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
import {
  IconUpload,
  IconFileSpreadsheet,
  IconAlertCircle,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface OpenFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileImported: (
    name: string,
    type: 'sheets' | 'docs',
    data: Record<string, unknown>,
  ) => void
}

export function OpenFileDialog({
  open,
  onOpenChange,
  onFileImported,
}: OpenFileDialogProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedFile(null)
      setError(null)
      setIsDragging(false)
    }
  }, [open])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    setError(null)

    // For now, we only support JSON files (exported from Univer)
    // In the future, we can add XLSX support with Univer Pro
    const validExtensions = ['.json']
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(extension)) {
      setError(
        'Solo se admiten archivos .json por ahora. El soporte para .xlsx requiere Univer Pro.',
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError('El archivo es demasiado grande. Máximo 10MB.')
      return
    }

    setSelectedFile(file)
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      // Determine file type from data structure
      const type: 'sheets' | 'docs' = data.sheets ? 'sheets' : 'docs'

      // Get name from file or data
      const name = data.name || selectedFile.name.replace(/\.[^/.]+$/, '')

      onFileImported(name, type, data)
      onOpenChange(false)
    } catch (err) {
      console.error('Import error:', err)
      setError(
        'Error al procesar el archivo. Asegúrate de que sea un archivo JSON válido.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir archivo</DialogTitle>
          <DialogDescription>
            Importa un archivo para continuar trabajando
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            className={cn(
              'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
              error && 'border-destructive/50',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              className={cn(
                'p-3 rounded-full',
                isDragging ? 'bg-primary/10' : 'bg-muted',
              )}
            >
              <IconUpload
                className={cn(
                  'h-6 w-6',
                  isDragging ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging
                  ? 'Suelta el archivo aquí'
                  : 'Arrastra un archivo o haz clic'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Soporta archivos .json (exportados de S-AGI)
              </p>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && !error && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="p-2 rounded-md bg-emerald-500/10">
                <IconFileSpreadsheet className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <IconAlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Info about XLSX support */}
          <p className="text-[10px] text-muted-foreground text-center">
            El soporte para archivos .xlsx estará disponible próximamente
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !!error || isProcessing}
          >
            {isProcessing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
