import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
  convertToModelMessages,
  streamText,
  tool,
} from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

// Configure OpenAI - uses OPENAI_API_KEY env var by default
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define spreadsheet tools - NO execute functions!
// These will be executed on the client side via onToolCall
const tools = {
  // Create a new spreadsheet with initial data
  // NO execute function - handled client-side via onToolCall
  createSpreadsheet: tool({
    description:
      'Create a new spreadsheet with a title, column headers, and initial data rows. Use this tool when the user asks to create a table, spreadsheet, or dataset.',
    inputSchema: z.object({
      title: z.string().describe('The title/name for the spreadsheet'),
      columns: z
        .array(z.string())
        .describe(
          "Column headers for the spreadsheet (e.g., ['Nombre', 'Edad', 'Ciudad'])",
        ),
      rows: z
        .array(z.array(z.string()))
        .optional()
        .describe(
          'Initial data rows as 2D array. Each inner array is a row matching the columns order.',
        ),
    }),
  }),

  // Add data to cells
  // NO execute function - handled client-side via onToolCall
  addData: tool({
    description:
      'Add or update data in specific cells of the spreadsheet. Use Excel-style range notation.',
    inputSchema: z.object({
      range: z.string().describe('Cell range like A1, B2:C5, or A2:D10'),
      values: z
        .array(z.array(z.string()))
        .describe(
          '2D array of values to insert, matching the range dimensions',
        ),
    }),
  }),

  // Apply formula
  // NO execute function - handled client-side via onToolCall
  applyFormula: tool({
    description:
      'Apply a formula to a specific cell. The formula will be calculated automatically.',
    inputSchema: z.object({
      cell: z.string().describe('Target cell reference like C10, B5, etc.'),
      formula: z
        .string()
        .describe(
          "Excel-style formula starting with =, like =SUM(A1:A10), =AVERAGE(B:B), =IF(A1>10,'Yes','No'), =COUNT(A:A)",
        ),
    }),
  }),

  // Sort data
  // NO execute function - handled client-side via onToolCall
  sortData: tool({
    description:
      'Sort spreadsheet data by a specific column in ascending or descending order',
    inputSchema: z.object({
      column: z
        .string()
        .describe("Column letter to sort by (e.g., 'A', 'B', 'C')"),
      order: z
        .enum(['asc', 'desc'])
        .describe("Sort order: 'asc' for ascending, 'desc' for descending"),
      range: z
        .string()
        .optional()
        .describe('Optional range to sort, defaults to all data'),
    }),
  }),

  // Filter data
  // NO execute function - handled client-side via onToolCall
  filterData: tool({
    description: 'Apply a filter to show only rows matching specific criteria',
    inputSchema: z.object({
      column: z
        .string()
        .describe("Column letter to filter on (e.g., 'A', 'B')"),
      operator: z
        .enum(['equals', 'contains', 'greater_than', 'less_than', 'not_empty'])
        .describe('Filter operator type'),
      value: z
        .string()
        .optional()
        .describe('Value to compare against (not needed for not_empty)'),
    }),
  }),

  // Format cells
  // NO execute function - handled client-side via onToolCall
  formatCells: tool({
    description:
      'Apply visual formatting to cells (bold, colors, alignment). Great for headers and highlighting important data.',
    inputSchema: z.object({
      range: z
        .string()
        .describe('Cell range to format like A1:B5, A1:A1 for single cell'),
      style: z
        .object({
          bold: z.boolean().optional().describe('Make text bold'),
          italic: z.boolean().optional().describe('Make text italic'),
          textColor: z
            .string()
            .optional()
            .describe('Hex color for text like #FF0000 for red'),
          backgroundColor: z
            .string()
            .optional()
            .describe('Hex color for cell background like #FFFF00 for yellow'),
          alignment: z
            .enum(['left', 'center', 'right'])
            .optional()
            .describe('Text horizontal alignment'),
        })
        .describe('Style properties to apply to the range'),
    }),
  }),

  // Create Chart
  // NO execute function - handled client-side via onToolCall
  createChart: tool({
    description:
      'Create a chart visualization (bar, line, pie, etc.) from spreadsheet data to visualize trends and comparisons',
    inputSchema: z.object({
      title: z.string().describe('Title of the chart'),
      type: z
        .enum(['bar', 'line', 'pie', 'area', 'column', 'scatter'])
        .describe('Type of chart to create'),
      dataRange: z
        .string()
        .describe("Range of data to visualize (e.g., 'A1:B10')"),
      xAxisColumn: z
        .string()
        .optional()
        .describe("Column for X-axis labels (e.g., 'A')"),
      seriesColumns: z
        .array(z.string())
        .optional()
        .describe("Columns for data series (e.g., ['B', 'C'])"),
    }),
  }),

  // Insert Pivot Table
  // NO execute function - handled client-side via onToolCall
  insertPivotTable: tool({
    description:
      'Analyze data by creating a pivot table for aggregation and summary statistics',
    inputSchema: z.object({
      sourceRange: z.string().describe("Source data range (e.g., 'A1:D100')"),
      targetCell: z
        .string()
        .describe("Where to place the pivot table (e.g., 'F1')"),
      rows: z.array(z.string()).describe('Columns to use for grouping rows'),
      columns: z
        .array(z.string())
        .optional()
        .describe('Columns to use for grouping columns'),
      values: z
        .array(
          z.object({
            column: z.string(),
            summarizeBy: z
              .enum(['SUM', 'COUNT', 'AVERAGE', 'MAX', 'MIN'])
              .default('SUM'),
          }),
        )
        .describe('Values to aggregate with summary function'),
    }),
  }),

  // Calculate statistics
  // NO execute function - handled client-side via onToolCall
  calculateStats: tool({
    description:
      'Calculate summary statistics (sum, average, min, max, count) for a range of data',
    inputSchema: z.object({
      range: z.string().describe('Data range to analyze like B2:B100'),
      metrics: z
        .array(z.enum(['sum', 'average', 'min', 'max', 'count']))
        .describe('Statistics to calculate'),
    }),
  }),
} satisfies ToolSet

export type ChatTools = InferUITools<typeof tools>

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>

// System prompt for the spreadsheet AI assistant
const systemPrompt = `Eres S-AGI, un asistente experto en hojas de cálculo y análisis de datos. Tu trabajo es ayudar a los usuarios a crear, editar, visualizar y analizar datos en spreadsheets.

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

// API handler for TanStack Start
export async function POST(request: Request) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Chat API] OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({
          error: 'API key not configured',
          message: 'Please set OPENAI_API_KEY in your environment variables',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await request.json()
    const { messages }: { messages: ChatMessage[] } = body

    console.log('[Chat API] Received', messages?.length || 0, 'messages')

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
    })

    return result.toUIMessageStreamResponse({
      sendStart: true,
      sendFinish: true,
    })
  } catch (error) {
    console.error('[Chat API] Error:', error)

    // Check for specific OpenAI errors
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
}
