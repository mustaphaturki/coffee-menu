import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, sort_order, is_active, subcategories(id, name, icon, sort_order, is_active, category_id)')
        .order('sort_order', { ascending: true })
      if (error) throw error
      setCategories(data || [])
      return data || []
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Categories ──────────────────────────────────────
  const addCategory = async ({ name, icon }) => {
    const { error } = await supabase
      .from('categories')
      .insert([{ name: name.trim(), icon: icon || null, is_active: true }])
    if (error) throw error
    await fetchCategories()
  }

  const updateCategory = async (id, { name, icon }) => {
    const { error } = await supabase
      .from('categories')
      .update({ name: name.trim(), icon: icon || null })
      .eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  const toggleCategory = async (id, isActive) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !isActive })
      .eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  // ── Subcategories ────────────────────────────────────
  const addSubcategory = async ({ category_id, name, icon }) => {
    const { error } = await supabase
      .from('subcategories')
      .insert([{ category_id, name: name.trim(), icon: icon || null, is_active: true }])
    if (error) throw error
    await fetchCategories()
  }

  const updateSubcategory = async (id, { name, icon }) => {
    const { error } = await supabase
      .from('subcategories')
      .update({ name: name.trim(), icon: icon || null })
      .eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  const deleteSubcategory = async (id) => {
    const { error } = await supabase.from('subcategories').delete().eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  const toggleSubcategory = async (id, isActive) => {
    const { error } = await supabase
      .from('subcategories')
      .update({ is_active: !isActive })
      .eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  return {
    categories,
    loading,
    fetchCategories,
    addCategory, updateCategory, deleteCategory, toggleCategory,
    addSubcategory, updateSubcategory, deleteSubcategory, toggleSubcategory,
  }
}