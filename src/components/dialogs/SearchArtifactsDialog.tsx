'use client'

import * as React from 'react'
import { IconSearch, IconTable, IconTrash, IconX } from '@tabler/icons-react'
import type { Workbook } from '@/lib/supabase'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ARTIFACT_WORKBOOK_PREFIX } from '@/lib/ai/types'

interface SearchArtifactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artifacts: Array<Workbook>
  onLoadArtifact: (id: string) => void
  onDeleteArtifact: (id: string) => void
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'hace un momento'
  if (diffMins < 60)
    return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24)
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  return past.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getArtifactTitle(name: string) {
  return name.startsWith(ARTIFACT_WORKBOOK_PREFIX)
    ? name.slice(ARTIFACT_WORKBOOK_PREFIX.length)
    : name
}

export function SearchArtifactsDialog({
  open,
  onOpenChange,
  artifacts,
  onLoadArtifact,
  onDeleteArtifact,
}: SearchArtifactsDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null)

  const filteredArtifacts = artifacts.filter((artifact) =>
    getArtifactTitle(artifact.name)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  )

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este artifact?')) {
      return
    }
    setIsProcessing(id)
    try {
      await onDeleteArtifact(id)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleArtifactClick = (id: string) => {
    onLoadArtifact(id)
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (open) {
      setSearchQuery('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] h-[600px] flex flex-col p-0 overflow-hidden">
        <div className="pt-5 px-6 pb-4 border-b border-border/50">
          <div className="relative mr-8">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border border-border/50 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <IconX className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-6 pb-6">
            {filteredArtifacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 opacity-50">
                  <IconTable className="size-6" />
                </div>
                <p className="text-sm font-medium">
                  {searchQuery
                    ? 'No se encontraron artifacts'
                    : 'No hay artifacts guardados'}
                </p>
                <p className="text-xs">
                  {searchQuery
                    ? 'Probá con otros términos de búsqueda.'
                    : 'Los artifacts generados por el chat aparecen acá.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredArtifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    onClick={() => handleArtifactClick(artifact.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                  >
                    <div className="size-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50 group-hover:border-primary/30 transition-colors">
                      <IconTable className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold truncate leading-none mb-1 group-hover:text-primary transition-colors">
                        {getArtifactTitle(artifact.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(artifact.updated_at)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive shrink-0 transition-all"
                      onClick={(e) => handleDelete(e, artifact.id)}
                      disabled={isProcessing === artifact.id}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
