import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Search, Download, ChevronRight } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { BudgetStatusBadge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import type { Budget } from '../types'

interface BudgetsProps {
  companyId: string
}

export function Budgets({ companyId }: BudgetsProps) {
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<(Budget & { event?: { name: string; artist?: string; event_date?: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('budgets')
      .select('*, event:events(name, artist, event_date)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBudgets(data || [])
        setLoading(false)
      })
  }, [companyId])

  const filtered = budgets.filter(b => {
    const q = search.toLowerCase()
    return !search || b.budget_number.toLowerCase().includes(q) ||
      b.event?.name.toLowerCase().includes(q) ||
      b.event?.artist?.toLowerCase().includes(q)
  })

  const totalAceptado = budgets
    .filter(b => b.status === 'aceptado')
    .reduce((s, b) => s + b.total_amount, 0)

  return (
    <div className="flex-1">
      <Header
        title="Presupuestos"
        subtitle={`${budgets.length} presupuestos · ${totalAceptado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € confirmados`}
      />

      <div className="p-6">
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Buscar por número, evento o artista..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando presupuestos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay presupuestos</p>
            <p className="text-gray-400 text-sm">Los presupuestos se generan desde los eventos</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {filtered.map(budget => (
              <div
                key={budget.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => budget.event_id && navigate(`/eventos/${budget.event_id}`)}
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Receipt size={18} className="text-blue-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-primary">{budget.budget_number}</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{budget.event?.name}</p>
                  {budget.event?.artist && (
                    <p className="text-xs text-primary-mid">{budget.event.artist}</p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-accent" style={{ fontFamily: 'Space Grotesk' }}>
                    {budget.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-xs text-gray-400">{budget.days}d · x{budget.ratio}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <BudgetStatusBadge status={budget.status} />
                  <p className="text-xs text-gray-400">
                    {new Date(budget.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
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
