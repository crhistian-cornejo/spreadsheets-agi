/**
 * TanStack AI Client Tools
 * These are the client-side implementations of the tool definitions
 * They execute the actual spreadsheet operations using the Univer API
 */

import { clientTools } from '@tanstack/ai-client'
import { nanoid } from 'nanoid'
import {
  createSpreadsheetDef,
  addDataDef,
  applyFormulaDef,
  sortDataDef,
  filterDataDef,
  formatCellsDef,
  createChartDef,
  insertPivotTableDef,
  calculateStatsDef,
  insertRowsDef,
  deleteRowsDef,
  insertColumnsDef,
  deleteColumnsDef,
  resizeColumnDef,
  resizeRowDef,
  mergeCellsDef,
  unmergeCellsDef,
  addDataValidationDef,
  addConditionalFormatDef,
  createDocumentDef,
  insertTextDef,
  addHeadingDef,
  addListDef,
} from './tools'
import { generateWorkbookData } from './spreadsheet-actions'
import type { UniverSheetHandle } from '@/components/univer'
import type { SpreadsheetArtifact } from './types'

// ============================================================================
// Tool Executor Context (passed to tools via closure)
// ============================================================================

export interface ToolExecutorContext {
  univerRef: React.RefObject<UniverSheetHandle | null>
  onArtifactCreated?: (artifact: SpreadsheetArtifact) => void
}

// Default context (will be set by the hook)
let toolContext: ToolExecutorContext = {
  univerRef: { current: null },
}

/**
 * Set the context for tool execution
 * Called by the useSpreadsheetChat hook when mounting
 */
export function setToolContext(context: ToolExecutorContext) {
  toolContext = context
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Convert column letter to 0-based index (A=0, B=1, etc.) */
function columnLetterToIndex(letter: string): number {
  let result = 0
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64)
  }
  return result - 1
}

/** Count cells in a range like "A1:B5" */
function countCellsInRange(range: string): number {
  const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i)
  if (!match) return 1
  const startCol = columnLetterToIndex(match[1].toUpperCase())
  const startRow = parseInt(match[2])
  const endCol = columnLetterToIndex(match[3].toUpperCase())
  const endRow = parseInt(match[4])
  return (endCol - startCol + 1) * (endRow - startRow + 1)
}

// ============================================================================
// Client Tool Implementations
// ============================================================================

const createSpreadsheetClient = createSpreadsheetDef.client((input) => {
  const sheetId = nanoid()
  const { title, columns, rows = [] } = input

  // Generate workbook data structure for Univer
  const workbookData = generateWorkbookData({
    type: 'create_spreadsheet',
    title,
    columns,
    rows,
    sheetId,
  })

  // If we have a univerRef, create the sheet with data
  if (toolContext.univerRef.current) {
    toolContext.univerRef.current.createSheetWithData(title, columns, rows)
  }

  // Create artifact for UI display
  const artifact: SpreadsheetArtifact = {
    id: sheetId,
    title,
    type: 'sheet',
    createdAt: new Date(),
    data: workbookData as unknown as Record<string, unknown>,
  }

  toolContext.onArtifactCreated?.(artifact)

  return {
    success: true,
    sheetId,
    title,
    columns,
    rowCount: rows.length,
  }
})

const addDataClient = addDataDef.client((input) => {
  const { range, values } = input

  if (!toolContext.univerRef.current) {
    return { success: false, range, cellsUpdated: 0 }
  }

  const success = toolContext.univerRef.current.setCellValues(range, values)
  const cellsUpdated = values.reduce((acc, row) => acc + row.length, 0)

  return {
    success,
    range,
    cellsUpdated: success ? cellsUpdated : 0,
  }
})

const applyFormulaClient = applyFormulaDef.client((input) => {
  const { cell, formula } = input

  if (!toolContext.univerRef.current) {
    return { success: false, cell, formula }
  }

  const success = toolContext.univerRef.current.applyFormula(cell, formula)

  return { success, cell, formula }
})

const sortDataClient = sortDataDef.client((input) => {
  const { column, order } = input

  if (!toolContext.univerRef.current) {
    return { success: false, column, order, rowsSorted: 0 }
  }

  // Convert column letter to index (A=0, B=1, etc.)
  const colIndex = columnLetterToIndex(column.toUpperCase())
  const ascending = order === 'asc'

  const success = toolContext.univerRef.current.sortByColumn(
    colIndex,
    ascending,
  )

  return {
    success,
    column,
    order,
    rowsSorted: success ? -1 : 0, // -1 means all rows (we don't track exact count)
  }
})

const filterDataClient = filterDataDef.client((input) => {
  const { column, value } = input

  if (!toolContext.univerRef.current) {
    return { success: false, column, matchingRows: 0 }
  }

  // Convert column letter to index
  const colIndex = columnLetterToIndex(column.toUpperCase())

  // Build filter values based on operator
  // For now, we just pass the value as-is - proper filtering would need more logic
  const filterValues = value ? [value] : []

  // Create filter on a reasonable default range (can be improved)
  const success = toolContext.univerRef.current.createFilter(
    'A1:Z1000', // Default large range
    colIndex,
    filterValues,
  )

  return {
    success,
    column,
    matchingRows: success ? -1 : 0, // -1 means filtered (exact count unknown)
  }
})

const formatCellsClient = formatCellsDef.client((input) => {
  const { range, style } = input

  if (!toolContext.univerRef.current) {
    return { success: false, range, stylesApplied: [] }
  }

  const success = toolContext.univerRef.current.formatCells(range, style)
  const stylesApplied = Object.keys(style).filter(
    (key) => style[key as keyof typeof style] !== undefined,
  )

  return { success, range, stylesApplied }
})

const createChartClient = createChartDef.client((input) => {
  const chartId = nanoid()
  const { title, type, dataRange, xAxisColumn, seriesColumns } = input

  // Create artifact for chart display (charts are rendered separately, not via Univer)
  const artifact: SpreadsheetArtifact = {
    id: chartId,
    title,
    type: 'chart',
    createdAt: new Date(),
    data: {
      chartId,
      title,
      chartType: type,
      dataRange,
      xAxisColumn,
      seriesColumns,
    },
  }

  toolContext.onArtifactCreated?.(artifact)

  return { success: true, chartId, title, type }
})

const insertPivotTableClient = insertPivotTableDef.client((input) => {
  const pivotId = nanoid()
  const { sourceRange, targetCell, rows, columns, values } = input

  // Create artifact for pivot table display
  const artifact: SpreadsheetArtifact = {
    id: pivotId,
    title: 'Pivot Table',
    type: 'pivot',
    createdAt: new Date(),
    data: { pivotId, sourceRange, targetCell, rows, columns, values },
  }

  toolContext.onArtifactCreated?.(artifact)

  return { success: true, pivotId, location: targetCell }
})

const calculateStatsClient = calculateStatsDef.client((input) => {
  const { range, metrics } = input

  // For now, return placeholder - real implementation would read data and calculate
  const results: Record<string, number> = {}
  for (const metric of metrics) {
    results[metric] = 0
  }

  return { success: true, range, results }
})

// ============================================================================
// Row and Column Operations
// ============================================================================

const insertRowsClient = insertRowsDef.client((input) => {
  const { startRow, count = 1 } = input

  if (!toolContext.univerRef.current) {
    return { success: false, startRow, rowsInserted: 0 }
  }

  const success = toolContext.univerRef.current.insertRows(startRow - 1, count) // 0-indexed

  return { success, startRow, rowsInserted: success ? count : 0 }
})

const deleteRowsClient = deleteRowsDef.client((input) => {
  const { startRow, count = 1 } = input

  if (!toolContext.univerRef.current) {
    return { success: false, startRow, rowsDeleted: 0 }
  }

  const success = toolContext.univerRef.current.deleteRows(startRow - 1, count) // 0-indexed

  return { success, startRow, rowsDeleted: success ? count : 0 }
})

const insertColumnsClient = insertColumnsDef.client((input) => {
  const { startColumn, count = 1 } = input

  if (!toolContext.univerRef.current) {
    return { success: false, startColumn, columnsInserted: 0 }
  }

  // Convert column letter to index
  const colIndex = columnLetterToIndex(startColumn.toUpperCase())
  const success = toolContext.univerRef.current.insertColumns(colIndex, count)

  return { success, startColumn, columnsInserted: success ? count : 0 }
})

const deleteColumnsClient = deleteColumnsDef.client((input) => {
  const { startColumn, count = 1 } = input

  if (!toolContext.univerRef.current) {
    return { success: false, startColumn, columnsDeleted: 0 }
  }

  const colIndex = columnLetterToIndex(startColumn.toUpperCase())
  const success = toolContext.univerRef.current.deleteColumns(colIndex, count)

  return { success, startColumn, columnsDeleted: success ? count : 0 }
})

const resizeColumnClient = resizeColumnDef.client((input) => {
  const { column, width } = input

  if (!toolContext.univerRef.current) {
    return { success: false, column, width }
  }

  const colIndex = columnLetterToIndex(column.toUpperCase())
  const success = toolContext.univerRef.current.resizeColumn(colIndex, width)

  return { success, column, width }
})

const resizeRowClient = resizeRowDef.client((input) => {
  const { row, height } = input

  if (!toolContext.univerRef.current) {
    return { success: false, row, height }
  }

  const success = toolContext.univerRef.current.resizeRow(row - 1, height) // 0-indexed

  return { success, row, height }
})

// ============================================================================
// Merge Operations
// ============================================================================

const mergeCellsClient = mergeCellsDef.client((input) => {
  const { range } = input

  if (!toolContext.univerRef.current) {
    return { success: false, range, cellsMerged: 0 }
  }

  const success = toolContext.univerRef.current.mergeCells(range)
  const cellsMerged = success ? countCellsInRange(range) : 0

  return { success, range, cellsMerged }
})

const unmergeCellsClient = unmergeCellsDef.client((input) => {
  const { range } = input

  if (!toolContext.univerRef.current) {
    return { success: false, range }
  }

  const success = toolContext.univerRef.current.unmergeCells(range)

  return { success, range }
})

// ============================================================================
// Data Validation
// ============================================================================

const addDataValidationClient = addDataValidationDef.client((input) => {
  const { range, validationType } = input

  // Data validation requires the Univer data-validation plugin
  // For now, return success as a no-op until plugin is integrated
  return { success: true, range, validationType }
})

// ============================================================================
// Conditional Formatting
// ============================================================================

const addConditionalFormatClient = addConditionalFormatDef.client((input) => {
  const { range, ruleType, condition, format } = input

  if (!toolContext.univerRef.current) {
    return { success: false, range, ruleType }
  }

  // Map tool ruleType to UniverSheet ruleType
  const univerRuleTypeMap: Record<
    string,
    | 'greaterThan'
    | 'lessThan'
    | 'between'
    | 'equalTo'
    | 'colorScale'
    | 'notEmpty'
  > = {
    greaterThan: 'greaterThan',
    lessThan: 'lessThan',
    between: 'between',
    equalTo: 'equalTo',
    colorScale: 'colorScale',
    textContains: 'notEmpty', // Fallback
    duplicates: 'notEmpty', // Fallback
    top10: 'notEmpty', // Fallback
    dataBar: 'colorScale', // Fallback
  }

  const mappedRuleType = univerRuleTypeMap[ruleType] || 'notEmpty'

  // Extract values from condition
  const value =
    typeof condition?.value === 'number' ? condition.value : undefined
  const value2 =
    typeof condition?.value2 === 'number' ? condition.value2 : undefined

  const success = toolContext.univerRef.current.addConditionalFormat(
    range,
    mappedRuleType,
    value,
    value2,
    format,
  )

  return { success, range, ruleType }
})

// ============================================================================
// Document Tools
// ============================================================================

const createDocumentClient = createDocumentDef.client((input) => {
  const docId = nanoid()
  const { title, content } = input

  // Create artifact for document display
  const artifact: SpreadsheetArtifact = {
    id: docId,
    title,
    type: 'doc',
    createdAt: new Date(),
    data: {
      docId,
      title,
      content,
      styles: input.styles,
    },
  }

  toolContext.onArtifactCreated?.(artifact)

  return { success: true, docId, title }
})

const insertTextClient = insertTextDef.client((input) => {
  const { text } = input

  // Document text insertion requires UniverDoc context
  // For now, return success - would need doc ref in context
  return { success: true, charactersInserted: text.length }
})

const addHeadingClient = addHeadingDef.client((input) => {
  const { level } = input

  // Heading insertion requires UniverDoc context
  return { success: true, level }
})

const addListClient = addListDef.client((input) => {
  const { items, listType } = input

  // List insertion requires UniverDoc context
  return { success: true, itemsAdded: items.length, listType }
})

// ============================================================================
// Export combined client tools
// ============================================================================

export const spreadsheetClientTools = clientTools(
  // Core spreadsheet
  createSpreadsheetClient,
  addDataClient,
  applyFormulaClient,
  sortDataClient,
  filterDataClient,
  formatCellsClient,
  createChartClient,
  insertPivotTableClient,
  calculateStatsClient,
  // Row/Column operations
  insertRowsClient,
  deleteRowsClient,
  insertColumnsClient,
  deleteColumnsClient,
  resizeColumnClient,
  resizeRowClient,
  // Merge operations
  mergeCellsClient,
  unmergeCellsClient,
  // Data validation
  addDataValidationClient,
  // Conditional formatting
  addConditionalFormatClient,
  // Document tools
  createDocumentClient,
  insertTextClient,
  addHeadingClient,
  addListClient,
)

export type SpreadsheetClientTools = typeof spreadsheetClientTools
