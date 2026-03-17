-- Seed de inventario para RCA Pro Audiovisuales Toledo
-- NOTA: Ejecutar después de crear la empresa en la UI o adaptar el company_id

-- Esta función crea el seed para una empresa dada
-- Llamar con: SELECT seed_rca_inventory('<company_uuid>');

CREATE OR REPLACE FUNCTION seed_rca_inventory(p_company_id UUID)
RETURNS void AS $$
DECLARE
  cat_sonido UUID;
  cat_iluminacion UUID;
  cat_video UUID;
BEGIN
  -- Categorías
  INSERT INTO inventory_categories (company_id, name, color, sort_order)
  VALUES (p_company_id, 'SONIDO', '#1A5276', 1)
  RETURNING id INTO cat_sonido;

  INSERT INTO inventory_categories (company_id, name, color, sort_order)
  VALUES (p_company_id, 'ILUMINACIÓN', '#8E44AD', 2)
  RETURNING id INTO cat_iluminacion;

  INSERT INTO inventory_categories (company_id, name, color, sort_order)
  VALUES (p_company_id, 'VIDEO', '#117A65', 3)
  RETURNING id INTO cat_video;

  -- SONIDO — Consolas y control
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_sonido, 'Yamaha DM7 Digital', 'Yamaha', 'DM7', 375, 2),
  (p_company_id, cat_sonido, 'Yamaha CL-5 Mesa Digital', 'Yamaha', 'CL-5', 350, 2),
  (p_company_id, cat_sonido, 'Yamaha DM7 Compact', 'Yamaha', 'DM7 Compact', 250, 1),
  (p_company_id, cat_sonido, 'Yamaha RIO 3224-D2 Previo', 'Yamaha', 'RIO 3224-D2', 120, 2),
  (p_company_id, cat_sonido, 'Yamaha RIO 1608 D2 Interface', 'Yamaha', 'RIO 1608 D2', 70, 2),
  (p_company_id, cat_sonido, 'Digico D1 Live', 'DiGiCo', 'D1', 250, 2),
  (p_company_id, cat_sonido, 'Behringer X-32 Producer', 'Behringer', 'X-32 Producer', 175, 1);

  -- SONIDO — PA y subwoofers Meyer Sound
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_sonido, 'Meyer Sound Panther L 80°', 'Meyer Sound', 'Panther L 80°', 250, 8),
  (p_company_id, cat_sonido, 'Meyer Sound Panther W 110°', 'Meyer Sound', 'Panther W 110°', 250, 8),
  (p_company_id, cat_sonido, 'Meyer Sound Sub 2100-LFC', 'Meyer Sound', '2100-LFC', 250, 12),
  (p_company_id, cat_sonido, 'Meyer Sound Galileo Galaxy 8162', 'Meyer Sound', 'Galaxy 8162', 250, 1),
  (p_company_id, cat_sonido, 'Meyer Sound Mica Line Array', 'Meyer Sound', 'Mica', 150, 16),
  (p_company_id, cat_sonido, 'Meyer Sound HP700 Sub', 'Meyer Sound', 'HP700', 100, 8),
  (p_company_id, cat_sonido, 'Meyer Sound CQ-1', 'Meyer Sound', 'CQ-1', 50, 6),
  (p_company_id, cat_sonido, 'Meyer Sound Ultra X40 110°', 'Meyer Sound', 'Ultra X40 110°', 150, 4);

  -- SONIDO — Monitores
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_sonido, 'Nexo PS-15 Monitor', 'Nexo', 'PS-15', 75, 12),
  (p_company_id, cat_sonido, 'DAS Audio Vantec 18A', 'DAS Audio', 'Vantec 18A', 80, 2);

  -- SONIDO — IEM
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_sonido, 'Rack IEM Shure PSM1000 (4 sist.)', 'Shure', 'PSM1000', 350, 2),
  (p_company_id, cat_sonido, 'Rack IEM Sennheiser G4 Rango G (4 sist.)', 'Sennheiser', 'EW-IEM G4', 300, 3);

  -- SONIDO — Comunicaciones e interfaces
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_sonido, 'Hollyland Solidcom C1 Pro', 'Hollyland', 'Solidcom C1 Pro', 300, 1),
  (p_company_id, cat_sonido, 'BSS AR133 DI Box activa', 'BSS', 'AR133', 15, 28);

  -- SONIDO — Microfonía
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_sonido, 'Shure SM58', 'Shure', 'SM58', 8, 15),
  (p_company_id, cat_sonido, 'Shure SM57', 'Shure', 'SM57', 8, 17),
  (p_company_id, cat_sonido, 'Shure Beta 52A', 'Shure', 'Beta 52A', 25, 3),
  (p_company_id, cat_sonido, 'Shure Beta 98 D/S', 'Shure', 'Beta 98 D/S', 30, 9),
  (p_company_id, cat_sonido, 'AKG C414B', 'AKG', 'C414B', 100, 2),
  (p_company_id, cat_sonido, 'Neumann KM184', 'Neumann', 'KM184', 100, 2),
  (p_company_id, cat_sonido, 'Sennheiser E904', 'Sennheiser', 'E904', 20, 8),
  (p_company_id, cat_sonido, 'AKG D112', 'AKG', 'D112', 20, 1);

  -- ILUMINACIÓN — Control
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_iluminacion, 'Grand MA3 Compact XT', 'GrandMA', 'MA3 Compact XT', 350, 1),
  (p_company_id, cat_iluminacion, 'Grand MA2 Command Wing', 'GrandMA', 'MA2 Command Wing', 100, 1);

  -- ILUMINACIÓN — Fixtures
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_iluminacion, 'Ayrton Rivale Profile IP65', 'Ayrton', 'Rivale Profile IP65', 125, 20),
  (p_company_id, cat_iluminacion, 'Clay Paky Sharpy Plus', 'Clay Paky', 'Sharpy Plus', 100, 12),
  (p_company_id, cat_iluminacion, 'Pro Light Hibrid 400 CMY', 'Pro Light', 'Hibrid 400 CMY', 60, 12),
  (p_company_id, cat_iluminacion, 'Pro Light Pixel Wash LED 800', 'Pro Light', 'Pixel Wash LED 800', 60, 36),
  (p_company_id, cat_iluminacion, 'Chauvet Color Strike M IP65', 'Chauvet', 'Color Strike M IP65', 60, 12),
  (p_company_id, cat_iluminacion, 'Pro Light Sunrise 2 IP', 'Pro Light', 'Sunrise 2 IP', 30, 12),
  (p_company_id, cat_iluminacion, 'Cameo Zenit 200 Bateria', 'Cameo', 'Zenit 200', 80, 16),
  (p_company_id, cat_iluminacion, 'Martin Atomic 3000', 'Martin', 'Atomic 3000', 60, 4);

  -- ILUMINACIÓN — FX
  INSERT INTO inventory_items (company_id, category_id, name, brand, model, price_per_day, stock) VALUES
  (p_company_id, cat_iluminacion, 'Maquina Hazer Look Unique 2', 'Look Solutions', 'Unique 2', 100, 2),
  (p_company_id, cat_iluminacion, 'Maquina Hazer Haze Base Pro 19', 'Haze Base', 'Pro 19', 100, 2);

END;
$$ LANGUAGE plpgsql;
