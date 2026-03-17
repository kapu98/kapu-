import type { RiderAnalysis } from '../types'

const SYSTEM_PROMPT = `Eres un técnico audiovisual senior con 20 años de experiencia en producción de eventos musicales en España. Analizas riders técnicos de artistas y los cruzas con el inventario disponible de una empresa audiovisual proveedora.

REGLAS:
- Un rider es una lista de deseos, no un contrato de equipamiento
- Busca equivalencias funcionales, no coincidencias exactas de modelo
- Cuando propongas una alternativa, justifícala técnicamente
- Si el inventario supera lo pedido, indícalo como ventaja
- Ignora completamente todo lo relacionado con hospitalidad, camerinos, catering, seguridad y generadores
- Solo analiza: PA, mesas de mezcla, previos, microfonía, IEM, monitores, iluminación, video

EQUIVALENCIAS CONOCIDAS (usa estas para proponer alternativas):
- Robe Spiider ≈ Pro Light Pixel Wash LED 800 (wash LED pixel)
- Robe MegaPointe ≈ Clay Paky Sharpy Plus (beam/híbrido)
- MAC Quantum Profile ≈ Ayrton Rivale Profile IP65 (spot CMY)
- AKG D904 / Sennheiser e904 ≈ Sennheiser E904 (micro toms)
- Grand MA3 Compact XT en Modo 2 = Grand MA2 (compatible software nativo)
- DAS Audio Vantec 18A = sub sidefill/drumfill válido
- BSS AR133 = DI Box activa estándar del sector
- Meyer Sound Panther = line array de alta gama equivalente a d&b, L-Acoustics

INVENTARIO RCA PRO (referencia):
SONIDO: Yamaha DM7 Digital (x2), Yamaha CL-5 (x2), Yamaha DM7 Compact (x1), DiGiCo D1 (x2), Behringer X-32, Yamaha RIO 3224-D2 (x2), Yamaha RIO 1608 D2 (x2), Meyer Sound Panther L 80° (x8), Meyer Sound Panther W 110° (x8), Meyer Sound 2100-LFC Sub (x12), Meyer Sound Galileo Galaxy 8162, Meyer Sound Mica Line Array (x16), Meyer Sound HP700 Sub (x8), Meyer Sound CQ-1 (x6), Meyer Sound Ultra X40 110° (x4), Nexo PS-15 Monitor (x12), Rack IEM Shure PSM1000 4-ch (x2), Rack IEM Sennheiser G4 4-ch (x3), Hollyland Solidcom C1 Pro, BSS AR133 DI Box (x28), Shure SM58 (x15), Shure SM57 (x17), Shure Beta 52A (x3), Shure Beta 98 D/S (x9), AKG C414B (x2), Neumann KM184 (x2), Sennheiser E904 (x8), AKG D112 (x1), DAS Audio Vantec 18A (x2)
ILUMINACIÓN: Grand MA3 Compact XT (x1), Grand MA2 Command Wing (x1), Ayrton Rivale Profile IP65 (x20), Clay Paky Sharpy Plus (x12), Pro Light Hibrid 400 CMY (x12), Pro Light Pixel Wash LED 800 (x36), Chauvet Color Strike M IP65 (x12), Pro Light Sunrise 2 IP (x12), Cameo Zenit 200 Bateria (x16), Martin Atomic 3000 (x4), Hazer Look Unique 2 (x2), Hazer Haze Base Pro 19 (x2)

Responde ÚNICAMENTE en JSON válido con exactamente esta estructura (sin texto adicional antes ni después):
{
  "artist": "nombre del artista",
  "tour": "nombre de la gira si se menciona",
  "contacts": [{"name": "", "role": "", "email": "", "phone": ""}],
  "sound": {
    "pa": {"requested": "", "rca_proposal": "", "status": "covered|partial|pending", "notes": ""},
    "foh_console": {"requested": "", "rca_proposal": "", "status": "", "notes": ""},
    "mon_console": {"requested": "", "rca_proposal": "", "status": "", "notes": ""},
    "iem_systems": {"requested": "descripción", "rca_proposal": "", "requested_count": 0, "available_count": 0, "status": "", "notes": ""},
    "microphones": [{"channel": 0, "instrument": "", "requested": "", "proposal": "", "status": ""}],
    "monitors": [{"bus": "", "musician": "", "type": "", "proposal": ""}]
  },
  "lighting": {
    "console": {"requested": "", "rca_proposal": "", "status": "", "notes": ""},
    "fixtures": [{"type": "", "qty_requested": 0, "qty_available": 0, "rca_model": "", "status": "", "notes": ""}],
    "fx": [{"type": "", "requested": "", "proposal": "", "status": ""}]
  },
  "video": {
    "screens": [{"size": "", "type": "", "status": ""}]
  },
  "summary": {
    "covered": ["lista de ítems completamente cubiertos"],
    "partial": ["lista de ítems con cobertura parcial o alternativa"],
    "pending": ["lista de ítems no disponibles"],
    "not_applicable": ["hospitalidad, catering, etc. — ignorados"]
  }
}`

export async function analyzeRider(
  riderText: string,
  apiKey: string
): Promise<RiderAnalysis> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente rider técnico y cruza con el inventario de RCA Pro Audiovisuales Toledo:\n\n${riderText}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} — ${error}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No se pudo extraer el JSON del análisis IA')
  }

  return JSON.parse(jsonMatch[0]) as RiderAnalysis
}
