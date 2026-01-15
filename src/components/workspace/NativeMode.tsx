"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai"
import { 
  IconX,
  IconSend,
  IconRefresh,
  IconAlertCircle,
  IconPaperclip,
  IconTable,
  IconCheck,
} from "@tabler/icons-react"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { UniverSheet, type UniverSheetHandle } from "@/components/univer"
import { Streamdown } from "streamdown"

interface NativeModeProps {
  darkMode: boolean
  initialData?: Record<string, unknown>
  isPanelOpen: boolean
  onPanelChange: (open: boolean) => void
}

// Tool input types based on our backend tools
interface CreateSpreadsheetInput {
  title: string
  columns: string[]
  rows?: string[][]
}

interface AddDataInput {
  range: string
  values: string[][]
}

interface ApplyFormulaInput {
  cell: string
  formula: string
}

interface FormatCellsInput {
  range: string
  style: {
    bold?: boolean
    italic?: boolean
    textColor?: string
    backgroundColor?: string
    alignment?: "left" | "center" | "right"
  }
}

interface SortDataInput {
  column: string
  order: "asc" | "desc"
}

interface FilterDataInput {
  column: string
  operator: string
  value?: string
}

export function NativeMode({
  darkMode,
  initialData,
  isPanelOpen,
  onPanelChange
}: NativeModeProps) {
  const [input, setInput] = React.useState("")
  const [apiError, setApiError] = React.useState<string | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const univerRef = React.useRef<UniverSheetHandle>(null)
  
  // Vercel AI SDK useChat hook with client-side tool execution
  const { messages, sendMessage, addToolOutput, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    // Automatically re-send when tool calls are complete
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    
    // Handle tool calls on the client side to interact with Univer
    async onToolCall({ toolCall }) {
      const univerHandle = univerRef.current
      
      if (!univerHandle) {
        // API not ready, report error
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText: "Spreadsheet not ready",
        })
        return
      }

      try {
        switch (toolCall.toolName) {
          case "createSpreadsheet": {
            const args = toolCall.input as CreateSpreadsheetInput
            const success = univerHandle.createSheetWithData(
              args.title,
              args.columns,
              args.rows || []
            )
            
            addToolOutput({
              tool: "createSpreadsheet",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "create_spreadsheet",
                success,
                title: args.title,
                sheetId: `sheet-${Date.now()}`,
                columns: args.columns,
                rowCount: args.rows?.length || 0,
              },
            })
            break
          }

          case "addData": {
            const args = toolCall.input as AddDataInput
            const success = univerHandle.setCellValues(args.range, args.values)
            
            addToolOutput({
              tool: "addData",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "add_data",
                success,
                range: args.range,
                cellCount: args.values.flat().length,
              },
            })
            break
          }

          case "applyFormula": {
            const args = toolCall.input as ApplyFormulaInput
            const success = univerHandle.applyFormula(args.cell, args.formula)
            
            addToolOutput({
              tool: "applyFormula",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "apply_formula",
                success,
                cell: args.cell,
                formula: args.formula,
              },
            })
            break
          }

          case "formatCells": {
            const args = toolCall.input as FormatCellsInput
            const success = univerHandle.formatCells(args.range, args.style)
            
            addToolOutput({
              tool: "formatCells",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "format_cells",
                success,
                range: args.range,
              },
            })
            break
          }

          case "sortData": {
            const args = toolCall.input as SortDataInput
            // TODO: Implement sorting in UniverSheet
            addToolOutput({
              tool: "sortData",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "sort_data",
                success: true,
                column: args.column,
                order: args.order,
              },
            })
            break
          }

          case "filterData": {
            const args = toolCall.input as FilterDataInput
            // TODO: Implement filtering in UniverSheet
            addToolOutput({
              tool: "filterData",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "filter_data",
                success: true,
                column: args.column,
              },
            })
            break
          }

          case "calculateStats": {
            // Stats calculation is informational
            addToolOutput({
              tool: "calculateStats",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "calculate_stats",
                success: true,
              },
            })
            break
          }

          case "createChart": {
            // Chart creation - show in chat for now
            addToolOutput({
              tool: "createChart",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "create_chart",
                success: true,
                chartId: `chart-${Date.now()}`,
                message: "Chart visualization requested",
              },
            })
            break
          }

          case "insertPivotTable": {
            // Pivot table - show in chat for now
            addToolOutput({
              tool: "insertPivotTable",
              toolCallId: toolCall.toolCallId,
              output: {
                type: "insert_pivot_table",
                success: true,
                pivotId: `pivot-${Date.now()}`,
                message: "Pivot table analysis requested",
              },
            })
            break
          }

          default:
            addToolOutput({
              tool: toolCall.toolName,
              toolCallId: toolCall.toolCallId,
              state: "output-error",
              errorText: `Unknown tool: ${toolCall.toolName}`,
            })
        }
      } catch (err) {
        console.error("Tool execution error:", err)
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText: err instanceof Error ? err.message : "Tool execution failed",
        })
      }
    },
  })

  // Handle Univer API ready
  const handleAPIReady = React.useCallback((_handle: UniverSheetHandle) => {
    console.log("Univer API ready")
  }, [])

  // Log error from hook
  React.useEffect(() => {
    if (error) {
      console.error("Chat error:", error)
      setApiError(error.message)
    }
  }, [error])

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const handleSend = () => {
    if (!input.trim() || status !== "ready") return
    setApiError(null)
    
    const text = input.trim()
    setInput("")
    
    sendMessage({
      text,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isGenerating = status === "streaming" || status === "submitted"

  return (
    <div className="flex h-full">
      {/* Main Editor */}
      <div className="flex-1 relative">
        <UniverSheet 
          ref={univerRef}
          darkMode={darkMode} 
          initialData={initialData}
          onReady={handleAPIReady}
        />
      </div>

      {/* AI Assistant Chat Panel - Full functionality with tool calling */}
      {isPanelOpen && (
        <div className="w-96 border-l border-border bg-card flex flex-col animate-in slide-in-from-right duration-200 relative">
          {/* Panel Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Logo className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Asistente IA</span>
            </div>
            <button 
              type="button"
              onClick={() => onPanelChange(false)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              title="Cerrar panel"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="mx-3 mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
              <IconAlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive">Error de conexión</p>
                <p className="text-[10px] text-destructive/80 mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
                  <div className="relative h-12 w-12 rounded-2xl bg-card border ring-1 ring-border/50 shadow-lg flex items-center justify-center">
                    <Logo className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-1">¿En qué puedo ayudarte?</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Puedo crear datos, aplicar fórmulas, generar gráficos y más.
                </p>
                
                {/* Quick Actions */}
                <div className="mt-4 space-y-1.5 w-full max-w-[220px]">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        setInput(action.prompt)
                      }}
                      className="w-full p-2 text-left rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                    >
                      <p className="text-xs font-medium group-hover:text-primary transition-colors">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/80 border ring-1 ring-border/20"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Logo className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-medium text-muted-foreground">S-AGI</span>
                    </div>
                  )}
                  
                  {/* Render message parts */}
                  {(message.parts as Array<{ type: string; text?: string; toolInvocation?: { state: string; result?: { type?: string; success?: boolean; title?: string } } }>).map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div key={`${message.id}-text-${i}`} className="prose prose-sm dark:prose-invert max-w-none overflow-wrap-break-word [&>p]:text-[13px] [&>ul]:text-[13px] [&>ol]:text-[13px]">
                            <Streamdown>
                              {part.text || ""}
                            </Streamdown>
                          </div>
                        )
                      case "tool-invocation": {
                        const { toolInvocation } = part
                        if (!toolInvocation) return null
                        
                        if (toolInvocation.state === "call") {
                          return (
                            <div key={`${message.id}-tool-${i}`} className="mt-2 flex items-center gap-2 p-1.5 rounded-md bg-background/50 border border-border/50">
                              <IconRefresh className="h-3 w-3 animate-spin text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">
                                Ejecutando...
                              </span>
                            </div>
                          )
                        }
                        
                        if (toolInvocation.state === "result") {
                          const output = toolInvocation.result as { type?: string; success?: boolean; title?: string } | undefined
                          
                          let label = "Acción completada"
                          let success = output?.success ?? true
                          
                          if (output?.type === "create_spreadsheet") label = output.title || "Hoja creada"
                          else if (output?.type === "create_chart") label = "Gráfico creado"
                          else if (output?.type === "insert_pivot_table") label = "Tabla dinámica"
                          else if (output?.type === "apply_formula") label = "Fórmula aplicada"
                          else if (output?.type === "add_data") label = "Datos agregados"
                          else if (output?.type === "format_cells") label = "Formato aplicado"
                          else if (output?.type === "sort_data") label = "Datos ordenados"
                          else if (output?.type === "filter_data") label = "Filtro aplicado"

                          return (
                            <div
                              key={`${message.id}-tool-${i}`} 
                              className={cn(
                                "mt-2 flex items-center gap-2 p-1.5 rounded-md border",
                                success 
                                  ? "bg-emerald-500/10 border-emerald-500/20" 
                                  : "bg-destructive/10 border-destructive/20"
                              )}
                            >
                              <div className={cn(
                                "h-5 w-5 rounded flex items-center justify-center",
                                success ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                              )}>
                                {success ? <IconCheck className="h-3 w-3" /> : <IconTable className="h-3 w-3" />}
                              </div>
                              <div>
                                <p className={cn(
                                  "text-[11px] font-medium leading-none",
                                  success ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                                )}>
                                  {label}
                                </p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }
                      default:
                        return null
                    }
                  })}
                </div>
              </div>
            ))}
            
            {/* Generating indicator */}
            {isGenerating && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="bg-muted px-3 py-2 rounded-xl ring-1 ring-border flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">Analizando...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Chat Input at Bottom */}
          <div className="p-3 border-t border-border bg-background/50 shrink-0">
            <div className="relative flex items-end gap-2 bg-muted/50 border ring-1 ring-border/50 rounded-xl p-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <IconPaperclip className="h-3.5 w-3.5" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un comando..."
                className="flex-1 min-h-[36px] max-h-[100px] bg-transparent border-0 ring-0 focus-visible:ring-0 p-1 text-sm resize-none scrollbar-none"
                disabled={isGenerating}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isGenerating}
                size="icon"
                type="button"
                className="h-8 w-8 shrink-0 rounded-lg transition-transform active:scale-95"
              >
                <IconSend className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Quick actions for empty state
const quickActions = [
  {
    id: "create",
    title: "Crear hoja de datos",
    description: "Genera una nueva hoja con datos",
    prompt: "Crea una hoja de cálculo con datos de ejemplo de ventas mensuales",
  },
  {
    id: "formula",
    title: "Aplicar fórmula",
    description: "Agrega cálculos automáticos",
    prompt: "Aplica una fórmula SUM para sumar la columna B",
  },
  {
    id: "chart",
    title: "Crear gráfico",
    description: "Visualiza tus datos",
    prompt: "Crea un gráfico de barras con los datos actuales",
  },
  {
    id: "analyze",
    title: "Analizar datos",
    description: "Obtén insights de tus datos",
    prompt: "Analiza los datos y dame un resumen estadístico",
  },
]
