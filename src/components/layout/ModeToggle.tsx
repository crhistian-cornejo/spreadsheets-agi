"use client"

import { IconEdit } from "@tabler/icons-react"
import { Logo } from "@/components/ui/Logo"

interface ModeToggleProps {
  mode: "native" | "ai-chat"
  onModeChange: (mode: "native" | "ai-chat") => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => onModeChange("native")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${mode === "native" 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <IconEdit className="h-4 w-4" />
        Native Mode
      </button>
      <button
        type="button"
        onClick={() => onModeChange("ai-chat")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${mode === "ai-chat" 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <Logo className="h-4 w-4" />
        AI Chat Mode
      </button>
    </div>
  )
}
