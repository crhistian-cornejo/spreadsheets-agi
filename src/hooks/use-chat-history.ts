'use client'

import * as React from 'react'
import { useAuth, chatService } from '@/lib/supabase'
import type { Chat, ChatMessage, StoredUIMessagePart } from '@/lib/supabase'
import type { StoredArtifact } from '@/hooks/use-spreadsheet-chat'

interface UseChatHistoryReturn {
  chats: Array<Chat>
  currentChat: Chat | null
  messages: Array<ChatMessage>
  /** Messages converted to UIMessage format for TanStack AI */
  uiMessages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    parts: StoredUIMessagePart[]
    createdAt: Date
  }>
  /** Artifacts from all messages in the current chat */
  artifacts: StoredArtifact[]
  isLoading: boolean
  error: Error | null
  createChat: (title?: string) => Promise<Chat | null>
  loadChat: (chatId: string) => Promise<void>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  /** Persist a full UIMessage with parts and artifacts */
  persistMessage: (
    message: {
      id: string
      role: 'user' | 'assistant'
      parts: StoredUIMessagePart[]
      artifacts?: StoredArtifact[]
    },
    chatId?: string,
  ) => Promise<ChatMessage | null>
  refreshChats: () => Promise<void>
  clearCurrentChat: () => void
}

/**
 * Generate a smart title from the first user message
 * - Preserves special characters (ñ, accents, etc.)
 * - Truncates intelligently at word boundaries
 */
function generateSmartTitle(message: string): string {
  // Normalize and clean the message (preserves UTF-8)
  const cleaned = message.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ')

  // If short enough, use as-is
  if (cleaned.length <= 50) {
    return cleaned
  }

  // Find a good break point (space, punctuation)
  const truncated = cleaned.slice(0, 50)
  const lastSpace = truncated.lastIndexOf(' ')
  const lastPunctuation = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf(','),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('!'),
  )

  // Prefer breaking at punctuation if it's not too short
  if (lastPunctuation > 25) {
    return truncated.slice(0, lastPunctuation + 1)
  }

  // Otherwise break at space
  if (lastSpace > 25) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Check if a title is generic and should be replaced
 */
function isGenericTitle(title: string): boolean {
  const genericPatterns = [
    /^nueva?\s*conversaci[oó]n$/i,
    /^new\s*chat$/i,
    /^new\s*conversation$/i,
    /^chat$/i,
    /^untitled$/i,
    /^sin\s*t[ií]tulo$/i,
    /^\s*$/,
  ]
  return genericPatterns.some((pattern) => pattern.test(title.trim()))
}

export function useChatHistory(): UseChatHistoryReturn {
  const { user } = useAuth()

  const [chats, setChats] = React.useState<Array<Chat>>([])
  const [currentChat, setCurrentChat] = React.useState<Chat | null>(null)
  const [messages, setMessages] = React.useState<Array<ChatMessage>>([])
  const [uiMessages, setUiMessages] = React.useState<
    Array<{
      id: string
      role: 'user' | 'assistant' | 'system'
      parts: StoredUIMessagePart[]
      createdAt: Date
    }>
  >([])
  const [artifacts, setArtifacts] = React.useState<StoredArtifact[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // Track if we've already updated the title for this chat session
  const titleUpdatedRef = React.useRef<Set<string>>(new Set())

  // Load all chats for the user
  const refreshChats = React.useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await chatService.getChats(user.id)
      if (fetchError) throw fetchError
      setChats(data)
    } catch (err) {
      setError(err as Error)
      console.error('[useChatHistory] Error refreshing chats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Load chats on mount and when user changes
  React.useEffect(() => {
    refreshChats()
  }, [refreshChats])

  // Create a new chat (title is optional, will be set on first message)
  const createChat = React.useCallback(
    async (title?: string): Promise<Chat | null> => {
      if (!user) return null

      setError(null)
      // Use a temporary title if not provided
      const initialTitle = title || 'Nueva conversación'

      try {
        const { data, error: createError } = await chatService.createChat(
          user.id,
          initialTitle,
        )
        if (createError) throw createError
        if (data) {
          setChats((prev) => [data, ...prev])
          setCurrentChat(data)
          setMessages([])
          setUiMessages([])
          setArtifacts([])
          // Mark this as needing title update if using generic title
          if (isGenericTitle(initialTitle)) {
            titleUpdatedRef.current.delete(data.id)
          }
        }
        return data
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error creating chat:', err)
        return null
      }
    },
    [user],
  )

  // Load a specific chat with its messages
  const loadChat = React.useCallback(async (chatId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Load messages as UIMessages (with full parts and artifacts)
      const {
        data: uiMsgs,
        artifacts: loadedArtifacts,
        error: fetchError,
      } = await chatService.getMessagesAsUIMessages(chatId)
      if (fetchError) throw fetchError

      // Also load the chat info
      const { data: chatData, error: chatError } =
        await chatService.getChat(chatId)
      if (chatError) throw chatError

      if (chatData) {
        setCurrentChat(chatData)
        // Set raw messages for backwards compatibility
        const { data: rawMessages } = await chatService.getMessages(chatId)
        setMessages(rawMessages || [])
        // Set UIMessages for TanStack AI
        setUiMessages(uiMsgs)
        // Set artifacts
        setArtifacts(loadedArtifacts || [])

        // If chat already has messages, mark title as set
        if (uiMsgs.length > 0) {
          titleUpdatedRef.current.add(chatId)
        }
      }
    } catch (err) {
      setError(err as Error)
      console.error('[useChatHistory] Error loading chat:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update chat title
  const updateChatTitle = React.useCallback(
    async (chatId: string, title: string) => {
      setError(null)
      console.log('[useChatHistory] updateChatTitle called:', { chatId, title })

      try {
        const { error: updateError } = await chatService.updateChat(chatId, {
          title,
        })
        if (updateError) throw updateError

        // Update local state immediately for responsiveness
        setChats((prev) =>
          prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
        )

        if (currentChat?.id === chatId) {
          setCurrentChat((prev) => (prev ? { ...prev, title } : null))
        }

        // Mark this chat's title as updated
        titleUpdatedRef.current.add(chatId)
        console.log('[useChatHistory] Title updated successfully')
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error updating chat title:', err)
      }
    },
    [currentChat],
  )

  // Delete a chat
  const deleteChat = React.useCallback(
    async (chatId: string) => {
      setError(null)

      try {
        const { error: deleteError } = await chatService.deleteChat(chatId)
        if (deleteError) throw deleteError

        setChats((prev) => prev.filter((chat) => chat.id !== chatId))
        titleUpdatedRef.current.delete(chatId)

        if (currentChat?.id === chatId) {
          setCurrentChat(null)
          setMessages([])
        }
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error deleting chat:', err)
      }
    },
    [currentChat],
  )

  // Send a message in the current chat (or specified chat)
  // This also handles auto-generating titles from the first user message
  const persistMessage = React.useCallback(
    async (
      message: {
        id: string
        role: 'user' | 'assistant'
        parts: StoredUIMessagePart[]
        artifacts?: StoredArtifact[]
      },
      chatId?: string,
    ): Promise<ChatMessage | null> => {
      const targetChatId = chatId || currentChat?.id
      if (!user || !targetChatId) {
        console.warn(
          '[useChatHistory] persistMessage: No user or targetChatId',
          {
            user: !!user,
            targetChatId,
          },
        )
        return null
      }

      // Extract text content for logging and title generation
      const textContent = chatService.extractTextFromParts(message.parts)

      console.log('[useChatHistory] persistMessage:', {
        role: message.role,
        targetChatId,
        contentPreview: textContent.slice(0, 50),
        hasParts: message.parts.length,
        hasArtifacts: message.artifacts?.length || 0,
      })
      setError(null)

      try {
        // Save the full UIMessage with parts and artifacts
        const { data, error: saveError } = await chatService.saveUIMessage(
          targetChatId,
          user.id,
          {
            id: message.id,
            role: message.role,
            parts: message.parts,
          },
          message.artifacts,
        )
        if (saveError) throw saveError

        if (data) {
          setMessages((prev) => [...prev, data])

          // Auto-generate title from first USER message if title is generic
          if (
            message.role === 'user' &&
            !titleUpdatedRef.current.has(targetChatId)
          ) {
            // Try to find the chat in local state
            let chatToCheck =
              chats.find((c) => c.id === targetChatId) || currentChat

            // If we still can't find the chat (just created), fetch it from DB
            if (!chatToCheck) {
              console.log(
                '[useChatHistory] Chat not in local state, fetching from DB',
              )
              const { data: fetchedChat } =
                await chatService.getChatWithMessages(targetChatId)
              chatToCheck = fetchedChat?.chat || null
            }

            console.log('[useChatHistory] Checking title update:', {
              chatId: targetChatId,
              chatTitle: chatToCheck?.title,
              isGeneric: chatToCheck
                ? isGenericTitle(chatToCheck.title)
                : 'no chat found',
              alreadyUpdated: titleUpdatedRef.current.has(targetChatId),
            })

            if (chatToCheck && isGenericTitle(chatToCheck.title)) {
              const newTitle = generateSmartTitle(textContent)
              console.log('[useChatHistory] Auto-generating title:', {
                from: chatToCheck.title,
                to: newTitle,
              })
              // Fire and forget - don't wait for this
              updateChatTitle(targetChatId, newTitle).catch(console.error)
            } else {
              // Mark as updated so we don't try again
              titleUpdatedRef.current.add(targetChatId)
            }
          }
        }
        return data
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error persisting message:', err)
        return null
      }
    },
    [user, currentChat, chats, updateChatTitle],
  )

  // Clear current chat selection
  const clearCurrentChat = React.useCallback(() => {
    setCurrentChat(null)
    setMessages([])
    setUiMessages([])
    setArtifacts([])
  }, [])

  return {
    chats,
    currentChat,
    messages,
    uiMessages,
    artifacts,
    isLoading,
    error,
    createChat,
    loadChat,
    updateChatTitle,
    deleteChat,
    persistMessage,
    refreshChats,
    clearCurrentChat,
  }
}
