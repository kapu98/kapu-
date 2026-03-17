// ============================================
// Event.ia — TypeScript Types
// ============================================

export interface Company {
  id: string
  name: string
  cif?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  created_at: string
}

export interface UserProfile {
  id: string
  company_id?: string
  full_name?: string
  role: string
  created_at: string
}

export interface InventoryCategory {
  id: string
  company_id: string
  name: string
  color: string
  sort_order: number
}

export interface InventoryItem {
  id: string
  company_id: string
  category_id: string
  code?: string
  name: string
  description?: string
  price_per_day: number
  stock: number
  weight_kg?: number
  brand?: string
  model?: string
  notes?: string
  active: boolean
  created_at: string
  // joined
  category?: InventoryCategory
}

export interface Client {
  id: string
  company_id: string
  name: string
  nif?: string
  email?: string
  phone?: string
  address?: string
  type: 'ayuntamiento' | 'promotora' | 'festival' | 'corporativo' | 'otro'
  notes?: string
  created_at: string
}

export interface TechnicalContact {
  id: string
  company_id: string
  name: string
  role?: string
  artist?: string
  email?: string
  phone?: string
  notes?: string
}

export type EventStatus = 'pendiente' | 'presupuestado' | 'confirmado' | 'completado' | 'cancelado'

export interface Event {
  id: string
  company_id: string
  client_id?: string
  name: string
  artist?: string
  venue?: string
  city?: string
  event_date?: string
  setup_date?: string
  strike_date?: string
  days: number
  ratio: number
  status: EventStatus
  notes?: string
  created_at: string
  // joined
  client?: Client
  riders?: Rider[]
  budgets?: Budget[]
}

export interface Rider {
  id: string
  event_id: string
  company_id: string
  artist: string
  version: string
  file_url?: string
  file_name?: string
  analyzed: boolean
  analysis_json?: RiderAnalysis
  raw_text?: string
  created_at: string
}

// ============================================
// Rider Analysis — resultado de la IA
// ============================================

export type CoverageStatus = 'covered' | 'partial' | 'pending' | 'not_applicable'

export interface RiderContact {
  name: string
  role: string
  email?: string
  phone?: string
}

export interface RiderItem {
  requested: string
  rca_proposal: string
  status: CoverageStatus
  notes?: string
}

export interface RiderItemCount extends RiderItem {
  requested: string
  rca_proposal: string
  requested_count?: number
  available_count?: number
}

export interface MicrophoneChannel {
  channel: number
  instrument: string
  requested: string
  proposal: string
  status: CoverageStatus
}

export interface MonitorBus {
  bus: string
  musician: string
  type: string
  proposal: string
}

export interface LightingFixture {
  type: string
  qty_requested: number
  qty_available: number
  rca_model: string
  status: CoverageStatus
  notes?: string
}

export interface LightingFx {
  type: string
  requested: string
  proposal: string
  status: CoverageStatus
}

export interface VideoScreen {
  size: string
  type: string
  status: CoverageStatus
}

export interface RiderAnalysis {
  artist: string
  tour?: string
  contacts: RiderContact[]
  sound: {
    pa: RiderItem
    foh_console: RiderItem
    mon_console: RiderItem
    iem_systems: RiderItemCount
    microphones: MicrophoneChannel[]
    monitors: MonitorBus[]
  }
  lighting: {
    console: RiderItem
    fixtures: LightingFixture[]
    fx: LightingFx[]
  }
  video: {
    screens: VideoScreen[]
  }
  summary: {
    covered: string[]
    partial: string[]
    pending: string[]
    not_applicable: string[]
  }
}

// ============================================
// Presupuestos
// ============================================

export type BudgetStatus = 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
export type BudgetLineCategory = 'sonido' | 'iluminacion' | 'video' | 'personal' | 'transporte' | 'otro'

export interface BudgetLine {
  id: string
  budget_id: string
  category: BudgetLineCategory
  description: string
  detail?: string
  quantity: number
  days: number
  ratio: number
  unit_price: number
  subtotal: number
  sort_order: number
}

export interface Budget {
  id: string
  event_id: string
  company_id: string
  budget_number: string
  status: BudgetStatus
  days: number
  ratio: number
  subtotal_sound: number
  subtotal_lighting: number
  subtotal_video: number
  subtotal_staff: number
  base_amount: number
  vat_rate: number
  vat_amount: number
  total_amount: number
  notes?: string
  created_at: string
  // joined
  lines?: BudgetLine[]
  event?: Event
}

// ============================================
// Contra-riders
// ============================================

export interface ContraRiderSection {
  title: string
  items: ContraRiderItem[]
}

export interface ContraRiderItem {
  qty: number
  description: string
  detail?: string
  notes?: string
}

export interface ContraRiderContent {
  artist: string
  event: string
  venue: string
  date: string
  company: string
  sections: ContraRiderSection[]
  general_notes?: string
}

export interface ContraRider {
  id: string
  event_id: string
  budget_id: string
  company_id: string
  content_json?: ContraRiderContent
  file_url?: string
  version: number
  created_at: string
}

// ============================================
// Staff
// ============================================

export interface Staff {
  id: string
  company_id: string
  name: string
  role?: string
  phone?: string
  email?: string
  day_rate?: number
  available: boolean
}

// ============================================
// UI
// ============================================

export type StatusColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

export interface NavItem {
  label: string
  path: string
  icon: string
}
