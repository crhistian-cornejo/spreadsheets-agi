// TanStack AI Components for S-AGI
// Uses @tabler/icons-react and shadcn v2 conventions

// Types
export type {
  ChatStatus,
  Message,
  MessageRole,
  ToolCall,
  ToolCallState,
  FileAttachment,
  StreamChunk,
} from './types'

export {
  isUserMessage,
  isAssistantMessage,
  hasToolCalls,
  isToolExecuting,
  isToolCompleted,
  isToolFailed,
} from './types'

// Message Components
export {
  ChatMessage,
  ChatMessageContent,
  ChatMessageText,
  ChatMessageActions,
  ChatMessageAction,
  ChatMessageToolbar,
  ChatMessageAttachment,
  ChatMessageAttachments,
  StreamingIndicator,
} from './message'

export type {
  ChatMessageProps,
  ChatMessageContentProps,
  ChatMessageTextProps,
  ChatMessageActionsProps,
  ChatMessageActionProps,
  ChatMessageToolbarProps,
  ChatMessageAttachmentProps,
  ChatMessageAttachmentsProps,
  StreamingIndicatorProps,
} from './message'

// Tool Call Components
export {
  ToolCallDisplay,
  ToolCallHeader,
  ToolCallContent,
  ToolCallInput,
  ToolCallOutput,
  ToolCallList,
} from './tool-call'

export type {
  ToolCallDisplayProps,
  ToolCallHeaderProps,
  ToolCallContentProps,
  ToolCallInputProps,
  ToolCallOutputProps,
  ToolCallListProps,
} from './tool-call'

// Chat Input Components
export {
  SimpleChatInput,
  ChatInputTextarea,
  ChatInputSubmit,
} from './chat-input'

export type {
  SimpleChatInputProps,
  ChatInputTextareaProps,
  ChatInputSubmitProps,
} from './chat-input'

// Conversation Components
export {
  Conversation,
  ConversationEmptyState,
  MessageList,
} from './conversation'

export type {
  ConversationProps,
  ConversationEmptyStateProps,
  MessageListProps,
} from './conversation'

// Context
export {
  TanstackChatProvider,
  useTanstackChatContext,
  useOptionalTanstackChatContext,
} from './chat-context'

export type {
  TanstackChatContextValue,
  TanstackChatProviderProps,
  ChatContextValue,
} from './chat-context'
