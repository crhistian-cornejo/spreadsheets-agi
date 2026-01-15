'use client'

import * as React from 'react'
import { useAuth, workbookService } from '@/lib/supabase'
import type { Workbook, Folder, DocumentCategory, Json } from '@/lib/supabase'

// Settings stored locally (not in Supabase)
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'es' | 'en'
  autoSave: boolean
  autoSaveInterval: number // in seconds
}

const SETTINGS_KEY = 's-agi-settings'

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'es',
  autoSave: true,
  autoSaveInterval: 30,
}

interface WorkbookContextValue {
  // State
  workbooks: Workbook[]
  folders: Folder[]
  activeWorkbook: Workbook | null
  settings: AppSettings
  isLoading: boolean
  isSaving: boolean

  // Workbook actions
  createWorkbook: (
    name: string,
    type: 'sheets' | 'docs',
    options?: { folderId?: string | null; category?: DocumentCategory },
  ) => Promise<Workbook | null>
  updateWorkbook: (id: string, content: Json) => Promise<void>
  deleteWorkbook: (id: string) => Promise<void>
  loadWorkbook: (id: string) => Promise<void>
  renameWorkbook: (id: string, newName: string) => Promise<void>
  duplicateWorkbook: (id: string) => Promise<Workbook | null>
  moveToFolder: (workbookId: string, folderId: string | null) => Promise<void>
  toggleFavorite: (workbookId: string) => Promise<void>
  getRecentWorkbooks: (limit?: number) => Workbook[]
  getWorkbooksByCategory: (category: DocumentCategory) => Workbook[]
  getFavoriteWorkbooks: () => Workbook[]
  refreshWorkbooks: () => Promise<void>

  // Folder actions
  createFolder: (
    name: string,
    parentId?: string | null,
    color?: string,
  ) => Promise<Folder | null>
  updateFolder: (
    id: string,
    updates: { name?: string; color?: string },
  ) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  refreshFolders: () => Promise<void>

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void
}

const WorkbookContext = React.createContext<WorkbookContextValue | null>(null)

// Get settings from localStorage
function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Save settings to localStorage
function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// Default empty workbook data for Univer
function getEmptySheetData(name: string) {
  return {
    id: crypto.randomUUID(),
    name,
    sheets: [
      {
        id: 'sheet1',
        name: 'Hoja 1',
        cellData: {},
      },
    ],
  }
}

function getEmptyDocData(name: string) {
  return {
    id: crypto.randomUUID(),
    name,
    body: {
      dataStream: '',
    },
  }
}

export function WorkbookProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const [workbooks, setWorkbooks] = React.useState<Workbook[]>([])
  const [folders, setFolders] = React.useState<Folder[]>([])
  const [activeWorkbook, setActiveWorkbook] = React.useState<Workbook | null>(
    null,
  )
  const [settings, setSettings] = React.useState<AppSettings>(getSettings())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  // Debounce timer for auto-save
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const pendingContentRef = React.useRef<{ id: string; content: Json } | null>(
    null,
  )

  // Load workbooks and folders when user changes
  React.useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setWorkbooks([])
        setFolders([])
        setActiveWorkbook(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const [workbooksResult, foldersResult] = await Promise.all([
          workbookService.getWorkbooks(user.id),
          workbookService.getFolders(user.id),
        ])

        if (workbooksResult.data) {
          setWorkbooks(workbooksResult.data)
        }
        if (foldersResult.data) {
          setFolders(foldersResult.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user])

  // Cleanup save timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Create a new workbook
  const createWorkbook = React.useCallback(
    async (
      name: string,
      type: 'sheets' | 'docs',
      options?: { folderId?: string | null; category?: DocumentCategory },
    ): Promise<Workbook | null> => {
      if (!user) return null

      const content =
        type === 'sheets' ? getEmptySheetData(name) : getEmptyDocData(name)

      const { data, error } = await workbookService.createWorkbook(
        user.id,
        name,
        type,
        content,
        options,
      )

      if (error) {
        console.error('Error creating workbook:', error)
        return null
      }

      if (data) {
        setWorkbooks((prev) => [data, ...prev])
        setActiveWorkbook(data)
      }

      return data
    },
    [user],
  )

  // Update workbook content with debounced auto-save
  const updateWorkbook = React.useCallback(
    async (id: string, content: Json) => {
      // Store pending content
      pendingContentRef.current = { id, content }

      // Update local state immediately for UI responsiveness
      setWorkbooks((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, content, updated_at: new Date().toISOString() }
            : w,
        ),
      )

      if (activeWorkbook?.id === id) {
        setActiveWorkbook((prev) =>
          prev
            ? { ...prev, content, updated_at: new Date().toISOString() }
            : null,
        )
      }

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set up debounced save
      if (settings.autoSave) {
        saveTimeoutRef.current = setTimeout(async () => {
          if (pendingContentRef.current?.id === id) {
            setIsSaving(true)
            const { error } = await workbookService.updateWorkbook(id, {
              content: pendingContentRef.current.content,
            })
            if (error) {
              console.error('Error saving workbook:', error)
            }
            pendingContentRef.current = null
            setIsSaving(false)
          }
        }, settings.autoSaveInterval * 1000)
      }
    },
    [activeWorkbook?.id, settings.autoSave, settings.autoSaveInterval],
  )

  // Force save (for manual save)
  const forceSave = React.useCallback(async () => {
    if (pendingContentRef.current) {
      setIsSaving(true)
      const { error } = await workbookService.updateWorkbook(
        pendingContentRef.current.id,
        { content: pendingContentRef.current.content },
      )
      if (error) {
        console.error('Error saving workbook:', error)
      }
      pendingContentRef.current = null
      setIsSaving(false)
    }
  }, [])

  // Delete workbook
  const deleteWorkbook = React.useCallback(
    async (id: string) => {
      const { error } = await workbookService.deleteWorkbook(id)
      if (error) {
        console.error('Error deleting workbook:', error)
        return
      }

      setWorkbooks((prev) => prev.filter((w) => w.id !== id))
      if (activeWorkbook?.id === id) {
        setActiveWorkbook(null)
      }
    },
    [activeWorkbook?.id],
  )

  // Load a workbook (set as active)
  const loadWorkbook = React.useCallback(
    async (id: string) => {
      // First, force save any pending changes
      await forceSave()

      const workbook = workbooks.find((w) => w.id === id)
      if (workbook) {
        setActiveWorkbook(workbook)
        // Update last opened timestamp
        workbookService.updateLastOpened(id)
      }
    },
    [workbooks, forceSave],
  )

  // Rename workbook
  const renameWorkbook = React.useCallback(
    async (id: string, newName: string) => {
      const { error } = await workbookService.renameWorkbook(id, newName)
      if (error) {
        console.error('Error renaming workbook:', error)
        return
      }

      setWorkbooks((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, name: newName, updated_at: new Date().toISOString() }
            : w,
        ),
      )

      setActiveWorkbook((prev) =>
        prev?.id === id
          ? { ...prev, name: newName, updated_at: new Date().toISOString() }
          : prev,
      )
    },
    [],
  )

  // Duplicate workbook
  const duplicateWorkbook = React.useCallback(
    async (id: string): Promise<Workbook | null> => {
      const { data, error } = await workbookService.duplicateWorkbook(id)
      if (error) {
        console.error('Error duplicating workbook:', error)
        return null
      }

      if (data) {
        setWorkbooks((prev) => [data, ...prev])
      }

      return data
    },
    [],
  )

  // Move to folder
  const moveToFolder = React.useCallback(
    async (workbookId: string, folderId: string | null) => {
      const { error } = await workbookService.moveWorkbookToFolder(
        workbookId,
        folderId,
      )
      if (error) {
        console.error('Error moving workbook:', error)
        return
      }

      setWorkbooks((prev) =>
        prev.map((w) =>
          w.id === workbookId
            ? {
                ...w,
                folder_id: folderId,
                updated_at: new Date().toISOString(),
              }
            : w,
        ),
      )
    },
    [],
  )

  // Toggle favorite
  const toggleFavorite = React.useCallback(
    async (workbookId: string) => {
      const workbook = workbooks.find((w) => w.id === workbookId)
      if (!workbook) return

      const newFavorite = !workbook.is_favorite
      const { error } = await workbookService.toggleFavorite(
        workbookId,
        newFavorite,
      )
      if (error) {
        console.error('Error toggling favorite:', error)
        return
      }

      setWorkbooks((prev) =>
        prev.map((w) =>
          w.id === workbookId
            ? {
                ...w,
                is_favorite: newFavorite,
                updated_at: new Date().toISOString(),
              }
            : w,
        ),
      )
    },
    [workbooks],
  )

  // Get recent workbooks
  const getRecentWorkbooks = React.useCallback(
    (limit = 10): Workbook[] => {
      return [...workbooks]
        .sort(
          (a, b) =>
            new Date(b.last_opened_at).getTime() -
            new Date(a.last_opened_at).getTime(),
        )
        .slice(0, limit)
    },
    [workbooks],
  )

  // Get workbooks by category
  const getWorkbooksByCategory = React.useCallback(
    (category: DocumentCategory): Workbook[] => {
      return workbooks.filter((w) => w.category === category)
    },
    [workbooks],
  )

  // Get favorite workbooks
  const getFavoriteWorkbooks = React.useCallback((): Workbook[] => {
    return workbooks.filter((w) => w.is_favorite)
  }, [workbooks])

  // Refresh workbooks from server
  const refreshWorkbooks = React.useCallback(async () => {
    if (!user) return

    const { data, error } = await workbookService.getWorkbooks(user.id)
    if (error) {
      console.error('Error refreshing workbooks:', error)
      return
    }

    if (data) {
      setWorkbooks(data)
    }
  }, [user])

  // Create folder
  const createFolder = React.useCallback(
    async (
      name: string,
      parentId: string | null = null,
      color: string = '#6366f1',
    ): Promise<Folder | null> => {
      if (!user) return null

      const { data, error } = await workbookService.createFolder(
        user.id,
        name,
        parentId,
        color,
      )

      if (error) {
        console.error('Error creating folder:', error)
        return null
      }

      if (data) {
        setFolders((prev) => [...prev, data])
      }

      return data
    },
    [user],
  )

  // Update folder
  const updateFolder = React.useCallback(
    async (id: string, updates: { name?: string; color?: string }) => {
      const { error } = await workbookService.updateFolder(id, updates)
      if (error) {
        console.error('Error updating folder:', error)
        return
      }

      setFolders((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, ...updates, updated_at: new Date().toISOString() }
            : f,
        ),
      )
    },
    [],
  )

  // Delete folder
  const deleteFolder = React.useCallback(async (id: string) => {
    const { error } = await workbookService.deleteFolder(id)
    if (error) {
      console.error('Error deleting folder:', error)
      return
    }

    setFolders((prev) => prev.filter((f) => f.id !== id))
    // Also update workbooks that were in this folder
    setWorkbooks((prev) =>
      prev.map((w) => (w.folder_id === id ? { ...w, folder_id: null } : w)),
    )
  }, [])

  // Refresh folders
  const refreshFolders = React.useCallback(async () => {
    if (!user) return

    const { data, error } = await workbookService.getFolders(user.id)
    if (error) {
      console.error('Error refreshing folders:', error)
      return
    }

    if (data) {
      setFolders(data)
    }
  }, [user])

  // Update settings
  const updateSettingsHandler = React.useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings }
        saveSettings(updated)
        return updated
      })
    },
    [],
  )

  const value: WorkbookContextValue = {
    workbooks,
    folders,
    activeWorkbook,
    settings,
    isLoading,
    isSaving,
    createWorkbook,
    updateWorkbook,
    deleteWorkbook,
    loadWorkbook,
    renameWorkbook,
    duplicateWorkbook,
    moveToFolder,
    toggleFavorite,
    getRecentWorkbooks,
    getWorkbooksByCategory,
    getFavoriteWorkbooks,
    refreshWorkbooks,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders,
    updateSettings: updateSettingsHandler,
  }

  return (
    <WorkbookContext.Provider value={value}>
      {children}
    </WorkbookContext.Provider>
  )
}

export function useWorkbooks() {
  const context = React.useContext(WorkbookContext)
  if (!context) {
    throw new Error('useWorkbooks must be used within a WorkbookProvider')
  }
  return context
}

// Re-export Workbook type for components
export type { Workbook }
