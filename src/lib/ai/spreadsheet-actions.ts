// Types for spreadsheet tool outputs

export interface CreateSpreadsheetAction {
  type: 'create_spreadsheet'
  title: string
  columns: string[]
  rows: string[][]
  sheetId: string
}

export interface AddDataAction {
  type: 'add_data'
  range: string
  values: string[][]
}

export interface ApplyFormulaAction {
  type: 'apply_formula'
  cell: string
  formula: string
}

export interface SortDataAction {
  type: 'sort_data'
  column: string
  order: 'asc' | 'desc'
  range?: string
}

export interface FilterDataAction {
  type: 'filter_data'
  column: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_empty'
  value?: string
}

export interface FormatCellsAction {
  type: 'format_cells'
  range: string
  style: {
    bold?: boolean
    italic?: boolean
    textColor?: string
    backgroundColor?: string
    fontSize?: number
    alignment?: 'left' | 'center' | 'right'
    numberFormat?: 'number' | 'currency' | 'percentage' | 'date'
  }
}

export interface CalculateStatsAction {
  type: 'calculate_stats'
  range: string
  metrics: ('sum' | 'average' | 'min' | 'max' | 'count')[]
}

export type SpreadsheetAction =
  | CreateSpreadsheetAction
  | AddDataAction
  | ApplyFormulaAction
  | SortDataAction
  | FilterDataAction
  | FormatCellsAction
  | CalculateStatsAction

// Helper to parse cell reference like "A1" to { col: 0, row: 0 }
export function parseCellReference(ref: string): { col: number; row: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i)
  if (!match) throw new Error(`Invalid cell reference: ${ref}`)

  const colStr = match[1].toUpperCase()
  const row = Number.parseInt(match[2], 10) - 1

  let col = 0
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64)
  }
  col -= 1

  return { col, row }
}

// Helper to convert column number to letter (0 = A, 1 = B, etc.)
export function columnToLetter(col: number): string {
  let result = ''
  let n = col + 1
  while (n > 0) {
    n--
    result = String.fromCharCode((n % 26) + 65) + result
    n = Math.floor(n / 26)
  }
  return result
}

// ============================================================================
// Cell Value Types for Univer
// ============================================================================

interface UniverCellData {
  v?: string | number // value
  t?: number // type: 1=string, 2=number, 3=boolean
  f?: string // formula
  s?: string // style reference
}

interface UniverSheetData {
  id: string
  name: string
  cellData: Record<number, Record<number, UniverCellData>>
  rowCount: number
  columnCount: number
  defaultColumnWidth: number
  defaultRowHeight: number
}

interface UniverWorkbookData {
  id: string
  name: string
  sheetOrder: string[]
  sheets: Record<string, UniverSheetData>
  styles?: Record<string, Record<string, unknown>>
}

// ============================================================================
// Generate Univer workbook data structure from a create action
// ============================================================================

export function generateWorkbookData(
  action: CreateSpreadsheetAction,
): UniverWorkbookData {
  const sheetId = 'sheet-01'

  // Build cellData in Univer's format: { rowIndex: { colIndex: { v: value } } }
  const cellData: Record<number, Record<number, UniverCellData>> = {}

  // Add column headers (row 0)
  cellData[0] = {}
  action.columns.forEach((header, colIndex) => {
    cellData[0][colIndex] = {
      v: header,
      s: 'header-style', // Apply header style
    }
  })

  // Add data rows (starting from row 1)
  action.rows.forEach((row, rowIndex) => {
    const dataRowIndex = rowIndex + 1 // Offset by 1 for header
    cellData[dataRowIndex] = {}

    row.forEach((value, colIndex) => {
      // Try to detect if value is a number
      const numValue = Number(value)
      const isNumber = !isNaN(numValue) && value.trim() !== ''

      cellData[dataRowIndex][colIndex] = isNumber
        ? { v: numValue, t: 2 } // t=2 for number type
        : { v: value, t: 1 } // t=1 for string type
    })
  })

  return {
    id: action.sheetId,
    name: action.title,
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: action.title,
        cellData,
        rowCount: Math.max(1000, action.rows.length + 100),
        columnCount: Math.max(26, action.columns.length + 10),
        defaultColumnWidth: 100,
        defaultRowHeight: 24,
      },
    },
    styles: {
      'header-style': {
        bg: { rgb: '#4472C4' },
        cl: { rgb: '#FFFFFF' },
        bl: 1, // bold
        ht: 2, // horizontal alignment center
      },
    },
  }
}
