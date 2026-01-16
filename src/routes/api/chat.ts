/**
 * Chat API Route using TanStack AI
 * Uses chat() + toServerSentEventsResponse() for streaming
 */

import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { spreadsheetToolDefs } from '@/lib/ai/tools'

// System prompt for the spreadsheet AI assistant
const SYSTEM_PROMPT = `Eres S-AGI, un asistente experto en hojas de cálculo y análisis de datos. Tu trabajo es ayudar a los usuarios a crear, editar, visualizar y analizar datos en spreadsheets.

IMPORTANTE: Tienes herramientas que ejecutan acciones DIRECTAMENTE en la hoja de cálculo del usuario. Cuando uses una herramienta, la acción se ejecutará inmediatamente.

## Tus Capacidades:
- **createSpreadsheet**: Crear nuevas hojas de cálculo con columnas y datos
- **addData**: Agregar datos a celdas específicas
- **applyFormula**: Aplicar fórmulas (SUM, AVERAGE, IF, COUNT, etc.)
- **formatCells**: Dar formato visual (negrita, colores, alineación)
- **sortData**: Ordenar datos por columna
- **filterData**: Filtrar datos por criterios
- **createChart**: Crear gráficos de visualización
- **insertPivotTable**: Crear tablas dinámicas
- **calculateStats**: Calcular estadísticas

## Instrucciones:
1. Cuando el usuario pida crear datos, USA la herramienta createSpreadsheet con datos reales y relevantes
2. Para datos de ventas, crea al menos 12 filas (una por mes) con valores numéricos realistas
3. Después de crear datos, SIEMPRE sugiere posibles análisis o fórmulas
4. Responde SIEMPRE en español de forma concisa y profesional
5. Describe brevemente lo que has hecho después de usar una herramienta

## Ejemplo de uso de createSpreadsheet:
Para "crea datos de ventas mensuales", usa:
{
  "title": "Ventas Mensuales 2024",
  "columns": ["Mes", "Producto A", "Producto B", "Total"],
  "rows": [
    ["Enero", "15000", "12000", "27000"],
    ["Febrero", "18000", "14000", "32000"],
    ...
  ]
}`

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.log('[Chat API] Request received')

        // Validate API key
        if (!process.env.OPENAI_API_KEY) {
          console.error('[Chat API] OPENAI_API_KEY not configured')
          return new Response(
            JSON.stringify({
              error: 'API key not configured',
              message:
                'Please set OPENAI_API_KEY in your environment variables',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }

        try {
          const body = await request.json()
          const { messages, conversationId } = body

          console.log('[Chat API] Messages count:', messages?.length || 0)

          if (!messages || messages.length === 0) {
            return new Response(
              JSON.stringify({ error: 'No messages provided' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // Create streaming chat with TanStack AI
          // Tools are passed as definitions - client will execute them
          const stream = chat({
            adapter: openaiText('gpt-5-nano-2025-08-07'),
            messages,
            systemPrompts: [SYSTEM_PROMPT],
            tools: spreadsheetToolDefs,
            conversationId,
          })

          console.log('[Chat API] Stream created, returning SSE response')

          // Convert to Server-Sent Events response
          return toServerSentEventsResponse(stream)
        } catch (error) {
          console.error('[Chat API] Error:', error)

          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          const isAuthError =
            errorMessage.includes('401') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('API key')

          return new Response(
            JSON.stringify({
              error: isAuthError
                ? 'Invalid API key'
                : 'Error processing chat request',
              message: errorMessage,
            }),
            {
              status: isAuthError ? 401 : 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
