'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { IconSend, IconLoader2 } from '@tabler/icons-react'
import type { ChatStatus } from './types'

// ============================================================================
// Simple Chat Input Component
// ============================================================================

export interface SimpleChatInputProps extends Omit<
  React.HTMLAttributes<HTMLFormElement>,
  'onSubmit'
> {
  /** Current chat status */
  status?: ChatStatus
  /** Placeholder text */
  placeholder?: string
  /** Callback when message is submitted */
  onSubmit?: (message: string) => void
  /** Whether input is disabled */
  disabled?: boolean
  /** Auto focus on mount */
  autoFocus?: boolean
}

export function SimpleChatInput({
  className,
  status = 'ready',
  placeholder = 'Escribe un mensaje...',
  onSubmit,
  disabled,
  autoFocus,
  ...props
}: SimpleChatInputProps) {
  const [value, setValue] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const isStreaming = status === 'streaming'
  const isDisabled = disabled || isStreaming

  // Auto-resize textarea
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Handle form submission
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!value.trim() || isDisabled) return

      onSubmit?.(value.trim())
      setValue('')

      // Reset height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    },
    [value, isDisabled, onSubmit],
  )

  // Handle keyboard shortcuts
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit],
  )

  return (
    <form
      className={cn(
        'flex items-end gap-2 rounded-lg border border-border bg-background p-2',
        className,
      )}
      onSubmit={handleSubmit}
      {...props}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        autoFocus={autoFocus}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm outline-none',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[36px] max-h-[200px] py-2 px-1',
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isDisabled || !value.trim()}
        className="shrink-0"
      >
        {isStreaming ? <IconLoader2 className="animate-spin" /> : <IconSend />}
        <span className="sr-only">Enviar mensaje</span>
      </Button>
    </form>
  )
}

// ============================================================================
// Chat Input Textarea (Controlled)
// ============================================================================

export interface ChatInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Auto resize based on content */
  autoResize?: boolean
  /** Max height in pixels */
  maxHeight?: number
}

export const ChatInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ChatInputTextareaProps
>(
  (
    {
      className,
      autoResize = true,
      maxHeight = 200,
      onChange,
      value,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    const textareaRef =
      (ref as React.RefObject<HTMLTextAreaElement>) || internalRef

    // Auto-resize effect
    React.useEffect(() => {
      if (!autoResize) return
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }, [value, autoResize, maxHeight, textareaRef])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e)
      },
      [onChange],
    )

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        rows={1}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm outline-none',
          'placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[36px] py-2 px-1',
          className,
        )}
        style={{ maxHeight }}
        {...props}
      />
    )
  },
)
ChatInputTextarea.displayName = 'ChatInputTextarea'

// ============================================================================
// Chat Input Submit Button
// ============================================================================

export interface ChatInputSubmitProps extends Omit<
  React.ComponentProps<typeof Button>,
  'type'
> {
  /** Current chat status */
  status?: ChatStatus
  /** Loading label for screen readers */
  loadingLabel?: string
  /** Submit label for screen readers */
  submitLabel?: string
}

export function ChatInputSubmit({
  status = 'ready',
  loadingLabel = 'Enviando...',
  submitLabel = 'Enviar mensaje',
  disabled,
  className,
  ...props
}: ChatInputSubmitProps) {
  const isStreaming = status === 'streaming'

  return (
    <Button
      type="submit"
      size="icon"
      disabled={disabled || isStreaming}
      className={cn('shrink-0', className)}
      {...props}
    >
      {isStreaming ? <IconLoader2 className="animate-spin" /> : <IconSend />}
      <span className="sr-only">
        {isStreaming ? loadingLabel : submitLabel}
      </span>
    </Button>
  )
}
