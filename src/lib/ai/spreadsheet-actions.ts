// Types for spreadsheet tool outputs

export interface CreateSpreadsheetAction {
  type: "create_spreadsheet"
  title: string
  columns: string[]
  rows: string[][]
  sheetId: string
}

export interface AddDataAction {
  type: "add_data"
  range: string
  values: string[][]
}

export interface ApplyFormulaAction {
  type: "apply_formula"
  cell: string
  formula: string
}

export interface SortDataAction {
  type: "sort_data"
  column: string
  order: "asc" | "desc"
  range?: string
}

export interface FilterDataAction {
  type: "filter_data"
  column: string
  operator: "equals" | "contains" | "greater_than" | "less_than" | "not_empty"
  value?: string
}

export interface FormatCellsAction {
  type: "format_cells"
  range: string
  style: {
    bold?: boolean
    italic?: boolean
    textColor?: string
    backgroundColor?: string
    fontSize?: number
    alignment?: "left" | "center" | "right"
    numberFormat?: "number" | "currency" | "percentage" | "date"
  }
}

export interface CalculateStatsAction {
  type: "calculate_stats"
  range: string
  metrics: ("sum" | "average" | "min" | "max" | "count")[]
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
  let result = ""
  let n = col + 1
  while (n > 0) {
    n--
    result = String.fromCharCode((n % 26) + 65) + result
    n = Math.floor(n / 26)
  }
  return result
}

// Generate Univer workbook data structure from a create action
export function generateWorkbookData(action: CreateSpreadsheetAction) {
  const sheetData: Record<string, { v: string }> = {}
  
  // Add column headers
  action.columns.forEach((header, colIndex) => {
    const cellId = `${columnToLetter(colIndex)}1`
    sheetData[cellId] = { v: header }
  })
  
  // Add data rows
  action.rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cellId = `${columnToLetter(colIndex)}${rowIndex + 2}`
      sheetData[cellId] = { v: value }
    })
  })
  
  return {
    id: action.sheetId,
    name: action.title,
    sheets: [
      {
        id: "sheet1",
        name: "Hoja 1",
        cellData: sheetData,
      },
    ],
  }
}
