-- JáPede Database Setup Script
-- Execute this script in Supabase SQL Editor to create all necessary tables

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Usuários autenticados podem ler configurações" ON app_settings;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar configurações" ON app_settings;
DROP POLICY IF EXISTS "Usuários autenticados podem ler categorias" ON categories;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir categorias" ON categories;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar categorias" ON categories;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar categorias" ON categories;
DROP POLICY IF EXISTS "Usuários autenticados podem ler itens do menu" ON menu_items;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir itens do menu" ON menu_items;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar itens do menu" ON menu_items;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar itens do menu" ON menu_items;
DROP POLICY IF EXISTS "Usuários autenticados podem ler mesas" ON tables;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir mesas" ON tables;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar mesas" ON tables;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar mesas" ON tables;
DROP POLICY IF EXISTS "Usuários autenticados podem ler pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários autenticados podem ler itens do pedido" ON order_items;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir itens do pedido" ON order_items;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar itens do pedido" ON order_items;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar itens do pedido" ON order_items;
DROP POLICY IF EXISTS "Usuários autenticados podem ler reservas" ON reservations;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir reservas" ON reservations;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar reservas" ON reservations;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar reservas" ON reservations;
DROP POLICY IF EXISTS "Usuários autenticados podem ler perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver apenas seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seu próprio perfil" ON profiles;

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_settings table
CREATE TABLE app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table
CREATE TABLE tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT true,
    is_occupied BOOLEAN DEFAULT false,
    current_order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    preparation_time INTEGER DEFAULT 15,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'pix')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL DEFAULT 2,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Usuários autenticados podem ler perfis" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ver apenas seu próprio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for app_settings
CREATE POLICY "Usuários autenticados podem ler configurações" ON app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar configurações" ON app_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for categories
CREATE POLICY "Usuários autenticados podem ler categorias" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir categorias" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar categorias" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar categorias" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for tables
CREATE POLICY "Usuários autenticados podem ler mesas" ON tables
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir mesas" ON tables
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar mesas" ON tables
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar mesas" ON tables
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for menu_items
CREATE POLICY "Usuários autenticados podem ler itens do menu" ON menu_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir itens do menu" ON menu_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar itens do menu" ON menu_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar itens do menu" ON menu_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for orders
CREATE POLICY "Usuários autenticados podem ler pedidos" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir pedidos" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar pedidos" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar pedidos" ON orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for order_items
CREATE POLICY "Usuários autenticados podem ler itens do pedido" ON order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir itens do pedido" ON order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar itens do pedido" ON order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar itens do pedido" ON order_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for reservations
CREATE POLICY "Usuários autenticados podem ler reservas" ON reservations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir reservas" ON reservations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar reservas" ON reservations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar reservas" ON reservations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial app settings
INSERT INTO app_settings (key, value, description) VALUES
('restaurant_name', 'JáPede', 'Nome do restaurante'),
('restaurant_address', 'Endereço do restaurante', 'Endereço completo'),
('restaurant_phone', '(11) 99999-9999', 'Telefone do restaurante'),
('opening_hours', '18:00 - 23:00', 'Horário de funcionamento'),
('delivery_fee', '5.00', 'Taxa de entrega'),
('min_order_amount', '20.00', 'Valor mínimo do pedido');

-- Insert sample categories
INSERT INTO categories (name, description, sort_order) VALUES
('Pizzas', 'Pizzas tradicionais e especiais', 1),
('Bebidas', 'Refrigerantes, sucos e água', 2),
('Sobremesas', 'Doces e sobremesas', 3),
('Entradas', 'Aperitivos e entradas', 4);

-- Insert sample tables
INSERT INTO tables (number, capacity) VALUES
(1, 4),
(2, 4),
(3, 6),
(4, 2),
(5, 8);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category_id, preparation_time) 
SELECT 
    'Margherita', 
    'Molho de tomate, mussarela, manjericão', 
    25.90, 
    id, 
    15
FROM categories 
WHERE name = 'Pizzas';

INSERT INTO menu_items (name, description, price, category_id, preparation_time) 
SELECT 
    'Pepperoni', 
    'Molho de tomate, mussarela, pepperoni', 
    28.90, 
    id, 
    15
FROM categories 
WHERE name = 'Pizzas';

INSERT INTO menu_items (name, description, price, category_id, preparation_time) 
SELECT 
    'Coca-Cola', 
    'Refrigerante Coca-Cola 350ml', 
    6.50, 
    id, 
    1
FROM categories 
WHERE name = 'Bebidas';

INSERT INTO menu_items (name, description, price, category_id, preparation_time) 
SELECT 
    'Água Mineral', 
    'Água mineral sem gás 500ml', 
    3.50, 
    id, 
    1
FROM categories 
WHERE name = 'Bebidas';

INSERT INTO menu_items (name, description, price, category_id, preparation_time) 
SELECT 
    'Tiramisu', 
    'Sobremesa italiana tradicional', 
    12.90, 
    id, 
    5
FROM categories 
WHERE name = 'Sobremesas';

-- Verify tables were created
SELECT 'Database setup completed successfully!' as status; 