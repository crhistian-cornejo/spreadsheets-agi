'use client'

import * as React from 'react'
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react'
import { AnimatePresence, motion } from 'motion/react'
import { useChatContext } from './ChatProvider'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

// AI Elements components
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'

// ============================================================================
// Model Configuration
// ============================================================================

import {
  MODEL_REGISTRY,
  getModelById,
  getReasoningEfforts,
} from '@/lib/ai/model-registry'

const REASONING_LEVELS = [
  {
    id: 'none',
    label: 'Quick',
    description: 'Respuesta rápida (sin reasoning)',
  },
  { id: 'minimal', label: 'Minimal', description: 'Mínimo razonamiento' },
  { id: 'low', label: 'Low', description: 'Bajo razonamiento' },
  { id: 'medium', label: 'Medium', description: 'Razonamiento balanceado' },
  { id: 'high', label: 'High', description: 'Máximo razonamiento' },
] as const

// ============================================================================
// ChatInput Component
// ============================================================================

export interface ChatInputProps {
  className?: string
  /** Placeholder text */
  placeholder?: string
  /** Show compact version (for sidebar) */
  compact?: boolean
  /** Show model selector */
  showModelSelector?: boolean
  /** Show attachments menu */
  showAttachments?: boolean
  /** Accepted file types */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Footer text */
  footerText?: string
}

export function ChatInput({
  className,
  placeholder,
  compact = false,
  showModelSelector = true,
  showAttachments = true,
  accept = 'image/*,.csv,.xlsx,.xls',
  multiple = true,
  footerText = 'S-AGI puede cometer errores. Revisa la información importante.',
}: ChatInputProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    modelId,
    setModelId,
    reasoningEffort,
    setReasoningEffort,
    replyingTo,
    setReplyingTo,
  } = useChatContext()

  // Handle form submission
  const handleSubmit = React.useCallback(
    (message: PromptInputMessage) => {
      console.log('[ChatInput] handleSubmit called:', {
        text: message.text,
        filesCount: message.files.length,
        isLoading,
        isStreaming,
      })

      if (!message.text.trim() && message.files.length === 0) {
        console.warn('[ChatInput] Empty message, ignoring')
        return
      }

      // If replying to a message, format it as a quote
      let finalText = message.text.trim()
      if (replyingTo) {
        // Extract text from message parts
        const quotedText =
          replyingTo.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.content)
            .join(' ')
            .slice(0, 100) + '...'

        finalText = `> ${quotedText}\n\n${finalText}`
        setReplyingTo(null)
      }

      sendMessage({
        text: finalText,
        files: message.files.map((file, index) => ({
          id: `attachment-${index}`,
          url: file.url,
          mediaType: file.mediaType,
          filename: file.filename,
        })),
      })
    },
    [sendMessage, isLoading, isStreaming, replyingTo, setReplyingTo],
  )

  // Default placeholder based on message count
  const defaultPlaceholder =
    messages.length === 0
      ? 'Pregúntame cualquier cosa sobre datos...'
      : 'Continúa la conversación...'

  const selectedModelData = getModelById(modelId)
  const availableReasoningLevels = getReasoningEfforts(modelId)
  const hasQuick = availableReasoningLevels.includes('none')

  React.useEffect(() => {
    if (!availableReasoningLevels.includes(reasoningEffort)) {
      setReasoningEffort(availableReasoningLevels[0] || 'none')
    }
  }, [availableReasoningLevels, reasoningEffort, setReasoningEffort])

  // Model selector dropdown
  const ModelSelector = React.useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={modelId}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.1 }}
              className="flex items-center gap-1.5"
            >
              <Logo className="size-3.5 text-primary" />
              <span className="text-foreground/80 dark:text-white/80">
                {selectedModelData.label || 'Seleccionar modelo'}
              </span>
              <IconChevronDown className="size-3 opacity-50" />
            </motion.div>
          </AnimatePresence>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-48">
          {MODEL_REGISTRY.map((model) => (
            <DropdownMenuItem
              key={model.id}
              disabled={model.enabled === false}
              onClick={() => {
                if (model.enabled === false) return
                setModelId(model.id)
              }}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Logo className="size-3.5" />
                <span>{model.label}</span>
                {model.enabled === false && (
                  <span className="text-[10px] text-muted-foreground">
                    Próximamente
                  </span>
                )}
              </div>
              {modelId === model.id && (
                <IconCheck className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [modelId, selectedModelData.label, setModelId],
  )

  const selectedReasoning = REASONING_LEVELS.find(
    (level) => level.id === reasoningEffort,
  )

  const visibleReasoningLevels = REASONING_LEVELS.filter((level) =>
    availableReasoningLevels.includes(level.id),
  )

  const reasoningLabelFallback = hasQuick ? 'Quick' : 'Minimal'

  const ReasoningSelector = React.useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={reasoningEffort}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.1 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-foreground/80 dark:text-white/80">
                {selectedReasoning?.label ?? reasoningLabelFallback}
              </span>
              <IconChevronDown className="size-3 opacity-50" />
            </motion.div>
          </AnimatePresence>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-52">
          {visibleReasoningLevels.map((level) => (
            <DropdownMenuItem
              key={level.id}
              onClick={() => setReasoningEffort(level.id)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex flex-col">
                <span>{level.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {level.description}
                </span>
              </div>
              {reasoningEffort === level.id && (
                <IconCheck className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [
      reasoningEffort,
      reasoningLabelFallback,
      selectedReasoning?.label,
      setReasoningEffort,
      visibleReasoningLevels,
    ],
  )

  return (
    <div className={cn(compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4', className)}>
      {replyingTo && (
        <div className="max-w-2xl mx-auto mb-2 flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-2 pr-1 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <IconArrowBackUp className="size-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-tight">
                Respondiendo a {replyingTo.role === 'user' ? 'ti' : 'S-AGI'}
              </span>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.parts
                  .filter((p) => p.type === 'text')
                  .map((p) => p.content)
                  .join(' ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-primary/10 rounded-full transition-colors shrink-0"
          >
            <IconX className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
      <PromptInput
        onSubmit={handleSubmit}
        className="w-full"
        accept={accept}
        multiple={multiple}
      >
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>

        <PromptInputTextarea
          placeholder={placeholder || defaultPlaceholder}
          disabled={isStreaming}
          className="text-sm sm:text-base"
        />

        <PromptInputFooter>
          <PromptInputTools>
            {/* Model selector - hidden on mobile in non-compact mode */}
            {showModelSelector && !compact && (
              <div className="hidden sm:flex">{ModelSelector}</div>
            )}
            {showModelSelector && !compact && (
              <div className="hidden sm:flex">{ReasoningSelector}</div>
            )}
            {showModelSelector && !compact && showAttachments && (
              <div className="hidden sm:block mx-0.5 h-4 w-px bg-foreground/10 dark:bg-white/10" />
            )}
            {showAttachments && (
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments label="Agregar archivos" />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            )}
          </PromptInputTools>

          <PromptInputSubmit
            status={isLoading ? 'streaming' : 'ready'}
            disabled={isStreaming}
          />
        </PromptInputFooter>
      </PromptInput>

      {/* Footer text - hidden on mobile for space */}
      {footerText && !compact && (
        <p className="hidden sm:block text-center text-[10px] text-muted-foreground/50 mt-3">
          {footerText}
        </p>
      )}
    </div>
  )
}
