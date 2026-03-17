import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { InventoryItem, InventoryCategory } from '../types'

export function useInventory(companyId: string | undefined) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from('inventory_categories').select('*').eq('company_id', companyId).order('sort_order'),
        supabase.from('inventory_items').select('*, category:inventory_categories(*)').eq('company_id', companyId).eq('active', true).order('name'),
      ])
      setCategories(cats || [])
      setItems(its || [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  async function createCategory(data: Omit<InventoryCategory, 'id'>) {
    const { error } = await supabase.from('inventory_categories').insert(data)
    if (error) throw error
    await load()
  }

  async function createItem(data: Partial<InventoryItem>) {
    const { error } = await supabase.from('inventory_items').insert({ ...data, company_id: companyId })
    if (error) throw error
    await load()
  }

  async function updateItem(id: string, data: Partial<InventoryItem>) {
    const { error } = await supabase.from('inventory_items').update(data).eq('id', id)
    if (error) throw error
    await load()
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('inventory_items').update({ active: false }).eq('id', id)
    if (error) throw error
    await load()
  }

  return { items, categories, loading, error, reload: load, createCategory, createItem, updateItem, deleteItem }
}
