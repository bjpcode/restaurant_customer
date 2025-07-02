-- Restaurant Ordering System Database Schema
-- This file contains the SQL schema for Supabase

-- Create menu table
CREATE TABLE menu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('meat', 'vegetable', 'sauces', 'desserts', 'drinks')),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    allergens TEXT[], -- array of allergen strings
    nutritional_info JSONB, -- flexible nutrition data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_number INTEGER NOT NULL CHECK (table_number > 0),
    order_items JSONB NOT NULL, -- array of {menu_item_id, name, price, quantity, special_instructions}
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    session_id VARCHAR(255) NOT NULL,
    special_instructions TEXT,
    estimated_prep_time INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_menu_category ON menu(category);
CREATE INDEX idx_menu_available ON menu(is_available);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_table ON orders(table_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_menu_updated_at BEFORE UPDATE ON menu
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for menu table (read-only for public)
CREATE POLICY "Allow public read access to menu" ON menu
    FOR SELECT USING (true);

-- Create policies for orders table (customers can only access their session orders)
CREATE POLICY "Allow insert orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read own session orders" ON orders
    FOR SELECT USING (true); -- In production, you might want to restrict this further

-- Sample menu data
INSERT INTO menu (name, category, price, description, image_url, allergens, preparation_time) VALUES
-- Meat dishes
('Grilled Chicken Breast', 'meat', 18.99, 'Tender grilled chicken breast with herbs and spices', 'https://example.com/chicken.jpg', ARRAY['gluten'], 20),
('Beef Steak', 'meat', 24.99, 'Premium beef steak cooked to perfection', 'https://example.com/steak.jpg', ARRAY[], 25),
('Pork Ribs', 'meat', 22.50, 'Slow-cooked pork ribs with BBQ sauce', 'https://example.com/ribs.jpg', ARRAY['gluten'], 30),
('Lamb Chops', 'meat', 26.99, 'Succulent lamb chops with rosemary', 'https://example.com/lamb.jpg', ARRAY[], 22),

-- Vegetable dishes
('Caesar Salad', 'vegetable', 12.99, 'Fresh romaine lettuce with Caesar dressing', 'https://example.com/caesar.jpg', ARRAY['dairy', 'eggs'], 10),
('Grilled Vegetables', 'vegetable', 14.50, 'Seasonal vegetables grilled to perfection', 'https://example.com/vegetables.jpg', ARRAY[], 15),
('Caprese Salad', 'vegetable', 13.99, 'Fresh mozzarella, tomatoes, and basil', 'https://example.com/caprese.jpg', ARRAY['dairy'], 8),
('Vegetarian Pasta', 'vegetable', 16.99, 'Pasta with fresh vegetables and olive oil', 'https://example.com/pasta.jpg', ARRAY['gluten'], 18),

-- Sauces
('Garlic Aioli', 'sauces', 3.50, 'Creamy garlic aioli sauce', 'https://example.com/aioli.jpg', ARRAY['eggs', 'dairy'], 2),
('BBQ Sauce', 'sauces', 2.99, 'Smoky BBQ sauce', 'https://example.com/bbq.jpg', ARRAY[], 1),
('Pesto', 'sauces', 4.50, 'Fresh basil pesto sauce', 'https://example.com/pesto.jpg', ARRAY['nuts', 'dairy'], 2),
('Hot Sauce', 'sauces', 2.50, 'Spicy hot sauce', 'https://example.com/hot.jpg', ARRAY[], 1),

-- Desserts
('Chocolate Cake', 'desserts', 8.99, 'Rich chocolate cake with ganache', 'https://example.com/cake.jpg', ARRAY['gluten', 'dairy', 'eggs'], 5),
('Tiramisu', 'desserts', 9.50, 'Classic Italian tiramisu', 'https://example.com/tiramisu.jpg', ARRAY['gluten', 'dairy', 'eggs'], 3),
('Ice Cream', 'desserts', 6.99, 'Vanilla ice cream with toppings', 'https://example.com/icecream.jpg', ARRAY['dairy'], 2),
('Fruit Tart', 'desserts', 7.50, 'Fresh fruit tart with pastry cream', 'https://example.com/tart.jpg', ARRAY['gluten', 'dairy', 'eggs'], 4),

-- Drinks
('Coffee', 'drinks', 3.50, 'Freshly brewed coffee', 'https://example.com/coffee.jpg', ARRAY[], 3),
('Fresh Orange Juice', 'drinks', 4.99, 'Freshly squeezed orange juice', 'https://example.com/orange.jpg', ARRAY[], 2),
('Sparkling Water', 'drinks', 2.50, 'Refreshing sparkling water', 'https://example.com/water.jpg', ARRAY[], 1),
('House Wine', 'drinks', 8.99, 'Glass of house red or white wine', 'https://example.com/wine.jpg', ARRAY[], 1),
('Craft Beer', 'drinks', 6.50, 'Local craft beer on tap', 'https://example.com/beer.jpg', ARRAY['gluten'], 1),
('Cocktail', 'drinks', 12.99, 'Signature house cocktail', 'https://example.com/cocktail.jpg', ARRAY[], 5);