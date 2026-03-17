-- Event.ia — Schema inicial
-- Multi-tenant audiovisual SaaS

-- Empresas (multi-tenant)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cif TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfiles de usuario ligados a empresa
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías de inventario
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1A5276',
  sort_order INTEGER DEFAULT 0
);

-- Inventario de equipos
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  category_id UUID REFERENCES inventory_categories(id),
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 1,
  weight_kg DECIMAL(6,2),
  brand TEXT,
  model TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  nif TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  type TEXT CHECK (type IN ('ayuntamiento', 'promotora', 'festival', 'corporativo', 'otro')) DEFAULT 'otro',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contactos técnicos
CREATE TABLE IF NOT EXISTS technical_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  role TEXT,
  artist TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT
);

-- Eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  artist TEXT,
  venue TEXT,
  city TEXT,
  event_date DATE,
  setup_date DATE,
  strike_date DATE,
  days INTEGER DEFAULT 1,
  ratio DECIMAL(4,2) DEFAULT 1.0,
  status TEXT CHECK (status IN ('pendiente', 'presupuestado', 'confirmado', 'completado', 'cancelado')) DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders recibidos
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  artist TEXT NOT NULL,
  version TEXT DEFAULT 'v1',
  file_url TEXT,
  file_name TEXT,
  analyzed BOOLEAN DEFAULT false,
  analysis_json JSONB,
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presupuestos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  budget_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('borrador', 'enviado', 'aceptado', 'rechazado')) DEFAULT 'borrador',
  days INTEGER DEFAULT 1,
  ratio DECIMAL(4,2) DEFAULT 1.0,
  subtotal_sound DECIMAL(10,2) DEFAULT 0,
  subtotal_lighting DECIMAL(10,2) DEFAULT 0,
  subtotal_video DECIMAL(10,2) DEFAULT 0,
  subtotal_staff DECIMAL(10,2) DEFAULT 0,
  base_amount DECIMAL(10,2) DEFAULT 0,
  vat_rate DECIMAL(4,2) DEFAULT 21.00,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Líneas de presupuesto
CREATE TABLE IF NOT EXISTS budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('sonido', 'iluminacion', 'video', 'personal', 'transporte', 'otro')),
  description TEXT NOT NULL,
  detail TEXT,
  quantity INTEGER DEFAULT 1,
  days INTEGER DEFAULT 1,
  ratio DECIMAL(4,2) DEFAULT 1.0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Contra-riders
CREATE TABLE IF NOT EXISTS contra_riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id),
  company_id UUID REFERENCES companies(id),
  content_json JSONB,
  file_url TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal técnico propio
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  day_rate DECIMAL(8,2),
  available BOOLEAN DEFAULT true
);

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE contra_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- User profiles policy
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Companies policy
CREATE POLICY "Users can view own company" ON companies
  FOR ALL USING (id = get_my_company_id());

-- Generic company_id based policies
CREATE POLICY "Company data access for inventory_categories" ON inventory_categories
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for inventory_items" ON inventory_items
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for clients" ON clients
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for technical_contacts" ON technical_contacts
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for events" ON events
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for riders" ON riders
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for budgets" ON budgets
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for budget_lines" ON budget_lines
  FOR ALL USING (
    budget_id IN (SELECT id FROM budgets WHERE company_id = get_my_company_id())
  );
CREATE POLICY "Company data access for contra_riders" ON contra_riders
  FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company data access for staff" ON staff
  FOR ALL USING (company_id = get_my_company_id());

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
