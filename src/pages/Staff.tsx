import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Phone, Mail } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Modal, FormField, Input, Select } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import type { Staff as StaffType } from '../types'

interface StaffProps {
  companyId: string
}

export function Staff({ companyId }: StaffProps) {
  const [staff, setStaff] = useState<StaffType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<StaffType>>({
    name: '', role: '', phone: '', email: '', day_rate: 0, available: true,
  })

  const roles = ['Técnico FOH', 'Técnico Monitores', 'Técnico LX', 'Técnico Video', 'Rigger', 'Chófer', 'Producción', 'Otro']

  function load() {
    supabase.from('staff').select('*').eq('company_id', companyId).order('name')
      .then(({ data }) => { setStaff(data || []); setLoading(false) })
  }

  useEffect(() => { load() }, [companyId])

  function openNew() {
    setEditingId(null)
    setForm({ name: '', role: '', phone: '', email: '', day_rate: 0, available: true })
    setShowModal(true)
  }

  function openEdit(s: StaffType) {
    setEditingId(s.id)
    setForm({ ...s })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    try {
      if (editingId) {
        await supabase.from('staff').update(form).eq('id', editingId)
      } else {
        await supabase.from('staff').insert({ ...form, company_id: companyId })
      }
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1">
      <Header
        title="Personal técnico"
        subtitle={`${staff.length} técnicos`}
        actions={
          <Button icon={<Plus size={16} />} onClick={openNew}>Añadir técnico</Button>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium mb-4">No hay técnicos registrados</p>
            <Button onClick={openNew} icon={<Plus size={16} />}>Añadir técnico</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${s.available ? 'bg-success' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-500">{s.available ? 'Disponible' : 'No disponible'}</span>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{s.name}</p>
                <p className="text-sm text-primary-mid">{s.role}</p>
                {s.day_rate && (
                  <p className="text-sm font-semibold text-accent mt-1">{s.day_rate} €/día</p>
                )}
                <div className="mt-3 space-y-1">
                  {s.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone size={11} />{s.phone}
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail size={11} />{s.email}
                    </div>
                  )}
                </div>
                <button onClick={() => openEdit(s)}
                  className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                  <Edit2 size={11} /> Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar técnico' : 'Nuevo técnico'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={save}>Guardar</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Nombre completo" required>
              <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Pedro Martínez" />
            </FormField>
          </div>
          <FormField label="Rol">
            <Select value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="">Seleccionar rol...</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </FormField>
          <FormField label="Tarifa/día (€)">
            <Input type="number" min={0} value={form.day_rate || 0}
              onChange={e => setForm(f => ({ ...f, day_rate: parseFloat(e.target.value) || 0 }))} />
          </FormField>
          <FormField label="Teléfono">
            <Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="pedro@rcapro.es" />
          </FormField>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.available}
              onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
              className="w-4 h-4 text-primary rounded border-gray-300" />
            <label htmlFor="available" className="text-sm text-gray-700">Disponible para eventos</label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
