import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useEvents } from './hooks/useEvents'
import { useInventory } from './hooks/useInventory'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Events } from './pages/Events'
import { EventDetail } from './pages/EventDetail'
import { Riders } from './pages/Riders'
import { Budgets } from './pages/Budgets'
import { Documents } from './pages/Documents'
import { Staff } from './pages/Staff'
import { Settings } from './pages/Settings'
import { Loader, Zap } from 'lucide-react'

function AppContent() {
  const { user, profile, company, loading, signIn, signUp, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap size={24} className="text-white" />
          </div>
          <Loader size={20} className="animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Cargando Event.ia...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login onSignIn={signIn} onSignUp={signUp} />
  }

  const companyId = profile?.company_id

  // Show setup screen if no company
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Configurando tu empresa
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Tu cuenta está lista. Ahora configura los datos de tu empresa audiovisual en Supabase.
          </p>
          <p className="text-xs text-gray-400">
            Si ves este mensaje, verifica que el trigger de Supabase esté activo y que hayas completado el proceso de registro.
          </p>
          <button
            onClick={() => signOut()}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppRouter
      companyId={companyId}
      company={company}
      profile={profile}
      onSignOut={signOut}
      onCompanyUpdate={() => {}}
    />
  )
}

function AppRouter({
  companyId,
  company,
  profile,
  onSignOut,
  onCompanyUpdate,
}: {
  companyId: string
  company: import('./types').Company | null
  profile: import('./types').UserProfile | null
  onSignOut: () => void
  onCompanyUpdate: (c: import('./types').Company) => void
}) {
  const { events } = useEvents(companyId)
  const { items } = useInventory(companyId)

  return (
    <Layout company={company} profile={profile} onSignOut={onSignOut}>
      <Routes>
        <Route path="/" element={
          <Dashboard events={events} company={company} inventoryCount={items.length} />
        } />
        <Route path="/inventario" element={<Inventory companyId={companyId} />} />
        <Route path="/eventos" element={<Events companyId={companyId} />} />
        <Route path="/eventos/:id" element={<EventDetail companyId={companyId} company={company} />} />
        <Route path="/riders" element={<Riders companyId={companyId} />} />
        <Route path="/presupuestos" element={<Budgets companyId={companyId} />} />
        <Route path="/documentos" element={<Documents companyId={companyId} />} />
        <Route path="/personal" element={<Staff companyId={companyId} />} />
        <Route path="/configuracion" element={
          <Settings
            company={company}
            onCompanyUpdate={onCompanyUpdate}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
