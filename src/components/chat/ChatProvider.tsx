'use client'

import * as React from 'react'
import type { UIMessage } from '@ai-sdk/react'
import type { UniverSheetHandle } from '@/components/univer'
import {
  useSpreadsheetChat,
  type ArtifactHistoryItem,
  type ChatMessageInput,
} from '@/hooks/useSpreadsheetChat'

// ============================================================================
// Context Types
// ============================================================================

export interface ChatContextValue {
  // Chat state
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  error: Error | undefined
  isStreaming: boolean
  isGenerating: boolean

  // Chat actions
  sendMessage: (message: ChatMessageInput) => void
  sendText: (text: string) => void

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
  /** Callback when a message is sent (for persistence) */
  onMessageSent?: (role: 'user' | 'assistant', content: string) => void
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
  onMessageSent,
  univerRef,
}: ChatProviderProps) {
  const chat = useSpreadsheetChat({
    chatId,
    initialMessages,
    onMessageSent,
    univerRef,
  })

  const value: ChatContextValue = React.useMemo(
    () => ({
      messages: chat.messages,
      status: chat.status,
      error: chat.error,
      isStreaming: chat.isStreaming,
      isGenerating: chat.isGenerating,
      sendMessage: chat.sendMessage,
      sendText: chat.sendText,
      currentArtifact: chat.currentArtifact,
      artifactHistory: chat.artifactHistory,
      setCurrentArtifact: chat.setCurrentArtifact,
      clearArtifacts: chat.clearArtifacts,
      univerRef,
    }),
    [
      chat.messages,
      chat.status,
      chat.error,
      chat.isStreaming,
      chat.isGenerating,
      chat.sendMessage,
      chat.sendText,
      chat.currentArtifact,
      chat.artifactHistory,
      chat.setCurrentArtifact,
      chat.clearArtifacts,
      univerRef,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
