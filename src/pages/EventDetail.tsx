import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText, Receipt, FolderOpen, CheckCircle, Lock, ChevronDown,
  Upload, Loader, AlertCircle, Download, Edit2, ArrowLeft,
  Music, MapPin, Calendar, Clock, Zap
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { EventStatusBadge, BudgetStatusBadge, CoverageBadge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Modal, FormField, Input, Select, Textarea } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import { useRiderAnalysis } from '../hooks/useRiderAnalysis'
import { generateBudgetPDF } from '../lib/pdf-generator'
import { generateContraRiderDocx, buildContraRiderContent } from '../lib/docx-generator'
import type { Event, Rider, Budget, BudgetLine, BudgetLineCategory, Company, RiderAnalysis } from '../types'

interface EventDetailProps {
  companyId: string
  company: Company | null
}

type Step = 'rider' | 'analysis' | 'budget' | 'confirm' | 'documents'

const STEPS: { key: Step; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'rider', label: 'Rider', icon: FileText },
  { key: 'analysis', label: 'Análisis IA', icon: Zap },
  { key: 'budget', label: 'Presupuesto', icon: Receipt },
  { key: 'confirm', label: 'Confirmación', icon: CheckCircle },
  { key: 'documents', label: 'Documentos', icon: FolderOpen },
]

export function EventDetail({ companyId, company }: EventDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [rider, setRider] = useState<Rider | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [lines, setLines] = useState<BudgetLine[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<Step>('rider')
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ANTHROPIC_API_KEY || '')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  const { analyzing, uploading, error: analysisError, uploadRider, updateAnalysis } = useRiderAnalysis(companyId)

  const loadEvent = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data: ev } = await supabase
        .from('events')
        .select('*, client:clients(*)')
        .eq('id', id)
        .single()
      setEvent(ev)

      const { data: riders } = await supabase
        .from('riders')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (riders?.[0]) setRider(riders[0])

      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (budgets?.[0]) {
        setBudget(budgets[0])
        const { data: blines } = await supabase
          .from('budget_lines')
          .select('*')
          .eq('budget_id', budgets[0].id)
          .order('sort_order')
        setLines(blines || [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadEvent() }, [loadEvent])

  // Determine current step based on state
  useEffect(() => {
    if (!rider) setActiveStep('rider')
    else if (!rider.analyzed) setActiveStep('analysis')
    else if (!budget) setActiveStep('budget')
    else if (budget.status !== 'aceptado') setActiveStep('confirm')
    else setActiveStep('documents')
  }, [rider, budget])

  // --- Rider upload ---
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !event) return
    if (!apiKey) { setShowApiKeyModal(true); return }

    try {
      const newRider = await uploadRider(file, event.id, event.artist || 'Artista', apiKey)
      setRider(newRider)
      await loadEvent()
      // Update event status
      await supabase.from('events').update({ status: 'presupuestado' }).eq('id', event.id)
    } catch {
      // error shown in hook
    }
  }

  // --- Budget creation from analysis ---
  async function createBudgetFromAnalysis() {
    if (!event || !rider?.analysis_json) return

    const analysis = rider.analysis_json
    const newLines: Partial<BudgetLine>[] = []
    let order = 0

    // Sound
    if (analysis.sound.pa.rca_proposal) {
      newLines.push({ category: 'sonido', description: 'Sistema PA Principal', detail: analysis.sound.pa.rca_proposal, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }
    if (analysis.sound.foh_console.rca_proposal) {
      newLines.push({ category: 'sonido', description: 'Mesa FOH', detail: analysis.sound.foh_console.rca_proposal, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }
    if (analysis.sound.mon_console.rca_proposal) {
      newLines.push({ category: 'sonido', description: 'Mesa Monitores', detail: analysis.sound.mon_console.rca_proposal, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }
    if (analysis.sound.iem_systems.rca_proposal) {
      newLines.push({ category: 'sonido', description: 'Sistemas IEM', detail: analysis.sound.iem_systems.rca_proposal, quantity: analysis.sound.iem_systems.available_count || 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }
    if (analysis.sound.microphones.length > 0) {
      newLines.push({ category: 'sonido', description: 'Microfonía completa', detail: `${analysis.sound.microphones.length} canales según rider`, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }
    if (analysis.sound.monitors.length > 0) {
      newLines.push({ category: 'sonido', description: 'Monitores escenario', detail: `${analysis.sound.monitors.length} mezclas de monitores`, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }

    // Lighting
    if (analysis.lighting.console.rca_proposal) {
      newLines.push({ category: 'iluminacion', description: 'Consola iluminación', detail: analysis.lighting.console.rca_proposal, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
    }
    for (const fix of analysis.lighting.fixtures) {
      if (fix.qty_available > 0) {
        newLines.push({ category: 'iluminacion', description: fix.type, detail: `${fix.rca_model} (×${fix.qty_available})`, quantity: fix.qty_available, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
      }
    }

    // Video
    for (const screen of analysis.video.screens) {
      if (screen.status !== 'pending') {
        newLines.push({ category: 'video', description: `Pantalla ${screen.size}`, detail: screen.type, quantity: 1, days: event.days, ratio: event.ratio, unit_price: 0, subtotal: 0, sort_order: order++ })
      }
    }

    // Generate budget number
    const year = new Date().getFullYear().toString().slice(2)
    const { count } = await supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('company_id', companyId)
    const num = String((count || 0) + 1).padStart(4, '0')
    const budgetNumber = `P${year}-${num}`

    const { data: newBudget, error } = await supabase
      .from('budgets')
      .insert({
        event_id: event.id,
        company_id: companyId,
        budget_number: budgetNumber,
        days: event.days,
        ratio: event.ratio,
        status: 'borrador',
      })
      .select()
      .single()

    if (error) throw error

    // Insert lines
    if (newLines.length > 0) {
      await supabase.from('budget_lines').insert(
        newLines.map(l => ({ ...l, budget_id: newBudget.id }))
      )
    }

    await loadEvent()
  }

  // --- Budget line update ---
  async function updateLine(lineId: string, field: string, value: unknown) {
    const updatedLines = lines.map(l => {
      if (l.id !== lineId) return l
      const updated = { ...l, [field]: value }
      if (['quantity', 'days', 'ratio', 'unit_price'].includes(field)) {
        updated.subtotal = updated.quantity * updated.days * updated.ratio * updated.unit_price
      }
      return updated
    })
    setLines(updatedLines)

    // Update in DB
    const line = updatedLines.find(l => l.id === lineId)!
    await supabase.from('budget_lines').update({
      [field]: value,
      subtotal: line.subtotal,
    }).eq('id', lineId)

    // Recalculate budget totals
    await recalcBudget(updatedLines)
  }

  async function recalcBudget(currentLines: BudgetLine[]) {
    if (!budget) return
    const byCategory = (cat: BudgetLineCategory) =>
      currentLines.filter(l => l.category === cat).reduce((s, l) => s + l.subtotal, 0)

    const subtotalSound = byCategory('sonido')
    const subtotalLighting = byCategory('iluminacion')
    const subtotalVideo = byCategory('video')
    const subtotalStaff = byCategory('personal')
    const base = subtotalSound + subtotalLighting + subtotalVideo + subtotalStaff +
      byCategory('transporte') + byCategory('otro')
    const vat = base * (budget.vat_rate / 100)
    const total = base + vat

    const updates = {
      subtotal_sound: subtotalSound,
      subtotal_lighting: subtotalLighting,
      subtotal_video: subtotalVideo,
      subtotal_staff: subtotalStaff,
      base_amount: base,
      vat_amount: vat,
      total_amount: total,
    }

    await supabase.from('budgets').update(updates).eq('id', budget.id)
    setBudget(b => b ? { ...b, ...updates } : b)
  }

  async function addBudgetLine(category: BudgetLineCategory) {
    if (!budget) return
    const { data } = await supabase
      .from('budget_lines')
      .insert({
        budget_id: budget.id,
        category,
        description: 'Nueva línea',
        quantity: 1,
        days: event?.days || 1,
        ratio: event?.ratio || 1,
        unit_price: 0,
        subtotal: 0,
        sort_order: lines.length,
      })
      .select()
      .single()
    if (data) setLines(l => [...l, data])
  }

  async function deleteLine(lineId: string) {
    await supabase.from('budget_lines').delete().eq('id', lineId)
    const updated = lines.filter(l => l.id !== lineId)
    setLines(updated)
    await recalcBudget(updated)
  }

  // --- Accept budget + unlock documents ---
  async function acceptBudget() {
    if (!budget || !event) return
    await supabase.from('budgets').update({ status: 'aceptado' }).eq('id', budget.id)
    await supabase.from('events').update({ status: 'confirmado' }).eq('id', event.id)
    await loadEvent()
  }

  // --- Generate contra-rider ---
  async function generateContraRider() {
    if (!event || !rider?.analysis_json || !company) return
    const content = buildContraRiderContent(rider.analysis_json, event, company)
    const filename = `ContraRider_${event.artist || 'Artista'}_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`
    await generateContraRiderDocx(content, filename)
  }

  // --- Generate PDF ---
  function handleGeneratePDF() {
    if (!budget || !event || !company) return
    generateBudgetPDF(budget, lines, event, company)
  }

  // --- Determine step access ---
  const canAccessStep = (step: Step): boolean => {
    if (step === 'rider') return true
    if (step === 'analysis') return !!rider
    if (step === 'budget') return !!rider?.analyzed
    if (step === 'confirm') return !!budget
    if (step === 'documents') return budget?.status === 'aceptado'
    return false
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader size={24} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Evento no encontrado
      </div>
    )
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === activeStep)

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={event.name}
        subtitle={event.artist ? `Artista: ${event.artist}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <EventStatusBadge status={event.status} />
            <Button variant="ghost" size="sm" onClick={() => navigate('/eventos')}>
              <ArrowLeft size={14} className="mr-1" /> Eventos
            </Button>
          </div>
        }
      />

      <div className="flex flex-1">
        {/* Stepper sidebar */}
        <div className="w-60 bg-white border-r border-gray-200 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Flujo del evento</p>

          {STEPS.map((step, i) => {
            const isActive = activeStep === step.key
            const isCompleted = i < currentStepIndex
            const isLocked = !canAccessStep(step.key)
            const Icon = step.icon

            return (
              <button
                key={step.key}
                onClick={() => !isLocked && setActiveStep(step.key)}
                disabled={isLocked}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all
                  ${isActive ? 'bg-primary-light border-l-4 border-primary text-primary font-semibold' : ''}
                  ${isCompleted && !isActive ? 'text-success bg-green-50 border-l-4 border-success' : ''}
                  ${isLocked ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-50'}
                  ${!isActive && !isCompleted && !isLocked ? 'text-gray-600' : ''}
                `}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                  ${isActive ? 'bg-primary text-white' : ''}
                  ${isCompleted ? 'bg-success text-white' : ''}
                  ${isLocked ? 'bg-gray-100 text-gray-300' : ''}
                  ${!isActive && !isCompleted && !isLocked ? 'bg-gray-200 text-gray-500' : ''}
                `}>
                  {isCompleted ? '✓' : isLocked ? <Lock size={10} /> : i + 1}
                </div>
                <div>
                  <div className="leading-tight">{step.label}</div>
                  {isLocked && <div className="text-xs text-gray-300">Bloqueado</div>}
                </div>
              </button>
            )
          })}

          {/* Event meta */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
            {event.event_date && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} />
                {new Date(event.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
            {(event.venue || event.city) && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} />
                {event.venue}{event.city ? `, ${event.city}` : ''}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              {event.days} días · ratio x{event.ratio}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 p-6 overflow-y-auto">

          {/* STEP 1: Rider Upload */}
          {activeStep === 'rider' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                Rider técnico del artista
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Sube el PDF del rider. La IA lo analizará y cruzará con el inventario de RCA Pro.
              </p>

              {analysisError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{analysisError}</p>
                </div>
              )}

              {!rider ? (
                <label className={`
                  flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl
                  cursor-pointer transition-all
                  ${uploading || analyzing ? 'border-primary bg-primary-light' : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary-light/50'}
                `}>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload}
                    disabled={uploading || analyzing} />
                  {uploading ? (
                    <div className="text-center">
                      <Loader size={32} className="animate-spin text-primary mx-auto mb-3" />
                      <p className="text-primary font-medium">Subiendo rider...</p>
                    </div>
                  ) : analyzing ? (
                    <div className="text-center">
                      <Zap size={32} className="text-accent mx-auto mb-3 animate-pulse" />
                      <p className="text-accent font-semibold">Analizando rider técnico...</p>
                      <p className="text-gray-400 text-sm mt-1">La IA está cruzando el rider con el inventario RCA</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="text-gray-400 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">Arrastra el PDF del rider aquí</p>
                      <p className="text-gray-400 text-sm mt-1">o haz click para seleccionar</p>
                      <p className="text-xs text-gray-300 mt-3">Solo archivos PDF</p>
                    </div>
                  )}
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <FileText size={20} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rider.file_name}</p>
                      <p className="text-xs text-gray-400">
                        {rider.analyzed ? '✓ Analizado por IA' : 'Pendiente de análisis'}
                      </p>
                    </div>
                    {rider.analyzed && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveStep('analysis')}>
                        Ver análisis
                      </Button>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <p className="text-primary text-sm font-medium mb-2">¿Quieres subir otro rider?</p>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                      <Button variant="secondary" size="sm" icon={<Upload size={14} />}>
                        Subir nueva versión
                      </Button>
                    </label>
                  </div>
                </div>
              )}

              {!apiKey && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-800 text-sm font-medium mb-2">⚠ API Key de Anthropic no configurada</p>
                  <p className="text-yellow-700 text-xs mb-3">
                    Para el análisis IA necesitas configurar tu API key de Anthropic.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => setShowApiKeyModal(true)}>
                    Configurar API Key
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Analysis */}
          {activeStep === 'analysis' && rider?.analysis_json && (
            <AnalysisView
              analysis={rider.analysis_json}
              onUpdate={(analysis) => {
                updateAnalysis(rider.id, analysis)
                setRider(r => r ? { ...r, analysis_json: analysis } : r)
              }}
              onGenerateBudget={createBudgetFromAnalysis}
              hasBudget={!!budget}
            />
          )}

          {/* STEP 3: Budget */}
          {activeStep === 'budget' && (
            <BudgetEditor
              budget={budget}
              lines={lines}
              event={event}
              onUpdateLine={updateLine}
              onDeleteLine={deleteLine}
              onAddLine={addBudgetLine}
              onGeneratePDF={handleGeneratePDF}
              onCreateBudget={createBudgetFromAnalysis}
            />
          )}

          {/* STEP 4: Confirm */}
          {activeStep === 'confirm' && budget && (
            <ConfirmStep budget={budget} event={event} lines={lines} onAccept={acceptBudget} />
          )}

          {/* STEP 5: Documents */}
          {activeStep === 'documents' && budget?.status === 'aceptado' && (
            <DocumentsStep
              event={event}
              budget={budget}
              lines={lines}
              onGeneratePDF={handleGeneratePDF}
              onGenerateContraRider={generateContraRider}
            />
          )}
        </div>
      </div>

      {/* API Key modal */}
      <Modal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Configurar API Key Anthropic"
        size="sm"
        footer={<Button onClick={() => setShowApiKeyModal(false)}>Guardar</Button>}
      >
        <FormField label="API Key" hint="Puedes obtenerla en console.anthropic.com">
          <Input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
          />
        </FormField>
      </Modal>
    </div>
  )
}

// ============================================
// Analysis View Component
// ============================================

function AnalysisView({
  analysis,
  onUpdate,
  onGenerateBudget,
  hasBudget,
}: {
  analysis: RiderAnalysis
  onUpdate: (a: RiderAnalysis) => void
  onGenerateBudget: () => Promise<void>
  hasBudget: boolean
}) {
  const [generating, setGenerating] = useState(false)
  const summary = analysis.summary

  async function handleGenerate() {
    setGenerating(true)
    try { await onGenerateBudget() }
    finally { setGenerating(false) }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>
            Análisis IA del rider
          </h3>
          {analysis.artist && (
            <p className="text-primary-mid font-medium">{analysis.artist} {analysis.tour ? `· ${analysis.tour}` : ''}</p>
          )}
        </div>
        {!hasBudget && (
          <Button loading={generating} icon={<Receipt size={16} />} onClick={handleGenerate}>
            Generar presupuesto
          </Button>
        )}
        {hasBudget && (
          <div className="flex items-center gap-2 text-sm text-success font-medium">
            <CheckCircle size={16} />
            Presupuesto generado
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'covered', label: 'Cubierto', items: summary.covered, color: 'bg-green-50 border-green-200 text-green-800' },
          { key: 'partial', label: 'Parcial', items: summary.partial, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { key: 'pending', label: 'Pendiente', items: summary.pending, color: 'bg-red-50 border-red-200 text-red-800' },
          { key: 'na', label: 'No aplica', items: summary.not_applicable, color: 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map(({ key, label, items, color }) => (
          <div key={key} className={`rounded-xl border p-3 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{items.length}</p>
            <div className="mt-2 space-y-0.5">
              {items.slice(0, 3).map((item, i) => (
                <p key={i} className="text-xs truncate opacity-80">{item}</p>
              ))}
              {items.length > 3 && <p className="text-xs opacity-60">+{items.length - 3} más</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Contacts */}
      {analysis.contacts.length > 0 && (
        <Card title="Contactos técnicos" className="mb-4">
          <div className="grid grid-cols-2 gap-3">
            {analysis.contacts.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                <p className="text-xs text-primary-mid">{c.role}</p>
                {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sound section */}
      <Card title="🎵 Sonido" className="mb-4">
        <div className="space-y-3">
          {/* PA */}
          <AnalysisRow label="PA Principal" item={analysis.sound.pa} />
          <AnalysisRow label="Mesa FOH" item={analysis.sound.foh_console} />
          <AnalysisRow label="Mesa Monitores" item={analysis.sound.mon_console} />
          <AnalysisRow label="Sistemas IEM" item={analysis.sound.iem_systems} />

          {/* Microphones */}
          {analysis.sound.microphones.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                Microfonía ({analysis.sound.microphones.length} canales)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">CH</th>
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Instrumento</th>
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Rider pide</th>
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">RCA propone</th>
                      <th className="px-2 py-1.5 text-center text-gray-500 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {analysis.sound.microphones.map((mic, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-mono text-gray-600">{mic.channel}</td>
                        <td className="px-2 py-1.5 font-medium text-gray-800">{mic.instrument}</td>
                        <td className="px-2 py-1.5 text-gray-500">{mic.requested}</td>
                        <td className="px-2 py-1.5 text-primary font-medium">{mic.proposal}</td>
                        <td className="px-2 py-1.5 text-center"><CoverageBadge status={mic.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monitors */}
          {analysis.sound.monitors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                Monitores escenario
              </p>
              <div className="grid grid-cols-2 gap-2">
                {analysis.sound.monitors.map((mon, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 text-xs">
                    <span className="font-medium text-gray-700">Bus {mon.bus}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-600">{mon.musician}</span>
                    <div className="text-primary mt-0.5 font-medium">{mon.proposal || mon.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lighting */}
      <Card title="💡 Iluminación" className="mb-4">
        <div className="space-y-3">
          <AnalysisRow label="Consola" item={analysis.lighting.console} />

          {analysis.lighting.fixtures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Fixtures</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Tipo</th>
                      <th className="px-2 py-1.5 text-center text-gray-500 font-medium">Pide</th>
                      <th className="px-2 py-1.5 text-center text-gray-500 font-medium">RCA tiene</th>
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">Modelo RCA</th>
                      <th className="px-2 py-1.5 text-center text-gray-500 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {analysis.lighting.fixtures.map((fix, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-medium text-gray-800">{fix.type}</td>
                        <td className="px-2 py-1.5 text-center text-gray-500">{fix.qty_requested}</td>
                        <td className="px-2 py-1.5 text-center font-semibold text-primary">{fix.qty_available}</td>
                        <td className="px-2 py-1.5 text-primary">{fix.rca_model}</td>
                        <td className="px-2 py-1.5 text-center"><CoverageBadge status={fix.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analysis.lighting.fx.map((fx, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
              <span className="font-medium text-gray-700">{fx.type}</span>
              <span className="text-gray-500 mx-2">{fx.requested} → {fx.proposal}</span>
              <CoverageBadge status={fx.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Video */}
      {analysis.video.screens.length > 0 && (
        <Card title="🎬 Video" className="mb-4">
          <div className="space-y-2">
            {analysis.video.screens.map((screen, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{screen.size}</span>
                  <span className="text-xs text-gray-500 ml-2">{screen.type}</span>
                </div>
                <CoverageBadge status={screen.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function AnalysisRow({ label, item }: { label: string; item: { requested: string; rca_proposal: string; status: string; notes?: string } }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-50">
      <div className="col-span-2 text-xs font-semibold text-gray-500">{label}</div>
      <div className="col-span-4 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">{item.requested || '—'}</div>
      <div className="col-span-1 text-center text-gray-300 text-xs">→</div>
      <div className="col-span-4 text-xs text-primary font-medium bg-primary-light rounded px-2 py-1">
        {item.rca_proposal || '—'}
      </div>
      <div className="col-span-1 flex justify-end">
        <CoverageBadge status={item.status as import('../types').CoverageStatus} />
      </div>
    </div>
  )
}

// ============================================
// Budget Editor Component
// ============================================

function BudgetEditor({
  budget,
  lines,
  event,
  onUpdateLine,
  onDeleteLine,
  onAddLine,
  onGeneratePDF,
  onCreateBudget,
}: {
  budget: Budget | null
  lines: BudgetLine[]
  event: Event
  onUpdateLine: (id: string, field: string, value: unknown) => void
  onDeleteLine: (id: string) => void
  onAddLine: (cat: BudgetLineCategory) => void
  onGeneratePDF: () => void
  onCreateBudget: () => Promise<void>
}) {
  const [creating, setCreating] = useState(false)
  const categories: { key: BudgetLineCategory; label: string; color: string }[] = [
    { key: 'sonido', label: 'Sonido', color: 'text-blue-700 bg-blue-50' },
    { key: 'iluminacion', label: 'Iluminación', color: 'text-purple-700 bg-purple-50' },
    { key: 'video', label: 'Video', color: 'text-green-700 bg-green-50' },
    { key: 'personal', label: 'Personal', color: 'text-orange-700 bg-orange-50' },
    { key: 'transporte', label: 'Transporte', color: 'text-gray-700 bg-gray-100' },
    { key: 'otro', label: 'Otro', color: 'text-gray-700 bg-gray-100' },
  ]

  if (!budget) {
    return (
      <div className="max-w-2xl">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Presupuesto</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <Receipt size={36} className="mx-auto text-yellow-500 mb-3" />
          <p className="font-medium text-yellow-800 mb-2">No hay presupuesto creado</p>
          <p className="text-yellow-700 text-sm mb-4">
            Primero analiza el rider con IA y luego genera el presupuesto automáticamente.
          </p>
          <Button
            loading={creating}
            onClick={async () => { setCreating(true); await onCreateBudget(); setCreating(false) }}
          >
            Generar presupuesto desde análisis
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            {budget.budget_number}
          </h3>
          <p className="text-gray-500 text-sm">{event.days} días · ratio x{event.ratio}</p>
        </div>
        <div className="flex items-center gap-3">
          <BudgetStatusBadge status={budget.status} />
          <Button variant="secondary" icon={<Download size={14} />} onClick={onGeneratePDF}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Lines by category */}
      {categories.map(({ key, label, color }) => {
        const catLines = lines.filter(l => l.category === key)
        const catTotal = catLines.reduce((s, l) => s + l.subtotal, 0)

        return (
          <div key={key} className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${color}`}>
                  {label}
                </span>
                {catLines.length > 0 && (
                  <span className="text-sm font-semibold text-gray-700">
                    {catTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onAddLine(key)}>
                + Línea
              </Button>
            </div>

            {catLines.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="px-3 py-2 text-left font-semibold">Descripción</th>
                      <th className="px-3 py-2 text-center font-semibold w-16">Ud.</th>
                      <th className="px-3 py-2 text-center font-semibold w-16">Días</th>
                      <th className="px-3 py-2 text-center font-semibold w-20">Ratio</th>
                      <th className="px-3 py-2 text-right font-semibold w-24">€/día</th>
                      <th className="px-3 py-2 text-right font-semibold w-24">Subtotal</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {catLines.map(line => (
                      <tr key={line.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2">
                          <input
                            className="w-full bg-transparent border-none outline-none text-gray-800 font-medium"
                            value={line.description}
                            onChange={e => onUpdateLine(line.id, 'description', e.target.value)}
                          />
                          {line.detail && (
                            <input
                              className="w-full bg-transparent border-none outline-none text-gray-400 text-xs mt-0.5"
                              value={line.detail}
                              onChange={e => onUpdateLine(line.id, 'detail', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={1}
                            className="w-full text-center bg-transparent border-none outline-none"
                            value={line.quantity}
                            onChange={e => onUpdateLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={1}
                            className="w-full text-center bg-transparent border-none outline-none"
                            value={line.days}
                            onChange={e => onUpdateLine(line.id, 'days', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0} step={0.1}
                            className="w-full text-center bg-transparent border-none outline-none"
                            value={line.ratio}
                            onChange={e => onUpdateLine(line.id, 'ratio', parseFloat(e.target.value) || 1)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={0}
                            className="w-full text-right bg-transparent border-none outline-none"
                            value={line.unit_price}
                            onChange={e => onUpdateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-primary">
                          {line.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => onDeleteLine(line.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 w-72">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Base imponible</span>
              <span className="font-medium">{budget.base_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IVA ({budget.vat_rate}%)</span>
              <span>{budget.vat_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary border-t border-gray-200 pt-2 mt-2"
              style={{ fontFamily: 'Space Grotesk' }}>
              <span>TOTAL</span>
              <span className="text-accent">{budget.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Confirm Step
// ============================================

function ConfirmStep({
  budget,
  event,
  lines,
  onAccept,
}: {
  budget: Budget
  event: Event
  lines: BudgetLine[]
  onAccept: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try { await onAccept() }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl">
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Confirmación del presupuesto</h3>

      {budget.status === 'aceptado' ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle size={40} className="mx-auto text-success mb-3" />
          <p className="font-semibold text-success text-lg">¡Presupuesto confirmado!</p>
          <p className="text-green-700 text-sm mt-2">
            Ya puedes generar el contra-rider y la lista de carga.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="font-semibold text-gray-900 mb-3">{budget.budget_number}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sonido</span>
                <span>{budget.subtotal_sound.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Iluminación</span>
                <span>{budget.subtotal_lighting.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Video</span>
                <span>{budget.subtotal_video.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Personal</span>
                <span>{budget.subtotal_staff.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-primary">
                <span>TOTAL (IVA inc.)</span>
                <span className="text-accent text-lg">{budget.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm font-medium mb-1">⚠ Antes de confirmar</p>
            <p className="text-yellow-700 text-xs">
              Al marcar como aceptado se confirma el evento y se desbloquea la generación de contra-rider y lista de carga.
              Esta acción no se puede deshacer fácilmente.
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            variant="success"
            loading={loading}
            icon={<CheckCircle size={18} />}
            onClick={handle}
          >
            Marcar presupuesto como ACEPTADO
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Documents Step
// ============================================

function DocumentsStep({
  event,
  budget,
  lines,
  onGeneratePDF,
  onGenerateContraRider,
}: {
  event: Event
  budget: Budget
  lines: BudgetLine[]
  onGeneratePDF: () => void
  onGenerateContraRider: () => Promise<void>
}) {
  const [generating, setGenerating] = useState<string | null>(null)

  async function handleContraRider() {
    setGenerating('contra')
    try { await onGenerateContraRider() }
    finally { setGenerating(null) }
  }

  // Generate load list
  function generateLoadList() {
    const grouped = lines.reduce((acc, line) => {
      if (!acc[line.category]) acc[line.category] = []
      acc[line.category].push(line)
      return acc
    }, {} as Record<string, BudgetLine[]>)

    const text = [
      `LISTA DE CARGA — ${event.name}`,
      `Fecha: ${event.event_date || ''}`,
      `Artista: ${event.artist || ''}`,
      '',
      ...Object.entries(grouped).map(([cat, items]) => [
        `\n=== ${cat.toUpperCase()} ===`,
        ...items.map(i => `  [ ] ${i.quantity}x  ${i.description}${i.detail ? ` (${i.detail})` : ''}`),
      ]).flat(),
      '',
      `Generado con Event.ia`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ListaCarga_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Documentos del evento</h3>
      <p className="text-gray-500 text-sm mb-6">
        El presupuesto está confirmado. Genera y descarga los documentos técnicos.
      </p>

      <div className="space-y-4">
        {/* Presupuesto PDF */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt size={20} className="text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Presupuesto PDF</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Para el cliente/promotor. Con precios, IVA y totales.
              </p>
              <p className="text-xs text-gray-400 mt-1">{budget.budget_number} · {budget.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
            </div>
            <Button
              icon={<Download size={14} />}
              onClick={onGeneratePDF}
            >
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Contra-rider */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Contra-Rider (.docx)</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Para el técnico de producción del artista. Sin precios.
              </p>
              <p className="text-xs text-gray-400 mt-1">Generado desde el análisis IA del rider original</p>
            </div>
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              loading={generating === 'contra'}
              onClick={handleContraRider}
            >
              Descargar .docx
            </Button>
          </div>
        </div>

        {/* Lista de carga */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FolderOpen size={20} className="text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Lista de carga (interna)</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Para el equipo de RCA. Lista de equipos para el camión.
              </p>
              <p className="text-xs text-gray-400 mt-1">{lines.length} partidas · {event.days} días</p>
            </div>
            <Button
              variant="ghost"
              icon={<Download size={14} />}
              onClick={generateLoadList}
            >
              Descargar lista
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
