import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Company, UserProfile } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else {
        setProfile(null)
        setCompany(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        if (profileData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profileData.company_id)
            .single()
          if (companyData) setCompany(companyData)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, fullName: string, companyName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    if (!data.user) throw new Error('No se pudo crear el usuario')

    // Create company
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, email })
      .select()
      .single()
    if (companyError) throw companyError

    // Update profile with company
    await supabase
      .from('user_profiles')
      .update({ company_id: newCompany.id, full_name: fullName })
      .eq('id', data.user.id)

    return newCompany
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, profile, company, loading, signIn, signUp, signOut }
}
