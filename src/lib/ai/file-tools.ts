import type { ToolExecutionResult } from './tool-executor'
import { nanoid } from 'nanoid'
import type { SpreadsheetArtifact } from './types'

export function createSpreadsheetArtifactFromFile(
  title: string,
  columns: string[],
  rows: string[][],
): ToolExecutionResult {
  const sheetId = nanoid()
  const artifact: SpreadsheetArtifact = {
    id: sheetId,
    title,
    type: 'sheet',
    createdAt: new Date(),
    data: {
      title,
      columns,
      rows,
    },
  }

  return {
    success: true,
    output: {
      success: true,
      sheetId,
      title,
      columns,
      rowCount: rows.length,
    },
    artifact,
  }
}
