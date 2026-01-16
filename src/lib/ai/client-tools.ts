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
    data: workbookData,
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
    return {
      success: false,
      range,
      cellsUpdated: 0,
    }
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
    return {
      success: false,
      cell,
      formula,
    }
  }

  const success = toolContext.univerRef.current.applyFormula(cell, formula)

  return {
    success,
    cell,
    formula,
  }
})

const sortDataClient = sortDataDef.client((input) => {
  const { column, order } = input

  // TODO: Implement actual sorting via Univer API
  return {
    success: true,
    column,
    order,
    rowsSorted: 0,
  }
})

const filterDataClient = filterDataDef.client((input) => {
  const { column } = input

  // TODO: Implement actual filtering via Univer API
  return {
    success: true,
    column,
    matchingRows: 0,
  }
})

const formatCellsClient = formatCellsDef.client((input) => {
  const { range, style } = input

  if (!toolContext.univerRef.current) {
    return {
      success: false,
      range,
      stylesApplied: [],
    }
  }

  const success = toolContext.univerRef.current.formatCells(range, style)
  const stylesApplied = Object.keys(style).filter(
    (key) => style[key as keyof typeof style] !== undefined,
  )

  return {
    success,
    range,
    stylesApplied,
  }
})

const createChartClient = createChartDef.client((input) => {
  const chartId = nanoid()
  const { title, type, dataRange, xAxisColumn, seriesColumns } = input

  // Create artifact for chart display
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

  return {
    success: true,
    chartId,
    title,
    type,
  }
})

const insertPivotTableClient = insertPivotTableDef.client((input) => {
  const pivotId = nanoid()
  const { sourceRange, targetCell, rows, columns, values } = input

  // Create artifact for pivot table display
  const artifact: SpreadsheetArtifact = {
    id: pivotId,
    title: 'Tabla Dinámica',
    type: 'pivot',
    createdAt: new Date(),
    data: {
      pivotId,
      sourceRange,
      targetCell,
      rows,
      columns,
      values,
    },
  }

  toolContext.onArtifactCreated?.(artifact)

  return {
    success: true,
    pivotId,
    location: targetCell,
  }
})

const calculateStatsClient = calculateStatsDef.client((input) => {
  const { range, metrics } = input

  // TODO: Implement actual stats calculation via Univer API
  const results: Record<string, number> = {}
  for (const metric of metrics) {
    results[metric] = 0
  }

  return {
    success: true,
    range,
    results,
  }
})

// ============================================================================
// Export combined client tools
// ============================================================================

export const spreadsheetClientTools = clientTools(
  createSpreadsheetClient,
  addDataClient,
  applyFormulaClient,
  sortDataClient,
  filterDataClient,
  formatCellsClient,
  createChartClient,
  insertPivotTableClient,
  calculateStatsClient,
)

export type SpreadsheetClientTools = typeof spreadsheetClientTools
