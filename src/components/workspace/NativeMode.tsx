'use client'

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import {
  IconAlertCircle,
  IconFileText,
  IconTable,
  IconX,
} from '@tabler/icons-react'
import type { UIMessage } from '@tanstack/ai-react'
import type { UniverSheetHandle } from '@/components/univer/UniverSheet'
import { ChatConversation } from '@/components/chat/ChatConversation'
import { ChatInput } from '@/components/chat/ChatInput'
import {
  ChatProvider,
  useChatContext,
  type StoredArtifact,
} from '@/components/chat/ChatProvider'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import type { StoredUIMessagePart } from '@/lib/supabase'

const UniverSheet = lazy(() =>
  import('@/components/univer/UniverSheet').then((m) => ({
    default: m.UniverSheet,
  })),
)

const UniverDoc = lazy(() =>
  import('@/components/univer/UniverDoc').then((m) => ({
    default: m.UniverDoc,
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
  initialMessages?: UIMessage[]
  initialArtifacts?: StoredArtifact[]
  /** Callback when a message needs to be persisted (with full parts) */
  onMessagePersist?: (message: {
    id: string
    role: 'user' | 'assistant'
    parts: StoredUIMessagePart[]
    artifacts?: StoredArtifact[]
  }) => void
  /** Current app type */
  currentApp: 'sheets' | 'docs' | 'slides'
  /** Callback when app type changes */
  onAppChange: (app: 'sheets' | 'docs' | 'slides') => void
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

// App selector tabs config
const APP_TABS = [
  {
    id: 'sheets' as const,
    label: 'Sheets',
    icon: IconTable,
    color: 'text-emerald-500',
  },
  {
    id: 'docs' as const,
    label: 'Docs',
    icon: IconFileText,
    color: 'text-blue-500',
  },
] as const

export function NativeMode({
  darkMode,
  initialData,
  isPanelOpen,
  onPanelChange,
  onDataChange,
  chatId,
  initialMessages,
  initialArtifacts,
  onMessagePersist,
  currentApp,
  onAppChange,
}: NativeModeProps) {
  const univerRef = useRef<UniverSheetHandle>(null)

  // Track the rendered app separately to allow unmount/remount cycle
  const [renderedApp, setRenderedApp] = useState<
    'sheets' | 'docs' | 'slides' | null
  >(currentApp)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Handle app switching with unmount/remount cycle to avoid Univer DI conflicts
  useEffect(() => {
    if (currentApp !== renderedApp && !isTransitioning) {
      // Start transition: unmount current editor
      setIsTransitioning(true)
      setRenderedApp(null)

      // After a brief delay for cleanup, mount the new editor
      const timer = setTimeout(() => {
        setRenderedApp(currentApp)
        setIsTransitioning(false)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [currentApp, renderedApp, isTransitioning])

  // Handle Univer API ready
  const handleSheetAPIReady = useCallback((_handle: UniverSheetHandle) => {
    console.log('[NativeMode] Univer Sheet API ready')
  }, [])

  const handleDocAPIReady = useCallback((_api: unknown) => {
    console.log('[NativeMode] Univer Doc API ready')
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* App Selector Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        {APP_TABS.map((tab) => {
          const isActive = currentApp === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onAppChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-background shadow-sm border border-border text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
            >
              <tab.icon className={cn('size-4', isActive && tab.color)} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 relative">
          {/* Show loading during transition */}
          {isTransitioning || renderedApp === null ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-background">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              }
            >
              {renderedApp === 'sheets' && (
                <UniverSheet
                  key={`univer-sheet-${Date.now()}`}
                  ref={univerRef}
                  darkMode={darkMode}
                  initialData={initialData}
                  onReady={handleSheetAPIReady}
                  onChange={onDataChange}
                />
              )}
              {renderedApp === 'docs' && (
                <UniverDoc
                  key={`univer-doc-${Date.now()}`}
                  darkMode={darkMode}
                  initialData={initialData}
                  onReady={handleDocAPIReady}
                />
              )}
              {renderedApp === 'slides' && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Slides coming soon...
                </div>
              )}
            </Suspense>
          )}
        </div>

        {/* AI Assistant Chat Panel - Sidebar/Sheet */}
        {isPanelOpen && (
          <>
            {/* Mobile Overlay Backdrop */}
            {/* biome-ignore lint/a11y/useSemanticElements: overlay backdrop */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 sm:hidden animate-in fade-in duration-300"
              onClick={() => onPanelChange(false)}
            />

            <ChatProvider
              key={chatId || 'new-chat'}
              chatId={chatId}
              initialMessages={initialMessages}
              initialArtifacts={initialArtifacts}
              onMessagePersist={onMessagePersist}
              univerRef={univerRef}
            >
              <ChatSidebarContent onClose={() => onPanelChange(false)} />
            </ChatProvider>
          </>
        )}
      </div>
    </div>
  )
}
