'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconTable, IconFileText } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface CreateFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateFile: (name: string, type: 'sheets' | 'docs') => void
  defaultType?: 'sheets' | 'docs'
}

export function CreateFileDialog({
  open,
  onOpenChange,
  onCreateFile,
  defaultType = 'sheets',
}: CreateFileDialogProps) {
  const [name, setName] = React.useState('')
  const [type, setType] = React.useState<'sheets' | 'docs'>(defaultType)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName('')
      setType(defaultType)
    }
  }, [open, defaultType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      onCreateFile(name.trim(), type)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fileTypes = [
    {
      id: 'sheets' as const,
      name: 'Spreadsheet',
      description: 'Hoja de cálculo con fórmulas y datos',
      icon: IconTable,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500',
    },
    {
      id: 'docs' as const,
      name: 'Documento',
      description: 'Documento de texto enriquecido',
      icon: IconFileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear nuevo archivo</DialogTitle>
            <DialogDescription>
              Elige el tipo de archivo y dale un nombre
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Type Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tipo de archivo</Label>
              <div className="grid grid-cols-2 gap-2">
                {fileTypes.map((fileType) => (
                  <button
                    key={fileType.id}
                    type="button"
                    onClick={() => setType(fileType.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                      type === fileType.id
                        ? `${fileType.borderColor} ${fileType.bgColor}`
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
                    )}
                  >
                    <div className={cn('p-2 rounded-md', fileType.bgColor)}>
                      <fileType.icon
                        className={cn('h-5 w-5', fileType.color)}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">{fileType.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {fileType.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* File Name Input */}
            <div className="space-y-2">
              <Label htmlFor="file-name" className="text-xs font-medium">
                Nombre del archivo
              </Label>
              <Input
                id="file-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'sheets' ? 'Mi Spreadsheet' : 'Mi Documento'
                }
                className="h-9"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
