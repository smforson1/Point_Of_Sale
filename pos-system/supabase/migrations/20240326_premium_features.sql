-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'CANCELLED')),
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  vendor TEXT,
  payment_method TEXT DEFAULT 'CASH',
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Audits Table
CREATE TABLE IF NOT EXISTS inventory_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 7. Inventory Audit Items Table
CREATE TABLE IF NOT EXISTS inventory_audit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES inventory_audits(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  expected_quantity INTEGER NOT NULL,
  actual_quantity INTEGER NOT NULL,
  discrepancy INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS for all new tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audit_items ENABLE ROW LEVEL SECURITY;

-- 9. Setup RLS Policies (Allow managers & admins)
CREATE POLICY "Everyone can view suppliers" ON suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Everyone can view expense categories" ON expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- Managers and Admins can manage everything else
CREATE POLICY "Admins manage everything" ON suppliers FOR ALL USING (is_admin());
CREATE POLICY "Managers and Admins manage POs" ON purchase_orders FOR ALL USING (is_admin() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MANAGER'));
CREATE POLICY "Managers and Admins manage PO items" ON purchase_order_items FOR ALL USING (is_admin() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MANAGER'));
CREATE POLICY "Managers and Admins manage expenses" ON expenses FOR ALL USING (is_admin() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MANAGER'));
CREATE POLICY "Managers and Admins manage audits" ON inventory_audits FOR ALL USING (is_admin() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MANAGER'));
CREATE POLICY "Managers and Admins manage audit items" ON inventory_audit_items FOR ALL USING (is_admin() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MANAGER'));

-- 10. Seed Initial Expense Categories
INSERT INTO expense_categories (name) VALUES 
('Rent'), ('Utilities'), ('Salaries'), ('Marketing'), ('Supplies'), ('Maintenance'), ('Other')
ON CONFLICT (name) DO NOTHING;
