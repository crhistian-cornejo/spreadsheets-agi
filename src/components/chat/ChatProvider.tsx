'use client'

import * as React from 'react'
import type { UniverSheetHandle } from '@/components/univer'
import type { UIMessage } from '@tanstack/ai-react'
import {
  useSpreadsheetChat,
  type ArtifactHistoryItem,
  type StoredArtifact,
} from '@/hooks/use-spreadsheet-chat'
import type { StoredUIMessagePart } from '@/lib/supabase'

// ============================================================================
// Context Types
// ============================================================================

export interface ChatContextValue {
  // Chat state - using TanStack AI UIMessage format
  messages: UIMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: Error | null

  // Chat actions
  sendMessage: (text: string) => void
  stop: () => void

  // Artifact state
  currentArtifact: ArtifactHistoryItem | null
  artifactHistory: ArtifactHistoryItem[]
  setCurrentArtifact: (artifact: ArtifactHistoryItem | null) => void
  clearArtifacts: () => void

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
}: ChatProviderProps) {
  const chat = useSpreadsheetChat({
    chatId,
    initialMessages,
    initialArtifacts,
    onMessagePersist,
    univerRef,
  })

  // Wrap sendMessage to accept plain string (for backwards compatibility)
  const sendMessage = React.useCallback(
    (text: string) => {
      chat.sendText(text)
    },
    [chat.sendText],
  )

  const value: ChatContextValue = React.useMemo(
    () => ({
      messages: chat.messages,
      isLoading: chat.isLoading,
      isStreaming: chat.isStreaming,
      error: chat.error,
      sendMessage,
      stop: chat.stop,
      currentArtifact: chat.currentArtifact,
      artifactHistory: chat.artifactHistory,
      setCurrentArtifact: chat.setCurrentArtifact,
      clearArtifacts: chat.clearArtifacts,
      univerRef,
    }),
    [
      chat.messages,
      chat.isLoading,
      chat.isStreaming,
      chat.error,
      sendMessage,
      chat.stop,
      chat.currentArtifact,
      chat.artifactHistory,
      chat.setCurrentArtifact,
      chat.clearArtifacts,
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
