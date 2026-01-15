'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconLanguage,
  IconCloudUpload,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { AppSettings } from '@/lib/services/storage-service'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: AppSettings
  onSettingsChange: (settings: Partial<AppSettings>) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsDialogProps) {
  const themeOptions = [
    { id: 'light' as const, name: 'Claro', icon: IconSun },
    { id: 'dark' as const, name: 'Oscuro', icon: IconMoon },
    { id: 'system' as const, name: 'Sistema', icon: IconDeviceDesktop },
  ]

  const languageOptions = [
    { id: 'es' as const, name: 'Español', flag: 'ES' },
    { id: 'en' as const, name: 'English', flag: 'EN' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Personaliza tu experiencia en S-AGI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconSun className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium">Tema</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSettingsChange({ theme: option.id })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all',
                    settings.theme === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
                  )}
                >
                  <option.icon
                    className={cn(
                      'h-4 w-4',
                      settings.theme === option.id
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      settings.theme === option.id
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconLanguage className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium">Idioma</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSettingsChange({ language: option.id })}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border transition-all',
                    settings.language === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
                  )}
                >
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted">
                    {option.flag}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      settings.language === option.id
                        ? 'text-primary'
                        : 'text-foreground',
                    )}
                  >
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Auto-save Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconCloudUpload className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-medium">Guardado</Label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div>
                <p className="text-xs font-medium">Guardado automático</p>
                <p className="text-[10px] text-muted-foreground">
                  Guarda cambios automáticamente cada{' '}
                  {settings.autoSaveInterval}s
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) =>
                  onSettingsChange({ autoSave: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
