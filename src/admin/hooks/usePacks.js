import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import { uploadImage } from '../../shared/lib/uploadImage'

export const usePacks = () => {
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPacks = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('packs')
        .select(`
          id, name, description, price, image_url, pack_category, available, created_at,
          pack_items (
            id, quantity,
            items (id, name, image_url, available, price)
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPacks(data || [])
      return data || []
    } finally {
      setLoading(false)
    }
  }, [])

  const addPack = async ({ name, description, price, imageFile, packCategory, packQty }) => {
    const image_url = imageFile ? await uploadImage(imageFile) : null
    const { data: pack, error } = await supabase
      .from('packs')
      .insert([{ name: name.trim(), description, price: parseFloat(price), image_url, pack_category: packCategory, available: true }])
      .select().single()
    if (error) throw error

    const rows = Object.entries(packQty).map(([item_id, quantity]) => ({
      pack_id: pack.id, item_id: parseInt(item_id), quantity,
    }))
    if (rows.length > 0) {
      const { error: piErr } = await supabase.from('pack_items').insert(rows)
      if (piErr) throw piErr
    }
    return await fetchPacks()
  }

  const updatePack = async (id, { name, description, price, imageFile, image_url: existingUrl, packCategory, packQty }) => {
    const image_url = imageFile ? await uploadImage(imageFile) : existingUrl
    const { error } = await supabase.from('packs').update({
      name: name.trim(), description, price: parseFloat(price), image_url, pack_category: packCategory,
    }).eq('id', id)
    if (error) throw error

    await supabase.from('pack_items').delete().eq('pack_id', id)
    const rows = Object.entries(packQty).map(([item_id, quantity]) => ({
      pack_id: id, item_id: parseInt(item_id), quantity,
    }))
    if (rows.length > 0) {
      const { error: piErr } = await supabase.from('pack_items').insert(rows)
      if (piErr) throw piErr
    }
    return await fetchPacks()
  }

  const deletePack = async (id) => {
    const { error } = await supabase.from('packs').delete().eq('id', id)
    if (error) throw error
    return await fetchPacks()
  }

  // Called after any item availability change
  const syncAvailability = async (latestItems) => {
    try {
      const { data: allPacks } = await supabase.from('packs').select('id, pack_items(item_id)')
      if (!allPacks) return
      await Promise.all(allPacks.map(pack => {
        const ids = pack.pack_items.map(pi => pi.item_id)
        const available = ids.length === 0
          ? true
          : ids.every(id => latestItems.find(i => i.id === id)?.available !== false)
        return supabase.from('packs').update({ available }).eq('id', pack.id)
      }))
      await fetchPacks()
    } catch (err) {
      console.error('syncAvailability error:', err)
    }
  }

  return { packs, loading, fetchPacks, addPack, updatePack, deletePack, syncAvailability }
}