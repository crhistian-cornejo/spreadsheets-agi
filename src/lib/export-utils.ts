'use client'

import XLSX from 'xlsx-js-style'
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'
import type { UniverSheetHandle } from '@/components/univer/UniverSheet'

// ============================================================================
// Types
// ============================================================================

type ArtifactType = 'sheet' | 'chart' | 'pivot' | 'doc'

interface ExportOptions {
  title: string
  type: ArtifactType
  data: Record<string, unknown>
  /** Optional reference to Univer for live export with current styles */
  univerRef?: React.RefObject<UniverSheetHandle | null>
}

// ============================================================================
// Univer Style Types
// ============================================================================

interface UniverCellData {
  v?: string | number // value
  t?: number // type: 1=string, 2=number, 3=boolean
  f?: string // formula
  s?: string | Record<string, unknown> // style reference or inline style
}

interface UniverStyle {
  bg?: { rgb?: string } // background color
  cl?: { rgb?: string } // font color
  bl?: number // bold (1 = bold)
  it?: number // italic (1 = italic)
  ul?: { s?: number } // underline
  fs?: number // font size
  ff?: string // font family
  ht?: number // horizontal text alignment (0=left, 1=center, 2=right)
  vt?: number // vertical text alignment
  tb?: number // text wrap
  bd?: { // borders
    t?: { s?: number; cl?: { rgb?: string } } // top
    b?: { s?: number; cl?: { rgb?: string } } // bottom
    l?: { s?: number; cl?: { rgb?: string } } // left
    r?: { s?: number; cl?: { rgb?: string } } // right
  }
}

// xlsx-js-style cell style type
interface XlsxCellStyle {
  fill?: {
    patternType?: string
    fgColor?: { rgb: string }
    bgColor?: { rgb: string }
  }
  font?: {
    name?: string
    sz?: number
    bold?: boolean
    italic?: boolean
    underline?: boolean
    color?: { rgb: string }
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'center' | 'bottom'
    wrapText?: boolean
  }
  border?: {
    top?: { style: string; color: { rgb: string } }
    bottom?: { style: string; color: { rgb: string } }
    left?: { style: string; color: { rgb: string } }
    right?: { style: string; color: { rgb: string } }
  }
}

// ============================================================================
// Sheet/Excel Export (.xlsx) with Styles
// ============================================================================

/**
 * Convert Univer style to xlsx-js-style format
 */
function convertUniverStyleToXlsx(
  style: UniverStyle | string | undefined,
  styles: Record<string, UniverStyle> | undefined
): XlsxCellStyle | undefined {
  if (!style) return undefined
  
  // Resolve style reference
  const resolvedStyle: UniverStyle = typeof style === 'string' 
    ? (styles?.[style] || {})
    : style
  
  const xlsxStyle: XlsxCellStyle = {}
  
  // Fill (background color)
  if (resolvedStyle.bg?.rgb) {
    const rgb = resolvedStyle.bg.rgb.replace('#', '').toUpperCase()
    xlsxStyle.fill = {
      patternType: 'solid',
      fgColor: { rgb },
      bgColor: { rgb }
    }
  }
  
  // Font
  const font: XlsxCellStyle['font'] = {}
  let hasFont = false
  
  if (resolvedStyle.cl?.rgb) {
    font.color = { rgb: resolvedStyle.cl.rgb.replace('#', '').toUpperCase() }
    hasFont = true
  }
  if (resolvedStyle.bl === 1) {
    font.bold = true
    hasFont = true
  }
  if (resolvedStyle.it === 1) {
    font.italic = true
    hasFont = true
  }
  if (resolvedStyle.ul?.s === 1) {
    font.underline = true
    hasFont = true
  }
  if (resolvedStyle.fs) {
    font.sz = resolvedStyle.fs
    hasFont = true
  }
  if (resolvedStyle.ff) {
    font.name = resolvedStyle.ff
    hasFont = true
  }
  if (hasFont) {
    xlsxStyle.font = font
  }
  
  // Alignment
  const alignment: XlsxCellStyle['alignment'] = {}
  let hasAlignment = false
  
  if (resolvedStyle.ht !== undefined) {
    alignment.horizontal = resolvedStyle.ht === 0 ? 'left' : resolvedStyle.ht === 1 ? 'center' : 'right'
    hasAlignment = true
  }
  if (resolvedStyle.vt !== undefined) {
    alignment.vertical = resolvedStyle.vt === 0 ? 'top' : resolvedStyle.vt === 1 ? 'center' : 'bottom'
    hasAlignment = true
  }
  if (resolvedStyle.tb === 1) {
    alignment.wrapText = true
    hasAlignment = true
  }
  if (hasAlignment) {
    xlsxStyle.alignment = alignment
  }
  
  // Borders
  if (resolvedStyle.bd) {
    const border: XlsxCellStyle['border'] = {}
    let hasBorder = false
    
    const mapBorder = (b?: { s?: number; cl?: { rgb?: string } }) => {
      if (!b) return undefined
      return {
        style: b.s === 1 ? 'thin' : b.s === 2 ? 'medium' : b.s === 3 ? 'thick' : 'thin',
        color: { rgb: b.cl?.rgb?.replace('#', '').toUpperCase() || '000000' }
      }
    }
    
    if (resolvedStyle.bd.t) {
      border.top = mapBorder(resolvedStyle.bd.t)
      hasBorder = true
    }
    if (resolvedStyle.bd.b) {
      border.bottom = mapBorder(resolvedStyle.bd.b)
      hasBorder = true
    }
    if (resolvedStyle.bd.l) {
      border.left = mapBorder(resolvedStyle.bd.l)
      hasBorder = true
    }
    if (resolvedStyle.bd.r) {
      border.right = mapBorder(resolvedStyle.bd.r)
      hasBorder = true
    }
    if (hasBorder) {
      xlsxStyle.border = border
    }
  }
  
  return Object.keys(xlsxStyle).length > 0 ? xlsxStyle : undefined
}

/**
 * Create default header style for xlsx-js-style
 */
function createHeaderStyle(): XlsxCellStyle {
  return {
    fill: {
      patternType: 'solid',
      fgColor: { rgb: '4472C4' },
      bgColor: { rgb: '4472C4' }
    },
    font: {
      bold: true,
      color: { rgb: 'FFFFFF' },
      sz: 11
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  }
}

/**
 * Export spreadsheet data as .xlsx file with styles
 * Handles Univer workbook format
 */
function exportAsXlsx(
  title: string, 
  data: Record<string, unknown>,
  univerRef?: React.RefObject<UniverSheetHandle | null>
): void {
  try {
    // Try to get live data from Univer if available
    let liveData: Record<string, unknown> | null = null
    if (univerRef?.current) {
      liveData = univerRef.current.getWorkbookData() ?? null
    }
    const exportData = liveData || data
    
    const workbook = XLSX.utils.book_new()
    const globalStyles = exportData.styles as Record<string, UniverStyle> | undefined

    // Handle Univer workbook structure
    if (exportData.sheets && typeof exportData.sheets === 'object') {
      const sheets = exportData.sheets as Record<string, { 
        name?: string
        cellData?: Record<string, Record<string, UniverCellData>>
        columnData?: Record<string, { w?: number }>
        rowData?: Record<string, { h?: number }>
      }>
      
      for (const sheetData of Object.values(sheets)) {
        const cellData = sheetData.cellData || {}
        const wsData: Array<Array<{ v: string | number; t: string; s?: XlsxCellStyle }>> = []
        
        // Find max row and column
        let maxRow = 0
        let maxCol = 0
        
        for (const rowIdx of Object.keys(cellData)) {
          const rowNum = parseInt(rowIdx, 10)
          if (rowNum > maxRow) maxRow = rowNum
          
          const rowCells = cellData[rowIdx]
          for (const colIdx of Object.keys(rowCells)) {
            const colNum = parseInt(colIdx, 10)
            if (colNum > maxCol) maxCol = colNum
          }
        }
        
        // Build worksheet data with styles
        for (let r = 0; r <= maxRow; r++) {
          const row: Array<{ v: string | number; t: string; s?: XlsxCellStyle }> = []
          for (let c = 0; c <= maxCol; c++) {
            const rowCellData = cellData[r]
            const cell = rowCellData ? rowCellData[c] : undefined
            
            let value: string | number = ''
            let cellType = 's' // string by default
            
            if (cell) {
              if (cell.f) {
                value = cell.f
                cellType = 's'
              } else if (cell.v !== undefined) {
                value = cell.v
                cellType = typeof cell.v === 'number' ? 'n' : 's'
              }
            }
            
            // Build cell object with style
            const cellObj: { v: string | number; t: string; s?: XlsxCellStyle } = { 
              v: value, 
              t: cellType 
            }
            
            // Apply style from cell or global styles
            if (cell && cell.s) {
              const xlsxStyle = convertUniverStyleToXlsx(
                cell.s as UniverStyle | string, 
                globalStyles
              )
              if (xlsxStyle) {
                cellObj.s = xlsxStyle
              }
            }
            
            row.push(cellObj)
          }
          wsData.push(row)
        }
        
        // Create worksheet from array of arrays
        const worksheet = XLSX.utils.aoa_to_sheet(
          wsData.map(row => row.map(cell => cell.v))
        )
        
        // Apply styles to each cell
        for (let r = 0; r < wsData.length; r++) {
          for (let c = 0; c < wsData[r].length; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c })
            const cellData2 = wsData[r][c]
            if (cellData2.s && worksheet[cellRef]) {
              worksheet[cellRef].s = cellData2.s
            }
          }
        }
        
        // Apply column widths
        if (sheetData.columnData) {
          const colWidths: Array<{ wch?: number; wpx?: number }> = []
          for (let c = 0; c <= maxCol; c++) {
            const colData = sheetData.columnData[c]
            if (colData && colData.w) {
              colWidths[c] = { wpx: colData.w }
            } else {
              colWidths[c] = { wch: 15 } // default width
            }
          }
          worksheet['!cols'] = colWidths
        } else {
          // Set default column widths
          const colWidths: Array<{ wch: number }> = []
          for (let c = 0; c <= maxCol; c++) {
            colWidths[c] = { wch: 15 }
          }
          worksheet['!cols'] = colWidths
        }
        
        // Apply row heights
        if (sheetData.rowData) {
          const rowHeights: Array<{ hpx?: number; hpt?: number }> = []
          for (let r = 0; r <= maxRow; r++) {
            const rowInfo = sheetData.rowData[r]
            if (rowInfo && rowInfo.h) {
              rowHeights[r] = { hpx: rowInfo.h }
            }
          }
          worksheet['!rows'] = rowHeights
        }
        
        // Get sheet name
        const sheetName = (sheetData.name || title).slice(0, 31)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }
    } else if (exportData.columns && exportData.rows) {
      // Handle simple columns/rows format with styled headers
      const columns = exportData.columns as Array<string>
      const rows = exportData.rows as Array<Array<string | number>>
      
      // Build data with styled headers
      const headerStyle = createHeaderStyle()
      const headerRow = columns.map(col => ({ v: col, t: 's', s: headerStyle }))
      const dataRows = rows.map(row => 
        row.map(cell => ({ 
          v: cell, 
          t: typeof cell === 'number' ? 'n' : 's' 
        }))
      )
      
      const allData = [headerRow, ...dataRows]
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(
        allData.map(row => row.map(cell => cell.v))
      )
      
      // Apply styles
      for (let r = 0; r < allData.length; r++) {
        for (let c = 0; c < allData[r].length; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c })
          const cellData2 = allData[r][c]
          if ('s' in cellData2 && cellData2.s && worksheet[cellRef]) {
            worksheet[cellRef].s = cellData2.s
          }
        }
      }
      
      // Set column widths
      const colWidths: Array<{ wch: number }> = columns.map(() => ({ wch: 15 }))
      worksheet['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31))
    } else {
      // Fallback: export as JSON in a single cell
      const worksheet = XLSX.utils.aoa_to_sheet([[JSON.stringify(exportData, null, 2)]])
      XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31))
    }
    
    // Generate and download with styles enabled
    const xlsxBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array'
    })
    const blob = new Blob([xlsxBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    saveAs(blob, `${sanitizeFilename(title)}.xlsx`)
  } catch (error) {
    console.error('[exportAsXlsx] Error:', error)
    // Fallback to JSON
    exportAsJson(title, data)
  }
}

/**
 * Export spreadsheet data as .csv file
 */
export function exportAsCsv(title: string, data: Record<string, unknown>): void {
  try {
    let csvContent = ''
    
    // Handle Univer workbook structure
    if (data.sheets && typeof data.sheets === 'object') {
      const sheets = data.sheets as Record<string, { cellData?: Record<string, Record<string, { v?: unknown }>> }>
      const firstSheetId = Object.keys(sheets)[0]
      const sheetData = sheets[firstSheetId]
      const cellData = sheetData.cellData || {}
      
      // Find max row and column
      let maxRow = 0
      let maxCol = 0
      
      for (const rowIdx of Object.keys(cellData)) {
        const rowNum = parseInt(rowIdx, 10)
        if (rowNum > maxRow) maxRow = rowNum
        
        const rowCells = cellData[rowIdx]
        for (const colIdx of Object.keys(rowCells)) {
          const colNum = parseInt(colIdx, 10)
          if (colNum > maxCol) maxCol = colNum
        }
      }
      
      // Build CSV
      const rows: Array<string> = []
      for (let r = 0; r <= maxRow; r++) {
        const row: Array<string> = []
        for (let c = 0; c <= maxCol; c++) {
          const rowData = cellData[r]
          const cell = rowData ? rowData[c] : undefined
          const value = cell && cell.v !== undefined ? String(cell.v) : ''
          // Escape CSV values
          row.push(value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value
          )
        }
        rows.push(row.join(','))
      }
      csvContent = rows.join('\n')
    } else if (data.columns && data.rows) {
      // Handle simple columns/rows format
      const columns = data.columns as Array<string>
      const rows = data.rows as Array<Array<string | number>>
      
      csvContent = [
        columns.join(','),
        ...rows.map(row => row.map(cell => {
          const value = cell !== null && cell !== undefined ? String(cell) : ''
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(','))
      ].join('\n')
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `${sanitizeFilename(title)}.csv`)
  } catch (error) {
    console.error('[exportAsCsv] Error:', error)
    exportAsJson(title, data)
  }
}

// ============================================================================
// Document Export (.docx)
// ============================================================================

/**
 * Export document data as .docx file
 */
async function exportAsDocx(title: string, data: Record<string, unknown>): Promise<void> {
  try {
    const children: Array<Paragraph> = []
    
    // Add title
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    )
    
    // Handle different document structures
    if (data.content && typeof data.content === 'string') {
      // Simple text content
      const paragraphs = data.content.split('\n\n')
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun(para.trim())],
            spacing: { after: 200 },
          })
        )
      }
    } else if (data.sections && Array.isArray(data.sections)) {
      // Structured sections
      for (const section of data.sections as Array<{ title?: string; content?: string }>) {
        if (section.title) {
          children.push(
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          )
        }
        if (section.content) {
          const paragraphs = section.content.split('\n\n')
          for (const para of paragraphs) {
            children.push(
              new Paragraph({
                children: [new TextRun(para.trim())],
                spacing: { after: 200 },
              })
            )
          }
        }
      }
    } else if (data.text && typeof data.text === 'string') {
      // Plain text
      const paragraphs = data.text.split('\n\n')
      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun(para.trim())],
            spacing: { after: 200 },
          })
        )
      }
    } else {
      // Fallback: stringify the data
      children.push(
        new Paragraph({
          children: [new TextRun(JSON.stringify(data, null, 2))],
          spacing: { after: 200 },
        })
      )
    }
    
    const doc = new Document({
      sections: [{
        children,
      }],
    })
    
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${sanitizeFilename(title)}.docx`)
  } catch (error) {
    console.error('[exportAsDocx] Error:', error)
    exportAsJson(title, data)
  }
}

// ============================================================================
// JSON Export (fallback)
// ============================================================================

/**
 * Export data as .json file (fallback)
 */
function exportAsJson(title: string, data: Record<string, unknown>): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, `${sanitizeFilename(title)}.json`)
}

// ============================================================================
// Unified Export Function
// ============================================================================

/**
 * Export artifact based on its type
 * - sheet/chart/pivot → .xlsx (with styles)
 * - doc → .docx
 */
export async function exportArtifact(options: ExportOptions): Promise<void> {
  const { title, type, data, univerRef } = options
  
  switch (type) {
    case 'sheet':
    case 'chart':
    case 'pivot':
      exportAsXlsx(title, data, univerRef)
      break
    case 'doc':
      await exportAsDocx(title, data)
      break
    default:
      exportAsJson(title, data)
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Sanitize filename for safe download
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200) // Reasonable max length
}
