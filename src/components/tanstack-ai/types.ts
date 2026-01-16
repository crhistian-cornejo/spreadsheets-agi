/**
 * TanStack AI UI Component Types
 *
 * These types are designed to work with TanStack AI streaming
 * and are independent of Vercel AI SDK types.
 */

// ============================================================================
// Chat Status
// ============================================================================

/**
 * Chat status for TanStack AI
 * - 'ready': Chat is ready to receive input
 * - 'streaming': AI is currently generating a response
 * - 'error': An error occurred
 */
export type ChatStatus = 'ready' | 'streaming' | 'error'

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * Tool call information attached to a message
 */
export interface ToolCall {
  /** Unique identifier for the tool call */
  id: string
  /** Name of the tool being called */
  name: string
  /** Arguments passed to the tool */
  args: unknown
  /** Current state of the tool execution */
  state: ToolCallState
  /** Result from tool execution (if completed) */
  result?: unknown
  /** Error message (if failed) */
  error?: string
}

export type ToolCallState =
  | 'pending'
  | 'executing'
  | 'completed'
  | 'error'
  | 'cancelled'

/**
 * File attachment in a message
 */
export interface FileAttachment {
  /** Unique identifier */
  id: string
  /** File name */
  filename?: string
  /** MIME type */
  mediaType?: string
  /** URL to the file (blob URL or data URL) */
  url?: string
}

/**
 * A chat message in TanStack AI format
 */
export interface Message {
  /** Unique identifier */
  id: string
  /** Who sent the message */
  role: MessageRole
  /** Text content of the message */
  content: string
  /** When the message was created */
  createdAt: Date
  /** Tool calls made in this message (assistant only) */
  toolCalls?: ToolCall[]
  /** File attachments (user messages) */
  attachments?: FileAttachment[]
  /** Thinking/reasoning content from AI model (assistant only) */
  thinkingContent?: string
}

// ============================================================================
// Stream Chunk Types
// ============================================================================

/**
 * Chunk types from TanStack AI streaming
 */
export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error'
  /** Full accumulated content so far */
  content?: string
  /** Delta (new text since last chunk) */
  delta?: string
  /** Tool name being called */
  toolName?: string
  /** Tool call ID */
  toolCallId?: string
  /** Tool arguments */
  toolArgs?: unknown
  /** Error message */
  error?: string
}

// ============================================================================
// Component Props Helpers
// ============================================================================

/**
 * Props for components that need message context
 */
export interface MessageContextProps {
  message: Message
  isStreaming?: boolean
}

/**
 * Props for tool display components
 */
export interface ToolDisplayProps {
  toolCall: ToolCall
  className?: string
}

/**
 * Chat input message structure
 */
export interface ChatInputMessage {
  /** Text content */
  text: string
  /** File attachments */
  files?: FileAttachment[]
}

// ============================================================================
// Chat Context Types
// ============================================================================

/**
 * Chat context value for providers
 */
export interface ChatContextValue {
  /** All messages in the chat */
  messages: Message[]
  /** Current chat status */
  status: ChatStatus
  /** Error if status is 'error' */
  error?: Error
  /** Whether currently streaming */
  isStreaming: boolean
  /** Content being streamed (partial response) */
  streamingContent: string
  /** Send a new message */
  sendMessage: (text: string) => void
  /** Stop current generation */
  stop?: () => void
  /** Clear all messages */
  clear?: () => void
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper to check if a message is from the user
 */
export function isUserMessage(message: Message): boolean {
  return message.role === 'user'
}

/**
 * Helper to check if a message is from the assistant
 */
export function isAssistantMessage(message: Message): boolean {
  return message.role === 'assistant'
}

/**
 * Helper to check if a message has tool calls
 */
export function hasToolCalls(message: Message): boolean {
  return !!message.toolCalls && message.toolCalls.length > 0
}

/**
 * Helper to check if a tool call is still executing
 */
export function isToolExecuting(toolCall: ToolCall): boolean {
  return toolCall.state === 'pending' || toolCall.state === 'executing'
}

/**
 * Helper to check if a tool call completed successfully
 */
export function isToolCompleted(toolCall: ToolCall): boolean {
  return toolCall.state === 'completed'
}

/**
 * Helper to check if a tool call failed
 */
export function isToolFailed(toolCall: ToolCall): boolean {
  return toolCall.state === 'error' || toolCall.state === 'cancelled'
}
