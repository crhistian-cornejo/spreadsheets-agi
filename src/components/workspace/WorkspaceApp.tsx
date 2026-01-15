"use client"

import * as React from "react"
import { AppSidebar, ModeToggle } from "@/components/layout"
import { AIChatMode, NativeMode } from "@/components/workspace"
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
import { IconSettings, IconUser, IconLogout, IconCreditCard, IconBell, IconMoon, IconSun } from "@tabler/icons-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function WorkspaceApp() {
  const [currentApp, setCurrentApp] = React.useState<"sheets" | "docs" | "slides">("sheets")
  const [mode, setMode] = React.useState<"native" | "ai-chat">("native")
  const [darkMode, setDarkMode] = React.useState(false)
  const [artifactData, setArtifactData] = React.useState<Record<string, unknown> | undefined>()
  const [isAIChatPanelOpen, setIsAIChatPanelOpen] = React.useState(false)

  // Handle dark mode toggle
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const handleSwitchToNative = (data: Record<string, unknown>) => {
    setArtifactData(data)
    setMode("native")
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        {mode === "ai-chat" && (
          <AppSidebar 
            currentApp={currentApp}
            onAppChange={setCurrentApp}
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(!darkMode)}
          />
        )}

        <SidebarInset className="flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 border-b border-border flex shrink-0 items-center justify-between px-4 bg-background">
            <div className="flex items-center gap-2">
              {mode === "ai-chat" && <SidebarTrigger className="-ml-1" />}
              {mode === "ai-chat" && <Separator orientation="vertical" className="mr-2 h-4" />}
              <h1 className="font-semibold">
                {currentApp === "sheets" && "Spreadsheet"}
                {currentApp === "docs" && "Document"}
                {currentApp === "slides" && "Presentation"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <ModeToggle mode={mode} onModeChange={setMode} />
              
              {mode === "native" && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsAIChatPanelOpen(!isAIChatPanelOpen)}
                      className={`p-2 rounded-md hover:bg-accent transition-colors ${isAIChatPanelOpen ? 'bg-accent text-primary' : 'text-muted-foreground'}`}
                      title="Asistente IA"
                    >
                      <Logo className="size-5" />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <button 
                          type="button"
                          className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors" 
                          title="Configuración"
                        >
                          <IconSettings className="size-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Configuración</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <IconSettings className="size-4" /> General
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <IconBell className="size-4" /> Notificaciones
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <IconCreditCard className="size-4" /> Suscripción
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
                            {darkMode ? "Modo Claro" : "Modo Oscuro"}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
                          CP
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <IconUser className="size-4" /> Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                            <IconLogout className="size-4" /> Cerrar Sesión
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-hidden relative">
            {mode === "native" ? (
              <NativeMode 
                darkMode={darkMode} 
                initialData={artifactData}
                isPanelOpen={isAIChatPanelOpen}
                onPanelChange={setIsAIChatPanelOpen}
              />
            ) : (
              <AIChatMode 
                darkMode={darkMode}
                onSwitchToNative={handleSwitchToNative}
              />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
