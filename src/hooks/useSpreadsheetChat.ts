'use client'

import * as React from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type FileUIPart,
} from 'ai'
import type { UniverSheetHandle } from '@/components/univer'
import {
  executeSpreadsheetTool,
  type ToolExecutorContext,
} from '@/lib/ai/tool-executor'
import { isSpreadsheetTool, type SpreadsheetArtifact } from '@/lib/ai/types'

// ============================================================================
// Types
// ============================================================================

export interface ArtifactHistoryItem extends SpreadsheetArtifact {
  createdAt: Date
}

export interface UseSpreadsheetChatOptions {
  /** Chat ID for persistence */
  chatId?: string
  /** Initial messages to load */
  initialMessages?: UIMessage[]
  /** Callback when a message is sent (for persistence) */
  onMessageSent?: (role: 'user' | 'assistant', content: string) => void
  /** Reference to Univer sheet for tool execution */
  univerRef: React.RefObject<UniverSheetHandle | null>
}

/** Message format for sending (compatible with PromptInput) */
export interface ChatMessageInput {
  text: string
  files?: FileUIPart[]
}

export interface UseSpreadsheetChatReturn {
  // Chat state from AI SDK
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  error: Error | undefined
  isStreaming: boolean
  isGenerating: boolean

  // Chat actions - accepts the PromptInput format directly
  sendMessage: (message: ChatMessageInput) => void
  sendText: (text: string) => void

  // Artifact state
  currentArtifact: ArtifactHistoryItem | null
  artifactHistory: ArtifactHistoryItem[]
  setCurrentArtifact: (artifact: ArtifactHistoryItem | null) => void
  clearArtifacts: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSpreadsheetChat({
  chatId,
  initialMessages,
  onMessageSent,
  univerRef,
}: UseSpreadsheetChatOptions): UseSpreadsheetChatReturn {
  // Artifact state
  const [currentArtifact, setCurrentArtifact] =
    React.useState<ArtifactHistoryItem | null>(null)
  const [artifactHistory, setArtifactHistory] = React.useState<
    ArtifactHistoryItem[]
  >([])

  // Tool executor context - memoized to prevent unnecessary re-renders
  const toolContext: ToolExecutorContext = React.useMemo(
    () => ({
      univerRef,
      onArtifactCreated: (artifact) => {
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
      },
    }),
    [univerRef],
  )

  // AI SDK useChat hook with client-side tool execution
  const {
    messages,
    sendMessage: sdkSendMessage,
    addToolOutput,
    status,
    error,
  } = useChat({
    id: chatId,
    // Only pass messages if there are initial messages, otherwise let the SDK initialize empty
    messages:
      initialMessages && initialMessages.length > 0
        ? initialMessages
        : undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),

    // Automatically re-send when tool calls are complete
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // Handle tool calls on the client side
    async onToolCall({ toolCall }) {
      // Skip dynamic tools
      if (toolCall.dynamic) {
        console.log(
          '[useSpreadsheetChat] Skipping dynamic tool:',
          toolCall.toolName,
        )
        return
      }

      const toolName = toolCall.toolName
      console.log(
        '[useSpreadsheetChat] Tool call:',
        toolName,
        toolCall.toolCallId,
      )

      if (isSpreadsheetTool(toolName)) {
        try {
          const result = await executeSpreadsheetTool(
            toolName,
            toolCall.input,
            toolContext,
          )

          console.log('[useSpreadsheetChat] Tool result:', result)

          // Add tool output - don't await to avoid deadlocks
          addToolOutput({
            tool: toolName,
            toolCallId: toolCall.toolCallId,
            output: result.output,
          })
        } catch (err) {
          console.error('[useSpreadsheetChat] Tool execution error:', err)
          addToolOutput({
            tool: toolName,
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText:
              err instanceof Error ? err.message : 'Error ejecutando la acción',
          })
        }
      } else {
        console.warn('[useSpreadsheetChat] Unknown tool:', toolName)
        addToolOutput({
          tool: toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: `Tool no reconocido: ${toolName}`,
        })
      }
    },
  })

  // Track persisted message IDs to avoid duplicates
  const persistedMessagesRef = React.useRef<Set<string>>(new Set())

  // Initialize with existing message IDs from DB
  React.useEffect(() => {
    if (initialMessages) {
      persistedMessagesRef.current = new Set(initialMessages.map((m) => m.id))
    }
  }, [initialMessages])

  // Persist new messages to database
  React.useEffect(() => {
    if (!onMessageSent) return

    for (const message of messages) {
      // Skip already persisted messages
      if (persistedMessagesRef.current.has(message.id)) continue

      const parts =
        (message.parts as Array<{ type: string; text?: string }>) || []

      if (message.role === 'user') {
        // Persist user messages immediately
        const textPart = parts.find((p) => p.type === 'text')
        if (textPart && textPart.text) {
          onMessageSent('user', textPart.text)
          persistedMessagesRef.current.add(message.id)
        }
      } else if (message.role === 'assistant' && status === 'ready') {
        // For assistant messages, wait until streaming is done
        const textParts = parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text || '')
          .join('')
        if (textParts) {
          onMessageSent('assistant', textParts)
          persistedMessagesRef.current.add(message.id)
        }
      }
    }
  }, [messages, status, onMessageSent])

  // Log status changes for debugging
  React.useEffect(() => {
    console.log(
      '[useSpreadsheetChat] Status changed:',
      status,
      '| Messages count:',
      messages.length,
      '| ChatId:',
      chatId,
    )
  }, [status, messages.length, chatId])

  // Log errors
  React.useEffect(() => {
    if (error) {
      console.error('[useSpreadsheetChat] Error occurred:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
    }
  }, [error])

  // Computed states
  const isStreaming = status === 'streaming'
  const isGenerating = status === 'streaming' || status === 'submitted'

  // Send message - accepts ChatMessageInput format (compatible with PromptInput)
  const sendMessage = React.useCallback(
    (message: ChatMessageInput) => {
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
        currentStatus: status,
      })

      try {
        sdkSendMessage({
          text: message.text.trim(),
          files:
            message.files && message.files.length > 0
              ? message.files
              : undefined,
        })
        console.log('[useSpreadsheetChat] Message sent successfully')
      } catch (err) {
        console.error('[useSpreadsheetChat] Error sending message:', err)
      }
    },
    [sdkSendMessage, status],
  )

  // Send text only (shorthand for simple text messages)
  const sendText = React.useCallback(
    (text: string) => {
      sendMessage({ text })
    },
    [sendMessage],
  )

  // Clear all artifacts
  const clearArtifacts = React.useCallback(() => {
    setCurrentArtifact(null)
    setArtifactHistory([])
  }, [])

  return {
    // Chat state
    messages,
    status,
    error,
    isStreaming,
    isGenerating,

    // Chat actions
    sendMessage,
    sendText,

    // Artifact state
    currentArtifact,
    artifactHistory,
    setCurrentArtifact,
    clearArtifacts,
  }
}
