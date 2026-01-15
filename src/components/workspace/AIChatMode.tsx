"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { 
  IconSend, 
  IconTable,
  IconDownload,
  IconPencil,
  IconRefresh,
  IconAlertCircle,
  IconPaperclip,
  IconSearch,
  IconBrain,
  IconChevronDown,
  IconBolt,
  IconZoomIn,
  IconSparkles,
  IconBox,
} from "@tabler/icons-react"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UniverSheet, type UniverSheetHandle } from "@/components/univer"
import { generateWorkbookData, type CreateSpreadsheetAction } from "@/lib/ai"
import { Streamdown } from "streamdown"

interface ArtifactHistoryItem {
  id: string
  title: string
  type: "sheet" | "doc" | "chart" | "pivot"
  createdAt: Date
  data: Record<string, unknown>
}

interface AIChatModeProps {
  darkMode: boolean
  onSwitchToNative?: (artifactData: Record<string, unknown>) => void
}

export function AIChatMode({ darkMode, onSwitchToNative }: AIChatModeProps) {
  const [input, setInput] = React.useState("")
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [currentArtifact, setCurrentArtifact] = React.useState<{
    id: string
    title: string
    type: "sheet" | "doc" | "chart" | "pivot"
    data: Record<string, unknown>
  } | null>(null)
  const [artifactHistory, setArtifactHistory] = React.useState<ArtifactHistoryItem[]>([])
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  })

  // Log error from hook
  React.useEffect(() => {
    if (error) {
      console.error("Chat error:", error)
      setApiError(error.message)
    }
  }, [error])

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on messages.length
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const univerRef = React.useRef<UniverSheetHandle>(null)
  
  // Process tool outputs
  React.useEffect(() => {
    if (!messages.length) return

    const processTools = async () => {
      // We only process the last message to avoid re-running everything
      // In a real app we'd track processed IDs
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role !== "assistant") return

      for (const part of lastMessage.parts as any[]) {
        if (part.type === "tool-invocation") {
          const { toolInvocation } = part;
          if (toolInvocation.state === "result") {
            const toolOutput = toolInvocation.result as { type: string; [key: string]: unknown }
            
            // Handle creation (new artifacts)
            if (toolOutput.type === "create_spreadsheet") {
              const action = toolOutput as unknown as CreateSpreadsheetAction
              const workbookData = generateWorkbookData(action)
              
              // If we already have this artifact open, don't recreate it
              // This prevents flickering if the effect runs multiple times
              if (currentArtifact?.id !== action.sheetId) {
                const newArtifact = {
                  id: action.sheetId,
                  title: action.title,
                  type: "sheet" as const,
                  data: workbookData,
                }
                setCurrentArtifact(newArtifact)
                setArtifactHistory((prev) => {
                  if (prev.some((a) => a.id === newArtifact.id)) return prev
                  return [{ ...newArtifact, createdAt: new Date() }, ...prev]
                })
              }
            } 
            else if (toolOutput.type === "create_chart") {
               if (currentArtifact?.id !== toolOutput.chartId) {
                 const newArtifact = {
                   id: toolOutput.chartId as string,
                   title: toolOutput.title as string,
                   type: "chart" as const,
                   data: { ...toolOutput },
                 }
                 setCurrentArtifact(newArtifact)
                 setArtifactHistory(prev => [{ ...newArtifact, createdAt: new Date() }, ...prev])
               }
            }
            else if (toolOutput.type === "insert_pivot_table") {
               if (currentArtifact?.id !== toolOutput.pivotId) {
                 const newArtifact = {
                   id: toolOutput.pivotId as string,
                   title: "Pivot Table Analysis",
                   type: "pivot" as const,
                   data: { ...toolOutput },
                 }
                 setCurrentArtifact(newArtifact)
                 setArtifactHistory(prev => [{ ...newArtifact, createdAt: new Date() }, ...prev])
               }
            }

            // Handle mutations on active sheet
            if (univerRef.current) {
              if (toolOutput.type === "add_data") {
                const { range, values } = toolOutput as any
                univerRef.current.setCellValues(range, values)
              }
              else if (toolOutput.type === "apply_formula") {
                const { cell, formula } = toolOutput as any
                univerRef.current.applyFormula(cell, formula)
              }
              else if (toolOutput.type === "format_cells") {
                const { range, style } = toolOutput as any
                univerRef.current.formatCells(range, style)
              }
            }
          }
        }
      }
    }

    processTools()
  }, [messages, currentArtifact])

  const handleSend = async () => {
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
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* API Error Banner */}
        {apiError && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
            <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error de conexión</p>
              <p className="text-xs text-destructive/80 mt-1">{apiError}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4 relative">
          {/* Landing Page / Empty State */}
          {messages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                <div className="relative h-20 w-20 rounded-3xl bg-card border ring-1 ring-border/50 flex items-center justify-center group overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Logo className="h-10 w-10 text-primary relative z-10" />
                </div>
              </div>
              
              <div className="text-center space-y-3 mb-12">
                <h1 className="text-4xl font-bold tracking-tight">
                  Hola! Soy <span className="text-primary italic">S-AGI</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium">
                  Dime todo lo que necesites
                </p>
              </div>

              {/* Centered Advanced Input (Main focus) */}
              <div className="w-full max-w-2xl space-y-4">
                <div className="relative flex flex-col bg-card/50 backdrop-blur-xl border ring-1 ring-border/50 rounded-3xl p-4 transition-all focus-within:ring-primary/20 focus-within:border-primary/40 group">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pregúntame cualquier cosa..."
                    className="w-full min-h-[120px] bg-transparent border-0 ring-0 focus-visible:ring-0 p-0 text-lg resize-none scrollbar-none"
                    disabled={isGenerating}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon-sm" className="rounded-xl text-muted-foreground hover:text-foreground">
                         <IconPaperclip className="h-4 w-4" />
                       </Button>
                       <div className="h-4 w-[1px] bg-border mx-1" />
                       <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 px-3 text-[11px] font-semibold border-border/50 bg-background/50">
                         <IconSearch className="h-3.5 w-3.5" />
                         Deep Search
                       </Button>
                       <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 px-3 text-[11px] font-semibold border-border/50 bg-background/50">
                         <IconBrain className="h-3.5 w-3.5" />
                         Think
                       </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="rounded-xl gap-2 h-8 px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        <Logo className="h-3.5 w-3.5 opacity-70" />
                        S-AGI 3.0
                        <IconChevronDown className="h-3 w-3" />
                      </Button>
                      <Button 
                        onClick={handleSend} 
                        disabled={!input.trim() || isGenerating}
                        size="icon"
                        className="h-10 w-10 rounded-2xl transition-transform active:scale-95"
                      >
                        <IconSend className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mode Selection Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4 opacity-80">
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 h-9 px-4 text-xs font-semibold bg-muted/40 hover:bg-muted border border-border/40">
                    <IconBolt className="h-3.5 w-3.5 text-amber-500" />
                    Fast
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 h-9 px-4 text-xs font-semibold bg-muted/40 hover:bg-muted border border-border/40">
                    <IconZoomIn className="h-3.5 w-3.5 text-blue-500" />
                    In-depth
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 h-9 px-4 text-xs font-semibold bg-muted/40 hover:bg-muted border border-border/40">
                    <IconSparkles className="h-3.5 w-3.5 text-purple-500" />
                    Magic AI
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0 ml-1 bg-primary/10 text-primary border-0">PRO</Badge>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 h-9 px-4 text-xs font-semibold bg-muted/40 hover:bg-muted border border-border/40">
                    <IconBox className="h-3.5 w-3.5 text-emerald-500" />
                    Holistic
                  </Button>
                </div>
              </div>

              <p className="absolute bottom-6 text-[10px] text-muted-foreground opacity-50">
                S-AGI puede cometer errores. Revisa la información importante.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "bg-muted/80 backdrop-blur-sm border ring-1 ring-border/20"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Logo className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Asistente IA</span>
                  </div>
                )}
                
                {/* Render message parts */}
                {(message.parts as any[]).map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div key={`${message.id}-text-${i}`} className="prose prose-sm dark:prose-invert max-w-none break-words">
                          <Streamdown>
                            {part.text}
                          </Streamdown>
                        </div>
                      )
                    default:
                      // Handle tool calls
                      if ((part as any).type === "tool-invocation") {
                        const { toolInvocation } = part as any;
                        
                        if (toolInvocation.state === "call") {
                          return (
                            <div key={`${message.id}-tool-${i}`} className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/50">
                              <IconRefresh className="h-3 w-3 animate-spin text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Generando artifact...
                              </span>
                            </div>
                          )
                        }
                        
                        if (toolInvocation.state === "result") {
                          const output = toolInvocation.result as { type: string; title?: string }
                          
                          let icon = <IconTable className="h-3 w-3" />
                          let label = "Hoja de Cálculo"
                          
                          if (output.type === "create_chart") {
                              icon = <IconTable className="h-3 w-3" /> // Chart icon
                              label = "Gráfico Generado"
                          } else if (output.type === "insert_pivot_table") {
                              icon = <IconTable className="h-3 w-3" /> // Table icon
                              label = "Tabla Dinámica"
                          }

                          if (output.title || label) {
                            return (
                              <button
                                key={`${message.id}-tool-${i}`} 
                                className="mt-3 flex items-center gap-2 w-full text-left group"
                                onClick={() => {
                                    // Logic to re-open this artifact if needed
                                    // For now, it just shows it exists
                                }}
                              >
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors w-full shadow-sm">
                                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                      {icon}
                                  </div>
                                  <div>
                                      <p className="text-sm font-medium leading-none">{output.title || label}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">Click para ver</p>
                                  </div>
                                </div>
                              </button>
                            )
                          }
                        }
                      }
                      return null
                  }
                })}
              </div>
            </div>
          ))}
            
            {isGenerating && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                 <div className="bg-muted px-4 py-3 rounded-2xl ring-1 ring-border flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Analizando...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-32" />
          </div>

        {/* Floating Input Area (only shown when there are messages) */}
        {messages.length > 0 && (
          <div className={cn(
            "absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-background via-background/90 to-transparent z-20",
            !currentArtifact && "flex justify-center"
          )}>
            <div className={cn(
              "relative w-full transition-all duration-300",
              !currentArtifact ? "max-w-2xl" : "max-w-3xl"
            )}>
              <div className="relative flex items-end gap-2 bg-card/80 backdrop-blur-xl border ring-1 ring-border/50 shadow-2xl rounded-3xl p-2 pl-4 pr-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all group">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Dime qué necesitas crear o analizar..."
                  className="flex-1 min-h-[44px] max-h-[200px] bg-transparent border-0 ring-0 focus-visible:ring-0 p-3 text-sm resize-none scrollbar-none"
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isGenerating}
                  size="icon"
                  type="button"
                  className="h-10 w-10 shrink-0 rounded-2xl shadow-md transition-transform active:scale-95"
                >
                  <IconSend className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Artifact Preview Panel */}
      {currentArtifact && (
        <div className="w-1/2 flex flex-col border-l border-border bg-muted/5 animate-in slide-in-from-right duration-500">
          {/* Preview Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                <IconTable className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-sm truncate max-w-[200px]">
                  {currentArtifact.title}
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">ARTIFACT GENERADO</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-muted rounded-lg p-0.5 border">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  type="button"
                  className="h-7 w-7 rounded-sm"
                  onClick={() => onSwitchToNative?.(currentArtifact!.data)}
                >
                  <IconPencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" type="button" className="h-7 w-7 rounded-sm">
                  <IconDownload className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full rounded-2xl overflow-hidden border bg-background shadow-2xl shadow-primary/5">
              <UniverSheet 
                ref={univerRef}
                initialData={currentArtifact!.data} 
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* Artifact History */}
          {artifactHistory.length > 1 && (
            <div className="px-4 py-3 border-t border-border bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <IconRefresh className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Historial</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {artifactHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentArtifact(item)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all",
                      currentArtifact?.id === item.id 
                        ? "bg-primary/10 border-primary text-primary shadow-sm" 
                        : "bg-background hover:bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
