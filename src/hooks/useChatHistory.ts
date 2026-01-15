'use client'

import * as React from 'react'
import { useAuth, chatService } from '@/lib/supabase'
import type { Chat, ChatMessage } from '@/lib/supabase'

interface UseChatHistoryReturn {
  chats: Array<Chat>
  currentChat: Chat | null
  messages: Array<ChatMessage>
  isLoading: boolean
  error: Error | null
  createChat: (title: string) => Promise<Chat | null>
  loadChat: (chatId: string) => Promise<void>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  sendMessage: (
    content: string,
    role?: 'user' | 'assistant',
    chatId?: string,
  ) => Promise<ChatMessage | null>
  refreshChats: () => Promise<void>
}

export function useChatHistory(): UseChatHistoryReturn {
  const { user } = useAuth()

  const [chats, setChats] = React.useState<Array<Chat>>([])
  const [currentChat, setCurrentChat] = React.useState<Chat | null>(null)
  const [messages, setMessages] = React.useState<Array<ChatMessage>>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

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
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Load chats on mount and when user changes
  React.useEffect(() => {
    refreshChats()
  }, [refreshChats])

  // Create a new chat
  const createChat = React.useCallback(
    async (title: string): Promise<Chat | null> => {
      if (!user) return null

      setError(null)

      try {
        const { data, error: createError } = await chatService.createChat(
          user.id,
          title,
        )
        if (createError) throw createError
        if (data) {
          setChats((prev) => [data, ...prev])
          setCurrentChat(data)
          setMessages([])
        }
        return data
      } catch (err) {
        setError(err as Error)
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
      const { data, error: fetchError } =
        await chatService.getChatWithMessages(chatId)
      if (fetchError) throw fetchError
      if (data) {
        setCurrentChat(data.chat)
        setMessages(data.messages)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update chat title
  const updateChatTitle = React.useCallback(
    async (chatId: string, title: string) => {
      setError(null)

      try {
        const { error: updateError } = await chatService.updateChat(chatId, {
          title,
        })
        if (updateError) throw updateError

        setChats((prev) =>
          prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
        )

        if (currentChat?.id === chatId) {
          setCurrentChat((prev) => (prev ? { ...prev, title } : null))
        }
      } catch (err) {
        setError(err as Error)
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

        if (currentChat?.id === chatId) {
          setCurrentChat(null)
          setMessages([])
        }
      } catch (err) {
        setError(err as Error)
      }
    },
    [currentChat],
  )

  // Send a message in the current chat (or specified chat)
  const sendMessage = React.useCallback(
    async (
      content: string,
      role: 'user' | 'assistant' = 'user',
      chatId?: string,
    ): Promise<ChatMessage | null> => {
      const targetChatId = chatId || currentChat?.id
      if (!user || !targetChatId) return null

      setError(null)

      try {
        const { data, error: sendError } = await chatService.addMessage(
          targetChatId,
          user.id,
          role,
          content,
        )
        if (sendError) throw sendError
        if (data) {
          setMessages((prev) => [...prev, data])
        }
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [user, currentChat],
  )

  return {
    chats,
    currentChat,
    messages,
    isLoading,
    error,
    createChat,
    loadChat,
    updateChatTitle,
    deleteChat,
    sendMessage,
    refreshChats,
  }
}
