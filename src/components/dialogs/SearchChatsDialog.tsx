'use client'

import * as React from 'react'
import {
    IconMessage,
    IconSearch,
    IconTrash,
    IconX,
} from '@tabler/icons-react'
import type { Chat } from '@/lib/supabase'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SearchChatsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    chats: Array<Chat>
    onLoadChat: (id: string) => void
    onDeleteChat: (id: string) => void
}

export function SearchChatsDialog({
    open,
    onOpenChange,
    chats,
    onLoadChat,
    onDeleteChat,
}: SearchChatsDialogProps) {
    const [searchQuery, setSearchQuery] = React.useState('')
    const [isProcessing, setIsProcessing] = React.useState<string | null>(null)

    const filteredChats = chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('¿Estás seguro de que deseas eliminar esta conversación?')) {
            return
        }
        setIsProcessing(id)
        try {
            await onDeleteChat(id)
        } finally {
            setIsProcessing(null)
        }
    }

    const handleChatClick = (id: string) => {
        onLoadChat(id)
        onOpenChange(false)
    }

    // Clear search when opening
    React.useEffect(() => {
        if (open) {
            setSearchQuery('')
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
                <div className="pt-5 px-6 pb-4 border-b border-border/50">
                    <div className="relative mr-8">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Buscar conversaciones..."
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
                        {filteredChats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 opacity-50">
                                    <IconMessage className="size-6" />
                                </div>
                                <p className="text-sm font-medium">
                                    {searchQuery ? 'No se encontraron resultados' : 'No hay chats activos'}
                                </p>
                                <p className="text-xs">
                                    {searchQuery ? 'Prueba con otros términos de búsqueda.' : 'Tus conversaciones recientes aparecerán aquí.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleChatClick(chat.id)}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                                    >
                                        <div className="size-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50 group-hover:border-primary/30 transition-colors">
                                            <IconMessage className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-semibold truncate leading-none mb-1 group-hover:text-primary transition-colors">
                                                {chat.title}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatRelativeTime(chat.updated_at)}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive shrink-0 transition-all"
                                            onClick={(e) => handleDelete(e, chat.id)}
                                            disabled={isProcessing === chat.id}
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
