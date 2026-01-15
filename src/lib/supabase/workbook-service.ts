import { supabase } from './client'
import type {
  Workbook,
  WorkbookInsert,
  WorkbookUpdate,
  Folder,
  FolderInsert,
  FolderUpdate,
  Json,
  DocumentCategory,
} from './types'

// ============================================================================
// WORKBOOK CRUD OPERATIONS
// ============================================================================

/**
 * Create a new workbook
 */
export async function createWorkbook(
  userId: string,
  name: string,
  type: 'sheets' | 'docs',
  content: Json = {},
  options?: {
    folderId?: string | null
    category?: DocumentCategory
  },
): Promise<{ data: Workbook | null; error: Error | null }> {
  try {
    // Map type to category
    const category: DocumentCategory =
      options?.category || (type === 'sheets' ? 'spreadsheet' : 'document')

    const insertData: WorkbookInsert = {
      user_id: userId,
      name,
      type,
      category,
      content,
      folder_id: options?.folderId || null,
    }

    const { data, error } = await supabase
      .from('workbooks')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return { data: data as Workbook, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get all workbooks for a user
 */
export async function getWorkbooks(
  userId: string,
): Promise<{ data: Workbook[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workbooks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as Workbook[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get workbooks by type
 */
export async function getWorkbooksByType(
  userId: string,
  type: 'sheets' | 'docs',
): Promise<{ data: Workbook[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workbooks')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as Workbook[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get workbooks by category
 */
export async function getWorkbooksByCategory(
  userId: string,
  category: DocumentCategory,
): Promise<{ data: Workbook[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workbooks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as Workbook[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get workbooks by folder
 */
export async function getWorkbooksByFolder(
  userId: string,
  folderId: string | null,
): Promise<{ data: Workbook[]; error: Error | null }> {
  try {
    let query = supabase.from('workbooks').select('*').eq('user_id', userId)

    if (folderId === null) {
      query = query.is('folder_id', null)
    } else {
      query = query.eq('folder_id', folderId)
    }

    const { data, error } = await query.order('updated_at', {
      ascending: false,
    })

    if (error) throw error
    return { data: (data || []) as Workbook[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get a single workbook by ID
 */
export async function getWorkbook(
  workbookId: string,
): Promise<{ data: Workbook | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workbooks')
      .select('*')
      .eq('id', workbookId)
      .single()

    if (error) throw error
    return { data: data as Workbook, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Update a workbook
 */
export async function updateWorkbook(
  workbookId: string,
  updates: {
    name?: string
    content?: Json
    file_url?: string | null
    folder_id?: string | null
    is_favorite?: boolean
    category?: DocumentCategory
  },
): Promise<{ error: Error | null }> {
  try {
    const updateData: WorkbookUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('workbooks')
      .update(updateData)
      .eq('id', workbookId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Update last opened timestamp
 */
export async function updateLastOpened(
  workbookId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('workbooks')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', workbookId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  workbookId: string,
  isFavorite: boolean,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('workbooks')
      .update({
        is_favorite: isFavorite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workbookId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Move workbook to folder
 */
export async function moveWorkbookToFolder(
  workbookId: string,
  folderId: string | null,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('workbooks')
      .update({
        folder_id: folderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workbookId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Rename a workbook
 */
export async function renameWorkbook(
  workbookId: string,
  newName: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('workbooks')
      .update({
        name: newName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workbookId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Delete a workbook
 */
export async function deleteWorkbook(
  workbookId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('workbooks')
      .delete()
      .eq('id', workbookId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Duplicate a workbook
 */
export async function duplicateWorkbook(
  workbookId: string,
): Promise<{ data: Workbook | null; error: Error | null }> {
  try {
    // First get the original workbook
    const { data: original, error: fetchError } = await getWorkbook(workbookId)
    if (fetchError) throw fetchError
    if (!original) throw new Error('Workbook not found')

    // Create a copy
    const insertData: WorkbookInsert = {
      user_id: original.user_id,
      name: `${original.name} (copia)`,
      type: original.type,
      category: original.category,
      content: original.content,
      folder_id: original.folder_id,
    }

    const { data, error } = await supabase
      .from('workbooks')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return { data: data as Workbook, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get recent workbooks (last N)
 */
export async function getRecentWorkbooks(
  userId: string,
  limit = 10,
): Promise<{ data: Workbook[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workbooks')
      .select('*')
      .eq('user_id', userId)
      .order('last_opened_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data: (data || []) as Workbook[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get favorite workbooks
 */
export async function getFavoriteWorkbooks(
  userId: string,
): Promise<{ data: Workbook[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('workbooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as Workbook[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

// ============================================================================
// FOLDER CRUD OPERATIONS
// ============================================================================

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  name: string,
  parentId: string | null = null,
  color: string = '#6366f1',
): Promise<{ data: Folder | null; error: Error | null }> {
  try {
    const insertData: FolderInsert = {
      user_id: userId,
      name,
      parent_id: parentId,
      color,
    }

    const { data, error } = await supabase
      .from('folders')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return { data: data as Folder, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get all folders for a user
 */
export async function getFolders(
  userId: string,
): Promise<{ data: Folder[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw error
    return { data: (data || []) as Folder[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get subfolders of a folder
 */
export async function getSubfolders(
  userId: string,
  parentId: string | null,
): Promise<{ data: Folder[]; error: Error | null }> {
  try {
    let query = supabase.from('folders').select('*').eq('user_id', userId)

    if (parentId === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', parentId)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error
    return { data: (data || []) as Folder[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  updates: { name?: string; color?: string; parent_id?: string | null },
): Promise<{ error: Error | null }> {
  try {
    const updateData: FolderUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', folderId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(
  folderId: string,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('folders').delete().eq('id', folderId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}
