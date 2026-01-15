'use client'

import * as React from 'react'
import { useAuth, workbookService, storageService } from '@/lib/supabase'
import type {
  Workbook as SupabaseWorkbook,
  FileRecord,
  Json,
} from '@/lib/supabase'

interface UseCloudStorageReturn {
  workbooks: Array<SupabaseWorkbook>
  files: Array<FileRecord>
  isLoading: boolean
  error: Error | null
  // Workbook operations
  createWorkbook: (
    name: string,
    type: 'sheets' | 'docs',
    content?: Json,
  ) => Promise<SupabaseWorkbook | null>
  getWorkbook: (id: string) => Promise<SupabaseWorkbook | null>
  updateWorkbook: (
    id: string,
    updates: { name?: string; content?: Json },
  ) => Promise<void>
  deleteWorkbook: (id: string) => Promise<void>
  duplicateWorkbook: (id: string) => Promise<SupabaseWorkbook | null>
  // File operations
  uploadFile: (
    file: File,
    workbookId?: string,
  ) => Promise<{ fileRecord: FileRecord; publicUrl: string } | null>
  uploadExcelFile: (
    file: File,
    workbookId?: string,
  ) => Promise<{ fileRecord: FileRecord; publicUrl: string } | null>
  deleteFile: (fileId: string, filePath: string) => Promise<void>
  getSignedUrl: (filePath: string) => Promise<string | null>
  // Refresh
  refreshWorkbooks: () => Promise<void>
  refreshFiles: () => Promise<void>
}

export function useCloudStorage(): UseCloudStorageReturn {
  const { user } = useAuth()

  const [workbooks, setWorkbooks] = React.useState<Array<SupabaseWorkbook>>([])
  const [files, setFiles] = React.useState<Array<FileRecord>>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  // Refresh workbooks
  const refreshWorkbooks = React.useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await workbookService.getWorkbooks(
        user.id,
      )
      if (fetchError) throw fetchError
      setWorkbooks(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Refresh files
  const refreshFiles = React.useCallback(async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await storageService.getUserFiles(
        user.id,
      )
      if (fetchError) throw fetchError
      setFiles(data)
    } catch (err) {
      setError(err as Error)
    }
  }, [user])

  // Load data on mount
  React.useEffect(() => {
    refreshWorkbooks()
    refreshFiles()
  }, [refreshWorkbooks, refreshFiles])

  // Create workbook
  const createWorkbook = React.useCallback(
    async (
      name: string,
      type: 'sheets' | 'docs',
      content: Json = {},
    ): Promise<SupabaseWorkbook | null> => {
      if (!user) return null

      try {
        const { data, error: createError } =
          await workbookService.createWorkbook(user.id, name, type, content)
        if (createError) throw createError
        if (data) {
          setWorkbooks((prev) => [data, ...prev])
        }
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [user],
  )

  // Get workbook
  const getWorkbook = React.useCallback(
    async (id: string): Promise<SupabaseWorkbook | null> => {
      try {
        const { data, error: fetchError } =
          await workbookService.getWorkbook(id)
        if (fetchError) throw fetchError
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [],
  )

  // Update workbook
  const updateWorkbook = React.useCallback(
    async (id: string, updates: { name?: string; content?: Json }) => {
      try {
        const { error: updateError } = await workbookService.updateWorkbook(
          id,
          updates,
        )
        if (updateError) throw updateError

        setWorkbooks((prev) =>
          prev.map((wb) =>
            wb.id === id
              ? ({
                  ...wb,
                  ...updates,
                  updated_at: new Date().toISOString(),
                } as SupabaseWorkbook)
              : wb,
          ),
        )
      } catch (err) {
        setError(err as Error)
      }
    },
    [],
  )

  // Delete workbook
  const deleteWorkbook = React.useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await workbookService.deleteWorkbook(id)
      if (deleteError) throw deleteError
      setWorkbooks((prev) => prev.filter((wb) => wb.id !== id))
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  // Duplicate workbook
  const duplicateWorkbook = React.useCallback(
    async (id: string): Promise<SupabaseWorkbook | null> => {
      try {
        const { data, error: dupError } =
          await workbookService.duplicateWorkbook(id)
        if (dupError) throw dupError
        if (data) {
          setWorkbooks((prev) => [data, ...prev])
        }
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [],
  )

  // Upload file
  const uploadFile = React.useCallback(
    async (
      file: File,
      workbookId?: string,
    ): Promise<{ fileRecord: FileRecord; publicUrl: string } | null> => {
      if (!user) return null

      try {
        const { data, error: uploadError } = await storageService.uploadFile(
          user.id,
          file,
          workbookId,
        )
        if (uploadError) throw uploadError
        if (data) {
          setFiles((prev) => [data.fileRecord, ...prev])
        }
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [user],
  )

  // Upload Excel file
  const uploadExcelFile = React.useCallback(
    async (
      file: File,
      workbookId?: string,
    ): Promise<{ fileRecord: FileRecord; publicUrl: string } | null> => {
      if (!user) return null

      try {
        const { data, error: uploadError } =
          await storageService.uploadExcelFile(user.id, file, workbookId)
        if (uploadError) throw uploadError
        if (data) {
          setFiles((prev) => [data.fileRecord, ...prev])
        }
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [user],
  )

  // Delete file
  const deleteFile = React.useCallback(
    async (fileId: string, filePath: string) => {
      try {
        const { error: deleteError } = await storageService.deleteFile(
          fileId,
          filePath,
        )
        if (deleteError) throw deleteError
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
      } catch (err) {
        setError(err as Error)
      }
    },
    [],
  )

  // Get signed URL
  const getSignedUrl = React.useCallback(
    async (filePath: string): Promise<string | null> => {
      try {
        const { data, error: urlError } =
          await storageService.getSignedUrl(filePath)
        if (urlError) throw urlError
        return data
      } catch (err) {
        setError(err as Error)
        return null
      }
    },
    [],
  )

  return {
    workbooks,
    files,
    isLoading,
    error,
    createWorkbook,
    getWorkbook,
    updateWorkbook,
    deleteWorkbook,
    duplicateWorkbook,
    uploadFile,
    uploadExcelFile,
    deleteFile,
    getSignedUrl,
    refreshWorkbooks,
    refreshFiles,
  }
}
