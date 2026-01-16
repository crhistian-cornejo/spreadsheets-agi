/**
 * TanStack AI Spreadsheet Chat Hook
 * Uses @tanstack/ai-react for streaming chat with client-side tool execution
 */

import * as React from 'react'
import {
  useChat,
  fetchServerSentEvents,
  createChatClientOptions,
} from '@tanstack/ai-react'
import type { UIMessage, InferChatMessages } from '@tanstack/ai-react'
import type { UniverSheetHandle } from '@/components/univer'
import { spreadsheetClientTools, setToolContext } from '@/lib/ai/client-tools'
import type { SpreadsheetArtifact } from '@/lib/ai/types'
import type { StoredUIMessagePart } from '@/lib/supabase'

// ============================================================================
// Types
// ============================================================================

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
  initialMessages?: UIMessage[]
  /** Initial artifacts from loaded chat */
  initialArtifacts?: StoredArtifact[]
  /** Callback when a message needs to be persisted (with full parts) */
  onMessagePersist?: (message: {
    id: string
    role: 'user' | 'assistant'
    parts: StoredUIMessagePart[]
    artifacts?: StoredArtifact[]
  }) => void
  /** Reference to Univer sheet for tool execution */
  univerRef: React.RefObject<UniverSheetHandle | null>
}

/** Message format for sending (compatible with PromptInput) */
export interface ChatMessageInput {
  text: string
}

export interface UseSpreadsheetChatReturn {
  // Chat state from TanStack AI
  messages: UIMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: Error | null

  // Chat actions
  sendMessage: (message: ChatMessageInput) => void
  sendText: (text: string) => void
  stop: () => void

  // Artifact state
  currentArtifact: ArtifactHistoryItem | null
  artifactHistory: ArtifactHistoryItem[]
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
): StoredUIMessagePart[] {
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
}: UseSpreadsheetChatOptions): UseSpreadsheetChatReturn {
  // Artifact state
  const [currentArtifact, setCurrentArtifact] =
    React.useState<ArtifactHistoryItem | null>(null)
  const [artifactHistory, setArtifactHistory] = React.useState<
    ArtifactHistoryItem[]
  >([])
  const [error, setError] = React.useState<Error | null>(null)

  // Track artifacts created in the current assistant turn (for persistence)
  const pendingArtifactsRef = React.useRef<StoredArtifact[]>([])

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
    (artifact: SpreadsheetArtifact) => {
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
    },
    [],
  )

  // Set tool context for client-side execution
  React.useEffect(() => {
    setToolContext({
      univerRef,
      onArtifactCreated: handleArtifactCreated,
    })
  }, [univerRef, handleArtifactCreated])

  // TanStack AI useChat hook
  const {
    messages,
    sendMessage: tanstackSendMessage,
    isLoading,
    stop,
  } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
    tools: spreadsheetClientTools,
    id: chatId,
    initialMessages,
    body: {
      conversationId: chatId,
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

  // Send message - accepts ChatMessageInput format
  const sendMessage = React.useCallback(
    (message: ChatMessageInput) => {
      if (!message.text.trim()) {
        console.warn('[useSpreadsheetChat] Empty message, ignoring')
        return
      }

      console.log('[useSpreadsheetChat] Sending message:', {
        text: message.text,
        currentStatus: isLoading ? 'loading' : 'ready',
        chatId,
      })

      // Clear any previous errors
      setError(null)

      // Send via TanStack AI
      tanstackSendMessage(message.text.trim())
    },
    [tanstackSendMessage, isLoading, chatId],
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
    isLoading,
    isStreaming,
    error,

    // Chat actions
    sendMessage,
    sendText,
    stop,

    // Artifact state
    currentArtifact,
    artifactHistory,
    setCurrentArtifact,
    clearArtifacts,
  }
}
