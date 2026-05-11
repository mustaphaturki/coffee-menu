import { supabase } from './supabase'

const BUCKET = 'menu-images'

export const uploadImage = async (file) => {
  const ext = file.name.split('.').pop()
  const path = `menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('Could not get public URL')
  return data.publicUrl
}