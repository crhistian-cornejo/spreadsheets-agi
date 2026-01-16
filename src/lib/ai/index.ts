// TanStack AI Tool Definitions and Client Tools
// Export tool definitions and their inferred types from tools.ts (canonical source)
export {
  // Tool definitions
  createSpreadsheetDef,
  addDataDef,
  applyFormulaDef,
  sortDataDef,
  filterDataDef,
  formatCellsDef,
  createChartDef,
  insertPivotTableDef,
  calculateStatsDef,
  spreadsheetToolDefs,
  // Inferred types from Zod schemas
  type CreateSpreadsheetInput,
  type CreateSpreadsheetOutput,
  type AddDataInput,
  type AddDataOutput,
  type ApplyFormulaInput,
  type ApplyFormulaOutput,
  type SortDataInput,
  type SortDataOutput,
  type FilterDataInput,
  type FilterDataOutput,
  type FormatCellsInput,
  type FormatCellsOutput,
  type CreateChartInput,
  type CreateChartOutput,
  type InsertPivotTableInput,
  type InsertPivotTableOutput,
  type CalculateStatsInput,
  type CalculateStatsOutput,
  // Tool name utilities
  SPREADSHEET_TOOL_NAMES,
  type SpreadsheetToolName,
  isSpreadsheetTool,
} from './tools'

// Export client tools
export { spreadsheetClientTools, setToolContext } from './client-tools'

// Export spreadsheet actions
export * from './spreadsheet-actions'

// Export additional types from types.ts (these don't conflict)
export type {
  SpreadsheetToolInput,
  SpreadsheetToolOutput,
  ArtifactType,
  SpreadsheetArtifact,
  ChatRole,
  TextPart,
  ToolCallPart,
  MessagePart,
} from './types'
