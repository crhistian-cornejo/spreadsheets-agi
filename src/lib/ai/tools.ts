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
// Row and Column Operations
// ============================================================================

/**
 * Insert rows at a specific position
 */
export const insertRowsDef = toolDefinition({
  name: 'insertRows',
  description:
    'Insert one or more empty rows at a specific position in the spreadsheet',
  inputSchema: z.object({
    startRow: z
      .number()
      .describe('Row number to insert at (1-based, like Excel)'),
    count: z.number().default(1).describe('Number of rows to insert'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    startRow: z.number(),
    rowsInserted: z.number(),
  }),
})

/**
 * Delete rows from the spreadsheet
 */
export const deleteRowsDef = toolDefinition({
  name: 'deleteRows',
  description: 'Delete one or more rows from the spreadsheet',
  inputSchema: z.object({
    startRow: z.number().describe('First row to delete (1-based)'),
    count: z.number().default(1).describe('Number of rows to delete'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    startRow: z.number(),
    rowsDeleted: z.number(),
  }),
})

/**
 * Insert columns at a specific position
 */
export const insertColumnsDef = toolDefinition({
  name: 'insertColumns',
  description: 'Insert one or more empty columns at a specific position',
  inputSchema: z.object({
    startColumn: z
      .string()
      .describe("Column letter to insert at (e.g., 'B', 'C')"),
    count: z.number().default(1).describe('Number of columns to insert'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    startColumn: z.string(),
    columnsInserted: z.number(),
  }),
})

/**
 * Delete columns from the spreadsheet
 */
export const deleteColumnsDef = toolDefinition({
  name: 'deleteColumns',
  description: 'Delete one or more columns from the spreadsheet',
  inputSchema: z.object({
    startColumn: z
      .string()
      .describe("First column letter to delete (e.g., 'B')"),
    count: z.number().default(1).describe('Number of columns to delete'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    startColumn: z.string(),
    columnsDeleted: z.number(),
  }),
})

/**
 * Resize column width
 */
export const resizeColumnDef = toolDefinition({
  name: 'resizeColumn',
  description: 'Change the width of one or more columns',
  inputSchema: z.object({
    column: z.string().describe("Column letter to resize (e.g., 'A', 'B')"),
    width: z.number().describe('New width in pixels (typical range: 50-300)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    column: z.string(),
    width: z.number(),
  }),
})

/**
 * Resize row height
 */
export const resizeRowDef = toolDefinition({
  name: 'resizeRow',
  description: 'Change the height of one or more rows',
  inputSchema: z.object({
    row: z.number().describe('Row number to resize (1-based)'),
    height: z.number().describe('New height in pixels (typical range: 20-100)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    row: z.number(),
    height: z.number(),
  }),
})

// ============================================================================
// Cell Merge Operations
// ============================================================================

/**
 * Merge cells into one
 */
export const mergeCellsDef = toolDefinition({
  name: 'mergeCells',
  description:
    'Merge a range of cells into a single cell. The top-left cell value is preserved.',
  inputSchema: z.object({
    range: z.string().describe("Cell range to merge (e.g., 'A1:C1', 'B2:D5')"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
    cellsMerged: z.number(),
  }),
})

/**
 * Unmerge cells
 */
export const unmergeCellsDef = toolDefinition({
  name: 'unmergeCells',
  description: 'Unmerge previously merged cells back to individual cells',
  inputSchema: z.object({
    range: z.string().describe("Cell range to unmerge (e.g., 'A1:C1')"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
  }),
})

// ============================================================================
// Data Validation
// ============================================================================

/**
 * Add data validation to cells
 */
export const addDataValidationDef = toolDefinition({
  name: 'addDataValidation',
  description:
    'Add data validation rules to cells (dropdown lists, number ranges, etc.)',
  inputSchema: z.object({
    range: z.string().describe("Cell range to validate (e.g., 'B2:B100')"),
    validationType: z
      .enum(['list', 'number', 'date', 'textLength', 'custom'])
      .describe('Type of validation'),
    options: z
      .object({
        listItems: z
          .array(z.string())
          .optional()
          .describe("For 'list' type: allowed values"),
        min: z
          .number()
          .optional()
          .describe("For 'number' or 'textLength': minimum value"),
        max: z
          .number()
          .optional()
          .describe("For 'number' or 'textLength': maximum value"),
        customFormula: z
          .string()
          .optional()
          .describe("For 'custom' type: validation formula"),
        allowBlank: z
          .boolean()
          .optional()
          .default(true)
          .describe('Allow empty cells'),
        showDropdown: z
          .boolean()
          .optional()
          .default(true)
          .describe("For 'list': show dropdown arrow"),
      })
      .describe('Validation options based on type'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
    validationType: z.string(),
  }),
})

// ============================================================================
// Conditional Formatting
// ============================================================================

/**
 * Apply conditional formatting
 */
export const addConditionalFormatDef = toolDefinition({
  name: 'addConditionalFormat',
  description:
    'Apply conditional formatting to highlight cells based on their values',
  inputSchema: z.object({
    range: z.string().describe("Cell range to format (e.g., 'B2:B100')"),
    ruleType: z
      .enum([
        'greaterThan',
        'lessThan',
        'between',
        'equalTo',
        'textContains',
        'duplicates',
        'top10',
        'colorScale',
        'dataBar',
      ])
      .describe('Type of conditional format rule'),
    condition: z
      .object({
        value: z
          .union([z.string(), z.number()])
          .optional()
          .describe('Comparison value'),
        value2: z
          .union([z.string(), z.number()])
          .optional()
          .describe("Second value for 'between' rule"),
        text: z
          .string()
          .optional()
          .describe("Text to match for 'textContains'"),
      })
      .optional()
      .describe('Condition parameters'),
    format: z
      .object({
        backgroundColor: z
          .string()
          .optional()
          .describe('Background color when condition is met'),
        textColor: z
          .string()
          .optional()
          .describe('Text color when condition is met'),
        bold: z.boolean().optional().describe('Make text bold'),
      })
      .describe('Format to apply when condition is met'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    range: z.string(),
    ruleType: z.string(),
  }),
})

// ============================================================================
// Document Tools (UniverDoc)
// ============================================================================

/**
 * Create a new document
 */
export const createDocumentDef = toolDefinition({
  name: 'createDocument',
  description: 'Create a new text document with content and formatting',
  inputSchema: z.object({
    title: z.string().describe('Document title'),
    content: z.string().describe('Initial text content for the document'),
    styles: z
      .object({
        fontSize: z.number().optional().default(12).describe('Base font size'),
        fontFamily: z
          .string()
          .optional()
          .default('Arial')
          .describe('Font family'),
      })
      .optional()
      .describe('Default document styles'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    docId: z.string(),
    title: z.string(),
  }),
})

/**
 * Insert text into document
 */
export const insertTextDef = toolDefinition({
  name: 'insertText',
  description: 'Insert text at a specific position in the document',
  inputSchema: z.object({
    text: z.string().describe('Text to insert'),
    position: z
      .enum(['start', 'end', 'cursor'])
      .default('end')
      .describe('Where to insert the text'),
    style: z
      .object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        fontSize: z.number().optional(),
        color: z.string().optional().describe('Text color in hex'),
      })
      .optional()
      .describe('Text formatting'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    charactersInserted: z.number(),
  }),
})

/**
 * Add heading to document
 */
export const addHeadingDef = toolDefinition({
  name: 'addHeading',
  description: 'Add a heading (H1, H2, H3, etc.) to the document',
  inputSchema: z.object({
    text: z.string().describe('Heading text'),
    level: z
      .enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
      .describe('Heading level'),
    position: z
      .enum(['start', 'end'])
      .default('end')
      .describe('Where to add the heading'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    level: z.string(),
  }),
})

/**
 * Add list to document
 */
export const addListDef = toolDefinition({
  name: 'addList',
  description: 'Add a bulleted or numbered list to the document',
  inputSchema: z.object({
    items: z.array(z.string()).describe('List items'),
    listType: z.enum(['bullet', 'numbered']).describe('Type of list'),
    position: z
      .enum(['start', 'end'])
      .default('end')
      .describe('Where to add the list'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    itemsAdded: z.number(),
    listType: z.string(),
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

// Row/Column operations
export type InsertRowsInput = z.infer<typeof insertRowsDef.inputSchema>
export type InsertRowsOutput = z.infer<typeof insertRowsDef.outputSchema>
export type DeleteRowsInput = z.infer<typeof deleteRowsDef.inputSchema>
export type DeleteRowsOutput = z.infer<typeof deleteRowsDef.outputSchema>
export type InsertColumnsInput = z.infer<typeof insertColumnsDef.inputSchema>
export type InsertColumnsOutput = z.infer<typeof insertColumnsDef.outputSchema>
export type DeleteColumnsInput = z.infer<typeof deleteColumnsDef.inputSchema>
export type DeleteColumnsOutput = z.infer<typeof deleteColumnsDef.outputSchema>
export type ResizeColumnInput = z.infer<typeof resizeColumnDef.inputSchema>
export type ResizeColumnOutput = z.infer<typeof resizeColumnDef.outputSchema>
export type ResizeRowInput = z.infer<typeof resizeRowDef.inputSchema>
export type ResizeRowOutput = z.infer<typeof resizeRowDef.outputSchema>

// Merge operations
export type MergeCellsInput = z.infer<typeof mergeCellsDef.inputSchema>
export type MergeCellsOutput = z.infer<typeof mergeCellsDef.outputSchema>
export type UnmergeCellsInput = z.infer<typeof unmergeCellsDef.inputSchema>
export type UnmergeCellsOutput = z.infer<typeof unmergeCellsDef.outputSchema>

// Data validation
export type AddDataValidationInput = z.infer<
  typeof addDataValidationDef.inputSchema
>
export type AddDataValidationOutput = z.infer<
  typeof addDataValidationDef.outputSchema
>

// Conditional formatting
export type AddConditionalFormatInput = z.infer<
  typeof addConditionalFormatDef.inputSchema
>
export type AddConditionalFormatOutput = z.infer<
  typeof addConditionalFormatDef.outputSchema
>

// Document tools
export type CreateDocumentInput = z.infer<typeof createDocumentDef.inputSchema>
export type CreateDocumentOutput = z.infer<
  typeof createDocumentDef.outputSchema
>
export type InsertTextInput = z.infer<typeof insertTextDef.inputSchema>
export type InsertTextOutput = z.infer<typeof insertTextDef.outputSchema>
export type AddHeadingInput = z.infer<typeof addHeadingDef.inputSchema>
export type AddHeadingOutput = z.infer<typeof addHeadingDef.outputSchema>
export type AddListInput = z.infer<typeof addListDef.inputSchema>
export type AddListOutput = z.infer<typeof addListDef.outputSchema>

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
  // Row/Column operations
  'insertRows',
  'deleteRows',
  'insertColumns',
  'deleteColumns',
  'resizeColumn',
  'resizeRow',
  // Merge operations
  'mergeCells',
  'unmergeCells',
  // Data validation
  'addDataValidation',
  // Conditional formatting
  'addConditionalFormat',
  // Document tools
  'createDocument',
  'insertText',
  'addHeading',
  'addList',
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
  // Core spreadsheet
  createSpreadsheetDef,
  addDataDef,
  applyFormulaDef,
  sortDataDef,
  filterDataDef,
  formatCellsDef,
  createChartDef,
  insertPivotTableDef,
  calculateStatsDef,
  // Row/Column operations
  insertRowsDef,
  deleteRowsDef,
  insertColumnsDef,
  deleteColumnsDef,
  resizeColumnDef,
  resizeRowDef,
  // Merge operations
  mergeCellsDef,
  unmergeCellsDef,
  // Data validation
  addDataValidationDef,
  // Conditional formatting
  addConditionalFormatDef,
  // Document tools
  createDocumentDef,
  insertTextDef,
  addHeadingDef,
  addListDef,
]
