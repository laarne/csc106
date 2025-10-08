-- Laundry Management System Database Schema
-- PostgreSQL Database Setup

-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE laundry_db;

-- Connect to the database and run the following:

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'units',
    cost_per_unit DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    weight DECIMAL(8,2) NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('wash', 'dry', 'fold', 'wash_dry', 'wash_dry_fold')),
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'washing', 'ready', 'claimed')),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ready_date TIMESTAMP,
    claimed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table (for tracking inventory usage)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_used DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing history table
CREATE TABLE IF NOT EXISTS billing_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing configuration table
CREATE TABLE IF NOT EXISTS pricing (
    id SERIAL PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL UNIQUE,
    price_per_kg DECIMAL(8,2) NOT NULL,
    base_price DECIMAL(8,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing
INSERT INTO pricing (service_type, price_per_kg, base_price) VALUES
('wash', 15.00, 5.00),
('dry', 20.00, 8.00),
('fold', 10.00, 3.00),
('wash_dry', 30.00, 10.00),
('wash_dry_fold', 35.00, 12.00)
ON CONFLICT (service_type) DO NOTHING;

-- Insert default inventory items
INSERT INTO inventory (item_name, quantity, threshold, unit, cost_per_unit) VALUES
('Detergent', 50, 10, 'liters', 25.00),
('Fabric Softener', 30, 5, 'liters', 20.00),
('Bleach', 20, 5, 'liters', 15.00),
('Starch', 15, 3, 'kg', 30.00)
ON CONFLICT (item_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_order_id ON billing_history(order_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
