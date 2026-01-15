"use client"

import { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from "react"
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core"
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US"
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets"
import "@univerjs/preset-sheets-core/lib/index.css"

// Type definition for Univer Facade API
export interface UniverAPI {
  getActiveWorkbook: () => FWorkbook | null
  createWorkbook: (data: Record<string, unknown>) => FWorkbook
  dispose: () => void
}

export interface FWorkbook {
  getActiveSheet: () => FSheet | null
  getSheetByName: (name: string) => FSheet | null
}

export interface FSheet {
  getRange: (range: string) => FRange
  getName: () => string
}

export interface FRange {
  setValue: (value: unknown) => void
  setValues: (values: unknown[][]) => void
  getValue: () => unknown
  getValues: () => unknown[][]
  setBackground: (color: string) => void
  setFontColor: (color: string) => void
  setFontWeight: (weight: "bold" | "normal") => void
  setFontStyle: (style: "italic" | "normal") => void
  setHorizontalAlignment: (alignment: "left" | "center" | "right") => void
}

// Ref handle exposed to parent components
export interface UniverSheetHandle {
  /** Get the Univer API instance */
  getAPI: () => UniverAPI | null
  /** Set cell value(s) */
  setCellValue: (range: string, value: unknown) => boolean
  /** Set multiple cell values */
  setCellValues: (range: string, values: unknown[][]) => boolean
  /** Get cell value(s) */
  getCellValue: (range: string) => unknown
  /** Apply formula to a cell */
  applyFormula: (cell: string, formula: string) => boolean
  /** Format cells */
  formatCells: (range: string, style: CellStyle) => boolean
  /** Create a new sheet with data */
  createSheetWithData: (title: string, columns: string[], rows: string[][]) => boolean
}

export interface CellStyle {
  bold?: boolean
  italic?: boolean
  textColor?: string
  backgroundColor?: string
  alignment?: "left" | "center" | "right"
}

interface UniverSheetProps {
  /** Optional initial data for the workbook */
  initialData?: Record<string, unknown>
  /** Optional callback when the univerAPI is ready */
  onReady?: (api: UniverSheetHandle) => void
  /** Optional custom class name */
  className?: string
  /** Dark mode */
  darkMode?: boolean
}

export const UniverSheet = forwardRef<UniverSheetHandle, UniverSheetProps>(
  function UniverSheet({ initialData, onReady, className = "", darkMode = false }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const univerAPIRef = useRef<UniverAPI | null>(null)
    const initializedRef = useRef(false)

    // Helper function to get the API safely
    const getAPI = useCallback((): UniverAPI | null => {
      return univerAPIRef.current
    }, [])

    // Set cell value
    const setCellValue = useCallback((range: string, value: unknown): boolean => {
      try {
        const api = univerAPIRef.current
        if (!api) return false
        const workbook = api.getActiveWorkbook()
        if (!workbook) return false
        const sheet = workbook.getActiveSheet()
        if (!sheet) return false
        const rangeRef = sheet.getRange(range)
        rangeRef.setValue(value)
        return true
      } catch (error) {
        console.error("Error setting cell value:", error)
        return false
      }
    }, [])

    // Set multiple cell values
    const setCellValues = useCallback((range: string, values: unknown[][]): boolean => {
      try {
        const api = univerAPIRef.current
        if (!api) return false
        const workbook = api.getActiveWorkbook()
        if (!workbook) return false
        const sheet = workbook.getActiveSheet()
        if (!sheet) return false
        const rangeRef = sheet.getRange(range)
        rangeRef.setValues(values)
        return true
      } catch (error) {
        console.error("Error setting cell values:", error)
        return false
      }
    }, [])

    // Get cell value
    const getCellValue = useCallback((range: string): unknown => {
      try {
        const api = univerAPIRef.current
        if (!api) return null
        const workbook = api.getActiveWorkbook()
        if (!workbook) return null
        const sheet = workbook.getActiveSheet()
        if (!sheet) return null
        const rangeRef = sheet.getRange(range)
        return rangeRef.getValue()
      } catch (error) {
        console.error("Error getting cell value:", error)
        return null
      }
    }, [])

    // Apply formula
    const applyFormula = useCallback((cell: string, formula: string): boolean => {
      try {
        const api = univerAPIRef.current
        if (!api) return false
        const workbook = api.getActiveWorkbook()
        if (!workbook) return false
        const sheet = workbook.getActiveSheet()
        if (!sheet) return false
        const rangeRef = sheet.getRange(cell)
        // Formulas in Univer start with =
        rangeRef.setValue(formula.startsWith("=") ? formula : `=${formula}`)
        return true
      } catch (error) {
        console.error("Error applying formula:", error)
        return false
      }
    }, [])

    // Format cells
    const formatCells = useCallback((range: string, style: CellStyle): boolean => {
      try {
        const api = univerAPIRef.current
        if (!api) return false
        const workbook = api.getActiveWorkbook()
        if (!workbook) return false
        const sheet = workbook.getActiveSheet()
        if (!sheet) return false
        const rangeRef = sheet.getRange(range)
        
        if (style.bold !== undefined) {
          rangeRef.setFontWeight(style.bold ? "bold" : "normal")
        }
        if (style.italic !== undefined) {
          rangeRef.setFontStyle(style.italic ? "italic" : "normal")
        }
        if (style.textColor) {
          rangeRef.setFontColor(style.textColor)
        }
        if (style.backgroundColor) {
          rangeRef.setBackground(style.backgroundColor)
        }
        if (style.alignment) {
          rangeRef.setHorizontalAlignment(style.alignment)
        }
        return true
      } catch (error) {
        console.error("Error formatting cells:", error)
        return false
      }
    }, [])

    // Create sheet with data
    const createSheetWithData = useCallback((_title: string, columns: string[], rows: string[][]): boolean => {
      try {
        const api = univerAPIRef.current
        if (!api) return false
        const workbook = api.getActiveWorkbook()
        if (!workbook) return false
        const sheet = workbook.getActiveSheet()
        if (!sheet) return false

        // Set column headers in row 1
        if (columns.length > 0) {
          const headerRange = `A1:${columnToLetter(columns.length - 1)}1`
          const rangeRef = sheet.getRange(headerRange)
          rangeRef.setValues([columns])
          // Bold headers
          rangeRef.setFontWeight("bold")
          rangeRef.setBackground("#f3f4f6")
        }

        // Set data rows starting from row 2
        if (rows.length > 0 && columns.length > 0) {
          const dataRange = `A2:${columnToLetter(columns.length - 1)}${rows.length + 1}`
          const rangeRef = sheet.getRange(dataRange)
          rangeRef.setValues(rows)
        }

        return true
      } catch (error) {
        console.error("Error creating sheet with data:", error)
        return false
      }
    }, [])

    // Create the handle object
    const handle: UniverSheetHandle = {
      getAPI,
      setCellValue,
      setCellValues,
      getCellValue,
      applyFormula,
      formatCells,
      createSheetWithData,
    }

    // Expose handle to parent via ref
    useImperativeHandle(ref, () => handle, [
      getAPI,
      setCellValue,
      setCellValues,
      getCellValue,
      applyFormula,
      formatCells,
      createSheetWithData,
    ])

    useEffect(() => {
      if (!containerRef.current || initializedRef.current) return
      initializedRef.current = true

      const { univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
        },
        darkMode,
        presets: [
          UniverSheetsCorePreset({
            container: containerRef.current,
          }),
        ],
      })

      // Store the API reference
      univerAPIRef.current = univerAPI as unknown as UniverAPI

      // Create a new workbook with initial data or empty
      if (initialData) {
        univerAPI.createWorkbook(initialData)
      } else {
        univerAPI.createWorkbook({})
      }

      setIsLoading(false)

      // Notify parent that API is ready
      if (onReady) {
        onReady(handle)
      }

      // Cleanup on unmount
      return () => {
        univerAPI.dispose()
        initializedRef.current = false
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [darkMode])

    return (
      <div className={`relative h-full w-full ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Cargando Editor...</span>
            </div>
          </div>
        )}
        <div 
          ref={containerRef} 
          className="h-full w-full"
          style={{ minHeight: "500px" }}
        />
      </div>
    )
  }
)

// Helper to convert column number to letter (0 = A, 1 = B, etc.)
function columnToLetter(col: number): string {
  let result = ""
  let n = col + 1
  while (n > 0) {
    n--
    result = String.fromCharCode((n % 26) + 65) + result
    n = Math.floor(n / 26)
  }
  return result
}
