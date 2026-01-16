'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { IconArrowDown, IconSparkles } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  ChatMessage,
  ChatMessageContent,
  ChatMessageText,
  StreamingIndicator,
} from './message'
import { ToolCallList } from './tool-call'
import type { Message, ChatStatus } from './types'

// ============================================================================
// Conversation Container
// ============================================================================

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Messages to display */
  messages: Message[]
  /** Current chat status */
  status?: ChatStatus
  /** Streaming content preview */
  streamingContent?: string
  /** Whether to auto-scroll to bottom */
  autoScroll?: boolean
  /** Empty state component */
  emptyState?: React.ReactNode
}

export function Conversation({
  messages,
  status = 'ready',
  streamingContent = '',
  autoScroll = true,
  emptyState,
  className,
  ...props
}: ConversationProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = React.useState(false)

  const isStreaming = status === 'streaming'

  // Scroll to bottom
  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      bottomRef.current?.scrollIntoView({ behavior })
    },
    [],
  )

  // Auto-scroll when messages change or streaming
  React.useEffect(() => {
    if (autoScroll) {
      scrollToBottom('smooth')
    }
  }, [messages.length, streamingContent, autoScroll, scrollToBottom])

  // Track scroll position for "scroll to bottom" button
  React.useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Show empty state if no messages
  if (messages.length === 0 && !isStreaming) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center p-4',
          className,
        )}
        {...props}
      >
        {emptyState || <ConversationEmptyState />}
      </div>
    )
  }

  return (
    <div className={cn('relative flex flex-1 flex-col', className)} {...props}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} from={message.role}>
              <ChatMessageContent>
                {message.content && (
                  <ChatMessageText content={message.content} />
                )}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <ToolCallList toolCalls={message.toolCalls} />
                )}
              </ChatMessageContent>
            </ChatMessage>
          ))}

          {/* Streaming preview */}
          {isStreaming && (
            <ChatMessage from="assistant">
              <ChatMessageContent>
                {streamingContent ? (
                  <ChatMessageText content={streamingContent} />
                ) : (
                  <StreamingIndicator />
                )}
              </ChatMessageContent>
            </ChatMessage>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          size="icon"
          variant="outline"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-md"
          onClick={() => scrollToBottom()}
        >
          <IconArrowDown className="size-3.5" />
          <span className="sr-only">Ir al final</span>
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

export interface ConversationEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Suggestions to show */
  suggestions?: string[]
  /** Callback when suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void
}

export function ConversationEmptyState({
  title = '¿En qué puedo ayudarte?',
  description = 'Puedo crear hojas de cálculo, analizar datos, generar fórmulas y mucho más.',
  suggestions = [
    'Crea una hoja de ventas con datos de ejemplo',
    'Analiza mis datos y encuentra tendencias',
    'Genera una fórmula para calcular el IVA',
  ],
  onSuggestionClick,
  className,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 text-center',
        className,
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <IconSparkles className="size-6 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>

      {suggestions.length > 0 && onSuggestionClick && (
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Message List (simpler alternative)
// ============================================================================

export interface MessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Messages to display */
  messages: Message[]
}

export function MessageList({
  messages,
  className,
  ...props
}: MessageListProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {messages.map((message) => (
        <ChatMessage key={message.id} from={message.role}>
          <ChatMessageContent>
            {message.content && <ChatMessageText content={message.content} />}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <ToolCallList toolCalls={message.toolCalls} />
            )}
          </ChatMessageContent>
        </ChatMessage>
      ))}
    </div>
  )
}
