'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconChevronDown, IconCheck } from '@tabler/icons-react'
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
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'

import { useChatContext } from './ChatProvider'

// ============================================================================
// Model Configuration
// ============================================================================

const AI_MODELS = [
  { id: 'sagi-3', name: 'S-AGI 3.0', badge: 'Actual' },
  { id: 'sagi-4', name: 'S-AGI 4.0', badge: 'Pro', disabled: true },
]

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
  const { messages, status, isGenerating, sendMessage } = useChatContext()
  const [selectedModel, setSelectedModel] = React.useState(AI_MODELS[0].id)

  // Handle form submission
  const handleSubmit = React.useCallback(
    (message: PromptInputMessage) => {
      console.log('[ChatInput] handleSubmit called:', {
        text: message.text,
        filesCount: message.files.length,
        status,
        isGenerating,
      })

      if (!message.text.trim() && message.files.length === 0) {
        console.warn('[ChatInput] Empty message, ignoring')
        return
      }

      sendMessage({
        text: message.text.trim(),
        files: message.files.length > 0 ? message.files : undefined,
      })
    },
    [sendMessage, status, isGenerating],
  )

  // Default placeholder based on message count
  const defaultPlaceholder =
    messages.length === 0
      ? 'Pregúntame cualquier cosa sobre datos...'
      : 'Continúa la conversación...'

  const selectedModelData = AI_MODELS.find((m) => m.id === selectedModel)

  // Model selector dropdown
  const ModelSelector = React.useMemo(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium hover:bg-foreground/10 dark:hover:bg-white/10 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedModel}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.1 }}
              className="flex items-center gap-1.5"
            >
              <Logo className="size-3.5 text-primary" />
              <span className="text-foreground/80 dark:text-white/80">
                {selectedModelData?.name}
              </span>
              <IconChevronDown className="size-3 opacity-50" />
            </motion.div>
          </AnimatePresence>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-40">
          {AI_MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              disabled={model.disabled}
              onSelect={() => setSelectedModel(model.id)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Logo className="size-3.5" />
                <span>{model.name}</span>
              </div>
              {selectedModel === model.id && (
                <IconCheck className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [selectedModel, selectedModelData?.name],
  )

  return (
    <div
      className={cn(
        'border-t border-border',
        compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4',
        className,
      )}
    >
      <PromptInput
        onSubmit={handleSubmit}
        className={compact ? '' : 'max-w-2xl mx-auto'}
        accept={accept}
        multiple={multiple}
      >
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>

        <PromptInputTextarea
          placeholder={placeholder || defaultPlaceholder}
          disabled={isGenerating}
          className="text-sm sm:text-base"
        />

        <PromptInputFooter>
          <PromptInputTools>
            {/* Model selector - hidden on mobile in non-compact mode */}
            {showModelSelector && !compact && (
              <div className="hidden sm:flex">{ModelSelector}</div>
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

          <PromptInputSubmit status={status} disabled={isGenerating} />
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
