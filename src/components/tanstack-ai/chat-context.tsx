'use client'

import * as React from 'react'
import type { Message, ChatStatus, ToolCall } from './types'

// ============================================================================
// Context Types
// ============================================================================

export interface TanstackChatContextValue {
  // Chat state
  messages: Message[]
  status: ChatStatus
  error: Error | undefined
  isStreaming: boolean
  streamingContent: string

  // Chat actions
  sendMessage: (text: string) => void
  clearMessages?: () => void

  // Tool state (optional)
  pendingToolCalls?: ToolCall[]
}

// ============================================================================
// Context
// ============================================================================

const TanstackChatContext =
  React.createContext<TanstackChatContextValue | null>(null)

/**
 * Hook to access TanStack AI chat context.
 * Must be used within a TanstackChatProvider.
 */
export function useTanstackChatContext(): TanstackChatContextValue {
  const context = React.useContext(TanstackChatContext)
  if (!context) {
    throw new Error(
      'useTanstackChatContext must be used within a TanstackChatProvider',
    )
  }
  return context
}

/**
 * Optional hook that returns null if not within provider (no throw).
 */
export function useOptionalTanstackChatContext(): TanstackChatContextValue | null {
  return React.useContext(TanstackChatContext)
}

// ============================================================================
// Provider Props
// ============================================================================

export interface TanstackChatProviderProps {
  children: React.ReactNode
  /** Chat context value (from useSpreadsheetChat or similar) */
  value: TanstackChatContextValue
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Provider for TanStack AI chat context.
 * Wrap your chat UI with this component and pass the chat hook value.
 *
 * @example
 * ```tsx
 * function ChatApp() {
 *   const chat = useSpreadsheetChat({ univerRef })
 *
 *   return (
 *     <TanstackChatProvider value={chat}>
 *       <Conversation
 *         messages={chat.messages}
 *         status={chat.status}
 *         streamingContent={chat.streamingContent}
 *       />
 *       <SimpleChatInput
 *         status={chat.status}
 *         onSubmit={chat.sendMessage}
 *       />
 *     </TanstackChatProvider>
 *   )
 * }
 * ```
 */
export function TanstackChatProvider({
  children,
  value,
}: TanstackChatProviderProps) {
  return (
    <TanstackChatContext.Provider value={value}>
      {children}
    </TanstackChatContext.Provider>
  )
}

// ============================================================================
// Adapter for existing ChatProvider
// ============================================================================

/**
 * Re-export type alias for compatibility with existing ChatProvider.
 * Use this if you want to migrate gradually.
 */
export type { TanstackChatContextValue as ChatContextValue }
