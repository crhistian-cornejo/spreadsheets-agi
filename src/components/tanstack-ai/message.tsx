'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { IconPaperclip, IconX } from '@tabler/icons-react'
import type { MessageRole, FileAttachment } from './types'

// ============================================================================
// Message Container
// ============================================================================

export interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Who sent the message */
  from: MessageRole
}

export const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ className, from, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'group flex w-full max-w-[95%] flex-col gap-2',
        from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
        className,
      )}
      data-role={from}
      {...props}
    />
  ),
)
ChatMessage.displayName = 'ChatMessage'

// ============================================================================
// Message Content
// ============================================================================

export interface ChatMessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ChatMessageContent = React.forwardRef<
  HTMLDivElement,
  ChatMessageContentProps
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
      'group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground',
      'group-[.is-assistant]:text-foreground',
      className,
    )}
    {...props}
  >
    {children}
  </div>
))
ChatMessageContent.displayName = 'ChatMessageContent'

// ============================================================================
// Message Text (Plain text or simple markdown)
// ============================================================================

export interface ChatMessageTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The text content to render */
  content: string
  /** Whether to enable simple paragraph breaks */
  formatted?: boolean
}

export const ChatMessageText = React.forwardRef<
  HTMLDivElement,
  ChatMessageTextProps
>(({ content, formatted = true, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
      {...props}
    >
      {formatted ? (
        // Split by double newlines for paragraphs - use content hash for stable keys
        content.split('\n\n').map((paragraph) => {
          const hash = paragraph.slice(0, 32).replace(/\s/g, '-')
          return (
            <p key={hash} className="whitespace-pre-wrap">
              {paragraph}
            </p>
          )
        })
      ) : (
        <p className="whitespace-pre-wrap">{content}</p>
      )}
    </div>
  )
})
ChatMessageText.displayName = 'ChatMessageText'

// ============================================================================
// Message Actions Container
// ============================================================================

export interface ChatMessageActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ChatMessageActions = React.forwardRef<
  HTMLDivElement,
  ChatMessageActionsProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-1', className)}
    {...props}
  >
    {children}
  </div>
))
ChatMessageActions.displayName = 'ChatMessageActions'

// ============================================================================
// Message Action Button
// ============================================================================

export interface ChatMessageActionProps {
  tooltip?: string
  label?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function ChatMessageAction({
  tooltip,
  children,
  label,
  onClick,
  disabled,
  className,
}: ChatMessageActionProps) {
  const button = (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn('size-7 p-0', className)}
      variant="ghost"
    >
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={<span className="inline-flex">{button}</span>}
          />
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

// ============================================================================
// Message Toolbar
// ============================================================================

export interface ChatMessageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ChatMessageToolbar = React.forwardRef<
  HTMLDivElement,
  ChatMessageToolbarProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-4 flex w-full items-center justify-between gap-4',
      className,
    )}
    {...props}
  >
    {children}
  </div>
))
ChatMessageToolbar.displayName = 'ChatMessageToolbar'

// ============================================================================
// Message Attachment
// ============================================================================

export interface ChatMessageAttachmentProps extends React.HTMLAttributes<HTMLDivElement> {
  data: FileAttachment
  onRemove?: () => void
}

export const ChatMessageAttachment = React.forwardRef<
  HTMLDivElement,
  ChatMessageAttachmentProps
>(({ data, className, onRemove, ...props }, ref) => {
  const filename = data.filename || ''
  const isImage = data.mediaType?.startsWith('image/') && data.url
  const attachmentLabel = filename || (isImage ? 'Image' : 'Attachment')

  return (
    <div
      ref={ref}
      className={cn(
        'group relative size-24 overflow-hidden rounded-lg',
        className,
      )}
      {...props}
    >
      {isImage ? (
        <>
          <img
            alt={filename || 'attachment'}
            className="size-full object-cover"
            height={100}
            src={data.url}
            width={100}
          />
          {onRemove && (
            <Button
              className="absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 [&>svg]:size-3"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              type="button"
              variant="ghost"
            >
              <IconX />
              <span className="sr-only">Remove attachment</span>
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <IconPaperclip className="size-3.5" />
          </div>
          <span className="absolute bottom-1 left-1 right-1 truncate text-[10px] text-muted-foreground">
            {attachmentLabel}
          </span>
          {onRemove && (
            <Button
              className="absolute top-1 right-1 size-5 rounded-full p-0 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 [&>svg]:size-3"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              variant="ghost"
            >
              <IconX />
              <span className="sr-only">Remove attachment</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
})
ChatMessageAttachment.displayName = 'ChatMessageAttachment'

// ============================================================================
// Message Attachments Container
// ============================================================================

export interface ChatMessageAttachmentsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ChatMessageAttachments = React.forwardRef<
  HTMLDivElement,
  ChatMessageAttachmentsProps
>(({ children, className, ...props }, ref) => {
  if (!children) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        'ml-auto flex w-fit flex-wrap items-start gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ChatMessageAttachments.displayName = 'ChatMessageAttachments'

// ============================================================================
// Streaming Message Indicator
// ============================================================================

export interface StreamingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional label to show */
  label?: string
}

export const StreamingIndicator = React.forwardRef<
  HTMLDivElement,
  StreamingIndicatorProps
>(({ label = 'Pensando...', className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-2 text-muted-foreground', className)}
    {...props}
  >
    <div className="flex gap-1">
      <span className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="size-2 animate-bounce rounded-full bg-current" />
    </div>
    <span className="text-xs">{label}</span>
  </div>
))
StreamingIndicator.displayName = 'StreamingIndicator'
