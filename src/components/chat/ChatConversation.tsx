'use client'

import * as React from 'react'
import {
  IconArrowBackUp,
  IconCheck,
  IconCopy,
  IconRefresh,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { useChatContext } from './ChatProvider'
import type { UIMessage } from '@tanstack/ai-react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

// AI Elements components
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  MessageAction,
  MessageActions,
  Message as MessageComponent,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'

// ============================================================================
// Thinking Part Component
// ============================================================================

interface ThinkingPartProps {
  content: string
  isComplete?: boolean
  className?: string
}

function ThinkingPart({
  content,
  isComplete = false,
  className,
}: ThinkingPartProps) {
  return (
    <Reasoning
      className={cn(
        'rounded-md border border-border/60 bg-muted/40 px-3 py-2',
        className,
      )}
      defaultOpen={!isComplete}
      isStreaming={!isComplete}
    >
      <ReasoningTrigger
        className="text-xs"
        getThinkingMessage={(isStreaming, duration) => {
          if (isStreaming) return 'Pensando...'
          if (duration === undefined) return 'Razonamiento'
          return `Pensó por ${duration}s`
        }}
      />
      <ReasoningContent className="text-xs leading-relaxed text-muted-foreground">
        {content}
      </ReasoningContent>
    </Reasoning>
  )
}

// ============================================================================
// Tool Display Names
// ============================================================================

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  createSpreadsheet: 'Crear Hoja de Cálculo',
  addData: 'Agregar Datos',
  applyFormula: 'Aplicar Fórmula',
  sortData: 'Ordenar Datos',
  filterData: 'Filtrar Datos',
  formatCells: 'Formatear Celdas',
  createChart: 'Crear Gráfico',
  insertPivotTable: 'Insertar Tabla Dinámica',
  calculateStats: 'Calcular Estadísticas',
}

function getToolDisplayName(toolName: string): string {
  return TOOL_DISPLAY_NAMES[toolName] || toolName
}

// ============================================================================
// Helper to extract text from UIMessage parts
// ============================================================================

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; content: string } => {
      return (
        part.type === 'text' &&
        typeof (part as { content?: string }).content === 'string'
      )
    })
    .map((part) => part.content)
    .join('')
}

// ============================================================================
// Helper to extract thinking content from UIMessage parts
// ============================================================================

function getThinkingContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'thinking'; content: string } => {
      return (
        part.type === 'thinking' &&
        typeof (part as { content?: string }).content === 'string'
      )
    })
    .map((part) => part.content)
    .join('')
}

// ============================================================================
// Suggestions Config
// ============================================================================

const DEFAULT_SUGGESTIONS = [
  'Creá una tabla de ventas mensuales',
  'Analizá este CSV con estadísticas',
  'Generá un reporte de gastos',
  'Calculá el total de una columna',
]

// ============================================================================
// ChatConversation Component
// ============================================================================

export interface ChatConversationProps {
  className?: string
  /** Custom suggestions for empty state */
  suggestions?: Array<string>
  /** Custom empty state content */
  emptyStateContent?: React.ReactNode
  /** Show compact version (for sidebar) */
  compact?: boolean
}

export function ChatConversation({
  className,
  suggestions = DEFAULT_SUGGESTIONS,
  emptyStateContent,
  compact = false,
}: ChatConversationProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    reload,
    setReplyingTo,
    error,
    streamingThinking,
  } = useChatContext()

  // Scroll state for fade indicators
  const [canScrollUp, setCanScrollUp] = React.useState(false)
  const [canScrollDown, setCanScrollDown] = React.useState(false)
  const conversationRef = React.useRef<HTMLDivElement>(null)

  const handleScroll = React.useCallback(() => {
    if (conversationRef.current) {
      const scrollable =
        conversationRef.current.querySelector(
          '[data-stick-to-bottom-scroll-container="true"]',
        ) || conversationRef.current
      const { scrollTop, scrollHeight, clientHeight } =
        scrollable as HTMLElement
      setCanScrollUp(scrollTop > 10)
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10)
    }
  }, [])

  React.useEffect(() => {
    // StickToBottom might take a moment to initialize its scroll container
    const timer = setTimeout(handleScroll, 150)

    // Check if the scroll container exists
    const scrollable =
      conversationRef.current?.querySelector(
        '[data-stick-to-bottom-scroll-container="true"]',
      ) || conversationRef.current
    if (scrollable) {
      scrollable.addEventListener('scroll', handleScroll)
      const observer = new ResizeObserver(handleScroll)
      observer.observe(scrollable)
      return () => {
        scrollable.removeEventListener('scroll', handleScroll)
        observer.disconnect()
        clearTimeout(timer)
      }
    }
    return () => clearTimeout(timer)
  }, [handleScroll, messages, isLoading, isStreaming])

  // Custom message renderer to handle parts and tools
  const renderMessageContent = React.useCallback(
    (message: UIMessage, isCurrentlyStreaming: boolean) => {
      const textContent = getTextContent(message)
      const thinkingContent = getThinkingContent(message)

      // Determine if thinking is complete (we have text content already)
      const isThinkingComplete = !!textContent || !isCurrentlyStreaming
      const streamingThinkingContent = isCurrentlyStreaming
        ? streamingThinking
        : ''

      return (
        <>
          {(thinkingContent || streamingThinkingContent) && (
            <ThinkingPart
              content={thinkingContent || streamingThinkingContent}
              isComplete={isThinkingComplete}
            />
          )}

          {textContent && (
            <MessageResponse
              className="prose prose-sm dark:prose-invert max-w-none"
              mode={isCurrentlyStreaming ? 'streaming' : 'static'}
            >
              {textContent}
            </MessageResponse>
          )}

          {message.parts
            .filter((part) => part.type === 'tool-call')
            .map((toolCall) => {
              const toolCallAny = toolCall as {
                id: string
                name: string
                arguments: string
                state?: string
                output?: unknown
              }

              const args =
                typeof toolCallAny.arguments === 'string'
                  ? JSON.parse(toolCallAny.arguments)
                  : toolCallAny.arguments
              const state = toolCallAny.state || 'pending'
              const hasOutput = toolCallAny.output !== undefined

              return (
                <Tool
                  key={toolCallAny.id}
                  defaultOpen={state !== 'output-available'}
                >
                  <ToolHeader
                    title={getToolDisplayName(toolCallAny.name)}
                    type={`tool-${toolCallAny.name}`}
                    state={
                      state === 'output-available' || hasOutput
                        ? 'output-available'
                        : state === 'output-error'
                          ? 'output-error'
                          : 'input-streaming'
                    }
                  />
                  <ToolContent>
                    <ToolInput input={args} />
                    {hasOutput && (
                      <ToolOutput
                        output={toolCallAny.output}
                        errorText={undefined}
                      />
                    )}
                  </ToolContent>
                </Tool>
              )
            })}

          {/* If the message had tool calls that are all successful, show a summary */}
          {message.role === 'assistant' &&
            message.parts.some((part) => part.type === 'tool-call') &&
            message.parts.some((part) => {
              if (part.type !== 'tool-call') return false
              const tcAny = part as { output?: unknown }
              return tcAny.output !== undefined
            }) && (
              <div className="flex items-center gap-3 w-full p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-2">
                <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <IconCheck className="size-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                    Operación completada
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Los cambios se aplicaron a la hoja de cálculo
                  </p>
                </div>
              </div>
            )}
        </>
      )
    },
    [streamingThinking],
  )

  return (
    <div
      className={cn(
        'relative flex-1 flex flex-col min-h-0 overflow-hidden bg-background',
        className,
      )}
    >
      {/* Top fade indicator - Always in DOM for stability */}
      <div
        className={cn(
          'absolute top-0 inset-x-0 h-12 pointer-events-none z-30 transition-opacity duration-300',
          canScrollUp ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 50%, transparent 100%)',
        }}
      />

      <Conversation
        ref={conversationRef}
        className="flex-1 [&_[data-stick-to-bottom-scroll-container='true']]:overflow-y-auto [&_[data-stick-to-bottom-scroll-container='true']]:overflow-x-hidden [&_[data-stick-to-bottom-scroll-container='true']]:[&::-webkit-scrollbar]:w-1.5 [&_[data-stick-to-bottom-scroll-container='true']]:[&::-webkit-scrollbar-track]:bg-transparent [&_[data-stick-to-bottom-scroll-container='true']]:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&_[data-stick-to-bottom-scroll-container='true']]:[&::-webkit-scrollbar-thumb]:rounded-full [&_[data-stick-to-bottom-scroll-container='true']]:[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40"
      >
        <ConversationContent
          className={cn(compact ? 'px-3 py-6' : 'px-3 sm:px-4 py-8 sm:py-12')}
        >
          {messages.length === 0 && !isLoading ? (
            emptyStateContent || (
              <ConversationEmptyState
                className={cn('h-full w-full', !compact && 'max-w-2xl mx-auto')}
              >
                {/* Logo */}
                <div className="relative mb-4 sm:mb-6">
                  <div
                    className={cn(
                      'relative rounded-2xl bg-card border ring-1 ring-border/50 flex items-center justify-center',
                      compact ? 'size-12' : 'size-12 sm:size-16',
                    )}
                  >
                    <Logo
                      className={cn(compact ? 'size-6' : 'size-6 sm:size-8')}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1 sm:space-y-2 mb-6 sm:mb-8">
                  <h1
                    className={cn(
                      'font-bold tracking-tight text-balance',
                      compact ? 'text-lg' : 'text-xl sm:text-2xl',
                    )}
                  >
                    ¿En qué puedo ayudarte hoy?
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto">
                    Puedo ayudarte a crear tablas, analizar datos o generar
                    reportes inteligentes.
                  </p>
                </div>

                {/* Suggestions */}
                <Suggestions className="max-w-lg" layout="wrap">
                  {suggestions.map((s) => (
                    <Suggestion
                      key={s}
                      suggestion={s}
                      onClick={(text) => sendMessage({ text })}
                    >
                      {s}
                    </Suggestion>
                  ))}
                </Suggestions>
              </ConversationEmptyState>
            )
          ) : (
            <div
              className={cn(
                'w-full',
                !compact && 'max-w-2xl mx-auto space-y-4 sm:space-y-6',
              )}
            >
              {messages.map((message, index) => {
                const isLastAssistantMessage =
                  message.role === 'assistant' && index === messages.length - 1

                return (
                  <MessageComponent key={message.id} from={message.role}>
                    <MessageContent
                      className={cn(
                        'gap-3',
                        message.role === 'user' && 'items-end',
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Logo className="size-3.5 text-primary" />
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            S-AGI
                          </span>
                        </div>
                      )}
                      {message.role === 'user' && (
                        <div className="flex items-center gap-2 justify-end w-full">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Yo
                          </span>
                          <UserAvatar size="sm" />
                        </div>
                      )}
                      {renderMessageContent(
                        message,
                        isStreaming && isLastAssistantMessage,
                      )}
                    </MessageContent>

                    {!isStreaming || !isLastAssistantMessage ? (
                      <MessageToolbar
                        className={cn(
                          'opacity-0 group-hover:opacity-100 transition-opacity',
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start',
                        )}
                      >
                        <MessageActions className="mb-2">
                          <MessageAction
                            tooltip="Copiar"
                            onClick={() => {
                              const text = getTextContent(message)
                              navigator.clipboard.writeText(text)
                              toast.success('Copiado al portapapeles')
                            }}
                          >
                            <IconCopy className="size-3.5" />
                          </MessageAction>

                          <MessageAction
                            tooltip="Responder"
                            onClick={() => {
                              setReplyingTo(message)
                              // Focus input
                              const input = document.querySelector('textarea')
                              if (input) {
                                input.focus()
                              }
                            }}
                          >
                            <IconArrowBackUp className="size-3.5" />
                          </MessageAction>

                          {message.role === 'assistant' && (
                            <MessageAction
                              tooltip="Regenerar"
                              onClick={() => {
                                reload()
                                toast.info('Regenerando respuesta...')
                              }}
                            >
                              <IconRefresh className="size-3.5" />
                            </MessageAction>
                          )}
                        </MessageActions>
                      </MessageToolbar>
                    ) : null}
                  </MessageComponent>
                )
              })}

              {isLoading && !isStreaming && (
                <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                  {'Cargando...'}
                </MessageResponse>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mt-4">
                  {error.message}
                </div>
              )}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton className="z-40" />
      </Conversation>

      {/* Bottom fade indicator - Always in DOM for stability */}
      <div
        className={cn(
          'absolute bottom-0 inset-x-0 h-14 pointer-events-none z-30 transition-opacity duration-300',
          canScrollDown ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.8) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}
