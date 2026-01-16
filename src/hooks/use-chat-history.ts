'use client'

import * as React from 'react'
import type { Chat, ChatMessage, StoredUIMessagePart } from '@/lib/supabase'
import { chatService, useAuth } from '@/lib/supabase'
import type { StoredArtifact } from '@/hooks/use-spreadsheet-chat'

/** UIMessage format for TanStack AI - exported for route loaders */
export interface ChatUIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Array<StoredUIMessagePart>
  createdAt: Date
}

interface UseChatHistoryReturn {
  chats: Array<Chat>
  archivedChats: Array<Chat>
  currentChat: Chat | null
  messages: Array<ChatMessage>
  /** Messages converted to UIMessage format for TanStack AI */
  uiMessages: Array<ChatUIMessage>
  /** Artifacts from all messages in the current chat */
  artifacts: Array<StoredArtifact>
  isLoading: boolean
  /** True when creating a new chat */
  isCreating: boolean
  error: Error | null
  /** Create a new chat - returns the new chat or null if failed */
  createChat: (title?: string) => Promise<Chat | null>
  /** Load a chat by ID - use the route loader instead when possible */
  loadChat: (chatId: string) => Promise<void>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  /** Archive a chat (soft delete) */
  archiveChat: (chatId: string) => Promise<void>
  /** Unarchive a chat */
  unarchiveChat: (chatId: string) => Promise<void>
  /** Archive multiple chats */
  archiveChats: (chatIds: Array<string>) => Promise<void>
  /** Delete multiple chats */
  deleteChats: (chatIds: Array<string>) => Promise<void>
  /** Persist a full UIMessage with parts and artifacts */
  persistMessage: (
    message: {
      id: string
      role: 'user' | 'assistant'
      parts: Array<StoredUIMessagePart>
      artifacts?: Array<StoredArtifact>
    },
    chatId: string,
  ) => Promise<ChatMessage | null>
  refreshChats: () => Promise<void>
  refreshArchivedChats: () => Promise<void>
  clearCurrentChat: () => void
  /** Set current chat directly (from route loader data) */
  setCurrentChat: (chat: Chat | null) => void
  /** Set current chat with preloaded data (from route loader) */
  setCurrentChatFromPreloaded: (
    chat: Chat,
    uiMessages: Array<ChatUIMessage>,
    artifacts?: Array<StoredArtifact>,
  ) => void
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
  const [archivedChats, setArchivedChats] = React.useState<Array<Chat>>([])
  const [currentChat, setCurrentChat] = React.useState<Chat | null>(null)
  const [messages, setMessages] = React.useState<Array<ChatMessage>>([])
  const [uiMessages, setUiMessages] = React.useState<Array<ChatUIMessage>>([])
  const [artifacts, setArtifacts] = React.useState<Array<StoredArtifact>>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // Track if we've already updated the title for this chat session
  const titleUpdatedRef = React.useRef<Set<string>>(new Set())

  // Track in-flight operations to prevent duplicates
  const createInFlightRef = React.useRef(false)

  // Load all active chats for the user
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

  // Load archived chats for the user
  const refreshArchivedChats = React.useCallback(async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await chatService.getArchivedChats(
        user.id,
      )
      if (fetchError) throw fetchError
      setArchivedChats(data)
    } catch (err) {
      console.error('[useChatHistory] Error refreshing archived chats:', err)
    }
  }, [user])

  // Load chats on mount and when user changes
  React.useEffect(() => {
    refreshChats()
  }, [refreshChats])

  // Create a new chat (title is optional, will be set on first message)
  // Protected against duplicate calls with in-flight tracking
  const createChat = React.useCallback(
    async (title?: string): Promise<Chat | null> => {
      if (!user) return null

      // Prevent duplicate creates
      if (createInFlightRef.current) {
        console.log('[useChatHistory] createChat: Already in flight, skipping')
        return null
      }

      createInFlightRef.current = true
      setIsCreating(true)
      setError(null)

      // Use a temporary title if not provided
      const initialTitle = title || 'Nueva conversación'

      try {
        console.log('[useChatHistory] Creating chat:', initialTitle)
        const { data, error: createError } = await chatService.createChat(
          user.id,
          initialTitle,
        )
        if (createError) throw createError
        if (data) {
          console.log('[useChatHistory] Chat created:', data.id)
          setChats((prev) => [data, ...prev])
          // Don't set currentChat here - let the caller handle navigation
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
      } finally {
        createInFlightRef.current = false
        setIsCreating(false)
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
        setArchivedChats((prev) => prev.filter((chat) => chat.id !== chatId))
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

  // Archive a chat (soft delete)
  const archiveChat = React.useCallback(
    async (chatId: string) => {
      setError(null)

      try {
        const { error: archiveError } = await chatService.archiveChat(chatId)
        if (archiveError) throw archiveError

        // Move from chats to archivedChats
        const archivedItem = chats.find((chat) => chat.id === chatId)
        if (archivedItem) {
          setChats((prev) => prev.filter((chat) => chat.id !== chatId))
          setArchivedChats((prev) => [
            { ...archivedItem, archived: true },
            ...prev,
          ])
        }

        if (currentChat?.id === chatId) {
          setCurrentChat(null)
          setMessages([])
          setUiMessages([])
          setArtifacts([])
        }
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error archiving chat:', err)
      }
    },
    [currentChat, chats],
  )

  // Unarchive a chat
  const unarchiveChat = React.useCallback(
    async (chatId: string) => {
      setError(null)

      try {
        const { error: unarchiveError } =
          await chatService.unarchiveChat(chatId)
        if (unarchiveError) throw unarchiveError

        // Move from archivedChats to chats
        const unarchivedItem = archivedChats.find((chat) => chat.id === chatId)
        if (unarchivedItem) {
          setArchivedChats((prev) => prev.filter((chat) => chat.id !== chatId))
          setChats((prev) => [{ ...unarchivedItem, archived: false }, ...prev])
        }
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error unarchiving chat:', err)
      }
    },
    [archivedChats],
  )

  // Archive multiple chats
  const archiveChats = React.useCallback(
    async (chatIds: Array<string>) => {
      setError(null)

      try {
        // Archive all in parallel
        await Promise.all(chatIds.map((id) => chatService.archiveChat(id)))

        // Move from chats to archivedChats
        const archivedItems = chats.filter((chat) => chatIds.includes(chat.id))
        setChats((prev) => prev.filter((chat) => !chatIds.includes(chat.id)))
        setArchivedChats((prev) => [
          ...archivedItems.map((c) => ({ ...c, archived: true })),
          ...prev,
        ])

        // Clear current if it was archived
        if (currentChat && chatIds.includes(currentChat.id)) {
          setCurrentChat(null)
          setMessages([])
          setUiMessages([])
          setArtifacts([])
        }
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error archiving chats:', err)
        // Refresh to get correct state
        refreshChats()
      }
    },
    [currentChat, chats, refreshChats],
  )

  // Delete multiple chats
  const deleteChats = React.useCallback(
    async (chatIds: Array<string>) => {
      setError(null)

      try {
        // Delete all in parallel
        await Promise.all(chatIds.map((id) => chatService.deleteChat(id)))

        setChats((prev) => prev.filter((chat) => !chatIds.includes(chat.id)))
        setArchivedChats((prev) =>
          prev.filter((chat) => !chatIds.includes(chat.id)),
        )
        chatIds.forEach((id) => titleUpdatedRef.current.delete(id))

        // Clear current if it was deleted
        if (currentChat && chatIds.includes(currentChat.id)) {
          setCurrentChat(null)
          setMessages([])
          setUiMessages([])
          setArtifacts([])
        }
      } catch (err) {
        setError(err as Error)
        console.error('[useChatHistory] Error deleting chats:', err)
        // Refresh to get correct state
        refreshChats()
      }
    },
    [currentChat, refreshChats],
  )

  // Persist a message to a specific chat
  // chatId is REQUIRED - the caller must ensure a chat exists first
  const persistMessage = React.useCallback(
    async (
      message: {
        id: string
        role: 'user' | 'assistant'
        parts: Array<StoredUIMessagePart>
        artifacts?: Array<StoredArtifact>
      },
      chatId: string,
    ): Promise<ChatMessage | null> => {
      if (!user || !chatId) {
        console.warn('[useChatHistory] persistMessage: No user or chatId', {
          user: !!user,
          chatId,
        })
        return null
      }

      // Extract text content for logging and title generation
      const textContent = chatService.extractTextFromParts(message.parts)

      console.log('[useChatHistory] persistMessage:', {
        role: message.role,
        chatId,
        contentPreview: textContent.slice(0, 50),
        hasParts: message.parts.length,
        hasArtifacts: message.artifacts?.length || 0,
      })
      setError(null)

      try {
        // Save the full UIMessage with parts and artifacts
        const { data, error: saveError } = await chatService.saveUIMessage(
          chatId,
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
          if (message.role === 'user' && !titleUpdatedRef.current.has(chatId)) {
            // Try to find the chat in local state
            let chatToCheck = chats.find((c) => c.id === chatId) || currentChat

            // If we still can't find the chat (just created), fetch it from DB
            if (!chatToCheck) {
              console.log(
                '[useChatHistory] Chat not in local state, fetching from DB',
              )
              const { data: fetchedChat } =
                await chatService.getChatWithMessages(chatId)
              chatToCheck = fetchedChat?.chat || null
            }

            console.log('[useChatHistory] Checking title update:', {
              chatId,
              chatTitle: chatToCheck?.title,
              isGeneric: chatToCheck
                ? isGenericTitle(chatToCheck.title)
                : 'no chat found',
              alreadyUpdated: titleUpdatedRef.current.has(chatId),
            })

            if (chatToCheck && isGenericTitle(chatToCheck.title)) {
              const newTitle = generateSmartTitle(textContent)
              console.log('[useChatHistory] Auto-generating title:', {
                from: chatToCheck.title,
                to: newTitle,
              })
              // Fire and forget - don't wait for this
              updateChatTitle(chatId, newTitle).catch(console.error)
            } else {
              // Mark as updated so we don't try again
              titleUpdatedRef.current.add(chatId)
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

  // Set current chat from preloaded route data (avoids double-loading)
  const setCurrentChatFromPreloaded = React.useCallback(
    (
      chat: Chat,
      preloadedUiMessages: Array<ChatUIMessage>,
      preloadedArtifacts?: Array<StoredArtifact>,
    ) => {
      console.log('[useChatHistory] setCurrentChatFromPreloaded:', chat.id)
      setCurrentChat(chat)
      setUiMessages(preloadedUiMessages)
      setArtifacts(preloadedArtifacts || [])
      // Mark as having messages if there are any
      if (preloadedUiMessages.length > 0) {
        titleUpdatedRef.current.add(chat.id)
      }
    },
    [],
  )

  return {
    chats,
    archivedChats,
    currentChat,
    messages,
    uiMessages,
    artifacts,
    isLoading,
    isCreating,
    error,
    createChat,
    loadChat,
    updateChatTitle,
    deleteChat,
    archiveChat,
    unarchiveChat,
    archiveChats,
    deleteChats,
    persistMessage,
    refreshChats,
    refreshArchivedChats,
    clearCurrentChat,
    setCurrentChat,
    setCurrentChatFromPreloaded,
  }
}
