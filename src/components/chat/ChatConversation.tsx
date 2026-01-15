'use client'

import * as React from 'react'
import type { UIMessage } from '@ai-sdk/react'
import { IconCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

// AI Elements components
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachment,
  MessageAttachments,
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
  const { messages, isStreaming, isGenerating, sendText, status, error } =
    useChatContext()

  // Debug logging
  React.useEffect(() => {
    console.log('[ChatConversation] Render state:', {
      messagesCount: messages.length,
      isStreaming,
      isGenerating,
      status,
      hasError: !!error,
    })
  }, [messages.length, isStreaming, isGenerating, status, error])

  // Render message parts
  const renderMessageParts = React.useCallback(
    (message: UIMessage) => {
      const parts = (message.parts as any[]) || []

      return parts.map((part, i) => {
        const key = `${message.id}-${part.type}-${i}`

        switch (part.type) {
          case 'text':
            return (
              <MessageResponse
                key={key}
                mode={isStreaming ? 'streaming' : 'static'}
              >
                {part.text}
              </MessageResponse>
            )

          case 'file':
            return <MessageAttachment key={key} data={part} />

          default:
            // Handle tool invocations (new format: tool-<toolName>)
            if (part.type?.startsWith('tool-')) {
              const toolInvocation = part as any
              const toolName = part.type.replace('tool-', '')

              return (
                <Tool
                  key={key}
                  defaultOpen={toolInvocation.state !== 'output-available'}
                >
                  <ToolHeader
                    title={getToolDisplayName(toolName)}
                    type={part.type}
                    state={toolInvocation.state}
                  />
                  <ToolContent>
                    <ToolInput input={toolInvocation.input} />
                    {(toolInvocation.state === 'output-available' ||
                      toolInvocation.state === 'output-error') && (
                      <ToolOutput
                        output={toolInvocation.output}
                        errorText={toolInvocation.errorText}
                      />
                    )}
                  </ToolContent>
                </Tool>
              )
            }

            // Legacy tool-invocation format
            if (part.type === 'tool-invocation') {
              const { toolInvocation } = part as any

              if (toolInvocation.state === 'call') {
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <Loader size={14} />
                    <span className="text-sm text-muted-foreground">
                      Ejecutando {getToolDisplayName(toolInvocation.toolName)}
                      ...
                    </span>
                  </div>
                )
              }

              if (toolInvocation.state === 'result') {
                const output = toolInvocation.result as {
                  success?: boolean
                  title?: string
                  type?: string
                }

                // Show success indicator for completed tools
                if (output.success && output.title) {
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 w-full p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <IconCheck className="size-4 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                          {output.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Operación completada
                        </p>
                      </div>
                    </div>
                  )
                }
              }
            }

            return null
        }
      })
    },
    [isStreaming],
  )

  return (
    <Conversation className={cn('flex-1', className)}>
      <ConversationContent className={cn(compact ? 'p-3' : 'p-3 sm:p-4')}>
        {messages.length === 0 ? (
          emptyStateContent || (
            <ConversationEmptyState className="h-full px-2 sm:px-0">
              {/* Logo */}
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full scale-150" />
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
                className={cn(
                  compact ? 'max-w-full' : 'max-w-full sm:max-w-2xl',
                  'px-2 sm:px-0',
                )}
              >
                {suggestions.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={(s) => sendText(s)}
                  />
                ))}
              </Suggestions>
            </ConversationEmptyState>
          )
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {/* Attachments for user messages */}
                  {message.role === 'user' && (
                    <MessageAttachments>
                      {((message.parts as any[]) || [])
                        .filter((p) => p.type === 'file')
                        .map((file, i) => (
                          <MessageAttachment
                            key={`${message.id}-file-${i}`}
                            data={file}
                          />
                        ))}
                    </MessageAttachments>
                  )}

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
                    {renderMessageParts(message)}
                  </div>
                </MessageContent>
              </Message>
            ))}

            {/* Loading state */}
            {isGenerating && !isStreaming && (
              <Message from="assistant">
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
              </Message>
            )}
          </>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
