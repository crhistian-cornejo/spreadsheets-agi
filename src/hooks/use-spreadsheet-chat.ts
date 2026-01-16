/**
 * TanStack AI Spreadsheet Chat Hook
 * Uses @tanstack/ai-react for streaming chat with client-side tool execution
 */

import * as React from 'react'
import {
  createChatClientOptions,
  fetchServerSentEvents,
  useChat,
} from '@tanstack/ai-react'
import type { InferChatMessages, UIMessage } from '@tanstack/ai-react'
import type { UniverSheetHandle } from '@/components/univer'
import type { StoredUIMessagePart, Json } from '@/lib/supabase'
import { useAuth, workbookService } from '@/lib/supabase'
import type { SpreadsheetArtifact } from '@/lib/ai/types'
import { ARTIFACT_WORKBOOK_PREFIX } from '@/lib/ai/types'
import { setToolContext, spreadsheetClientTools } from '@/lib/ai/client-tools'
import { DEFAULT_MODEL_ID, getReasoningEfforts } from '@/lib/ai/model-registry'
import { useWorkbooks } from '@/lib/stores/workbook-context'
import { useCloudStorage } from '@/hooks/use-cloud-storage'
import XLSX from 'xlsx-js-style'
import Papa from 'papaparse'
import { generateWorkbookData } from '@/lib/ai/spreadsheet-actions'
import { nanoid } from 'nanoid'

// ============================================================================
// Types
// ============================================================================

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high'

export interface ArtifactHistoryItem extends SpreadsheetArtifact {
  createdAt: Date
}

/** Stored artifact format for persistence */
export interface StoredArtifact {
  id: string
  title: string
  type: 'sheet' | 'chart' | 'pivot' | 'doc'
  data: unknown
}

export interface UseSpreadsheetChatOptions {
  /** Chat ID for persistence */
  chatId?: string
  /** Initial messages to load */
  initialMessages?: Array<UIMessage>
  /** Initial artifacts from loaded chat */
  initialArtifacts?: Array<StoredArtifact>
  /** Callback when a message needs to be persisted (with full parts) */
  onMessagePersist?: (message: {
    id: string
    role: 'user' | 'assistant'
    parts: Array<StoredUIMessagePart>
    artifacts?: Array<StoredArtifact>
  }) => void
  /** Reference to Univer sheet for tool execution */
  univerRef: React.RefObject<UniverSheetHandle | null>
  /** Current workbook ID for file uploads */
  workbookId?: string | null
}

/** Message format for sending (compatible with PromptInput) */
export interface ChatMessageInput {
  text: string
  files?: Array<{
    id: string
    url: string
    mediaType: string
    filename?: string
  }>
}

export interface UseSpreadsheetChatReturn {
  // Chat state from TanStack AI
  messages: Array<UIMessage>
  isLoading: boolean
  isStreaming: boolean
  error: Error | null

  // Streaming reasoning (thinking)
  streamingThinking: string

  // Model configuration
  modelId: string
  setModelId: (modelId: string) => void

  // Reasoning configuration
  reasoningEffort: ReasoningEffort
  setReasoningEffort: (effort: ReasoningEffort) => void

  // Chat actions
  sendMessage: (message: ChatMessageInput) => void
  sendText: (text: string) => void
  reload: () => void
  stop: () => void

  // Artifact state
  currentArtifact: ArtifactHistoryItem | null
  artifactHistory: Array<ArtifactHistoryItem>
  setCurrentArtifact: (artifact: ArtifactHistoryItem | null) => void
  clearArtifacts: () => void
}

// ============================================================================
// Chat Options (for type inference)
// ============================================================================

const defaultChatOptions = createChatClientOptions({
  connection: fetchServerSentEvents('/api/chat'),
  tools: spreadsheetClientTools,
})

export type ChatMessages = InferChatMessages<typeof defaultChatOptions>

// ============================================================================
// Helper: Convert UIMessage parts to StoredUIMessagePart
// ============================================================================

function convertPartsForStorage(
  parts: UIMessage['parts'],
): Array<StoredUIMessagePart> {
  return parts.map((part) => {
    if (part.type === 'text') {
      return { type: 'text', content: part.content }
    }
    if (part.type === 'tool-call') {
      return {
        type: 'tool-call',
        id: part.id,
        name: part.name,
        arguments: part.arguments,
        input: part.input,
        state: part.state,
        approval: part.approval,
        output: part.output,
      }
    }
    if (part.type === 'tool-result') {
      return {
        type: 'tool-result',
        toolCallId: part.toolCallId,
        content: part.content,
        state: part.state,
        error: part.error,
      }
    }
    if (part.type === 'thinking') {
      return { type: 'thinking', content: part.content }
    }
    // Fallback for unknown types
    return { type: 'text', content: '' }
  })
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSpreadsheetChat({
  chatId,
  initialMessages,
  initialArtifacts,
  onMessagePersist,
  univerRef,
  workbookId,
}: UseSpreadsheetChatOptions): UseSpreadsheetChatReturn {
  const { user } = useAuth()
  // Workbook context
  const { activeWorkbook, createWorkbook } = useWorkbooks()
  const { uploadExcelFile, refreshWorkbooks } = useCloudStorage()

  // Artifact state
  const [currentArtifact, setCurrentArtifact] =
    React.useState<ArtifactHistoryItem | null>(null)
  const [artifactHistory, setArtifactHistory] = React.useState<
    Array<ArtifactHistoryItem>
  >([])
  const [error, setError] = React.useState<Error | null>(null)
  const [streamingThinking, setStreamingThinking] = React.useState('')
  const [modelId, setModelId] = React.useState<string>(DEFAULT_MODEL_ID)
  const [reasoningEffort, setReasoningEffort] =
    React.useState<ReasoningEffort>('none')

  // Track artifacts created in the current assistant turn (for persistence)
  const pendingArtifactsRef = React.useRef<Array<StoredArtifact>>([])

  // Initialize artifacts from loaded chat
  React.useEffect(() => {
    if (initialArtifacts && initialArtifacts.length > 0) {
      const historyItems = initialArtifacts.map((a) => ({
        ...a,
        createdAt: new Date(),
        data: a.data as Record<string, unknown>,
      }))
      setArtifactHistory(historyItems)
      // Set the most recent artifact as current
      setCurrentArtifact(historyItems[0])
    }
  }, [initialArtifacts])

  // Artifact callback - memoized
  const handleArtifactCreated = React.useCallback(
    async (artifact: SpreadsheetArtifact) => {
      const historyItem: ArtifactHistoryItem = {
        ...artifact,
        createdAt: artifact.createdAt || new Date(),
      }
      setCurrentArtifact(historyItem)
      setArtifactHistory((prev) => {
        // Avoid duplicates
        if (prev.some((a) => a.id === artifact.id)) return prev
        return [historyItem, ...prev]
      })

      // Track for persistence
      pendingArtifactsRef.current.push({
        id: artifact.id,
        title: artifact.title,
        type: artifact.type,
        data: artifact.data,
      })

      if (artifact.type === 'sheet' && user) {
        const existingWorkbookId = (artifact.data as { workbookId?: string })
          ?.workbookId
        if (!existingWorkbookId) {
          const title = `${ARTIFACT_WORKBOOK_PREFIX}${artifact.title}`
          const workbook = await workbookService.createWorkbook(
            user.id,
            title,
            'sheets',
            artifact.data as Json,
          )
          if (workbook.data?.id) {
            setArtifactHistory((prev) =>
              prev.map((item) =>
                item.id === artifact.id
                  ? {
                      ...item,
                      data: { ...item.data, workbookId: workbook.data?.id },
                    }
                  : item,
              ),
            )
            // Refresh workbooks list so the artifact appears in sidebar
            await refreshWorkbooks()
          }
        }
      }
    },
    [user, refreshWorkbooks],
  )

  // Set tool context for client-side execution
  React.useEffect(() => {
    setToolContext({
      univerRef,
      onArtifactCreated: handleArtifactCreated,
    })
  }, [univerRef, handleArtifactCreated])

  // Ensure reasoning effort is compatible with selected model
  React.useEffect(() => {
    const allowedEfforts = getReasoningEfforts(modelId)
    if (!allowedEfforts.includes(reasoningEffort)) {
      setReasoningEffort(allowedEfforts[0] || 'none')
    }
  }, [modelId, reasoningEffort, setReasoningEffort])

  // TanStack AI useChat hook
  const { messages, append, reload, isLoading, stop } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
    tools: spreadsheetClientTools,
    id: chatId,
    initialMessages,
    body: {
      conversationId: chatId,
      reasoning: reasoningEffort,
      modelId,
    },
    onChunk: (chunk) => {
      if (chunk.type === 'thinking') {
        console.log('[useSpreadsheetChat] Thinking chunk:', {
          delta: chunk.delta,
          length: chunk.content.length,
        })
        setStreamingThinking(chunk.content || '')
      }
    },
    onFinish: () => {
      console.log('[useSpreadsheetChat] Stream finished, clearing thinking')
      setStreamingThinking('')
    },
    onError: (err) => {
      console.error('[useSpreadsheetChat] Error:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
    },
  })

  // Computed states
  const isStreaming = isLoading

  // Track persisted message IDs to avoid duplicates
  const persistedMessagesRef = React.useRef<Set<string>>(new Set())

  // Initialize with existing message IDs from DB
  React.useEffect(() => {
    if (initialMessages) {
      persistedMessagesRef.current = new Set(initialMessages.map((m) => m.id))
    }
  }, [initialMessages])

  // Persist new messages to database with full parts
  React.useEffect(() => {
    if (!onMessagePersist) return

    for (const message of messages) {
      // Skip already persisted messages
      if (persistedMessagesRef.current.has(message.id)) continue

      if (message.role === 'user') {
        // Persist user message immediately with full parts
        const storedParts = convertPartsForStorage(message.parts)
        onMessagePersist({
          id: message.id,
          role: 'user',
          parts: storedParts,
        })
        persistedMessagesRef.current.add(message.id)
      } else if (message.role === 'assistant' && !isLoading) {
        // For assistant messages, wait until streaming is done
        // Include any artifacts created during this turn
        const storedParts = convertPartsForStorage(message.parts)
        const artifacts =
          pendingArtifactsRef.current.length > 0
            ? [...pendingArtifactsRef.current]
            : undefined

        onMessagePersist({
          id: message.id,
          role: 'assistant',
          parts: storedParts,
          artifacts,
        })

        // Clear pending artifacts after persisting
        pendingArtifactsRef.current = []
        persistedMessagesRef.current.add(message.id)
      }
    }
  }, [messages, isLoading, onMessagePersist])

  // Log status changes for debugging
  React.useEffect(() => {
    console.log(
      '[useSpreadsheetChat] Status:',
      isLoading ? 'loading' : 'ready',
      '| Messages count:',
      messages.length,
      '| ChatId:',
      chatId,
    )
  }, [isLoading, messages.length, chatId])

  const summarizeText = React.useCallback((text: string, maxChars = 2000) => {
    const cleaned = text.replace(/\s+/g, ' ').trim()
    if (cleaned.length <= maxChars) return cleaned
    return `${cleaned.slice(0, maxChars)}...`
  }, [])

  const parseSpreadsheetFile = React.useCallback(
    async (file: NonNullable<ChatMessageInput['files']>[number]) => {
      const isCsv =
        file.mediaType === 'text/csv' ||
        file.filename?.toLowerCase().endsWith('.csv')
      const isExcel =
        file.mediaType === 'application/vnd.ms-excel' ||
        file.mediaType ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.filename?.toLowerCase().endsWith('.xls') ||
        file.filename?.toLowerCase().endsWith('.xlsx')

      if (!isCsv && !isExcel) return null

      const base64 = file.url.startsWith('data:')
        ? file.url.split(',')[1]
        : file.url

      if (isCsv) {
        const csvText = atob(base64)
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true })
        const rows = parsed.data as string[][]
        const columns = rows.shift() || []
        return {
          title: file.filename?.replace(/\.[^/.]+$/, '') || 'Hoja importada',
          columns,
          rows,
        }
      }

      const workbook = XLSX.read(base64, { type: 'base64' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
      }) as Array<Array<string | number | boolean | null | undefined>>
      const rows = json.map((row) => row.map((cell) => `${cell ?? ''}`))
      const columns = rows.shift() || []
      return {
        title: file.filename?.replace(/\.[^/.]+$/, '') || sheetName,
        columns: columns.map((c) => `${c}`),
        rows,
      }
    },
    [],
  )

  const parsePdfFile = React.useCallback(
    async (file: NonNullable<ChatMessageInput['files']>[number]) => {
      const base64 = file.url.startsWith('data:')
        ? file.url.split(',')[1]
        : file.url
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      const pdf = await pdfjs.getDocument({
        data: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
      }).promise
      let text = ''
      const maxPages = Math.min(pdf.numPages, 5)
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()
        const pageText = content.items.map((item: any) => item.str).join(' ')
        text += `\n${pageText}`
      }
      return summarizeText(text)
    },
    [summarizeText],
  )

  const buildFileSummary = React.useCallback(
    async (files: NonNullable<ChatMessageInput['files']>) => {
      const summaries: string[] = []

      for (const file of files) {
        if (file.mediaType.startsWith('image/')) {
          summaries.push(`Imagen: ${file.filename || file.id}`)
          continue
        }

        if (
          file.mediaType === 'application/pdf' ||
          file.filename?.toLowerCase().endsWith('.pdf')
        ) {
          const summary = await parsePdfFile(file)
          summaries.push(`PDF ${file.filename || file.id}: ${summary}`)
          continue
        }

        const spreadsheet = await parseSpreadsheetFile(file)
        if (spreadsheet) {
          const preview = spreadsheet.rows
            .slice(0, 20)
            .map((row) => row.join(', '))
            .join('\n')
          summaries.push(
            `Spreadsheet ${spreadsheet.title}:\n${summarizeText(preview, 1500)}`,
          )
          continue
        }

        summaries.push(`Archivo: ${file.filename || file.id}`)
      }

      return summaries.length > 0
        ? `Resumen de archivos adjuntos:\n${summaries.join('\n\n')}`
        : ''
    },
    [parsePdfFile, parseSpreadsheetFile, summarizeText],
  )

  const dataUrlToFile = React.useCallback(
    async (file: NonNullable<ChatMessageInput['files']>[number]) => {
      const response = await fetch(file.url)
      const blob = await response.blob()
      return new File([blob], file.filename || file.id, {
        type: file.mediaType,
      })
    },
    [],
  )

  const handleFileAttachments = React.useCallback(
    async (files: NonNullable<ChatMessageInput['files']>) => {
      const spreadsheetFiles = files.filter(
        (file) =>
          [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ].includes(file.mediaType) ||
          file.filename?.match(/\.(csv|xls|xlsx)$/i),
      )

      if (spreadsheetFiles.length === 0) return

      const targetWorkbookId =
        workbookId ||
        activeWorkbook?.id ||
        (await createWorkbook('Archivo importado', 'sheets'))?.id

      for (const file of spreadsheetFiles) {
        const parsed = await parseSpreadsheetFile(file)
        if (!parsed) continue

        if (univerRef.current) {
          univerRef.current.createSheetWithData(
            parsed.title,
            parsed.columns,
            parsed.rows,
          )
        }

        const artifactData = generateWorkbookData({
          type: 'create_spreadsheet',
          title: parsed.title,
          columns: parsed.columns,
          rows: parsed.rows,
          sheetId: nanoid(),
        })

        handleArtifactCreated({
          id: nanoid(),
          title: parsed.title,
          type: 'sheet',
          createdAt: new Date(),
          data: artifactData as unknown as Record<string, unknown>,
        })

        if (targetWorkbookId) {
          const fileObj = await dataUrlToFile(file)
          await uploadExcelFile(fileObj, targetWorkbookId)
        }
      }
    },
    [
      activeWorkbook?.id,
      createWorkbook,
      dataUrlToFile,
      handleArtifactCreated,
      parseSpreadsheetFile,
      uploadExcelFile,
      univerRef,
      workbookId,
    ],
  )

  const sendMessage = React.useCallback(
    async (message: ChatMessageInput) => {
      if (
        !message.text.trim() &&
        (!message.files || message.files.length === 0)
      ) {
        console.warn('[useSpreadsheetChat] Empty message, ignoring')
        return
      }

      console.log('[useSpreadsheetChat] Sending message:', {
        text: message.text,
        filesCount: message.files?.length || 0,
        currentStatus: isLoading ? 'loading' : 'ready',
        chatId,
      })

      // Clear any previous errors
      setError(null)
      setStreamingThinking('')

      const attachments = message.files || []
      const summaryText =
        attachments.length > 0 ? await buildFileSummary(attachments) : ''

      if (attachments.length > 0) {
        void handleFileAttachments(attachments)
      }

      const textBlocks = [summaryText, message.text.trim()].filter(Boolean)

      // Send via TanStack AI
      append({
        role: 'user',
        content:
          attachments.length > 0
            ? ([
                { type: 'text', content: textBlocks.join('\n\n') },
                ...attachments.map((file) => ({
                  type: file.mediaType.startsWith('image/')
                    ? 'image'
                    : 'document',
                  source: { type: 'url', value: file.url },
                  name: file.filename || file.id,
                  mediaType: file.mediaType,
                })),
              ] as any)
            : message.text.trim(),
      })
    },
    [append, buildFileSummary, chatId, handleFileAttachments, isLoading],
  )

  const sendText = React.useCallback(
    (text: string) => {
      sendMessage({ text })
    },
    [sendMessage],
  )

  return {
    // Chat state
    messages,
    isLoading,
    isStreaming,
    error,

    // Streaming reasoning
    streamingThinking,

    // Model configuration
    modelId,
    setModelId,

    // Reasoning configuration
    reasoningEffort,
    setReasoningEffort,

    // Chat actions
    sendMessage,
    sendText,
    reload,
    stop,

    // Artifact state
    currentArtifact,
    artifactHistory,
    setCurrentArtifact,
    clearArtifacts: () => {
      setCurrentArtifact(null)
      setArtifactHistory([])
    },
  }
}
