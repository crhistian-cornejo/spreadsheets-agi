/**
 * TanStack AI Tool Definitions
 * Using toolDefinition() for isomorphic tool execution
 */

import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

// ============================================================================
// Tool Definitions (Isomorphic - can run on server or client)
// ============================================================================

/**
 * Create a new spreadsheet with title, columns, and initial data
 */
export const createSpreadsheetDef = toolDefinition({
  name: 'createSpreadsheet',
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
  outputSchema: z.object({
    success: z.boolean(),
    sheetId: z.string(),
    title: z.string(),
    columns: z.array(z.string()),
    rowCount: z.number(),
  }),
})

/**
 * Add or update data in specific cells
 */
export const addDataDef = toolDefinition({
  name: 'addData',
  description:
    'Add or update data in specific cells of the spreadsheet. Use Excel-style range notation.',
  inputSchema: z.object({
    range: z.string().describe('Cell range like A1, B2:C5, or A2:D10'),
    values: z
      .array(z.array(z.string()))
      .describe('2D array of values to insert, matching the range dimensions'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
    cellsUpdated: z.number(),
  }),
})

/**
 * Apply a formula to a specific cell
 */
export const applyFormulaDef = toolDefinition({
  name: 'applyFormula',
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
  outputSchema: z.object({
    success: z.boolean(),
    cell: z.string(),
    formula: z.string(),
  }),
})

/**
 * Sort spreadsheet data by column
 */
export const sortDataDef = toolDefinition({
  name: 'sortData',
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
  outputSchema: z.object({
    success: z.boolean(),
    column: z.string(),
    order: z.string(),
    rowsSorted: z.number(),
  }),
})

/**
 * Filter data by criteria
 */
export const filterDataDef = toolDefinition({
  name: 'filterData',
  description: 'Apply a filter to show only rows matching specific criteria',
  inputSchema: z.object({
    column: z.string().describe("Column letter to filter on (e.g., 'A', 'B')"),
    operator: z
      .enum(['equals', 'contains', 'greater_than', 'less_than', 'not_empty'])
      .describe('Filter operator type'),
    value: z
      .string()
      .optional()
      .describe('Value to compare against (not needed for not_empty)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    column: z.string(),
    matchingRows: z.number(),
  }),
})

/**
 * Format cells with styles
 */
export const formatCellsDef = toolDefinition({
  name: 'formatCells',
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
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
    stylesApplied: z.array(z.string()),
  }),
})

/**
 * Create a chart visualization
 */
export const createChartDef = toolDefinition({
  name: 'createChart',
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
  outputSchema: z.object({
    success: z.boolean(),
    chartId: z.string(),
    title: z.string(),
    type: z.string(),
  }),
})

/**
 * Insert a pivot table
 */
export const insertPivotTableDef = toolDefinition({
  name: 'insertPivotTable',
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
  outputSchema: z.object({
    success: z.boolean(),
    pivotId: z.string(),
    location: z.string(),
  }),
})

/**
 * Calculate statistics for a range
 */
export const calculateStatsDef = toolDefinition({
  name: 'calculateStats',
  description:
    'Calculate summary statistics (sum, average, min, max, count) for a range of data',
  inputSchema: z.object({
    range: z.string().describe('Data range to analyze like B2:B100'),
    metrics: z
      .array(z.enum(['sum', 'average', 'min', 'max', 'count']))
      .describe('Statistics to calculate'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
    results: z.record(z.string(), z.number()),
  }),
})

// ============================================================================
// Tool Types (inferred from definitions)
// ============================================================================

export type CreateSpreadsheetInput = z.infer<
  typeof createSpreadsheetDef.inputSchema
>
export type CreateSpreadsheetOutput = z.infer<
  typeof createSpreadsheetDef.outputSchema
>

export type AddDataInput = z.infer<typeof addDataDef.inputSchema>
export type AddDataOutput = z.infer<typeof addDataDef.outputSchema>

export type ApplyFormulaInput = z.infer<typeof applyFormulaDef.inputSchema>
export type ApplyFormulaOutput = z.infer<typeof applyFormulaDef.outputSchema>

export type SortDataInput = z.infer<typeof sortDataDef.inputSchema>
export type SortDataOutput = z.infer<typeof sortDataDef.outputSchema>

export type FilterDataInput = z.infer<typeof filterDataDef.inputSchema>
export type FilterDataOutput = z.infer<typeof filterDataDef.outputSchema>

export type FormatCellsInput = z.infer<typeof formatCellsDef.inputSchema>
export type FormatCellsOutput = z.infer<typeof formatCellsDef.outputSchema>

export type CreateChartInput = z.infer<typeof createChartDef.inputSchema>
export type CreateChartOutput = z.infer<typeof createChartDef.outputSchema>

export type InsertPivotTableInput = z.infer<
  typeof insertPivotTableDef.inputSchema
>
export type InsertPivotTableOutput = z.infer<
  typeof insertPivotTableDef.outputSchema
>

export type CalculateStatsInput = z.infer<typeof calculateStatsDef.inputSchema>
export type CalculateStatsOutput = z.infer<
  typeof calculateStatsDef.outputSchema
>

// ============================================================================
// Tool Names
// ============================================================================

export const SPREADSHEET_TOOL_NAMES = [
  'createSpreadsheet',
  'addData',
  'applyFormula',
  'sortData',
  'filterData',
  'formatCells',
  'createChart',
  'insertPivotTable',
  'calculateStats',
] as const

export type SpreadsheetToolName = (typeof SPREADSHEET_TOOL_NAMES)[number]

export function isSpreadsheetTool(
  toolName: string,
): toolName is SpreadsheetToolName {
  return SPREADSHEET_TOOL_NAMES.includes(toolName as SpreadsheetToolName)
}

// ============================================================================
// All Tool Definitions (for passing to chat)
// ============================================================================

export const spreadsheetToolDefs = [
  createSpreadsheetDef,
  addDataDef,
  applyFormulaDef,
  sortDataDef,
  filterDataDef,
  formatCellsDef,
  createChartDef,
  insertPivotTableDef,
  calculateStatsDef,
]
