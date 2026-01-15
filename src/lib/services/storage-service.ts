// Storage service for persisting workbooks to localStorage
// In the future, this can be swapped out for IndexedDB or a backend API

export interface StoredWorkbook {
  id: string
  name: string
  type: 'sheets' | 'docs'
  createdAt: string
  updatedAt: string
  data: Record<string, unknown>
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'es' | 'en'
  autoSave: boolean
  autoSaveInterval: number // in seconds
}

const STORAGE_KEYS = {
  WORKBOOKS: 's-agi-workbooks',
  ACTIVE_WORKBOOK: 's-agi-active-workbook',
  SETTINGS: 's-agi-settings',
} as const

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'es',
  autoSave: true,
  autoSaveInterval: 30,
}

// Workbook storage functions
export function getStoredWorkbooks(): StoredWorkbook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKBOOKS)
    if (!stored) return []
    return JSON.parse(stored) as StoredWorkbook[]
  } catch (error) {
    console.error('Error reading workbooks from storage:', error)
    return []
  }
}

export function saveWorkbooks(workbooks: StoredWorkbook[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKBOOKS, JSON.stringify(workbooks))
  } catch (error) {
    console.error('Error saving workbooks to storage:', error)
  }
}

export function getWorkbookById(id: string): StoredWorkbook | null {
  const workbooks = getStoredWorkbooks()
  return workbooks.find((w) => w.id === id) || null
}

export function saveWorkbook(workbook: StoredWorkbook): void {
  const workbooks = getStoredWorkbooks()
  const existingIndex = workbooks.findIndex((w) => w.id === workbook.id)

  if (existingIndex >= 0) {
    workbooks[existingIndex] = workbook
  } else {
    workbooks.unshift(workbook) // Add to beginning for recent order
  }

  saveWorkbooks(workbooks)
}

export function deleteWorkbook(id: string): void {
  const workbooks = getStoredWorkbooks()
  const filtered = workbooks.filter((w) => w.id !== id)
  saveWorkbooks(filtered)
}

export function getRecentWorkbooks(limit = 10): StoredWorkbook[] {
  const workbooks = getStoredWorkbooks()
  return workbooks
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit)
}

// Active workbook tracking
export function getActiveWorkbookId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKBOOK)
  } catch {
    return null
  }
}

export function setActiveWorkbookId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKBOOK, id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKBOOK)
    }
  } catch (error) {
    console.error('Error saving active workbook ID:', error)
  }
}

// Settings functions
export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as AppSettings
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// Utility: Generate unique ID
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

// Utility: Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - past.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'hace un momento'
  if (diffMins < 60)
    return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24)
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  return past.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
