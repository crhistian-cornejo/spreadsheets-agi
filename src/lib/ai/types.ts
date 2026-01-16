/**
 * Shared types for AI Chat and Tool execution
 * These are the canonical type definitions - tools.ts uses Zod schemas
 */

// ============================================================================
// Tool Input Types (what the AI sends)
// ============================================================================

export interface CreateSpreadsheetInput {
  title: string
  columns: string[]
  rows?: string[][]
}

export interface AddDataInput {
  range: string
  values: string[][]
}

export interface ApplyFormulaInput {
  cell: string
  formula: string
}

export interface SortDataInput {
  column: string
  order: 'asc' | 'desc'
  range?: string
}

export interface FilterDataInput {
  column: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_empty'
  value?: string
}

export interface FormatCellsInput {
  range: string
  style: {
    bold?: boolean
    italic?: boolean
    textColor?: string
    backgroundColor?: string
    alignment?: 'left' | 'center' | 'right'
  }
}

export interface CreateChartInput {
  title: string
  type: 'bar' | 'line' | 'pie' | 'area' | 'column' | 'scatter'
  dataRange: string
  xAxisColumn?: string
  seriesColumns?: string[]
}

export interface InsertPivotTableInput {
  sourceRange: string
  targetCell: string
  rows: string[]
  columns?: string[]
  values: Array<{
    column: string
    summarizeBy: 'SUM' | 'COUNT' | 'AVERAGE' | 'MAX' | 'MIN'
  }>
}

export interface CalculateStatsInput {
  range: string
  metrics: Array<'sum' | 'average' | 'min' | 'max' | 'count'>
}

// Union type for all tool inputs
export type SpreadsheetToolInput =
  | { toolName: 'createSpreadsheet'; input: CreateSpreadsheetInput }
  | { toolName: 'addData'; input: AddDataInput }
  | { toolName: 'applyFormula'; input: ApplyFormulaInput }
  | { toolName: 'sortData'; input: SortDataInput }
  | { toolName: 'filterData'; input: FilterDataInput }
  | { toolName: 'formatCells'; input: FormatCellsInput }
  | { toolName: 'createChart'; input: CreateChartInput }
  | { toolName: 'insertPivotTable'; input: InsertPivotTableInput }
  | { toolName: 'calculateStats'; input: CalculateStatsInput }

// ============================================================================
// Tool Output Types (what we return to the AI)
// ============================================================================

export interface CreateSpreadsheetOutput {
  success: boolean
  sheetId: string
  title: string
  columns: string[]
  rowCount: number
  workbookData?: Record<string, unknown>
}

export interface AddDataOutput {
  success: boolean
  range: string
  cellsUpdated: number
}

export interface ApplyFormulaOutput {
  success: boolean
  cell: string
  formula: string
}

export interface SortDataOutput {
  success: boolean
  column: string
  order: string
  rowsSorted: number
}

export interface FilterDataOutput {
  success: boolean
  column: string
  matchingRows: number
}

export interface FormatCellsOutput {
  success: boolean
  range: string
  stylesApplied: string[]
}

export interface CreateChartOutput {
  success: boolean
  chartId: string
  title: string
  type: string
}

export interface InsertPivotTableOutput {
  success: boolean
  pivotId: string
  location: string
}

export interface CalculateStatsOutput {
  success: boolean
  range: string
  results: Record<string, number>
}

export type SpreadsheetToolOutput =
  | CreateSpreadsheetOutput
  | AddDataOutput
  | ApplyFormulaOutput
  | SortDataOutput
  | FilterDataOutput
  | FormatCellsOutput
  | CreateChartOutput
  | InsertPivotTableOutput
  | CalculateStatsOutput

// ============================================================================
// Artifact Types
// ============================================================================

export type ArtifactType = 'sheet' | 'chart' | 'pivot' | 'doc'

export interface SpreadsheetArtifact {
  id: string
  title: string
  type: ArtifactType
  createdAt: Date
  data: Record<string, unknown>
}

// ============================================================================
// Chat Types (TanStack AI compatible)
// ============================================================================

export type ChatRole = 'user' | 'assistant' | 'system'

// TanStack AI uses 'parts' array format
export interface TextPart {
  type: 'text'
  content: string
}

export interface ToolCallPart {
  type: 'tool-call'
  name: string
  input: unknown
  output?: unknown
}

export type MessagePart = TextPart | ToolCallPart

// ============================================================================
// Tool Names
// ============================================================================

export const TOOL_NAMES = [
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

export type SpreadsheetToolName = (typeof TOOL_NAMES)[number]

export function isSpreadsheetTool(
  toolName: string,
): toolName is SpreadsheetToolName {
  return TOOL_NAMES.includes(toolName as SpreadsheetToolName)
}
