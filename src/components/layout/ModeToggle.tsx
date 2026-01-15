"use client"

import { IconEdit } from "@tabler/icons-react"
import { Logo } from "@/components/ui/Logo"

interface ModeToggleProps {
  mode: "native" | "ai-chat"
  onModeChange: (mode: "native" | "ai-chat") => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted/50 p-0.5">
      <button
        type="button"
        onClick={() => onModeChange("native")}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200
          ${mode === "native"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <IconEdit className="h-3.5 w-3.5" />
        <span>Native</span>
      </button>
      <button
        type="button"
        onClick={() => onModeChange("ai-chat")}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200
          ${mode === "ai-chat"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <Logo className="h-3.5 w-3.5" />
        <span>AI Chat</span>
      </button>
    </div>
  )
}
