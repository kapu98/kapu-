import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, FileText, Download, Search, ChevronRight } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { supabase } from '../lib/supabase'
import type { Event } from '../types'

interface DocumentsProps {
  companyId: string
}

export function Documents({ companyId }: DocumentsProps) {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('events')
      .select('*, client:clients(*)')
      .eq('company_id', companyId)
      .in('status', ['confirmado', 'completado'])
      .order('event_date', { ascending: false })
      .then(({ data }) => {
        setEvents(data || [])
        setLoading(false)
      })
  }, [companyId])

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    return !search || e.name.toLowerCase().includes(q) || e.artist?.toLowerCase().includes(q)
  })

  return (
    <div className="flex-1">
      <Header
        title="Documentos"
        subtitle="Contra-riders y listas de carga de eventos confirmados"
      />

      <div className="p-6">
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Buscar eventos confirmados..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay documentos disponibles</p>
            <p className="text-gray-400 text-sm">Los documentos se generan cuando el presupuesto está confirmado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(event => (
              <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    {event.artist && <p className="text-sm text-primary-mid">{event.artist}</p>}
                    {event.event_date && (
                      <p className="text-xs text-gray-400">
                        {new Date(event.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full
                    ${event.status === 'confirmado' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                    {event.status}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/eventos/${event.id}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <FileText size={15} />
                    Ver en evento
                  </button>
                  <button
                    onClick={() => navigate(`/eventos/${event.id}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Download size={15} />
                    Contra-rider
                  </button>
                  <button
                    onClick={() => navigate(`/eventos/${event.id}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Download size={15} />
                    Lista de carga
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
