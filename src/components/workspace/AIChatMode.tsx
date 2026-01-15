'use client'

import { lazy, Suspense, useRef, useState } from 'react'
import type { UIMessage } from '@ai-sdk/react'
import { IconAlertCircle, IconMessage, IconTable } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { UniverSheetHandle } from '@/components/univer/UniverSheet'

const UniverSheet = lazy(() =>
  import('@/components/univer/UniverSheet').then((m) => ({
    default: m.UniverSheet,
  })),
)

// New shared chat components
import { ChatProvider } from '@/components/chat/ChatProvider'
import { ChatConversation } from '@/components/chat/ChatConversation'
import { ChatInput } from '@/components/chat/ChatInput'
import { useChatContext } from '@/components/chat/ChatProvider'
import { ArtifactPanel } from '@/components/artifact'

// ============================================================================
// Types
// ============================================================================

interface AIChatModeProps {
  darkMode: boolean
  onSwitchToNative?: (artifactData: Record<string, unknown>) => void
  chatId?: string
  initialMessages?: UIMessage[]
  onMessageSent?: (role: 'user' | 'assistant', content: string) => void
}

type MobileTab = 'chat' | 'artifact'

// ============================================================================
// Mobile Tab Bar Component
// ============================================================================

function MobileTabBar({
  activeTab,
  onTabChange,
  hasArtifact,
}: {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  hasArtifact: boolean
}) {
  return (
    <div className="flex md:hidden border-b border-border bg-card/50 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onTabChange('chat')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
          activeTab === 'chat'
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <IconMessage className="size-4" />
        <span>Chat</span>
      </button>
      <button
        type="button"
        onClick={() => onTabChange('artifact')}
        disabled={!hasArtifact}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
          activeTab === 'artifact'
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-foreground',
          !hasArtifact && 'opacity-50 cursor-not-allowed',
        )}
      >
        <IconTable className="size-4" />
        <span>Resultado</span>
        {hasArtifact && (
          <span className="size-2 rounded-full bg-primary animate-pulse" />
        )}
      </button>
    </div>
  )
}

// ============================================================================
// AIChatModeContent - Inner component that uses chat context
// ============================================================================

function AIChatModeContent({
  darkMode,
  onSwitchToNative,
}: {
  darkMode: boolean
  onSwitchToNative?: (artifactData: Record<string, unknown>) => void
}) {
  const { currentArtifact, error, status } = useChatContext()
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')

  // Auto-switch to artifact tab when one is created (mobile only)
  const prevArtifactRef = useRef(currentArtifact)
  if (currentArtifact && !prevArtifactRef.current) {
    // New artifact created, switch to artifact tab on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileTab('artifact')
    }
  }
  prevArtifactRef.current = currentArtifact

  // Determine error type for better messaging
  const getErrorMessage = () => {
    if (!error) return null
    const message = error.message.toLowerCase()

    if (
      message.includes('api key') ||
      message.includes('401') ||
      message.includes('unauthorized')
    ) {
      return {
        title: 'Error de autenticación',
        description:
          'La clave API de OpenAI no está configurada o es inválida. Configura OPENAI_API_KEY en tu archivo .env',
      }
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        title: 'Límite de solicitudes',
        description:
          'Has excedido el límite de solicitudes. Espera un momento e intenta de nuevo.',
      }
    }
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Error de red',
        description:
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      }
    }
    return {
      title: 'Error de conexión',
      description: error.message,
    }
  }

  const errorInfo = getErrorMessage()
  const hasArtifact = !!currentArtifact

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Tab Bar - only visible on mobile when there's an artifact */}
      {hasArtifact && (
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          hasArtifact={hasArtifact}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Chat Panel */}
        <div
          className={cn(
            'flex flex-col min-h-0',
            // Desktop: side-by-side layout
            'md:flex',
            hasArtifact ? 'md:w-1/2 md:border-r md:border-border' : 'md:flex-1',
            // Mobile: show/hide based on tab
            hasArtifact && mobileTab !== 'chat' ? 'hidden' : 'flex-1',
          )}
        >
          {/* Error Banner */}
          {error && errorInfo && (
            <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
              <IconAlertCircle className="size-4 sm:size-5 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-destructive">
                  {errorInfo.title}
                </p>
                <p className="text-[10px] sm:text-xs text-destructive/80 mt-1 break-words">
                  {errorInfo.description}
                </p>
              </div>
            </div>
          )}

          {/* Status indicator for debugging */}
          {status === 'submitted' && (
            <div className="mx-3 sm:mx-4 mt-2 text-xs text-muted-foreground">
              Procesando...
            </div>
          )}

          {/* Conversation */}
          <ChatConversation className="flex-1 overflow-hidden" />

          {/* Input */}
          <ChatInput />
        </div>

        {/* Artifact Preview Panel */}
        {hasArtifact && (
          <ArtifactPanel
            className={cn(
              // Desktop: always visible side-by-side
              'md:flex md:w-1/2',
              // Mobile: show/hide based on tab
              mobileTab === 'artifact' ? 'flex flex-1' : 'hidden',
            )}
            onEditInNative={onSwitchToNative}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// AIChatMode Component
// ============================================================================

export function AIChatMode({
  darkMode,
  onSwitchToNative,
  chatId,
  initialMessages,
  onMessageSent,
}: AIChatModeProps) {
  const univerRef = useRef<UniverSheetHandle>(null)

  return (
    <ChatProvider
      chatId={chatId}
      initialMessages={initialMessages}
      onMessageSent={onMessageSent}
      univerRef={univerRef}
    >
      {/* Hidden UniverSheet for tool execution - mounted but not visible */}
      <div className="hidden">
        <Suspense fallback={null}>
          <UniverSheet ref={univerRef} darkMode={darkMode} />
        </Suspense>
      </div>

      <AIChatModeContent
        darkMode={darkMode}
        onSwitchToNative={onSwitchToNative}
      />
    </ChatProvider>
  )
}
