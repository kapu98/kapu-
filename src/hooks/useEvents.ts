import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Event, EventStatus } from '../types'

export function useEvents(companyId: string | undefined) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase
        .from('events')
        .select('*, client:clients(*)')
        .eq('company_id', companyId)
        .order('event_date', { ascending: false })
      setEvents(data || [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  async function createEvent(data: Partial<Event>) {
    const { data: created, error } = await supabase
      .from('events')
      .insert({ ...data, company_id: companyId })
      .select()
      .single()
    if (error) throw error
    await load()
    return created
  }

  async function updateEvent(id: string, data: Partial<Event>) {
    const { error } = await supabase.from('events').update(data).eq('id', id)
    if (error) throw error
    await load()
  }

  async function updateEventStatus(id: string, status: EventStatus) {
    const { error } = await supabase.from('events').update({ status }).eq('id', id)
    if (error) throw error
    await load()
  }

  async function getEvent(id: string): Promise<Event | null> {
    const { data } = await supabase
      .from('events')
      .select('*, client:clients(*), riders(*), budgets(*)')
      .eq('id', id)
      .single()
    return data
  }

  return { events, loading, error, reload: load, createEvent, updateEvent, updateEventStatus, getEvent }
}
