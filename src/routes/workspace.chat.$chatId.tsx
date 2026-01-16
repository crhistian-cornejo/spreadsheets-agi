import { createFileRoute, redirect } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import type { Chat, StoredUIMessagePart } from '@/lib/supabase'
import type { StoredArtifact } from '@/hooks/use-spreadsheet-chat'
import { WorkbookProvider } from '@/lib/stores/workbook-context'
import { Toaster } from '@/components/ui/sonner'
import { chatService } from '@/lib/supabase'

// Lazy load the workspace component for better performance
const WorkspaceApp = lazy(() =>
  import('@/components/workspace/WorkspaceApp').then((m) => ({
    default: m.WorkspaceApp,
  })),
)

// Type for the loader data - exported for use in WorkspaceApp
export interface ChatLoaderData {
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

export const Route = createFileRoute('/workspace/chat/$chatId')({
  // Load chat data BEFORE rendering the component
  loader: async ({ params }) => {
    const { chatId } = params

    // Validate chatId format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(chatId)) {
      console.warn('[ChatLoader] Invalid chatId format, redirecting')
      throw redirect({ to: '/workspace' })
    }

    // Load chat and messages in parallel
    const [chatResult, messagesResult] = await Promise.all([
      chatService.getChat(chatId),
      chatService.getMessagesAsUIMessages(chatId),
    ])

    // If chat doesn't exist, redirect to workspace
    if (chatResult.error || !chatResult.data) {
      console.warn('[ChatLoader] Chat not found:', chatId)
      throw redirect({ to: '/workspace' })
    }

    return {
      chatId,
      chat: chatResult.data,
      uiMessages: messagesResult.data,
      artifacts: messagesResult.artifacts,
    } as ChatLoaderData
  },
  // Show loading while the loader is fetching
  pendingComponent: WorkspaceLoading,
  // Handle errors gracefully
  errorComponent: ({ error }) => {
    console.error('[ChatLoader] Error:', error)
    return <WorkspaceLoading />
  },
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
  // Get the pre-loaded data from the route loader
  const loaderData = Route.useLoaderData()

  // Safety check - should never happen since loader throws redirect on error
  if (!loaderData) {
    return <WorkspaceLoading />
  }

  return (
    <WorkbookProvider>
      <Suspense fallback={<WorkspaceLoading />}>
        <WorkspaceApp
          initialChatId={loaderData.chatId}
          preloadedChatData={loaderData}
        />
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
