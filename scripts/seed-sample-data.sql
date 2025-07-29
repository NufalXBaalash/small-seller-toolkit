-- This script will create sample data for a user
-- Replace 'USER_ID_HERE' with an actual user ID from your auth.users table

-- Sample products
INSERT INTO public.products (user_id, name, sku, category, price, stock, description, status) VALUES
('USER_ID_HERE', 'iPhone 14 Pro Case', 'IPC-14P-001', 'Phone Cases', 25.00, 25, 'Premium protective case for iPhone 14 Pro', 'active'),
('USER_ID_HERE', 'Wireless Headphones', 'WH-BT-002', 'Electronics', 89.99, 3, 'High-quality Bluetooth headphones', 'active'),
('USER_ID_HERE', 'Phone Stand', 'PS-ADJ-003', 'Accessories', 15.50, 0, 'Adjustable phone stand for desk', 'active'),
('USER_ID_HERE', 'USB-C Cable', 'UC-CBL-004', 'Cables', 12.99, 50, '2-meter USB-C charging cable', 'active');

-- Sample customers
INSERT INTO public.customers (user_id, name, email, phone_number, platform, total_orders, total_spent, status) VALUES
('USER_ID_HERE', 'Maria Santos', 'maria.santos@email.com', '+55 11 99999-1234', 'whatsapp', 8, 450.00, 'active'),
('USER_ID_HERE', 'João Silva', 'joao.silva@email.com', '+55 11 88888-5678', 'facebook', 3, 180.50, 'active'),
('USER_ID_HERE', 'Ana Costa', 'ana.costa@email.com', '+55 11 77777-9012', 'whatsapp', 12, 890.75, 'active'),
('USER_ID_HERE', 'Pedro Lima', 'pedro.lima@email.com', '+55 11 66666-3456', 'facebook', 1, 25.00, 'inactive');

-- Sample orders
INSERT INTO public.orders (user_id, customer_id, total_amount, status, platform) VALUES
('USER_ID_HERE', (SELECT id FROM public.customers WHERE name = 'Maria Santos' AND user_id = 'USER_ID_HERE'), 45.00, 'completed', 'whatsapp'),
('USER_ID_HERE', (SELECT id FROM public.customers WHERE name = 'João Silva' AND user_id = 'USER_ID_HERE'), 89.99, 'pending', 'facebook'),
('USER_ID_HERE', (SELECT id FROM public.customers WHERE name = 'Ana Costa' AND user_id = 'USER_ID_HERE'), 25.00, 'completed', 'whatsapp');

-- Sample chats
INSERT INTO public.chats (user_id, customer_id, platform, last_message, unread_count, status) VALUES
('USER_ID_HERE', (SELECT id FROM public.customers WHERE name = 'Maria Santos' AND user_id = 'USER_ID_HERE'), 'whatsapp', 'Hi! Do you have the iPhone case in blue?', 2, 'active'),
('USER_ID_HERE', (SELECT id FROM public.customers WHERE name = 'João Silva' AND user_id = 'USER_ID_HERE'), 'facebook', 'Perfect! I''ll take 2 pieces', 0, 'active'),
('USER_ID_HERE', (SELECT id FROM public.customers WHERE name = 'Ana Costa' AND user_id = 'USER_ID_HERE'), 'whatsapp', 'When will my order be delivered?', 1, 'active');
