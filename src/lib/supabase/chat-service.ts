import { supabase } from './client'
import type {
  Chat,
  ChatMessage,
  ChatInsert,
  ChatMessageInsert,
  ChatUpdate,
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
 * Get all chats for a user
 */
export async function getChats(
  userId: string,
): Promise<{ data: Chat[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

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
