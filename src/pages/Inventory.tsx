import React, { useState } from 'react'
import { Package, Plus, Search, Edit2, Trash2, Tag } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { useInventory } from '../hooks/useInventory'
import type { InventoryItem, InventoryCategory } from '../types'

interface InventoryProps {
  companyId: string
}

export function Inventory({ companyId }: InventoryProps) {
  const { items, categories, loading, createCategory, createItem, updateItem, deleteItem } = useInventory(companyId)

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [showItemModal, setShowItemModal] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({
    name: '', brand: '', model: '', price_per_day: 0, stock: 1, category_id: '', active: true,
  })
  const [catForm, setCatForm] = useState({ name: '', color: '#1A5276' })

  // Filter
  const filtered = items.filter(item => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.model?.toLowerCase().includes(search.toLowerCase())
    const matchesCat = filterCat === 'all' || item.category_id === filterCat
    return matchesSearch && matchesCat
  })

  // Group by category
  const grouped = categories.map(cat => ({
    category: cat,
    items: filtered.filter(i => i.category_id === cat.id),
  })).filter(g => g.items.length > 0)

  function openNew() {
    setEditingItem(null)
    setItemForm({ name: '', brand: '', model: '', price_per_day: 0, stock: 1, category_id: categories[0]?.id || '', active: true })
    setShowItemModal(true)
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setItemForm({ ...item })
    setShowItemModal(true)
  }

  async function saveItem() {
    setSaving(true)
    setError('')
    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemForm)
      } else {
        await createItem(itemForm)
      }
      setShowItemModal(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function saveCat() {
    setSaving(true)
    try {
      await createCategory({ ...catForm, company_id: companyId, sort_order: categories.length })
      setShowCatModal(false)
      setCatForm({ name: '', color: '#1A5276' })
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const totalValue = items.reduce((s, i) => s + i.price_per_day * i.stock, 0)

  return (
    <div className="flex-1">
      <Header
        title="Inventario"
        subtitle={`${items.length} equipos en ${categories.length} categorías`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<Tag size={14} />} onClick={() => setShowCatModal(true)}>
              Categoría
            </Button>
            <Button icon={<Plus size={16} />} onClick={openNew}>
              Añadir equipo
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category_id === cat.id)
            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:border-primary transition-colors"
                onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{cat.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>{catItems.length}</p>
                <p className="text-xs text-gray-400">equipos</p>
              </div>
            )
          })}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Valor/día total</p>
            <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'Space Grotesk' }}>
              {totalValue.toLocaleString('es-ES')} €
            </p>
            <p className="text-xs text-gray-400">todo el inventario</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Buscar por nombre, marca, modelo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Items table by category */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando inventario...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay equipos</p>
            <p className="text-gray-400 text-sm mb-4">
              {search ? 'No coincide con la búsqueda' : 'Empieza añadiendo equipos a tu inventario'}
            </p>
            {!search && <Button onClick={openNew} icon={<Plus size={16} />}>Añadir primer equipo</Button>}
          </div>
        ) : grouped.map(({ category, items: catItems }) => (
          <div key={category.id} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: category.color }} />
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                {category.name}
              </h3>
              <Badge color="gray">{catItems.length} equipos</Badge>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca / Modelo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio/día</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">V. día total</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.code && <p className="text-xs text-gray-400">#{item.code}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || item.model || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {item.price_per_day.toLocaleString('es-ES')} €
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {(item.price_per_day * item.stock).toLocaleString('es-ES')} €
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Item Modal */}
      <Modal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItem ? 'Editar equipo' : 'Añadir equipo'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowItemModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={saveItem}>
              {editingItem ? 'Guardar cambios' : 'Añadir equipo'}
            </Button>
          </>
        }
      >
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nombre" required>
            <Input value={itemForm.name || ''} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Meyer Sound Panther L" />
          </FormField>
          <FormField label="Categoría" required>
            <Select value={itemForm.category_id || ''} onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Marca">
            <Input value={itemForm.brand || ''} onChange={e => setItemForm(f => ({ ...f, brand: e.target.value }))} placeholder="Meyer Sound" />
          </FormField>
          <FormField label="Modelo">
            <Input value={itemForm.model || ''} onChange={e => setItemForm(f => ({ ...f, model: e.target.value }))} placeholder="Panther L 80°" />
          </FormField>
          <FormField label="Precio/día (€)" required>
            <Input type="number" min={0} step={0.01} value={itemForm.price_per_day || 0}
              onChange={e => setItemForm(f => ({ ...f, price_per_day: parseFloat(e.target.value) || 0 }))} />
          </FormField>
          <FormField label="Stock" required>
            <Input type="number" min={1} value={itemForm.stock || 1}
              onChange={e => setItemForm(f => ({ ...f, stock: parseInt(e.target.value) || 1 }))} />
          </FormField>
          <FormField label="Código interno">
            <Input value={itemForm.code || ''} onChange={e => setItemForm(f => ({ ...f, code: e.target.value }))} placeholder="20920" />
          </FormField>
          <FormField label="Peso (kg)">
            <Input type="number" min={0} step={0.1} value={itemForm.weight_kg || ''}
              onChange={e => setItemForm(f => ({ ...f, weight_kg: parseFloat(e.target.value) || undefined }))} />
          </FormField>
        </div>
        <FormField label="Descripción / Notas">
          <Textarea value={itemForm.notes || ''} onChange={e => setItemForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notas técnicas, condiciones de uso..." rows={2} />
        </FormField>
      </Modal>

      {/* Category Modal */}
      <Modal
        open={showCatModal}
        onClose={() => setShowCatModal(false)}
        title="Nueva categoría"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCatModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={saveCat}>Crear categoría</Button>
          </>
        }
      >
        <FormField label="Nombre" required>
          <Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
            placeholder="SONIDO" />
        </FormField>
        <FormField label="Color">
          <div className="flex items-center gap-3">
            <input type="color" value={catForm.color}
              onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300" />
            <span className="text-sm text-gray-600">{catForm.color}</span>
          </div>
        </FormField>
      </Modal>
    </div>
  )
}
