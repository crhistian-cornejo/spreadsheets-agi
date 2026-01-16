/**
 * Client-side tool executor for spreadsheet operations
 * This executes tools on the UniverSheet component
 */

import { nanoid } from 'nanoid'
import type { UniverSheetHandle } from '@/components/univer'
import type {
  SpreadsheetToolName,
  CreateSpreadsheetInput,
  AddDataInput,
  ApplyFormulaInput,
  SortDataInput,
  FilterDataInput,
  FormatCellsInput,
  CreateChartInput,
  InsertPivotTableInput,
  CalculateStatsInput,
  CreateSpreadsheetOutput,
  AddDataOutput,
  ApplyFormulaOutput,
  SortDataOutput,
  FilterDataOutput,
  FormatCellsOutput,
  CreateChartOutput,
  InsertPivotTableOutput,
  CalculateStatsOutput,
  SpreadsheetToolOutput,
  SpreadsheetArtifact,
} from './types'
import { generateWorkbookData } from './spreadsheet-actions'

export interface ToolExecutionResult {
  success: boolean
  output: SpreadsheetToolOutput
  artifact?: SpreadsheetArtifact
  error?: string
}

export interface ToolExecutorContext {
  univerRef: React.RefObject<UniverSheetHandle | null>
  onArtifactCreated?: (artifact: SpreadsheetArtifact) => void
}

/**
 * Execute a spreadsheet tool and return the result
 */
export async function executeSpreadsheetTool(
  toolName: SpreadsheetToolName,
  input: unknown,
  context: ToolExecutorContext,
): Promise<ToolExecutionResult> {
  const { univerRef, onArtifactCreated } = context

  try {
    switch (toolName) {
      case 'createSpreadsheet':
        return executeCreateSpreadsheet(
          input as CreateSpreadsheetInput,
          univerRef,
          onArtifactCreated,
        )

      case 'addData':
        return executeAddData(input as AddDataInput, univerRef)

      case 'applyFormula':
        return executeApplyFormula(input as ApplyFormulaInput, univerRef)

      case 'sortData':
        return executeSortData(input as SortDataInput)

      case 'filterData':
        return executeFilterData(input as FilterDataInput)

      case 'formatCells':
        return executeFormatCells(input as FormatCellsInput, univerRef)

      case 'createChart':
        return executeCreateChart(input as CreateChartInput, onArtifactCreated)

      case 'insertPivotTable':
        return executeInsertPivotTable(
          input as InsertPivotTableInput,
          onArtifactCreated,
        )

      case 'calculateStats':
        return executeCalculateStats(input as CalculateStatsInput)

      default:
        return {
          success: false,
          output: { success: false } as SpreadsheetToolOutput,
          error: `Unknown tool: ${toolName}`,
        }
    }
  } catch (error) {
    return {
      success: false,
      output: { success: false } as SpreadsheetToolOutput,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Individual Tool Executors
// ============================================================================

function executeCreateSpreadsheet(
  input: CreateSpreadsheetInput,
  univerRef: React.RefObject<UniverSheetHandle | null>,
  onArtifactCreated?: (artifact: SpreadsheetArtifact) => void,
): ToolExecutionResult {
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
  if (univerRef.current) {
    univerRef.current.createSheetWithData(title, columns, rows)
  }

  const output: CreateSpreadsheetOutput = {
    success: true,
    sheetId,
    title,
    columns,
    rowCount: rows.length,
    workbookData: workbookData as unknown as Record<string, unknown>,
  }

  const artifact: SpreadsheetArtifact = {
    id: sheetId,
    title,
    type: 'sheet',
    createdAt: new Date(),
    data: workbookData as unknown as Record<string, unknown>,
  }

  onArtifactCreated?.(artifact)

  return {
    success: true,
    output,
    artifact,
  }
}

function executeAddData(
  input: AddDataInput,
  univerRef: React.RefObject<UniverSheetHandle | null>,
): ToolExecutionResult {
  const { range, values } = input

  if (!univerRef.current) {
    return {
      success: false,
      output: { success: false, range, cellsUpdated: 0 } as AddDataOutput,
      error: 'Spreadsheet not initialized',
    }
  }

  const success = univerRef.current.setCellValues(range, values)
  const cellsUpdated = values.reduce((acc, row) => acc + row.length, 0)

  const output: AddDataOutput = {
    success,
    range,
    cellsUpdated: success ? cellsUpdated : 0,
  }

  return { success, output }
}

function executeApplyFormula(
  input: ApplyFormulaInput,
  univerRef: React.RefObject<UniverSheetHandle | null>,
): ToolExecutionResult {
  const { cell, formula } = input

  if (!univerRef.current) {
    return {
      success: false,
      output: { success: false, cell, formula } as ApplyFormulaOutput,
      error: 'Spreadsheet not initialized',
    }
  }

  const success = univerRef.current.applyFormula(cell, formula)

  const output: ApplyFormulaOutput = {
    success,
    cell,
    formula,
  }

  return { success, output }
}

function executeSortData(input: SortDataInput): ToolExecutionResult {
  const { column, order } = input

  // TODO: Implement actual sorting via Univer API
  const output: SortDataOutput = {
    success: true,
    column,
    order,
    rowsSorted: 0,
  }

  return { success: true, output }
}

function executeFilterData(input: FilterDataInput): ToolExecutionResult {
  const { column } = input

  // TODO: Implement actual filtering via Univer API
  const output: FilterDataOutput = {
    success: true,
    column,
    matchingRows: 0,
  }

  return { success: true, output }
}

function executeFormatCells(
  input: FormatCellsInput,
  univerRef: React.RefObject<UniverSheetHandle | null>,
): ToolExecutionResult {
  const { range, style } = input

  if (!univerRef.current) {
    return {
      success: false,
      output: { success: false, range, stylesApplied: [] } as FormatCellsOutput,
      error: 'Spreadsheet not initialized',
    }
  }

  const success = univerRef.current.formatCells(range, style)
  const stylesApplied = Object.keys(style).filter(
    (key) => style[key as keyof typeof style] !== undefined,
  )

  const output: FormatCellsOutput = {
    success,
    range,
    stylesApplied,
  }

  return { success, output }
}

function executeCreateChart(
  input: CreateChartInput,
  onArtifactCreated?: (artifact: SpreadsheetArtifact) => void,
): ToolExecutionResult {
  const chartId = nanoid()
  const { title, type, dataRange, xAxisColumn, seriesColumns } = input

  const output: CreateChartOutput = {
    success: true,
    chartId,
    title,
    type,
  }

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

  onArtifactCreated?.(artifact)

  return {
    success: true,
    output,
    artifact,
  }
}

function executeInsertPivotTable(
  input: InsertPivotTableInput,
  onArtifactCreated?: (artifact: SpreadsheetArtifact) => void,
): ToolExecutionResult {
  const pivotId = nanoid()
  const { sourceRange, targetCell, rows, columns, values } = input

  const output: InsertPivotTableOutput = {
    success: true,
    pivotId,
    location: targetCell,
  }

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

  onArtifactCreated?.(artifact)

  return {
    success: true,
    output,
    artifact,
  }
}

function executeCalculateStats(
  input: CalculateStatsInput,
): ToolExecutionResult {
  const { range, metrics } = input

  // TODO: Implement actual stats calculation
  const results: Record<string, number> = {}
  for (const metric of metrics) {
    results[metric] = 0
  }

  const output: CalculateStatsOutput = {
    success: true,
    range,
    results,
  }

  return { success: true, output }
}
