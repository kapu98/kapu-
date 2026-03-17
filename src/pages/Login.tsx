import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, FormField } from '../components/ui/Modal'

interface LoginProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string, fullName: string, companyName: string) => Promise<unknown>
}

export function Login({ onSignIn, onSignUp }: LoginProps) {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
  })

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await onSignUp(form.email, form.password, form.fullName, form.companyName)
      } else {
        await onSignIn(form.email, form.password)
      }
      navigate('/')
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0D2B3E 0%, #1A5276 60%, #2E86C1 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Event.ia
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Del rider<br />al contra-rider<br />en minutos.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            La plataforma de gestión audiovisual diseñada por técnicos, para técnicos.
            Analiza riders con IA, genera presupuestos y documentos técnicos en segundos.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Análisis IA', desc: 'Rider → propuesta técnica automática' },
              { label: 'Presupuestos', desc: 'PDF profesional en un click' },
              { label: 'Contra-riders', desc: 'Word editable generado al instante' },
              { label: 'Inventario', desc: 'Catálogo con precios y stock' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-blue-200 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-xs">
          Desarrollado para RCA Pro Audiovisuales Toledo · rcapro.es
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Zap size={17} className="text-white" />
            </div>
            <span className="font-bold text-xl text-primary" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Event.ia
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {isRegister
                ? 'Crea tu cuenta y registra tu empresa audiovisual.'
                : 'Accede a tu plataforma de gestión audiovisual.'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <FormField label="Nombre completo" required>
                    <Input
                      type="text"
                      value={form.fullName}
                      onChange={e => update('fullName', e.target.value)}
                      placeholder="Pedro Martínez"
                      required
                    />
                  </FormField>
                  <FormField label="Nombre de la empresa" required>
                    <Input
                      type="text"
                      value={form.companyName}
                      onChange={e => update('companyName', e.target.value)}
                      placeholder="RCA Pro Audiovisuales"
                      required
                    />
                  </FormField>
                </>
              )}

              <FormField label="Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="pedro@rcapro.es"
                  required
                />
              </FormField>

              <FormField label="Contraseña" required>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormField>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {isRegister ? 'Crear cuenta' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsRegister(v => !v); setError('') }}
                className="text-sm text-primary hover:underline"
              >
                {isRegister
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
