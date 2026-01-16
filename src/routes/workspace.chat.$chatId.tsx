import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Suspense, lazy, useEffect } from 'react'
import { WorkbookProvider } from '@/lib/stores/workbook-context'
import { Toaster } from '@/components/ui/sonner'

// Lazy load the workspace component for better performance
const WorkspaceApp = lazy(() =>
  import('@/components/workspace/WorkspaceApp').then((m) => ({
    default: m.WorkspaceApp,
  })),
)

export const Route = createFileRoute('/workspace/chat/$chatId')({
  component: WorkspaceChatPage,
  head: () => ({
    meta: [
      { title: 'Chat | Spreadsheets-AGI' },
      {
        name: 'description',
        content: 'Conversación con el asistente IA de Spreadsheets.',
      },
    ],
  }),
})

function WorkspaceChatPage() {
  const { chatId } = Route.useParams()
  const navigate = useNavigate()

  // Validate chatId format (UUID)
  useEffect(() => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(chatId)) {
      console.warn(
        '[WorkspaceChatPage] Invalid chatId, redirecting to workspace',
      )
      navigate({ to: '/workspace' })
    }
  }, [chatId, navigate])

  return (
    <WorkbookProvider>
      <Suspense fallback={<WorkspaceLoading />}>
        <WorkspaceApp initialChatId={chatId} />
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
