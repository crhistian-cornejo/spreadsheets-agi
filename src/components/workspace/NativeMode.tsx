'use client'

import { Suspense, lazy, useCallback, useRef } from 'react'
import { IconAlertCircle, IconX } from '@tabler/icons-react'
import type { UIMessage } from '@ai-sdk/react'
import type { UniverSheetHandle } from '@/components/univer/UniverSheet'
import { ChatConversation } from '@/components/chat/ChatConversation'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatProvider, useChatContext } from '@/components/chat/ChatProvider'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

const UniverSheet = lazy(() =>
  import('@/components/univer/UniverSheet').then((m) => ({
    default: m.UniverSheet,
  })),
)

// ============================================================================
// Types
// ============================================================================

interface NativeModeProps {
  darkMode: boolean
  initialData?: Record<string, unknown>
  isPanelOpen: boolean
  onPanelChange: (open: boolean) => void
  /** Callback when spreadsheet data changes (debounced) */
  onDataChange?: (data: Record<string, unknown>) => void
  /** Chat persistence props */
  chatId?: string
  initialMessages?: Array<UIMessage>
  onMessageSent?: (role: 'user' | 'assistant', content: string) => void
}

// ============================================================================
// Compact suggestions for sidebar
// ============================================================================

const SIDEBAR_SUGGESTIONS = [
  'Crear hoja de ventas',
  'Aplicar fórmula SUM',
  'Crear gráfico de barras',
  'Analizar datos actuales',
]

// ============================================================================
// Chat Sidebar Content - uses chat context for error display
// ============================================================================

function ChatSidebarContent({ onClose }: { onClose: () => void }) {
  const { error } = useChatContext()

  return (
    <div
      className={cn(
        'bg-card flex flex-col border-border animate-in duration-300 relative shadow-2xl sm:shadow-none',
        // Mobile: Bottom Sheet (overlay)
        'fixed inset-x-0 bottom-0 z-50 h-[70vh] sm:h-full w-full border-t rounded-t-2xl sm:rounded-none slide-in-from-bottom sm:slide-in-from-right',
        // Desktop: Sidebar (push)
        'sm:relative sm:inset-auto sm:w-96 sm:border-t-0 sm:border-l',
      )}
    >
      {/* Drag Handle (Mobile only) */}
      <div className="h-1.5 w-12 bg-muted rounded-full mx-auto mt-2 mb-1 sm:hidden" />

      {/* Panel Header */}
      <div className="h-11 flex items-center justify-between px-4 sm:border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Logo className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Asistente IA</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          title="Cerrar panel"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <IconAlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error.message}</p>
        </div>
      )}

      {/* Chat Conversation */}
      <ChatConversation
        compact
        suggestions={SIDEBAR_SUGGESTIONS}
        className="flex-1 overflow-hidden"
      />

      {/* Chat Input */}
      <ChatInput
        compact
        showModelSelector={false}
        placeholder="Escribe un comando..."
        footerText=""
      />
    </div>
  )
}

// ============================================================================
// NativeMode Component
// ============================================================================

export function NativeMode({
  darkMode,
  initialData,
  isPanelOpen,
  onPanelChange,
  onDataChange,
  chatId,
  initialMessages,
  onMessageSent,
}: NativeModeProps) {
  const univerRef = useRef<UniverSheetHandle>(null)

  // Handle Univer API ready
  const handleAPIReady = useCallback((_handle: UniverSheetHandle) => {
    console.log('[NativeMode] Univer API ready')
  }, [])

  return (
    <div className="flex h-full">
      {/* Main Editor */}
      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <UniverSheet
            ref={univerRef}
            darkMode={darkMode}
            initialData={initialData}
            onReady={handleAPIReady}
            onChange={onDataChange}
          />
        </Suspense>
      </div>

      {/* AI Assistant Chat Panel - Sidebar/Sheet */}
      {isPanelOpen && (
        <>
          {/* Mobile Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden animate-in fade-in duration-300"
            onClick={() => onPanelChange(false)}
          />

          <ChatProvider
            chatId={chatId}
            initialMessages={initialMessages}
            onMessageSent={onMessageSent}
            univerRef={univerRef}
          >
            <ChatSidebarContent onClose={() => onPanelChange(false)} />
          </ChatProvider>
        </>
      )}
    </div>
  )
}
