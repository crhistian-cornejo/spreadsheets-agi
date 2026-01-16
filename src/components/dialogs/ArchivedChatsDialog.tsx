'use client'

import * as React from 'react'
import type { Chat } from '@/lib/supabase'
import {
    IconArchive,
    IconCornerUpLeft,
    IconMessage,
    IconTrash,
} from '@tabler/icons-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ArchivedChatsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    archivedChats: Array<Chat>
    onUnarchive: (id: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export function ArchivedChatsDialog({
    open,
    onOpenChange,
    archivedChats,
    onUnarchive,
    onDelete,
}: ArchivedChatsDialogProps) {
    const [isProcessing, setIsProcessing] = React.useState<string | null>(null)

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

    const handleUnarchive = async (id: string) => {
        setIsProcessing(id)
        try {
            await onUnarchive(id)
        } finally {
            setIsProcessing(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta conversación permanentemente?')) {
            return
        }
        setIsProcessing(id)
        try {
            await onDelete(id)
        } finally {
            setIsProcessing(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <IconArchive className="size-5" />
                        <DialogTitle>Chats Archivados</DialogTitle>
                    </div>
                    <DialogDescription>
                        Recupera o elimina permanentemente tus conversaciones archivadas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full px-6 pb-6">
                        {archivedChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 opacity-50">
                                    <IconArchive className="size-6" />
                                </div>
                                <p className="text-sm font-medium">No hay chats archivados</p>
                                <p className="text-xs">Las conversaciones que archives aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {archivedChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className="flex flex-col gap-2 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50">
                                                    <IconMessage className="size-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate leading-none mb-1">
                                                        {chat.title}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Actualizado {formatRelativeTime(chat.updated_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-full hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => handleUnarchive(chat.id)}
                                                    disabled={isProcessing === chat.id}
                                                    title="Restaurar"
                                                >
                                                    <IconCornerUpLeft className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDelete(chat.id)}
                                                    disabled={isProcessing === chat.id}
                                                    title="Eliminar permanentemente"
                                                >
                                                    <IconTrash className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
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
