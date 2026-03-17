import React from 'react'
import { Sidebar } from './Sidebar'
import type { Company, UserProfile } from '../../types'

interface LayoutProps {
  children: React.ReactNode
  company: Company | null
  profile: UserProfile | null
  onSignOut: () => void
}

export function Layout({ children, company, profile, onSignOut }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar company={company} profile={profile} onSignOut={onSignOut} />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
