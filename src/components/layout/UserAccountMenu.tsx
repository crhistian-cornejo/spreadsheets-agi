'use client'

import * as React from 'react'
import {
    IconBell,
    IconChevronRight,
    IconCreditCard,
    IconLogout,
    IconMoon,
    IconSettings,
    IconSun,
    IconUser,
} from '@tabler/icons-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useAuth } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface UserAccountMenuProps {
    darkMode: boolean
    onDarkModeToggle: () => void
    onOpenSettings: () => void
    onOpenProfile: () => void
    onSignOut: () => void
    showLabel?: boolean
    isSidebar?: boolean
    className?: string
}

export function UserAccountMenu({
    darkMode,
    onDarkModeToggle,
    onOpenSettings,
    onOpenProfile,
    onSignOut,
    showLabel = false,
    isSidebar = false,
    className = '',
}: UserAccountMenuProps) {
    const { user, profile } = useAuth()
    const displayName = profile?.full_name || user?.email || 'Usuario'

    const trigger = (
        <div
            className={cn(
                'flex items-center gap-2 transition-colors outline-none',
                isSidebar
                    ? 'w-full p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-full'
                    : 'p-1 rounded-full hover:opacity-80',
                className,
            )}
        >
            <UserAvatar size="sm" />
            {showLabel && (
                <div className="flex flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-medium text-foreground">
                        {displayName}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                        {user?.email}
                    </span>
                </div>
            )}
            {showLabel && (
                <IconChevronRight className="ml-auto size-3.5 text-muted-foreground/60 group-data-[collapsible=icon]:hidden" />
            )}
        </div>
    )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left outline-none">
                {trigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={isSidebar ? 'start' : 'end'}
                className="w-64"
                side={isSidebar ? 'right' : 'bottom'}
                sideOffset={8}
            >
                <DropdownMenuGroup>
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none text-foreground">
                                {displayName}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2" onClick={onOpenProfile}>
                        <IconUser className="size-4" />
                        <span>Mi Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 p-2" onClick={onOpenSettings}>
                        <IconSettings className="size-4" />
                        <span>Configuración General</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 p-2" disabled>
                        <IconBell className="size-4" />
                        <span>Notificaciones</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 p-2" disabled>
                        <IconCreditCard className="size-4" />
                        <span>Suscripción</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2" onClick={handleDarkModeToggle}>
                        {darkMode ? (
                            <IconSun className="size-4" />
                        ) : (
                            <IconMoon className="size-4" />
                        )}
                        <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="gap-2 p-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={onSignOut}
                    >
                        <IconLogout className="size-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    function handleDarkModeToggle(e: React.MouseEvent) {
        e.preventDefault()
        onDarkModeToggle()
    }
}
