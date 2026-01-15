import { supabase } from './client'
import type { FileRecord, FileRecordInsert, ProfileUpdate } from './types'

// Bucket name for Excel/spreadsheet files
const FILES_BUCKET = 'user-files'
const AVATARS_BUCKET = 'avatars'

// ============================================================================
// FILE UPLOAD/DOWNLOAD OPERATIONS
// ============================================================================

/**
 * Upload a file to storage and create a record in the files table
 */
export async function uploadFile(
  userId: string,
  file: File,
  workbookId?: string,
): Promise<{
  data: { fileRecord: FileRecord; publicUrl: string } | null
  error: Error | null
}> {
  try {
    // Create a unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(FILES_BUCKET)
      .getPublicUrl(fileName)

    // Create a record in the files table
    const insertData: FileRecordInsert = {
      user_id: userId,
      workbook_id: workbookId || null,
      name: file.name,
      file_path: fileName,
      file_size: file.size,
      mime_type: file.type,
    }

    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert(insertData)
      .select()
      .single()

    if (dbError) throw dbError

    return {
      data: {
        fileRecord: fileRecord as FileRecord,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Download a file from storage
 */
export async function downloadFile(
  filePath: string,
): Promise<{ data: Blob | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .download(filePath)

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get a signed URL for a private file (valid for 1 hour)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn = 3600,
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    if (error) throw error
    return { data: data.signedUrl, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Delete a file from storage and its database record
 */
export async function deleteFile(
  fileId: string,
  filePath: string,
): Promise<{ error: Error | null }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(FILES_BUCKET)
      .remove([filePath])

    if (storageError) throw storageError

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) throw dbError
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Get all files for a user
 */
export async function getUserFiles(
  userId: string,
): Promise<{ data: FileRecord[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as FileRecord[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

/**
 * Get files associated with a workbook
 */
export async function getWorkbookFiles(
  workbookId: string,
): Promise<{ data: FileRecord[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('workbook_id', workbookId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as FileRecord[], error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

// ============================================================================
// AVATAR OPERATIONS
// ============================================================================

/**
 * Upload a user avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    // Upload to avatars bucket (will overwrite existing)
    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(fileName)

    // Add cache buster to force refresh
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Update user profile with new avatar URL
    const updateData: ProfileUpdate = {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) throw updateError

    return { data: avatarUrl, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(
  userId: string,
): Promise<{ error: Error | null }> {
  try {
    // List files in user's avatar folder
    const { data: files, error: listError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(userId)

    if (listError) throw listError

    if (files && files.length > 0) {
      // Delete all avatar files
      const filePaths = files.map((f) => `${userId}/${f.name}`)
      const { error: removeError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .remove(filePaths)

      if (removeError) throw removeError
    }

    // Update profile to remove avatar URL
    const updateData: ProfileUpdate = {
      avatar_url: null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) throw updateError

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

// ============================================================================
// EXCEL FILE SPECIFIC OPERATIONS
// ============================================================================

/**
 * Upload an Excel file
 */
export async function uploadExcelFile(
  userId: string,
  file: File,
  workbookId?: string,
): Promise<{
  data: { fileRecord: FileRecord; publicUrl: string } | null
  error: Error | null
}> {
  // Validate file type
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ]

  if (!validTypes.includes(file.type)) {
    return {
      data: null,
      error: new Error(
        'Invalid file type. Please upload an Excel file (.xls, .xlsx) or CSV.',
      ),
    }
  }

  return uploadFile(userId, file, workbookId)
}
