import { useState, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase'

export const useMenuData = () => {
  const [categories,  setCategories]  = useState([])
  const [items,       setItems]       = useState([])
  const [packs,       setPacks]       = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [catsRes, itemsRes, packsRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, icon, sort_order, is_active, subcategories(id, name, icon, sort_order, is_active, category_id)')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),

          supabase
            .from('items')
            .select(`
              id, name, price, image_url, available,
              subcategory_id,
              subcategories(id, name, icon, category_id,
                categories(id, name, icon)
              )
            `)
            .eq('available', true),

          supabase
            .from('packs')
            .select(`
              id, name, description, price, image_url, pack_category, available,
              pack_items(
                quantity,
                items(id, name, image_url)
              )
            `)
            .eq('available', true),
        ])

        setCategories(catsRes.data || [])
        setItems(itemsRes.data || [])
        setPacks(packsRes.data || [])
      } catch (err) {
        console.error('Menu load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { categories, items, packs, loading }
}