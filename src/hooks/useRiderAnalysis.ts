import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { analyzeRider } from '../lib/anthropic'
import { extractTextFromPDF } from '../lib/rider-parser'
import type { Rider, RiderAnalysis } from '../types'

export function useRiderAnalysis(companyId: string | undefined) {
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadRider(
    file: File,
    eventId: string,
    artist: string,
    apiKey: string
  ): Promise<Rider> {
    if (!companyId) throw new Error('No company')
    setError(null)
    setUploading(true)

    try {
      // Upload PDF to Supabase Storage
      const filePath = `${companyId}/riders/${eventId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('riders')
        .upload(filePath, file)

      let fileUrl: string | undefined
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('riders').getPublicUrl(filePath)
        fileUrl = urlData.publicUrl
      }

      // Extract text
      let rawText = ''
      try {
        rawText = await extractTextFromPDF(file)
      } catch (e) {
        console.warn('PDF extraction failed, proceeding without text:', e)
      }

      // Create rider record
      const { data: rider, error: riderError } = await supabase
        .from('riders')
        .insert({
          event_id: eventId,
          company_id: companyId,
          artist,
          file_url: fileUrl,
          file_name: file.name,
          raw_text: rawText,
          analyzed: false,
        })
        .select()
        .single()

      if (riderError) throw riderError

      setUploading(false)

      // Analyze with IA
      if (rawText && apiKey) {
        setAnalyzing(true)
        try {
          const analysis = await analyzeRider(rawText, apiKey)

          const { data: updated, error: updateError } = await supabase
            .from('riders')
            .update({
              analyzed: true,
              analysis_json: analysis,
            })
            .eq('id', rider.id)
            .select()
            .single()

          if (updateError) throw updateError
          return updated
        } catch (analysisError) {
          setError(`Análisis IA fallido: ${String(analysisError)}`)
          return rider
        } finally {
          setAnalyzing(false)
        }
      }

      return rider
    } catch (e) {
      setError(String(e))
      throw e
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  async function reanalyzeRider(riderId: string, rawText: string, apiKey: string): Promise<RiderAnalysis> {
    setAnalyzing(true)
    setError(null)
    try {
      const analysis = await analyzeRider(rawText, apiKey)
      await supabase
        .from('riders')
        .update({ analyzed: true, analysis_json: analysis })
        .eq('id', riderId)
      return analysis
    } catch (e) {
      setError(String(e))
      throw e
    } finally {
      setAnalyzing(false)
    }
  }

  async function updateAnalysis(riderId: string, analysis: RiderAnalysis): Promise<void> {
    const { error } = await supabase
      .from('riders')
      .update({ analysis_json: analysis })
      .eq('id', riderId)
    if (error) throw error
  }

  return { analyzing, uploading, error, uploadRider, reanalyzeRider, updateAnalysis }
}
