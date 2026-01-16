import { supabase } from './client'
import type {
  Chat,
  ChatMessage,
  ChatInsert,
  ChatMessageInsert,
  ChatUpdate,
  Json,
} from './types'

// ============================================================================
// CHAT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new chat
 */
export async function createChat(
  userId: string,
  title: string,
): Promise<{ data: Chat | null; error: Error | null }> {
  try {
    const insertData: ChatInsert = {
      user_id: userId,
      title,
      archived: false,
    }

    const { data, error } = await supabase
      .from('chats')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return { data: data as Chat, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get all chats for a user (optionally filter by archived status)
 */
export async function getChats(
  userId: string,
  options?: { includeArchived?: boolean },
): Promise<{ data: Chat[]; error: Error | null }> {
  try {
    let query = supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    // By default, exclude archived chats
    if (!options?.includeArchived) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: (data || []) as Chat[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get a single chat by ID
 */
export async function getChat(
  chatId: string,
): Promise<{ data: Chat | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (error) throw error
    return { data: data as Chat, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Update a chat
 */
export async function updateChat(
  chatId: string,
  updates: { title?: string },
): Promise<{ error: Error | null }> {
  try {
    const updateData: ChatUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('chats')
      .update(updateData)
      .eq('id', chatId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(
  chatId: string,
): Promise<{ error: Error | null }> {
  try {
    // Messages will be deleted by CASCADE if set up in DB
    const { error } = await supabase.from('chats').delete().eq('id', chatId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

// ============================================================================
// CHAT MESSAGE CRUD OPERATIONS
// ============================================================================

/**
 * Add a message to a chat
 */
export async function addMessage(
  chatId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  try {
    const insertData: ChatMessageInsert = {
      chat_id: chatId,
      user_id: userId,
      role,
      content,
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at timestamp
    const updateData: ChatUpdate = { updated_at: new Date().toISOString() }
    await supabase.from('chats').update(updateData).eq('id', chatId)

    return { data: data as ChatMessage, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get all messages for a chat
 */
export async function getMessages(
  chatId: string,
): Promise<{ data: ChatMessage[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: (data || []) as ChatMessage[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Get chat with messages
 */
export async function getChatWithMessages(chatId: string): Promise<{
  data: { chat: Chat; messages: ChatMessage[] } | null
  error: Error | null
}> {
  try {
    const [chatResult, messagesResult] = await Promise.all([
      getChat(chatId),
      getMessages(chatId),
    ])

    if (chatResult.error) throw chatResult.error
    if (messagesResult.error) throw messagesResult.error
    if (!chatResult.data) throw new Error('Chat not found')

    return {
      data: {
        chat: chatResult.data,
        messages: messagesResult.data,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

// ============================================================================
// ARCHIVE OPERATIONS
// ============================================================================

/**
 * Archive a chat (soft delete)
 */
export async function archiveChat(
  chatId: string,
): Promise<{ error: Error | null }> {
  try {
    const updateData: ChatUpdate = {
      archived: true,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('chats')
      .update(updateData)
      .eq('id', chatId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Unarchive a chat
 */
export async function unarchiveChat(
  chatId: string,
): Promise<{ error: Error | null }> {
  try {
    const updateData: ChatUpdate = {
      archived: false,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('chats')
      .update(updateData)
      .eq('id', chatId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Get archived chats for a user
 */
export async function getArchivedChats(
  userId: string,
): Promise<{ data: Chat[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', true)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as Chat[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

// ============================================================================
// AUTO-TITLE GENERATION
// ============================================================================

/**
 * Generate a title from the first user message
 * Takes the first ~50 characters and cleans it up
 */
export function generateTitleFromMessage(message: string): string {
  // Clean up the message
  const cleaned = message
    .trim()
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces

  // Take first 50 chars
  if (cleaned.length <= 50) {
    return cleaned
  }

  // Find a good break point (space, punctuation)
  const truncated = cleaned.slice(0, 50)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > 30) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Update chat title from first message if title is generic
 */
export async function maybeUpdateChatTitle(
  chatId: string,
  firstMessage: string,
): Promise<{ error: Error | null }> {
  try {
    // Get current chat
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('title')
      .eq('id', chatId)
      .single()

    if (fetchError) throw fetchError

    // Check if title is generic (starts with "Nuevo" or "New" or is empty)
    const genericTitles = ['nuevo chat', 'new chat', 'chat', '']
    const isGeneric = genericTitles.includes(chat.title.toLowerCase().trim())

    if (isGeneric) {
      const newTitle = generateTitleFromMessage(firstMessage)
      const updateData: ChatUpdate = {
        title: newTitle,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('chats')
        .update(updateData)
        .eq('id', chatId)

      if (updateError) throw updateError
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

// ============================================================================
// MESSAGE WITH METADATA
// ============================================================================

/**
 * Add a message with optional metadata (tool calls, artifacts, etc.)
 */
export async function addMessageWithMetadata(
  chatId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Json,
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  try {
    const insertData: ChatMessageInsert = {
      chat_id: chatId,
      user_id: userId,
      role,
      content,
      metadata: metadata ?? null,
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at timestamp
    const updateData: ChatUpdate = { updated_at: new Date().toISOString() }
    await supabase.from('chats').update(updateData).eq('id', chatId)

    return { data: data as ChatMessage, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

// ============================================================================
// UIMESSAGE PERSISTENCE (TanStack AI format)
// ============================================================================

/**
 * UIMessage part types from TanStack AI
 * We store these in metadata to preserve tool calls, results, etc.
 */
export interface StoredUIMessagePart {
  type: 'text' | 'tool-call' | 'tool-result' | 'thinking'
  // For text parts
  content?: string
  // For tool-call parts
  id?: string
  name?: string
  arguments?: string
  input?: Record<string, unknown>
  state?: string
  approval?: {
    id: string
    needsApproval: boolean
    approved?: boolean
  }
  output?: Record<string, unknown>
  // For tool-result parts
  toolCallId?: string
  error?: string
}

export interface StoredUIMessageMetadata {
  /** The original message ID from TanStack AI */
  originalId: string
  /** All message parts (text, tool calls, tool results, thinking) */
  parts: StoredUIMessagePart[]
  /** Artifacts created during this message */
  artifacts?: Array<{
    id: string
    title: string
    type: 'sheet' | 'chart' | 'pivot' | 'doc'
    data: unknown
  }>
}

/**
 * Extract plain text content from UIMessage parts for searchability
 */
export function extractTextFromParts(parts: StoredUIMessagePart[]): string {
  return parts
    .filter((p) => p.type === 'text')
    .map((p) => p.content || '')
    .join('')
}

/**
 * Save a complete UIMessage with all its parts (tool calls, results, etc.)
 * This preserves the full structure for accurate restoration
 */
export async function saveUIMessage(
  chatId: string,
  userId: string,
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    parts: StoredUIMessagePart[]
    createdAt?: Date
  },
  artifacts?: StoredUIMessageMetadata['artifacts'],
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  try {
    // Extract text content for the content field (used for search/preview)
    const textContent = extractTextFromParts(message.parts)

    // Store full message structure in metadata
    const metadata: StoredUIMessageMetadata = {
      originalId: message.id,
      parts: message.parts,
      artifacts,
    }

    const insertData: ChatMessageInsert = {
      chat_id: chatId,
      user_id: userId,
      role: message.role,
      content: textContent,
      metadata: metadata as unknown as Json,
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at timestamp
    const updateData: ChatUpdate = { updated_at: new Date().toISOString() }
    await supabase.from('chats').update(updateData).eq('id', chatId)

    return { data: data as ChatMessage, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Convert a stored ChatMessage back to UIMessage format
 * If metadata contains parts, use those; otherwise create text-only message
 */
export function chatMessageToUIMessage(dbMessage: ChatMessage): {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: StoredUIMessagePart[]
  createdAt: Date
} {
  const metadata = dbMessage.metadata as StoredUIMessageMetadata | null

  // If we have stored parts in metadata, use them
  if (metadata?.parts && Array.isArray(metadata.parts)) {
    return {
      id: metadata.originalId || dbMessage.id,
      role: dbMessage.role,
      parts: metadata.parts,
      createdAt: new Date(dbMessage.created_at),
    }
  }

  // Otherwise, create a simple text message from content
  return {
    id: dbMessage.id,
    role: dbMessage.role,
    parts: [{ type: 'text', content: dbMessage.content }],
    createdAt: new Date(dbMessage.created_at),
  }
}

/**
 * Get all messages for a chat and convert them to UIMessage format
 */
export async function getMessagesAsUIMessages(chatId: string): Promise<{
  data: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    parts: StoredUIMessagePart[]
    createdAt: Date
  }>
  artifacts: StoredUIMessageMetadata['artifacts']
  error: Error | null
}> {
  try {
    const { data: messages, error } = await getMessages(chatId)

    if (error) throw error

    const uiMessages = messages.map(chatMessageToUIMessage)

    // Collect all artifacts from messages
    const allArtifacts: StoredUIMessageMetadata['artifacts'] = []
    for (const msg of messages) {
      const metadata = msg.metadata as StoredUIMessageMetadata | null
      if (metadata?.artifacts) {
        allArtifacts.push(...metadata.artifacts)
      }
    }

    return {
      data: uiMessages,
      artifacts: allArtifacts.length > 0 ? allArtifacts : undefined,
      error: null,
    }
  } catch (err) {
    return { data: [], artifacts: undefined, error: err as Error }
  }
}
