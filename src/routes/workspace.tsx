import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { WorkbookProvider } from '@/lib/stores/workbook-context'
import { Toaster } from '@/components/ui/sonner'
import { chatService, useAuth } from '@/lib/supabase'

// Lazy load the workspace component for better performance
const WorkspaceApp = lazy(() =>
  import('@/components/workspace/WorkspaceApp').then((m) => ({
    default: m.WorkspaceApp,
  })),
)

export const Route = createFileRoute('/workspace')({
  component: WorkspacePage,
  head: () => ({
    meta: [
      { title: 'Workspace | Spreadsheets-AGI' },
      {
        name: 'description',
        content:
          'Tu espacio de trabajo inteligente para hojas de cálculo y documentos.',
      },
    ],
  }),
})

function WorkspacePage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // On mount, check for existing chats and redirect
  useEffect(() => {
    if (authLoading || isRedirecting) return
    if (!user) return // Let WorkspaceApp handle redirect to login

    const initChat = async () => {
      setIsRedirecting(true)
      try {
        // Check for existing chats
        const { data: existingChats } = await chatService.getChats(user.id)

        if (existingChats && existingChats.length > 0) {
          // Redirect to the most recent chat
          navigate({
            to: '/workspace/chat/$chatId',
            params: { chatId: existingChats[0].id },
            replace: true,
          })
          return
        }

        // No existing chats - create a new one
        const { data: newChat } = await chatService.createChat(
          user.id,
          'Nueva conversación',
        )

        if (newChat) {
          navigate({
            to: '/workspace/chat/$chatId',
            params: { chatId: newChat.id },
            replace: true,
          })
          return
        }

        // Fallback: couldn't create chat, show workspace anyway
        setIsRedirecting(false)
      } catch (error) {
        console.error('[WorkspacePage] Error initializing chat:', error)
        setIsRedirecting(false)
      }
    }

    initChat()
  }, [user, authLoading, navigate, isRedirecting])

  // Show loading while redirecting
  if (authLoading || isRedirecting) {
    return <WorkspaceLoading />
  }

  // Fallback: render workspace if redirect didn't work
  return (
    <WorkbookProvider>
      <Suspense fallback={<WorkspaceLoading />}>
        <WorkspaceApp />
      </Suspense>
      <Toaster position="bottom-right" />
    </WorkbookProvider>
  )
}

function WorkspaceLoading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Cargando workspace...</p>
      </div>
    </div>
  )
}
