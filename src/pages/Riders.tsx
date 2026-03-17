import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, Zap, Calendar, ChevronRight, CheckCircle, Clock } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import type { Rider } from '../types'

interface RidersProps {
  companyId: string
}

export function Riders({ companyId }: RidersProps) {
  const navigate = useNavigate()
  const [riders, setRiders] = useState<(Rider & { event?: { name: string; artist?: string; event_date?: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('riders')
      .select('*, event:events(name, artist, event_date)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRiders(data || [])
        setLoading(false)
      })
  }, [companyId])

  const filtered = riders.filter(r => {
    const q = search.toLowerCase()
    return !search || r.artist.toLowerCase().includes(q) || r.event?.name.toLowerCase().includes(q)
  })

  return (
    <div className="flex-1">
      <Header
        title="Riders"
        subtitle={`${riders.length} riders subidos`}
      />

      <div className="p-6">
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Buscar por artista o evento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando riders...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay riders</p>
            <p className="text-gray-400 text-sm mb-4">
              {search ? 'No coincide' : 'Los riders se suben desde la página del evento'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {filtered.map(rider => (
              <div
                key={rider.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => rider.event_id && navigate(`/eventos/${rider.event_id}`)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${rider.analyzed ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {rider.analyzed
                    ? <CheckCircle size={18} className="text-success" />
                    : <Clock size={18} className="text-gray-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{rider.artist}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {rider.event?.name} {rider.file_name ? `· ${rider.file_name}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {rider.analyzed ? (
                    <div className="flex items-center gap-1 text-xs text-success font-medium">
                      <Zap size={12} />
                      Analizado
                    </div>
                  ) : (
                    <Badge color="yellow">Sin analizar</Badge>
                  )}
                  {rider.event?.event_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} />
                      {new Date(rider.event.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                  )}
                  <span className="text-xs text-gray-400">v{rider.version}</span>
                </div>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
