'use client'

import * as React from 'react'
import { useAuth, storageService } from '@/lib/supabase'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { IconCamera, IconTrash, IconCheck, IconX, IconLoader } from '@tabler/icons-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'

interface ProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
    const { user, profile, updateProfile, refreshProfile } = useAuth()

    const [fullName, setFullName] = React.useState(profile?.full_name || '')
    const [isEditing, setIsEditing] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Update local state when profile changes
    React.useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '')
        }
    }, [profile])

    const handleSave = async () => {
        if (!fullName.trim()) {
            setError('El nombre no puede estar vacío')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const { error } = await updateProfile({ full_name: fullName.trim() })
            if (error) throw error
            setIsEditing(false)
        } catch (err) {
            setError('Error al guardar los cambios')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setFullName(profile?.full_name || '')
        setIsEditing(false)
        setError(null)
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen debe ser menor a 5MB')
            return
        }

        setIsUploadingAvatar(true)
        setError(null)

        try {
            const { error } = await storageService.uploadAvatar(user.id, file)
            if (error) throw error
            await refreshProfile()
        } catch (err) {
            setError('Error al subir la imagen')
        } finally {
            setIsUploadingAvatar(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDeleteAvatar = async () => {
        if (!user) return

        setIsUploadingAvatar(true)
        setError(null)

        try {
            const { error } = await storageService.deleteAvatar(user.id)
            if (error) throw error
            await refreshProfile()
        } catch (err) {
            setError('Error al eliminar la imagen')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mi Perfil</DialogTitle>
                    <DialogDescription>
                        Actualiza tu información de perfil
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <UserAvatar size="lg" className="size-24 text-2xl" />

                            {/* Avatar Overlay */}
                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {isUploadingAvatar ? (
                                    <IconLoader className="size-6 text-white animate-spin" />
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleAvatarClick}
                                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                            title="Cambiar foto"
                                        >
                                            <IconCamera className="size-4 text-white" />
                                        </button>
                                        {profile?.avatar_url && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteAvatar}
                                                className="p-2 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
                                                title="Eliminar foto"
                                            >
                                                <IconTrash className="size-4 text-white" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Clic para cambiar tu foto de perfil
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Profile Fields */}
                    <div className="space-y-4">
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                                Correo electrónico
                            </label>
                            <div className="px-3 py-2.5 rounded-lg bg-muted/50 text-foreground text-sm">
                                {user?.email}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Nombre completo
                            </label>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        placeholder="Tu nombre"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                        title="Guardar"
                                    >
                                        {isSaving ? (
                                            <IconLoader className="size-4 animate-spin" />
                                        ) : (
                                            <IconCheck className="size-4" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent disabled:opacity-50"
                                        title="Cancelar"
                                    >
                                        <IconX className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="px-3 py-2.5 rounded-lg bg-muted/50 text-foreground text-sm flex-1">
                                        {profile?.full_name || 'Sin nombre'}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="ml-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Cuenta creada el {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                }) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
