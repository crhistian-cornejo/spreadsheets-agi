'use client'

import * as React from 'react'
import { IconTable, IconRefresh } from '@tabler/icons-react'
import { PencilIcon, DownloadIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
const UniverSheet = React.lazy(() =>
  import('@/components/univer/UniverSheet').then((m) => ({
    default: m.UniverSheet,
  })),
)

// AI Elements artifact components
import {
  Artifact,
  ArtifactHeader,
  ArtifactContent,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactClose,
} from '@/components/ai-elements/artifact'

import { useChatContext } from '@/components/chat/ChatProvider'
import type { ArtifactHistoryItem } from '@/hooks/useSpreadsheetChat'

// ============================================================================
// ArtifactPanel Component
// ============================================================================

export interface ArtifactPanelProps {
  className?: string
  /** Callback when user wants to edit in native mode */
  onEditInNative?: (data: Record<string, unknown>) => void
  /** Dark mode for UniverSheet */
  darkMode?: boolean
}

export function ArtifactPanel({
  className,
  onEditInNative,
  darkMode = false,
}: ArtifactPanelProps) {
  const { currentArtifact, artifactHistory, setCurrentArtifact, univerRef } =
    useChatContext()

  if (!currentArtifact) return null

  const handleDownload = () => {
    // Create JSON blob and download
    const blob = new Blob([JSON.stringify(currentArtifact.data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentArtifact.title}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Artifact
      className={cn(
        'animate-in slide-in-from-right duration-150 flex flex-col',
        className,
      )}
    >
      <ArtifactHeader className="shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
          <div className="bg-emerald-500/10 p-1 sm:p-1.5 rounded-lg border border-emerald-500/20 shrink-0">
            <IconTable className="size-3.5 sm:size-4 text-emerald-500" />
          </div>
          <div className="flex flex-col min-w-0">
            <ArtifactTitle className="truncate max-w-[120px] sm:max-w-[200px] text-sm sm:text-base">
              {currentArtifact.title}
            </ArtifactTitle>
            <ArtifactDescription className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">
              ARTIFACT GENERADO
            </ArtifactDescription>
          </div>
        </div>
        <ArtifactActions>
          {onEditInNative && (
            <ArtifactAction
              tooltip="Editar en modo nativo"
              icon={PencilIcon}
              onClick={() => onEditInNative(currentArtifact.data)}
            />
          )}
          <ArtifactAction
            tooltip="Descargar"
            icon={DownloadIcon}
            onClick={handleDownload}
          />
          <ArtifactClose onClick={() => setCurrentArtifact(null)} />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className="p-2 sm:p-4 flex-1 min-h-0">
        <div className="h-full rounded-lg overflow-hidden border bg-background">
          <React.Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            }
          >
            <UniverSheet
              ref={univerRef}
              initialData={currentArtifact.data}
              darkMode={darkMode}
            />
          </React.Suspense>
        </div>
      </ArtifactContent>

      {/* Artifact History */}
      {artifactHistory.length > 1 && (
        <ArtifactHistory
          artifacts={artifactHistory}
          currentId={currentArtifact.id}
          onSelect={setCurrentArtifact}
        />
      )}
    </Artifact>
  )
}

// ============================================================================
// ArtifactHistory Component
// ============================================================================

export interface ArtifactHistoryProps {
  artifacts: ArtifactHistoryItem[]
  currentId: string
  onSelect: (artifact: ArtifactHistoryItem) => void
  className?: string
}

export function ArtifactHistory({
  artifacts,
  currentId,
  onSelect,
  className,
}: ArtifactHistoryProps) {
  if (artifacts.length <= 1) return null

  return (
    <div
      className={cn(
        'px-2 sm:px-4 py-2 sm:py-3 border-t border-border bg-background/50 shrink-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <IconRefresh className="size-3 text-muted-foreground" />
        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Historial
        </span>
      </div>
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {artifacts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-[11px] font-medium transition-colors',
              currentId === item.id
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background hover:bg-muted text-muted-foreground border-border',
            )}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// ArtifactPreview Component (for inline chat preview)
// ============================================================================

export interface ArtifactPreviewProps {
  artifact: ArtifactHistoryItem
  onClick?: () => void
  className?: string
}

export function ArtifactPreview({
  artifact,
  onClick,
  className,
}: ArtifactPreviewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors group',
        className,
      )}
    >
      <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
        <IconTable className="size-5 text-emerald-500" />
      </div>
      <div className="text-left">
        <p className="font-medium text-sm">{artifact.title}</p>
        <p className="text-xs text-muted-foreground">
          Click para ver en el panel
        </p>
      </div>
    </button>
  )
}
