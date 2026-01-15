"use client"

import { useEffect, useRef, useState } from "react"
import { UniverDocsCorePreset } from "@univerjs/preset-docs-core"
import UniverPresetDocsCoreEnUS from "@univerjs/preset-docs-core/locales/en-US"
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets"
import "@univerjs/preset-docs-core/lib/index.css"

interface UniverDocProps {
  /** Optional initial data for the document */
  initialData?: Record<string, unknown>
  /** Optional callback when the univerAPI is ready */
  onReady?: (univerAPI: unknown) => void
  /** Optional custom class name */
  className?: string
  /** Dark mode */
  darkMode?: boolean
}

export function UniverDoc({
  initialData,
  onReady,
  className = "",
  darkMode = false,
}: UniverDocProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const univerAPIRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetDocsCoreEnUS),
      },
      darkMode,
      presets: [
        UniverDocsCorePreset({
          container: containerRef.current,
        }),
      ],
    })

    // Store the API reference
    univerAPIRef.current = univerAPI

    // Create a new document with initial data or empty
    if (initialData) {
      univerAPI.createUniverDoc(initialData)
    } else {
      univerAPI.createUniverDoc({})
    }

    setIsLoading(false)

    // Notify parent that API is ready
    if (onReady) {
      onReady(univerAPI)
    }

    // Cleanup on unmount
    return () => {
      univerAPI.dispose()
    }
  }, [darkMode, initialData, onReady])

  return (
    <div className={`relative h-full w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Cargando Editor...</span>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ minHeight: "500px" }}
      />
    </div>
  )
}
