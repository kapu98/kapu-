import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Plus, Search, ChevronRight, MapPin, Music } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { EventStatusBadge } from '../components/ui/Badge'
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal'
import { useEvents } from '../hooks/useEvents'
import { supabase } from '../lib/supabase'
import type { Event, Client } from '../types'

interface EventsProps {
  companyId: string
}

export function Events({ companyId }: EventsProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { events, loading, createEvent } = useEvents(companyId)
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showModal, setShowModal] = useState(searchParams.get('new') === '1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<Partial<Event>>({
    name: '', artist: '', venue: '', city: '', event_date: '',
    setup_date: '', days: 1, ratio: 1.0, status: 'pendiente', notes: '',
  })

  useEffect(() => {
    supabase.from('clients').select('*').eq('company_id', companyId).then(({ data }) => {
      setClients(data || [])
    })
  }, [companyId])

  function upd(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !search || e.name.toLowerCase().includes(q) ||
      e.artist?.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    return matchSearch && matchStatus
  })

  async function handleSave() {
    if (!form.name) { setError('El nombre del evento es obligatorio'); return }
    setSaving(true); setError('')
    try {
      const created = await createEvent(form)
      setShowModal(false)
      navigate(`/eventos/${created.id}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const statusCounts = {
    pendiente: events.filter(e => e.status === 'pendiente').length,
    presupuestado: events.filter(e => e.status === 'presupuestado').length,
    confirmado: events.filter(e => e.status === 'confirmado').length,
    completado: events.filter(e => e.status === 'completado').length,
  }

  return (
    <div className="flex-1">
      <Header
        title="Eventos"
        subtitle={`${events.length} eventos totales`}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Nuevo evento
          </Button>
        }
      />

      <div className="p-6">
        {/* Status filter pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([
            { key: 'all', label: 'Todos', count: events.length },
            { key: 'pendiente', label: 'Pendientes', count: statusCounts.pendiente },
            { key: 'presupuestado', label: 'Presupuestados', count: statusCounts.presupuestado },
            { key: 'confirmado', label: 'Confirmados', count: statusCounts.confirmado },
            { key: 'completado', label: 'Completados', count: statusCounts.completado },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                ${filterStatus === key
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
                }`}
            >
              {label}
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold
                ${filterStatus === key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Buscar por nombre, artista o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Events list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando eventos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay eventos</p>
            <p className="text-gray-400 text-sm mb-4">
              {search ? 'No coincide con la búsqueda' : 'Crea tu primer evento para empezar'}
            </p>
            {!search && <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>Nuevo evento</Button>}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {filtered.map(event => {
              const date = event.event_date ? new Date(event.event_date) : null
              const isUrgent = date && (date.getTime() - Date.now()) < 14 * 24 * 60 * 60 * 1000 && event.status !== 'completado'

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/eventos/${event.id}`)}
                >
                  {/* Date block */}
                  <div className={`w-14 text-center flex-shrink-0 p-2 rounded-xl ${isUrgent ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    {date ? (
                      <>
                        <div className={`text-2xl font-bold leading-none ${isUrgent ? 'text-orange-600' : 'text-primary'}`} style={{ fontFamily: 'Space Grotesk' }}>
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-gray-400 uppercase">
                          {date.toLocaleDateString('es-ES', { month: 'short' })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {date.getFullYear()}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-300 text-xs">TBD</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate">{event.name}</p>
                      {isUrgent && <span className="text-xs text-orange-500 font-medium">· Próximo</span>}
                    </div>
                    {event.artist && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <Music size={11} className="text-primary-mid" />
                        <span className="text-xs text-primary-mid font-medium">{event.artist}</span>
                      </div>
                    )}
                    {(event.venue || event.city) && (
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {event.venue}{event.city ? `, ${event.city}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-2">
                    <EventStatusBadge status={event.status} />
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{event.days}d</span>
                      <span>x{event.ratio}</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create event modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setError('') }}
        title="Nuevo evento"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Crear evento</Button>
          </>
        }
      >
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nombre del evento" required>
            <Input value={form.name || ''} onChange={e => upd('name', e.target.value)}
              placeholder="HUECCO TOUR 2025 — Toledo" />
          </FormField>
          <FormField label="Artista">
            <Input value={form.artist || ''} onChange={e => upd('artist', e.target.value)}
              placeholder="Huecco" />
          </FormField>
          <FormField label="Recinto">
            <Input value={form.venue || ''} onChange={e => upd('venue', e.target.value)}
              placeholder="Recinto Ferial Municipal" />
          </FormField>
          <FormField label="Ciudad">
            <Input value={form.city || ''} onChange={e => upd('city', e.target.value)}
              placeholder="Toledo" />
          </FormField>
          <FormField label="Fecha del evento">
            <Input type="date" value={form.event_date || ''} onChange={e => upd('event_date', e.target.value)} />
          </FormField>
          <FormField label="Fecha de montaje">
            <Input type="date" value={form.setup_date || ''} onChange={e => upd('setup_date', e.target.value)} />
          </FormField>
          <FormField label="Días totales">
            <Input type="number" min={1} value={form.days || 1}
              onChange={e => upd('days', parseInt(e.target.value) || 1)} />
          </FormField>
          <FormField label="Ratio" hint="Multiplicador de uso (1.0 = solo show, 1.5 = montaje+show+desmontaje)">
            <Select value={form.ratio || 1.0} onChange={e => upd('ratio', parseFloat(e.target.value))}>
              <option value={1.0}>x1.0 — Solo show</option>
              <option value={1.2}>x1.2 — Montaje + show</option>
              <option value={1.5}>x1.5 — Montaje + show + desmontaje</option>
              <option value={2.0}>x2.0 — Fin de semana completo</option>
            </Select>
          </FormField>
          <FormField label="Cliente">
            <Select value={form.client_id || ''} onChange={e => upd('client_id', e.target.value || undefined)}>
              <option value="">Sin cliente asignado</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label="Notas">
          <Textarea value={form.notes || ''} onChange={e => upd('notes', e.target.value)}
            placeholder="Observaciones del evento..." rows={2} />
        </FormField>
      </Modal>
    </div>
  )
}
