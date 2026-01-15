// Client and helpers
export { supabase, getCurrentUser, getSession } from './client'

// Auth context and hook
export { AuthProvider, useAuth } from './auth-context'

// Services
export * as chatService from './chat-service'
export * as workbookService from './workbook-service'
export * as storageService from './storage-service'

// Types
export type {
  Database,
  Profile,
  Chat,
  ChatMessage,
  Workbook,
  FileRecord,
  Folder,
  Json,
  DocumentCategory,
} from './types'
