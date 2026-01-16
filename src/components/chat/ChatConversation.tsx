'use client'

import * as React from 'react'
import { IconCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import type { UIMessage } from '@tanstack/ai-react'

// AI Elements components
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation'
import {
  Message as MessageComponent,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { Loader } from '@/components/ai-elements/loader'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'

import { useChatContext } from './ChatProvider'

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
  if (!message.parts || message.parts.length === 0) {
    return ''
  }
  
  return message.parts
    .filter((part): part is { type: 'text'; content: string } => {
      return part.type === 'text' && typeof (part as { content?: string }).content === 'string'
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
  suggestions?: string[]
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
  const { messages, isLoading, isStreaming, sendMessage, error } =
    useChatContext()

  // Debug logging
  React.useEffect(() => {
    console.log('[ChatConversation] Render state:', {
      messagesCount: messages.length,
      isLoading,
      isStreaming,
      hasError: !!error,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        partsCount: m.parts.length,
        parts: m.parts.map((p) => ({
          type: p.type,
          hasContent: p.type === 'text' ? !!(p as { content: string }).content : false,
        })),
      })),
    })
  }, [messages, isLoading, isStreaming, error])

  // Render message content using TanStack AI UIMessage parts
  const renderMessageContent = React.useCallback(
    (message: UIMessage, isCurrentlyStreaming: boolean) => {
      const textContent = getTextContent(message)
      
      // Debug: log message content extraction
      if (textContent) {
        console.log('[ChatConversation] Rendering message with text:', {
          messageId: message.id,
          role: message.role,
          textLength: textContent.length,
          textPreview: textContent.substring(0, 50),
        })
      } else {
        console.log('[ChatConversation] Message has no text content:', {
          messageId: message.id,
          role: message.role,
          parts: message.parts.map((p) => p.type),
        })
      }

      // Filter tool call parts using type narrowing
      const toolCallParts = message.parts.filter(
        (part) => part.type === 'tool-call',
      )

      return (
        <>
          {/* Main text content */}
          {textContent && (
            <MessageResponse
              mode={isCurrentlyStreaming ? 'streaming' : 'static'}
            >
              {textContent}
            </MessageResponse>
          )}

          {/* Tool calls */}
          {toolCallParts.map((toolCall) => {
            if (toolCall.type !== 'tool-call') return null

            // Access properties safely
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

          {/* Success indicator for completed tools */}
          {toolCallParts.some((tc) => {
            const tcAny = tc as { output?: unknown }
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
    [],
  )

  return (
    <Conversation className={cn('flex-1', className)}>
      <ConversationContent className={cn(compact ? 'p-3' : 'p-3 sm:p-4')}>
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
                  {compact ? (
                    '¿En qué puedo ayudarte?'
                  ) : (
                    <>
                      Hola! Soy{' '}
                      <span className="text-primary italic">S-AGI</span>
                    </>
                  )}
                </h1>
                {!compact && (
                  <p className="text-sm sm:text-base text-muted-foreground font-medium text-pretty">
                    Tu asistente inteligente de hojas de cálculo
                  </p>
                )}
              </div>

              {/* Suggestions - responsive layout */}
              <Suggestions
                className={cn('w-full', compact ? '' : 'max-w-2xl mx-auto')}
                layout="wrap"
              >
                {suggestions.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={(s) => sendMessage(s)}
                  />
                ))}
              </Suggestions>
            </ConversationEmptyState>
          )
        ) : (
          <div className={cn('w-full', !compact && 'max-w-2xl mx-auto')}>
            {messages.map((message, index) => {
              const isLastAssistantMessage =
                message.role === 'assistant' && index === messages.length - 1

              return (
                <MessageComponent key={message.id} from={message.role}>
                  <MessageContent>
                    {/* Assistant header */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="size-5 sm:size-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Logo className="size-3 sm:size-3.5 text-primary" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                          S-AGI
                        </span>
                      </div>
                    )}

                    {/* Message content */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.role === 'user' ? (
                        // For user messages, show text directly from parts
                        <div className="text-foreground">
                          {getTextContent(message) || '(Sin contenido)'}
                        </div>
                      ) : (
                        // For assistant messages, use the full render function
                        renderMessageContent(
                          message,
                          isLastAssistantMessage && isStreaming,
                        )
                      )}
                    </div>
                  </MessageContent>
                </MessageComponent>
              )
            })}

            {/* Loading state when no messages or streaming */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <MessageComponent from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="size-5 sm:size-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Logo className="size-3 sm:size-3.5 text-primary animate-pulse" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                      S-AGI
                    </span>
                  </div>
                  <Loader className="text-muted-foreground" />
                </MessageContent>
              </MessageComponent>
            )}
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
