'use client'

import * as React from 'react'
import type { UniverSheetHandle } from '@/components/univer'
import type { UIMessage } from '@tanstack/ai-react'
import type { StoredUIMessagePart } from '@/lib/supabase'
import type {
  ArtifactHistoryItem,
  StoredArtifact,
} from '@/hooks/use-spreadsheet-chat'
import { useSpreadsheetChat } from '@/hooks/use-spreadsheet-chat'

// ============================================================================
// Context Types
// ============================================================================

export interface ChatContextValue {
  // Chat state - using TanStack AI UIMessage format
  messages: Array<UIMessage>
  isLoading: boolean
  isStreaming: boolean
  error: Error | null

  // Streaming reasoning
  streamingThinking: string

  // Model configuration
  modelId: string
  setModelId: (modelId: string) => void

  // Reasoning configuration
  reasoningEffort: 'none' | 'minimal' | 'low' | 'medium' | 'high'
  setReasoningEffort: (
    effort: 'none' | 'minimal' | 'low' | 'medium' | 'high',
  ) => void

  // Chat actions
  sendMessage: (message: {
    text: string
    files?: Array<{
      id: string
      url: string
      mediaType: string
      filename?: string
    }>
  }) => void
  reload: () => void
  stop: () => void

  // Artifact state
  currentArtifact: ArtifactHistoryItem | null
  artifactHistory: Array<ArtifactHistoryItem>
  setCurrentArtifact: (artifact: ArtifactHistoryItem | null) => void
  clearArtifacts: () => void

  // Reply state
  replyingTo: UIMessage | null
  setReplyingTo: (message: UIMessage | null) => void

  // Univer ref (for components that need direct access)
  univerRef: React.RefObject<UniverSheetHandle | null>
}

// ============================================================================
// Context
// ============================================================================

const ChatContext = React.createContext<ChatContextValue | null>(null)

export function useChatContext(): ChatContextValue {
  const context = React.useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

// Optional hook that doesn't throw (for conditional usage)
export function useOptionalChatContext(): ChatContextValue | null {
  return React.useContext(ChatContext)
}

// ============================================================================
// Provider Props
// ============================================================================

export interface ChatProviderProps {
  children: React.ReactNode
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

// ============================================================================
// Provider Component
// ============================================================================

export function ChatProvider({
  children,
  chatId,
  initialMessages,
  initialArtifacts,
  onMessagePersist,
  univerRef,
  workbookId,
}: ChatProviderProps) {
  const chat = useSpreadsheetChat({
    chatId,
    initialMessages,
    initialArtifacts,
    onMessagePersist,
    univerRef,
    workbookId,
  })

  const [replyingTo, setReplyingTo] = React.useState<UIMessage | null>(null)

  const sendMessage = React.useCallback(
    (message: {
      text: string
      files?: Array<{
        id: string
        url: string
        mediaType: string
        filename?: string
      }>
    }) => {
      chat.sendMessage(message)
    },
    [chat.sendMessage],
  )

  const value: ChatContextValue = React.useMemo(
    () => ({
      messages: chat.messages,
      isLoading: chat.isLoading,
      isStreaming: chat.isStreaming,
      error: chat.error,
      streamingThinking: chat.streamingThinking,
      modelId: chat.modelId,
      setModelId: chat.setModelId,
      reasoningEffort: chat.reasoningEffort,
      setReasoningEffort: chat.setReasoningEffort,
      sendMessage,
      reload: chat.reload,
      stop: chat.stop,
      currentArtifact: chat.currentArtifact,
      artifactHistory: chat.artifactHistory,
      setCurrentArtifact: chat.setCurrentArtifact,
      clearArtifacts: chat.clearArtifacts,
      replyingTo,
      setReplyingTo,
      univerRef,
    }),
    [
      chat.messages,
      chat.isLoading,
      chat.isStreaming,
      chat.error,
      chat.streamingThinking,
      chat.modelId,
      chat.setModelId,
      chat.reasoningEffort,
      chat.setReasoningEffort,
      sendMessage,
      chat.reload,
      chat.stop,
      chat.currentArtifact,
      chat.artifactHistory,
      chat.setCurrentArtifact,
      chat.clearArtifacts,
      replyingTo,
      setReplyingTo,
      univerRef,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// ============================================================================
// Re-export types for consumers
// ============================================================================

export type { UIMessage } from '@tanstack/ai-react'
export type {
  ArtifactHistoryItem,
  StoredArtifact,
} from '@/hooks/use-spreadsheet-chat'
