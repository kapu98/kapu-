import React, { useState } from 'react'
import { Settings as SettingsIcon, Save, Building, Key, Database } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField, Input, Textarea } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'
import type { Company } from '../types'

interface SettingsProps {
  company: Company | null
  onCompanyUpdate: (c: Company) => void
}

export function Settings({ company, onCompanyUpdate }: SettingsProps) {
  const [form, setForm] = useState<Partial<Company>>(company || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('anthropic_api_key') || '')
  const [apiKeySaved, setApiKeySaved] = useState(false)

  async function saveCompany() {
    if (!company) return
    setSaving(true)
    try {
      const { data } = await supabase
        .from('companies')
        .update(form)
        .eq('id', company.id)
        .select()
        .single()
      if (data) onCompanyUpdate(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function saveApiKey() {
    localStorage.setItem('anthropic_api_key', apiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  function upd(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  return (
    <div className="flex-1">
      <Header title="Configuración" subtitle="Datos de empresa y configuración técnica" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Company data */}
        <Card title="Datos de la empresa" border actions={
          <Button size="sm" loading={saving} icon={<Save size={14} />} onClick={saveCompany}>
            {saved ? '¡Guardado!' : 'Guardar'}
          </Button>
        }>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre de la empresa" required>
                <Input value={form.name || ''} onChange={e => upd('name', e.target.value)} placeholder="RCA Pro Audiovisuales" />
              </FormField>
              <FormField label="CIF">
                <Input value={form.cif || ''} onChange={e => upd('cif', e.target.value)} placeholder="B12345678" />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={form.email || ''} onChange={e => upd('email', e.target.value)} placeholder="info@rcapro.es" />
              </FormField>
              <FormField label="Teléfono">
                <Input value={form.phone || ''} onChange={e => upd('phone', e.target.value)} placeholder="+34 925 000 000" />
              </FormField>
              <FormField label="Web">
                <Input value={form.website || ''} onChange={e => upd('website', e.target.value)} placeholder="rcapro.es" />
              </FormField>
            </div>
            <FormField label="Dirección">
              <Input value={form.address || ''} onChange={e => upd('address', e.target.value)} placeholder="Calle Mayor 1, 45001 Toledo" />
            </FormField>
          </div>
        </Card>

        {/* API Key */}
        <Card title="API Key Anthropic" border actions={
          <Button size="sm" variant="secondary" icon={<Save size={14} />} onClick={saveApiKey}>
            {apiKeySaved ? '¡Guardada!' : 'Guardar'}
          </Button>
        }>
          <div className="p-4">
            <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
              <Key size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Necesaria para el análisis IA de riders</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Obtén tu API key en <strong>console.anthropic.com</strong>. Se guarda localmente en tu navegador.
                </p>
              </div>
            </div>
            <FormField label="API Key" hint="Formato: sk-ant-api03-...">
              <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
              />
            </FormField>
          </div>
        </Card>

        {/* Supabase info */}
        <Card title="Base de datos" border>
          <div className="p-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Database size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-700">Supabase PostgreSQL</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Configurado' : '✗ No configurado'}
                </p>
                <p className="text-gray-500 text-xs">
                  Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configurado' : '✗ No configurado'}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
              <p className="font-medium mb-1">Primeros pasos:</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                <li>Crea un proyecto en supabase.com</li>
                <li>Ejecuta el schema en <code className="bg-yellow-100 px-1 rounded">supabase/migrations/001_initial.sql</code></li>
                <li>Copia las credenciales al archivo <code className="bg-yellow-100 px-1 rounded">.env</code></li>
                <li>Para cargar datos de RCA Pro ejecuta <code className="bg-yellow-100 px-1 rounded">SELECT seed_rca_inventory('tu_company_id')</code></li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
