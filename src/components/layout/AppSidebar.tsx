'use client'

import {
  IconChevronsDown,
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconFileText,
  IconFolderOpen,
  IconMessage,
  IconPlus,
  IconPresentation,
  IconTable,
  IconTrash,
} from '@tabler/icons-react'
import { UserAccountMenu } from './UserAccountMenu'
import type { Chat, Workbook } from '@/lib/supabase'
import { Logo } from '@/components/ui/Logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Format relative time helper
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

interface AppSidebarProps {
  currentApp: 'sheets' | 'docs' | 'slides'
  onAppChange: (app: 'sheets' | 'docs' | 'slides') => void
  darkMode: boolean
  onDarkModeToggle: () => void
  // Props for file management
  recentWorkbooks: Array<Workbook>
  activeWorkbookId: string | null
  onCreateNew: () => void
  onOpenFile: () => void
  onLoadWorkbook: (id: string) => void
  onDeleteWorkbook: (id: string) => void
  onDuplicateWorkbook: (id: string) => void
  onExportWorkbook: (id: string) => void
  onOpenSettings: () => void
  onOpenProfile: () => void
  onSignOut: () => void
  // Props for chat history
  recentChats?: Array<Chat>
  activeChatId?: string | null
  onCreateChat?: () => void
  onLoadChat?: (id: string) => void
  onDeleteChat?: (id: string) => void
}

const apps = [
  {
    id: 'sheets' as const,
    name: 'Sheets',
    icon: IconTable,
    color: 'text-emerald-500',
  },
  {
    id: 'docs' as const,
    name: 'Docs',
    icon: IconFileText,
    color: 'text-blue-500',
  },
  {
    id: 'slides' as const,
    name: 'Slides',
    icon: IconPresentation,
    color: 'text-amber-500',
    disabled: true,
  },
]

export function AppSidebar({
  currentApp,
  onAppChange,
  darkMode,
  onDarkModeToggle,
  recentWorkbooks,
  activeWorkbookId,
  onCreateNew,
  onOpenFile,
  onLoadWorkbook,
  onDeleteWorkbook,
  onDuplicateWorkbook,
  onExportWorkbook,
  onOpenSettings,
  onOpenProfile,
  onSignOut,
  recentChats = [],
  activeChatId,
  onCreateChat,
  onLoadChat,
  onDeleteChat,
}: AppSidebarProps) {
  const currentAppData = apps.find((app) => app.id === currentApp)
  const { state: sidebarState, isMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger className="w-full">
                    <div className="flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-1! h-12 text-sm cursor-pointer bg-muted/30 border border-transparent hover:border-border/50 transition-colors">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-sm">
                        <Logo className="size-5" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-foreground">
                          S-AGI
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground/80">
                          Spreadsheets Plus
                        </span>
                      </div>
                      <IconChevronsDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-muted-foreground/60" />
                    </div>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  hidden={sidebarState !== 'collapsed' || isMobile}
                >
                  {currentAppData?.name || 'Aplicaciones'}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Aplicaciones
                  </DropdownMenuLabel>
                  {apps.map((app) => (
                    <DropdownMenuItem
                      key={app.id}
                      onClick={() => !app.disabled && onAppChange(app.id)}
                      className="gap-2 p-2"
                      disabled={app.disabled}
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <app.icon className={`size-4 shrink-0 ${app.color}`} />
                      </div>
                      {app.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-2 p-2" disabled>
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <IconPlus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Más apps (pronto)
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Acciones</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={`Nuevo ${currentAppData?.name === 'Sheets' ? 'Spreadsheet' : 'Documento'}`}
                onClick={onCreateNew}
              >
                <IconPlus />
                <span className="group-data-[collapsible=icon]:hidden">
                  Nuevo{' '}
                  {currentAppData?.name === 'Sheets'
                    ? 'Spreadsheet'
                    : 'Documento'}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Abrir archivo" onClick={onOpenFile}>
                <IconFolderOpen />
                <span className="group-data-[collapsible=icon]:hidden">
                  Abrir archivo
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Archivos Recientes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentWorkbooks.length === 0 ? (
                <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                  <p className="text-xs text-muted-foreground">
                    No hay archivos recientes
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Crea un archivo nuevo para comenzar
                  </p>
                </div>
              ) : (
                recentWorkbooks.map((workbook) => {
                  const FileIcon =
                    workbook.type === 'sheets' ? IconTable : IconFileText
                  const iconColor =
                    workbook.type === 'sheets'
                      ? 'text-emerald-500'
                      : 'text-blue-500'
                  const isActive = workbook.id === activeWorkbookId

                  return (
                    <SidebarMenuItem key={workbook.id}>
                      <SidebarMenuButton
                        tooltip={workbook.name}
                        onClick={() => onLoadWorkbook(workbook.id)}
                        isActive={isActive}
                      >
                        <FileIcon className={iconColor} />
                        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                          <span className="truncate">{workbook.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(workbook.updated_at)}
                          </span>
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger className="text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-1.5 right-1 aspect-square w-5 rounded-[calc(var(--radius-sm)-2px)] p-0 focus-visible:ring-2 flex items-center justify-center outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0">
                              <IconDotsVertical className="size-4" />
                              <span className="sr-only">Más opciones</span>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="center"
                            hidden={sidebarState !== 'collapsed' || isMobile}
                          >
                            Más opciones
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent
                          className="w-48 rounded-lg"
                          side="right"
                          align="start"
                        >
                          <DropdownMenuItem
                            onClick={() => onDuplicateWorkbook(workbook.id)}
                            className="gap-2"
                          >
                            <IconCopy className="size-4" />
                            <span>Duplicar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onExportWorkbook(workbook.id)}
                            className="gap-2"
                          >
                            <IconDownload className="size-4" />
                            <span>Exportar JSON</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteWorkbook(workbook.id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <IconTrash className="size-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History Section - Always show */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Conversaciones</span>
            {onCreateChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onCreateChat}
                    className="p-0.5 rounded hover:bg-muted transition-colors"
                    aria-label="Nueva conversación"
                  >
                    <IconPlus className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  hidden={isMobile}
                >
                  Nueva conversación
                </TooltipContent>
              </Tooltip>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.length === 0 ? (
                <div className="px-2 py-4 text-center group-data-[collapsible=icon]:hidden">
                  <IconMessage className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No hay conversaciones
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Inicia un chat con el asistente IA
                  </p>
                </div>
              ) : (
                recentChats.slice(0, 10).map((chat) => {
                  const isActive = chat.id === activeChatId

                  return (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        tooltip={chat.title}
                        onClick={() => onLoadChat?.(chat.id)}
                        isActive={isActive}
                      >
                        <IconMessage
                          className={
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }
                        />
                        <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
                          <span className="truncate text-sm">{chat.title}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(chat.updated_at)}
                          </span>
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger className="text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-1.5 right-1 aspect-square w-5 rounded-[calc(var(--radius-sm)-2px)] p-0 focus-visible:ring-2 flex items-center justify-center outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0">
                              <IconDotsVertical className="size-4" />
                              <span className="sr-only">Más opciones</span>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="center"
                            hidden={sidebarState !== 'collapsed' || isMobile}
                          >
                            Más opciones
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent
                          className="w-48 rounded-lg"
                          side="right"
                          align="start"
                        >
                          <DropdownMenuItem
                            onClick={() => onDeleteChat?.(chat.id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <IconTrash className="size-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserAccountMenu
              isSidebar
              showLabel
              darkMode={darkMode}
              onDarkModeToggle={onDarkModeToggle}
              onOpenSettings={onOpenSettings}
              onOpenProfile={onOpenProfile}
              onSignOut={onSignOut}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
