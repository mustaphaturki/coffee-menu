import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import { uploadImage } from '../../shared/lib/uploadImage'

export const useItems = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id, name, price, image_url, available, created_at,
          subcategories (
            id, name, category_id,
            categories (id, name, icon)
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
      return data || []
    } finally {
      setLoading(false)
    }
  }, [])

  const addItem = async ({ subcategory_id, name, price, imageFile }) => {
    const image_url = imageFile ? await uploadImage(imageFile) : null
    const { error } = await supabase.from('items').insert([{
      subcategory_id, name: name.trim(),
      price: parseFloat(price), image_url, available: true,
    }])
    if (error) throw error
    return await fetchItems()
  }

  const updateItem = async (id, { subcategory_id, name, price, imageFile, image_url: existingUrl }) => {
    const image_url = imageFile ? await uploadImage(imageFile) : existingUrl
    const { error } = await supabase.from('items').update({
      subcategory_id, name: name.trim(), price: parseFloat(price), image_url,
    }).eq('id', id)
    if (error) throw error
    return await fetchItems()
  }

  const deleteItem = async (id) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
    return await fetchItems()
  }

  const toggleAvailability = async (id, current) => {
    const { error } = await supabase.from('items').update({ available: !current }).eq('id', id)
    if (error) throw error
    return await fetchItems()
  }

  return { items, loading, fetchItems, addItem, updateItem, deleteItem, toggleAvailability }
}