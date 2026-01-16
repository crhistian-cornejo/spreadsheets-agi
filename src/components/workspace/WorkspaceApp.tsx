'use client'

import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Chat, Json, StoredUIMessagePart } from '@/lib/supabase'
import type { UIMessage } from '@tanstack/ai-react'
import type { StoredArtifact } from '@/hooks/use-spreadsheet-chat'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { UserAccountMenu } from '@/components/layout/UserAccountMenu'
import { ModeToggle } from '@/components/layout/ModeToggle'
import { AIChatMode } from '@/components/workspace/AIChatMode'
import { NativeMode } from '@/components/workspace/NativeMode'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/lib/supabase'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useWorkbooks } from '@/lib/stores/workbook-context'
import { useChatHistory } from '@/hooks/use-chat-history'
import {
  ArchivedChatsDialog,
  CreateFileDialog,
  OpenFileDialog,
  ProfileDialog,
  SettingsDialog,
} from '@/components/dialogs'

/** Preloaded chat data from route loader */
export interface PreloadedChatData {
  chatId: string
  chat: Chat
  uiMessages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    parts: Array<StoredUIMessagePart>
    createdAt: Date
  }>
  artifacts: Array<StoredArtifact> | undefined
}

export interface WorkspaceAppProps {
  /** Initial chat ID from URL params */
  initialChatId?: string
  /** Preloaded chat data from route loader - makes loading instant */
  preloadedChatData?: PreloadedChatData
}

export function WorkspaceApp({
  initialChatId,
  preloadedChatData,
}: WorkspaceAppProps = {}) {
  const navigate = useNavigate()
  const { user, signOut, isLoading: authLoading } = useAuth()
  const isE2E = import.meta.env.VITE_E2E === 'true'

  const [currentApp, setCurrentApp] = React.useState<
    'sheets' | 'docs' | 'slides'
  >('sheets')
  // If we have an initialChatId, start in ai-chat mode
  const [mode, setMode] = React.useState<'native' | 'ai-chat'>('ai-chat')
  const [darkMode, setDarkMode] = React.useState(false)
  const [isAIChatPanelOpen, setIsAIChatPanelOpen] = React.useState(false)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = React.useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false)
  const [isArchivedChatsDialogOpen, setIsArchivedChatsDialogOpen] =
    React.useState(false)

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user && !isE2E) {
      navigate({ to: '/login' })
    }
  }, [user, authLoading, navigate])

  // Workbook store
  const {
    activeWorkbook,
    settings,
    isSaving,
    createWorkbook,
    updateWorkbook,
    deleteWorkbook,
    loadWorkbook,
    duplicateWorkbook,
    getRecentWorkbooks,
    updateSettings,
  } = useWorkbooks()

  // Get recent workbooks
  const recentWorkbooks = React.useMemo(
    () => getRecentWorkbooks(10),
    [getRecentWorkbooks],
  )

  // Chat history hook - used for sidebar list and mutations
  const {
    chats,
    archivedChats,
    currentChat: hookCurrentChat,
    uiMessages: hookUIMessages,
    artifacts: hookArtifacts,
    isLoading: chatLoading,
    isCreating: isCreatingChat,
    createChat,
    loadChat,
    deleteChat,
    archiveChat,
    unarchiveChat,
    archiveChats,
    deleteChats,
    refreshArchivedChats,
    persistMessage,
    setCurrentChatFromPreloaded,
  } = useChatHistory()

  // Initialize from preloaded data if available (from route loader)
  // This runs once when component mounts with preloaded data
  React.useEffect(() => {
    if (preloadedChatData && !hookCurrentChat) {
      console.log(
        '[WorkspaceApp] Initializing from preloaded data:',
        preloadedChatData.chatId,
      )
      setCurrentChatFromPreloaded(
        preloadedChatData.chat,
        preloadedChatData.uiMessages,
        preloadedChatData.artifacts,
      )
    }
  }, [preloadedChatData, hookCurrentChat, setCurrentChatFromPreloaded])

  // Use preloaded data if available and hook hasn't loaded yet, otherwise use hook data
  const currentChat = preloadedChatData?.chat ?? hookCurrentChat
  const chatUIMessages = preloadedChatData?.uiMessages ?? hookUIMessages
  const chatArtifacts = preloadedChatData?.artifacts ?? hookArtifacts

  // Track which chatId we're currently loading to prevent race conditions
  const [loadingChatId, setLoadingChatId] = React.useState<string | null>(null)

  // Check if chat data is ready - SIMPLIFIED with preloaded data
  const isChatDataReady = React.useMemo(() => {
    // If we're not in ai-chat mode, we're always ready
    if (mode !== 'ai-chat') return true
    // If we have preloaded data for this chat, we're immediately ready
    if (preloadedChatData?.chatId === initialChatId) return true
    // If we're creating a new chat, wait for it
    if (isCreatingChat) return false
    // If we're actively loading a chat via the hook, wait
    if (chatLoading && loadingChatId) return false
    // Otherwise we're ready
    return true
  }, [
    mode,
    preloadedChatData,
    initialChatId,
    isCreatingChat,
    chatLoading,
    loadingChatId,
  ])

  // Load initial chat from URL param ONLY if no preloaded data
  React.useEffect(() => {
    // Skip if we have preloaded data
    if (preloadedChatData) return

    if (initialChatId && user && !currentChat && !loadingChatId) {
      console.log(
        '[WorkspaceApp] Loading initial chat from URL (no preload):',
        initialChatId,
      )
      setLoadingChatId(initialChatId)
      loadChat(initialChatId)
        .catch((err) => {
          console.error('[WorkspaceApp] Failed to load initial chat:', err)
          toast.error('Error', {
            description:
              'No se pudo cargar la conversación. Creando una nueva...',
          })
          // Redirect to base workspace and let auto-create handle it
          navigate({ to: '/workspace' })
        })
        .finally(() => {
          setLoadingChatId(null)
        })
    }
  }, [
    initialChatId,
    user,
    currentChat,
    loadChat,
    loadingChatId,
    navigate,
    preloadedChatData,
  ])

  // Update URL when chat changes (only in ai-chat mode)
  React.useEffect(() => {
    if (mode !== 'ai-chat') return

    if (currentChat?.id) {
      // Only update if URL doesn't already have this chatId
      const currentPath = window.location.pathname
      const expectedPath = `/workspace/chat/${currentChat.id}`
      if (currentPath !== expectedPath) {
        navigate({
          to: '/workspace/chat/$chatId',
          params: { chatId: currentChat.id },
          replace: true,
        })
      }
    }
  }, [currentChat?.id, mode, navigate])

  // Use UIMessages from chat history (already in TanStack AI format)
  // Cast to UIMessage format - the parts are compatible
  const initialChatMessages = React.useMemo(() => {
    if (!chatUIMessages || chatUIMessages.length === 0) return []
    // Cast to UIMessage - StoredUIMessagePart is structurally compatible
    return chatUIMessages as unknown as Array<UIMessage>
  }, [chatUIMessages])

  // Initial artifacts from chat history
  const initialArtifacts = React.useMemo(() => {
    if (!chatArtifacts || chatArtifacts.length === 0) return undefined
    return chatArtifacts
  }, [chatArtifacts])

  // NOTE: We intentionally do NOT auto-create chats here.
  // Users should click "New Chat" in the sidebar or the handleCreateChat button.
  // This prevents the triple-chat creation bug caused by race conditions.

  // Handle persisting chat messages (with full parts and artifacts)
  // IMPORTANT: A chat MUST exist before messages can be persisted.
  // If no chat exists, we log an error - the route should handle chat creation.
  const handleMessagePersist = React.useCallback(
    async (message: {
      id: string
      role: 'user' | 'assistant'
      parts: Array<StoredUIMessagePart>
      artifacts?: Array<StoredArtifact>
    }) => {
      if (!currentChat) {
        console.error(
          '[WorkspaceApp] No currentChat! Messages cannot be persisted without a chat.',
          'Navigate to /workspace to create a new chat first.',
        )
        return
      }

      await persistMessage(message, currentChat.id)
    },
    [currentChat, persistMessage],
  )

  // Handle theme from settings
  React.useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
  }, [settings.theme])

  // Handle dark mode toggle
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Handle switching from AI chat to native with artifact data
  const handleSwitchToNative = async (data: Record<string, unknown>) => {
    // If we have an active workbook, update it and switch
    if (activeWorkbook) {
      updateWorkbook(activeWorkbook.id, data as Json)
      setMode('native')
      navigate({ to: '/workspace' })
      return
    }

    // No active workbook - create one from the artifact data
    // Detect type from data structure
    const isSheet = data.sheets || data.cells || data.columns
    const type = isSheet ? 'sheets' : 'docs'
    const name =
      (data.title as string) ||
      (isSheet ? 'Hoja sin título' : 'Documento sin título')

    const newWorkbook = await createWorkbook(name, type)
    if (newWorkbook) {
      await updateWorkbook(newWorkbook.id, data as Json)
      setCurrentApp(type)
      setMode('native')
      navigate({ to: '/workspace' })
      toast.success('Archivo creado', {
        description: `"${newWorkbook.name}" creado desde el chat`,
      })
    } else {
      // Fallback: open create dialog
      setIsCreateDialogOpen(true)
    }
  }

  // Handle creating a new file
  const handleCreateFile = async (name: string, type: 'sheets' | 'docs') => {
    console.log('[WorkspaceApp] handleCreateFile called:', {
      name,
      type,
      user: !!user,
    })

    if (!user) {
      toast.error('Error', {
        description: 'Debes iniciar sesión para crear archivos',
      })
      throw new Error('No user logged in')
    }

    const newWorkbook = await createWorkbook(name, type)
    console.log('[WorkspaceApp] createWorkbook result:', newWorkbook)

    if (newWorkbook) {
      setCurrentApp(type)
      // Switch to native mode after creating the file
      setMode('native')
      navigate({ to: '/workspace' })
      toast.success('Archivo creado', {
        description: `"${newWorkbook.name}" está listo para usar`,
      })
      return
    }

    // If we get here, creation failed
    toast.error('Error', {
      description: 'No se pudo crear el archivo. Verifica tu conexión.',
    })
    throw new Error('Failed to create workbook')
  }

  // Handle importing a file
  const handleFileImported = async (
    name: string,
    type: 'sheets' | 'docs',
    data: Record<string, unknown>,
  ) => {
    const newWorkbook = await createWorkbook(name, type)
    if (newWorkbook) {
      await updateWorkbook(newWorkbook.id, data as Json)
      setCurrentApp(type)
      // Switch to native mode after importing the file
      setMode('native')
      navigate({ to: '/workspace' })
      toast.success('Archivo importado', {
        description: `"${name}" se ha importado correctamente`,
      })
    } else {
      toast.error('Error', {
        description: 'No se pudo importar el archivo',
      })
    }
  }

  // Handle loading a workbook
  const handleLoadWorkbook = async (id: string) => {
    await loadWorkbook(id)
    const workbook = recentWorkbooks.find((w) => w.id === id)
    if (workbook) {
      setCurrentApp(workbook.type)
      toast.info('Archivo abierto', {
        description: `Trabajando en "${workbook.name}"`,
      })
    }
  }

  // Handle deleting a workbook
  const handleDeleteWorkbook = async (id: string) => {
    const workbook = recentWorkbooks.find((w) => w.id === id)
    await deleteWorkbook(id)
    toast.success('Archivo eliminado', {
      description: workbook
        ? `"${workbook.name}" ha sido eliminado`
        : 'Archivo eliminado',
    })
  }

  // Handle duplicating a workbook
  const handleDuplicateWorkbook = async (id: string) => {
    const newWorkbook = await duplicateWorkbook(id)
    if (newWorkbook) {
      toast.success('Archivo duplicado', {
        description: `Se ha creado "${newWorkbook.name}"`,
      })
    } else {
      toast.error('Error', {
        description: 'No se pudo duplicar el archivo',
      })
    }
  }

  // Handle creating a new chat
  const handleCreateChat = async () => {
    // Create with no title - it will be set to 'Nueva conversación' initially
    // and auto-updated when first message is sent
    const chat = await createChat()
    if (chat) {
      // Navigate to the new chat URL
      navigate({ to: '/workspace/chat/$chatId', params: { chatId: chat.id } })
      toast.info('Nueva conversación', {
        description: 'Escribe tu primer mensaje para comenzar',
      })
    }
  }

  // Handle loading a chat
  const handleLoadChat = async (id: string) => {
    // Don't reload the same chat
    if (currentChat?.id === id && !chatLoading) {
      // Just navigate if we're already on this chat
      navigate({ to: '/workspace/chat/$chatId', params: { chatId: id } })
      return
    }

    // Set loading state BEFORE starting the load
    setLoadingChatId(id)
    try {
      await loadChat(id)
      // Navigate to chat URL after data is loaded
      navigate({ to: '/workspace/chat/$chatId', params: { chatId: id } })
      const chat = chats.find((c) => c.id === id)
      if (chat) {
        toast.info('Conversación cargada', {
          description: `"${chat.title}"`,
        })
      }
    } catch (error) {
      console.error('[WorkspaceApp] Error loading chat:', error)
      toast.error('Error al cargar', {
        description: 'No se pudo cargar la conversación',
      })
    } finally {
      // Always clear loading state
      setLoadingChatId(null)
    }
  }

  // Handle deleting a chat
  const handleDeleteChat = async (id: string) => {
    const chat = chats.find((c) => c.id === id)

    await deleteChat(id)
    toast.success('Conversación eliminada', {
      description: chat
        ? `"${chat.title}" ha sido eliminada`
        : 'Conversación eliminada',
    })
    // Note: If this was the current chat, the auto-create effect will
    // automatically create a new one since currentChat becomes null
  }

  // Handle archiving a chat
  const handleArchiveChat = async (id: string) => {
    const chat = chats.find((c) => c.id === id)
    await archiveChat(id)
    toast.success('Conversación archivada', {
      description: chat
        ? `"${chat.title}" ha sido movida a archivados`
        : 'Conversación archivada',
    })
  }

  // Handle archiving multiple chats
  const handleArchiveChats = async (ids: Array<string>) => {
    await archiveChats(ids)
    toast.success(`${ids.length} conversaciones archivadas`)
  }

  // Handle deleting multiple chats
  const handleDeleteChats = async (ids: Array<string>) => {
    await deleteChats(ids)
    toast.success(`${ids.length} conversaciones eliminadas`)
  }

  // Handle exporting a workbook
  const handleExportWorkbook = (id: string) => {
    const workbook = recentWorkbooks.find((w) => w.id === id)
    if (!workbook) return

    // Create JSON blob and download
    const blob = new Blob([JSON.stringify(workbook.content, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workbook.name}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Archivo exportado', {
      description: `"${workbook.name}.json" se ha descargado`,
    })
  }

  // Handle mode change with URL updates
  const handleModeChange = React.useCallback(
    (newMode: 'native' | 'ai-chat') => {
      if (newMode === 'native') {
        // When switching to native, require an active workbook
        if (!activeWorkbook) {
          // Open create file dialog instead of switching
          setIsCreateDialogOpen(true)
          return
        }
        // Only switch if we have an active workbook
        setMode(newMode)
        navigate({ to: '/workspace' })
      } else {
        setMode(newMode)
        if (currentChat?.id) {
          // When switching to ai-chat with existing chat, use chat URL
          navigate({
            to: '/workspace/chat/$chatId',
            params: { chatId: currentChat.id },
          })
        }
        // If switching to ai-chat without a chat, the auto-create effect will handle it
      }
    },
    [navigate, currentChat?.id, activeWorkbook],
  )

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    const newDark = !darkMode
    setDarkMode(newDark)
    updateSettings({ theme: newDark ? 'dark' : 'light' })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/login' })
  }

  // Use client-side only rendering to avoid hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false)
  const [authTimeout, setAuthTimeout] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!authLoading) return
    const timer = window.setTimeout(() => setAuthTimeout(true), 4000)
    return () => window.clearTimeout(timer)
  }, [authLoading])

  // Show loading while checking auth or not mounted yet
  if (!isMounted || authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
          {authTimeout && (
            <p className="text-xs text-muted-foreground">
              La sesión está tardando más de lo normal…
            </p>
          )}
        </div>
      </div>
    )
  }

  // Don't render workspace if not authenticated
  if (!user && !isE2E) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={mode !== 'ai-chat'} key={mode}>
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        {mode === 'ai-chat' && (
          <AppSidebar
            currentApp={currentApp}
            onAppChange={setCurrentApp}
            darkMode={darkMode}
            onDarkModeToggle={handleDarkModeToggle}
            recentWorkbooks={recentWorkbooks}
            activeWorkbookId={activeWorkbook?.id || null}
            onCreateNew={() => setIsCreateDialogOpen(true)}
            onOpenFile={() => setIsOpenDialogOpen(true)}
            onLoadWorkbook={handleLoadWorkbook}
            onDeleteWorkbook={handleDeleteWorkbook}
            onDuplicateWorkbook={handleDuplicateWorkbook}
            onExportWorkbook={handleExportWorkbook}
            onOpenSettings={() => setIsSettingsDialogOpen(true)}
            onOpenProfile={() => setIsProfileDialogOpen(true)}
            onSignOut={handleSignOut}
            // Chat history props
            recentChats={chats}
            activeChatId={currentChat?.id || null}
            onCreateChat={handleCreateChat}
            onLoadChat={handleLoadChat}
            onDeleteChat={handleDeleteChat}
            onArchiveChat={handleArchiveChat}
            onArchiveChats={handleArchiveChats}
            onDeleteChats={handleDeleteChats}
            onOpenArchivedChats={() => {
              refreshArchivedChats()
              setIsArchivedChatsDialogOpen(true)
            }}
            // Artifacts props - artifacts are workbooks with ARTIFACT_WORKBOOK_PREFIX
            artifacts={recentWorkbooks}
            onLoadArtifact={handleLoadWorkbook}
            onDeleteArtifact={handleDeleteWorkbook}
          />
        )}

        <SidebarInset className="flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-11 border-b border-border flex shrink-0 items-center justify-between px-4 bg-background">
            <div className="flex items-center gap-2">
              {mode === 'ai-chat' && <SidebarTrigger className="-ml-1" />}
              {mode === 'ai-chat' && (
                <Separator orientation="vertical" className="mr-2 h-4" />
              )}
              <h1 className="font-semibold text-sm">
                {activeWorkbook?.name || (
                  <>
                    {currentApp === 'sheets' && 'Spreadsheet'}
                    {currentApp === 'docs' && 'Document'}
                    {currentApp === 'slides' && 'Presentation'}
                  </>
                )}
              </h1>
              {/* Saving indicator */}
              {isSaving && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Guardando...
                </span>
              )}
              {/* Chat loading indicator */}
              {isCreatingChat && mode === 'ai-chat' && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Creando chat...
                </span>
              )}
              {loadingChatId && !isCreatingChat && mode === 'ai-chat' && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Cargando chat...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ModeToggle mode={mode} onModeChange={handleModeChange} />

              {mode === 'native' && (
                <>
                  <Separator
                    orientation="vertical"
                    className="h-4 mx-2 self-center"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAIChatPanelOpen(!isAIChatPanelOpen)}
                      className={`p-2 rounded-md hover:bg-accent transition-colors ${isAIChatPanelOpen ? 'bg-accent text-primary' : 'text-muted-foreground'}`}
                      title="Asistente IA"
                    >
                      <Logo className="size-5" />
                    </button>

                    <UserAccountMenu
                      darkMode={darkMode}
                      onDarkModeToggle={handleDarkModeToggle}
                      onOpenSettings={() => setIsSettingsDialogOpen(true)}
                      onOpenProfile={() => setIsProfileDialogOpen(true)}
                      onSignOut={handleSignOut}
                      className="ml-1"
                    />
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-hidden relative">
            {mode === 'native' ? (
              <NativeMode
                darkMode={darkMode}
                initialData={activeWorkbook?.content as Record<string, unknown>}
                isPanelOpen={isAIChatPanelOpen}
                onPanelChange={setIsAIChatPanelOpen}
                onDataChange={(data) => {
                  if (activeWorkbook) {
                    updateWorkbook(activeWorkbook.id, data as Json)
                  }
                }}
                // Chat persistence props
                chatId={currentChat?.id}
                initialMessages={initialChatMessages}
                initialArtifacts={initialArtifacts}
                onMessagePersist={handleMessagePersist}
                workbookId={activeWorkbook?.id || null}
                // App type props
                currentApp={currentApp}
                onAppChange={setCurrentApp}
              />
            ) : !isChatDataReady ? (
              // Show loading state while chat data is being fetched
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Cargando conversación...
                  </p>
                </div>
              </div>
            ) : (
              <AIChatMode
                key={`${currentChat?.id || 'new'}-${initialChatMessages.length}`}
                darkMode={darkMode}
                onSwitchToNative={handleSwitchToNative}
                chatId={currentChat?.id}
                initialMessages={initialChatMessages}
                initialArtifacts={initialArtifacts}
                onMessagePersist={handleMessagePersist}
                workbookId={activeWorkbook?.id || null}
              />
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      <CreateFileDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateFile={handleCreateFile}
        defaultType={currentApp === 'docs' ? 'docs' : 'sheets'}
      />

      <OpenFileDialog
        open={isOpenDialogOpen}
        onOpenChange={setIsOpenDialogOpen}
        onFileImported={handleFileImported}
      />

      <SettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        settings={settings}
        onSettingsChange={updateSettings}
      />

      <ProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />

      <ArchivedChatsDialog
        open={isArchivedChatsDialogOpen}
        onOpenChange={setIsArchivedChatsDialogOpen}
        archivedChats={archivedChats}
        onUnarchive={unarchiveChat}
        onDelete={deleteChat}
      />
    </SidebarProvider>
  )
}
