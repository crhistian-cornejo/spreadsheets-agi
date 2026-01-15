'use client'

import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Json } from '@/lib/supabase'
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
import { useChatHistory } from '@/hooks/useChatHistory'
import {
  CreateFileDialog,
  OpenFileDialog,
  ProfileDialog,
  SettingsDialog,
} from '@/components/dialogs'

export function WorkspaceApp() {
  const navigate = useNavigate()
  const { user, signOut, isLoading: authLoading } = useAuth()
  const isE2E = import.meta.env.VITE_E2E === 'true'

  const [currentApp, setCurrentApp] = React.useState<
    'sheets' | 'docs' | 'slides'
  >('sheets')
  const [mode, setMode] = React.useState<'native' | 'ai-chat'>('native')
  const [darkMode, setDarkMode] = React.useState(false)
  const [isAIChatPanelOpen, setIsAIChatPanelOpen] = React.useState(false)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = React.useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false)

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user && !isE2E) {
      navigate({ to: '/login' })
    }
  }, [user, authLoading, navigate, isE2E])

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

  // Chat history
  const {
    chats,
    currentChat,
    messages: chatMessages,
    isLoading: _chatLoading, // TODO: Use for loading indicator
    createChat,
    loadChat,
    deleteChat,
    sendMessage: persistMessage,
  } = useChatHistory()

  // Convert DB messages to UIMessage format for AI SDK
  // IMPORTANT: Return empty array instead of undefined to avoid SDK initialization issues
  const initialChatMessages = React.useMemo(() => {
    if (!chatMessages || chatMessages.length === 0) return [] // Return empty array instead of undefined

    return chatMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: msg.content }],
      createdAt: new Date(msg.created_at),
    }))
  }, [chatMessages])

  // Handle persisting chat messages
  const handleMessageSent = React.useCallback(
    async (role: 'user' | 'assistant', content: string) => {
      if (!currentChat) {
        // Create a new chat if there isn't one, then persist the message
        const newChat = await createChat('Nueva conversación')
        if (newChat) {
          // Persist using the newly created chat ID
          await persistMessage(content, role, newChat.id)
        }
        return
      }

      await persistMessage(content, role)
    },
    [currentChat, createChat, persistMessage],
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
  const handleSwitchToNative = (data: Record<string, unknown>) => {
    // If we have an active workbook, update it
    if (activeWorkbook) {
      updateWorkbook(activeWorkbook.id, data as Json)
    }
    setMode('native')
  }

  // Handle creating a new file
  const handleCreateFile = async (name: string, type: 'sheets' | 'docs') => {
    const newWorkbook = await createWorkbook(name, type)
    if (newWorkbook) {
      setCurrentApp(type)
      toast.success('Archivo creado', {
        description: `"${newWorkbook.name}" está listo para usar`,
      })
      return
    }

    toast.error('Error', {
      description: 'No se pudo crear el archivo',
    })
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
    const chat = await createChat('Nueva conversación')
    if (chat) {
      toast.info('Nueva conversación', {
        description: 'Se ha creado una nueva conversación',
      })
    }
  }

  // Handle loading a chat
  const handleLoadChat = async (id: string) => {
    await loadChat(id)
    const chat = chats.find((c) => c.id === id)
    if (chat) {
      toast.info('Conversación cargada', {
        description: `"${chat.title}"`,
      })
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
            </div>

            <div className="flex items-center gap-2">
              <ModeToggle mode={mode} onModeChange={setMode} />

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
                onMessageSent={handleMessageSent}
              />
            ) : (
              <AIChatMode
                darkMode={darkMode}
                onSwitchToNative={handleSwitchToNative}
                chatId={currentChat?.id}
                initialMessages={initialChatMessages}
                onMessageSent={handleMessageSent}
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
    </SidebarProvider>
  )
}
