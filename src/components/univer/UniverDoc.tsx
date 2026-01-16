"use client"

import { useEffect, useRef, useState } from "react"
import { BooleanNumber } from "@univerjs/core"
import { UniverDocsCorePreset } from "@univerjs/preset-docs-core"
import UniverPresetDocsCoreEnUS from "@univerjs/preset-docs-core/locales/en-US"
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets"
import "@univerjs/preset-docs-core/lib/index.css"

// ============================================================================
// Default Document Data - "How to Use" Guide
// ============================================================================

// Helper to create the dataStream with proper indexing
const DEFAULT_DOC_CONTENT = `Bienvenido a S-AGI Docs
Tu editor de documentos inteligente

Este es tu espacio para crear documentos profesionales con la potencia de la inteligencia artificial. A continuación te mostramos las principales características disponibles.

Formato de Texto
Puedes aplicar diferentes estilos a tu texto: negrita, cursiva, subrayado, y combinaciones de estos. También puedes cambiar el tamaño de fuente y el color del texto.

Encabezados y Estructura
Organiza tu documento usando diferentes niveles de encabezados. Los encabezados ayudan a crear una jerarquía visual clara y mejoran la legibilidad.

Listas
Crea listas ordenadas y no ordenadas para organizar información:
• Primer elemento de la lista
• Segundo elemento con más detalles
• Tercer elemento importante

Párrafos y Espaciado
Cada párrafo se separa automáticamente con el espaciado adecuado. Puedes ajustar los márgenes y la alineación según tus necesidades.

Asistente IA
Usa el panel de IA a la derecha para obtener ayuda con tu documento. Puedes pedirle que:
• Mejore la redacción
• Corrija errores ortográficos
• Sugiera contenido adicional
• Traduzca texto

¡Comienza a escribir tu documento ahora!
`

// Build document data structure
const buildDefaultDocument = () => {
  // Calculate positions for styling
  const lines = DEFAULT_DOC_CONTENT.split('\n')
  let currentPos = 0
  const positions: { text: string; start: number; end: number }[] = []

  for (const line of lines) {
    positions.push({
      text: line,
      start: currentPos,
      end: currentPos + line.length,
    })
    currentPos += line.length + 1 // +1 for \r
  }

  // Create dataStream with \r instead of \n
  const dataStream = DEFAULT_DOC_CONTENT.replace(/\n/g, '\r') + '\0'

  return {
    id: 'doc-default-guide',
    body: {
      dataStream,
      textRuns: [
        // Title - "Bienvenido a S-AGI Docs"
        {
          st: positions[0].start,
          ed: positions[0].end,
          ts: {
            fs: 28,
            bl: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(59, 130, 246)' }, // blue-500
          },
        },
        // Subtitle - "Tu editor de documentos inteligente"
        {
          st: positions[1].start,
          ed: positions[1].end,
          ts: {
            fs: 16,
            it: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(107, 114, 128)' }, // gray-500
          },
        },
        // Intro paragraph
        {
          st: positions[3].start,
          ed: positions[3].end,
          ts: { fs: 12 },
        },
        // Section: "Formato de Texto"
        {
          st: positions[5].start,
          ed: positions[5].end,
          ts: {
            fs: 18,
            bl: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(16, 185, 129)' }, // emerald-500
          },
        },
        // Content paragraph
        {
          st: positions[6].start,
          ed: positions[6].end,
          ts: { fs: 12 },
        },
        // Section: "Encabezados y Estructura"
        {
          st: positions[8].start,
          ed: positions[8].end,
          ts: {
            fs: 18,
            bl: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(16, 185, 129)' },
          },
        },
        // Content
        {
          st: positions[9].start,
          ed: positions[9].end,
          ts: { fs: 12 },
        },
        // Section: "Listas"
        {
          st: positions[11].start,
          ed: positions[11].end,
          ts: {
            fs: 18,
            bl: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(16, 185, 129)' },
          },
        },
        // List intro
        {
          st: positions[12].start,
          ed: positions[12].end,
          ts: { fs: 12 },
        },
        // List items
        {
          st: positions[13].start,
          ed: positions[15].end,
          ts: { fs: 12 },
        },
        // Section: "Párrafos y Espaciado"
        {
          st: positions[17].start,
          ed: positions[17].end,
          ts: {
            fs: 18,
            bl: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(16, 185, 129)' },
          },
        },
        // Content
        {
          st: positions[18].start,
          ed: positions[18].end,
          ts: { fs: 12 },
        },
        // Section: "Asistente IA"
        {
          st: positions[20].start,
          ed: positions[20].end,
          ts: {
            fs: 18,
            bl: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(139, 92, 246)' }, // violet-500
          },
        },
        // AI intro
        {
          st: positions[21].start,
          ed: positions[21].end,
          ts: { fs: 12 },
        },
        // AI list items
        {
          st: positions[22].start,
          ed: positions[25].end,
          ts: { fs: 12 },
        },
        // Final CTA
        {
          st: positions[27].start,
          ed: positions[27].end,
          ts: {
            fs: 14,
            bl: BooleanNumber.TRUE,
            it: BooleanNumber.TRUE,
            cl: { rgb: 'rgb(59, 130, 246)' },
          },
        },
      ],
      paragraphs: positions.map((pos, _idx) => ({
        startIndex: pos.start,
      })),
    },
    documentStyle: {
      pageSize: {
        width: 816, // Letter width in points (8.5 inches)
        height: 1056, // Letter height in points (11 inches)
      },
      marginTop: 72,
      marginBottom: 72,
      marginLeft: 90,
      marginRight: 90,
      renderConfig: {
        vertexAngle: 0,
        centerAngle: 0,
      },
    },
  }
}

// ============================================================================
// Component
// ============================================================================

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
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return
    isInitializedRef.current = true

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

    // Create a new document with initial data or default guide
    const docData = initialData || buildDefaultDocument()
    univerAPI.createUniverDoc(docData)

    setIsLoading(false)

    // Notify parent that API is ready
    if (onReady) {
      onReady(univerAPI)
    }

    // Cleanup on unmount
    return () => {
      isInitializedRef.current = false
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
