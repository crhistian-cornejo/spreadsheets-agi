import { 
  IconTable, 
  IconFileText, 
  IconPresentation, 
  IconPlus,
  IconFolderOpen,
  IconSettings,
  IconMoon,
  IconSun,
  IconChevronsDown,
} from "@tabler/icons-react"
import { Logo } from "@/components/ui/Logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  currentApp: "sheets" | "docs" | "slides"
  onAppChange: (app: "sheets" | "docs" | "slides") => void
  darkMode: boolean
  onDarkModeToggle: () => void
}

const apps = [
  { id: "sheets" as const, name: "Sheets", icon: IconTable, color: "text-emerald-500" },
  { id: "docs" as const, name: "Docs", icon: IconFileText, color: "text-blue-500" },
  { id: "slides" as const, name: "Slides", icon: IconPresentation, color: "text-amber-500", disabled: true },
]

const recentFiles = [
  { id: "1", name: "Budget 2026", type: "sheets", updatedAt: "hace 2 horas" },
  { id: "2", name: "Proyecto Propuesta", type: "docs", updatedAt: "ayer" },
  { id: "3", name: "Inventario Q1", type: "sheets", updatedAt: "hace 3 días" },
]

export function AppSidebar({ 
  currentApp, 
  onAppChange, 
  darkMode, 
  onDarkModeToggle 
}: AppSidebarProps) {
  const currentAppData = apps.find(app => app.id === currentApp)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Logo className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-primary">S-AGI</span>
                    <span className="truncate text-xs">Spreadsheets Plus</span>
                  </div>
                  <IconChevronsDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
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
                  <DropdownMenuItem className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <IconPlus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add App</div>
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
              <SidebarMenuButton tooltip={`Nuevo ${currentAppData?.name === "Sheets" ? "Spreadsheet" : "Documento"}`}>
                <IconPlus />
                <span>Nuevo {currentAppData?.name === "Sheets" ? "Spreadsheet" : "Documento"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Abrir archivo">
                <IconFolderOpen />
                <span>Abrir archivo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Archivos Recientes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentFiles.map((file) => {
                const FileIcon = file.type === "sheets" ? IconTable : IconFileText
                const iconColor = file.type === "sheets" ? "text-emerald-500" : "text-blue-500"
                
                return (
                  <SidebarMenuItem key={file.id}>
                    <SidebarMenuButton tooltip={file.name}>
                      <FileIcon className={iconColor} />
                      <div className="flex flex-col">
                        <span className="truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">{file.updatedAt}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onDarkModeToggle} tooltip={darkMode ? "Modo Claro" : "Modo Oscuro"}>
              {darkMode ? <IconSun /> : <IconMoon />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Configuración">
              <IconSettings />
              <span>Configuración</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
