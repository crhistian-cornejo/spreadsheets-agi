import XLSX from 'xlsx-js-style'
import Papa from 'papaparse'
import type { ContentPart } from '@tanstack/ai'

export interface ParsedFileResult {
  filename: string
  mediaType: string
  summary: string
  contentParts?: ContentPart[]
  isSpreadsheet: boolean
  sheetData?: {
    title: string
    columns: string[]
    rows: string[][]
  }
}

function summarizeText(text: string, maxChars = 4000): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned
  return `${cleaned.slice(0, maxChars)}...`
}

function sheetToTable(sheet: XLSX.WorkSheet): {
  columns: string[]
  rows: string[][]
} {
  const json = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
  }) as Array<Array<string | number | boolean | null | undefined>>
  const rows = json.map((row) => row.map((cell) => `${cell ?? ''}`))
  const columns = rows.shift() || []
  return {
    columns: columns.map((c) => `${c}`),
    rows,
  }
}

export async function parseFile(
  file: {
    filename: string
    mediaType: string
    data: string
  },
  provider: 'openai' | 'gemini' = 'openai',
): Promise<ParsedFileResult> {
  const { filename, mediaType, data } = file
  const isImage = mediaType.startsWith('image/')
  const isCsv =
    mediaType === 'text/csv' || filename.toLowerCase().endsWith('.csv')
  const isExcel =
    mediaType === 'application/vnd.ms-excel' ||
    mediaType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    filename.toLowerCase().endsWith('.xls') ||
    filename.toLowerCase().endsWith('.xlsx')
  const isPdf =
    mediaType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')

  if (isImage) {
    const contentParts: ContentPart[] = [
      {
        type: 'text',
        content: `Archivo de imagen: ${filename}`,
      } as ContentPart,
      {
        type: 'image',
        source:
          provider === 'openai'
            ? { type: 'url', value: data }
            : { type: 'data', value: data.split(',')[1] || data },
      } as ContentPart,
    ]

    return {
      filename,
      mediaType,
      summary: `Imagen adjunta: ${filename}`,
      contentParts,
      isSpreadsheet: false,
    }
  }

  if (isCsv) {
    const parsed = Papa.parse<string[]>(data, { skipEmptyLines: true })
    const rows = parsed.data as string[][]
    const columns = rows.shift() || []
    return {
      filename,
      mediaType,
      summary: summarizeText(rows.map((r) => r.join(', ')).join('\n')),
      isSpreadsheet: true,
      sheetData: {
        title: filename.replace(/\.[^/.]+$/, ''),
        columns,
        rows,
      },
    }
  }

  if (isExcel) {
    const binary = data.startsWith('data:') ? data.split(',')[1] : data
    const workbook = XLSX.read(binary, { type: 'base64' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const table = sheetToTable(sheet)
    return {
      filename,
      mediaType,
      summary: summarizeText(
        table.rows
          .slice(0, 50)
          .map((r) => r.join(', '))
          .join('\n'),
      ),
      isSpreadsheet: true,
      sheetData: {
        title: filename.replace(/\.[^/.]+$/, ''),
        columns: table.columns,
        rows: table.rows,
      },
    }
  }

  if (isPdf) {
    const binary = data.startsWith('data:') ? data.split(',')[1] : data
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const pdf = await pdfjs.getDocument({
      data: Uint8Array.from(atob(binary), (c) => c.charCodeAt(0)),
    }).promise
    let text = ''
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items.map((item: any) => item.str).join(' ')
      text += `\n${pageText}`
    }
    return {
      filename,
      mediaType,
      summary: summarizeText(text),
      isSpreadsheet: false,
    }
  }

  return {
    filename,
    mediaType,
    summary: `Archivo adjunto (${mediaType}): ${filename}`,
    isSpreadsheet: false,
  }
}
