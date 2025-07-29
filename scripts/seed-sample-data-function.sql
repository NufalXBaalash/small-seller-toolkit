-- Create a function to seed sample data for a user
CREATE OR REPLACE FUNCTION seed_sample_data_for_user(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    customer_maria_id UUID;
    customer_joao_id UUID;
    customer_ana_id UUID;
    customer_pedro_id UUID;
BEGIN
    -- Insert sample products
    INSERT INTO public.products (user_id, name, sku, category, price, stock, description, status) VALUES
    (target_user_id, 'iPhone 14 Pro Case', 'IPC-14P-001', 'Phone Cases', 25.00, 25, 'Premium protective case for iPhone 14 Pro', 'active'),
    (target_user_id, 'Wireless Headphones', 'WH-BT-002', 'Electronics', 89.99, 3, 'High-quality Bluetooth headphones', 'active'),
    (target_user_id, 'Phone Stand', 'PS-ADJ-003', 'Accessories', 15.50, 0, 'Adjustable phone stand for desk', 'active'),
    (target_user_id, 'USB-C Cable', 'UC-CBL-004', 'Cables', 12.99, 50, '2-meter USB-C charging cable', 'active');

    -- Insert sample customers and store their IDs
    INSERT INTO public.customers (user_id, name, email, phone_number, platform, total_orders, total_spent, status, last_order_date) VALUES
    (target_user_id, 'Maria Santos', 'maria.santos@email.com', '+55 11 99999-1234', 'whatsapp', 8, 450.00, 'active', NOW() - INTERVAL '2 days')
    RETURNING id INTO customer_maria_id;

    INSERT INTO public.customers (user_id, name, email, phone_number, platform, total_orders, total_spent, status, last_order_date) VALUES
    (target_user_id, 'João Silva', 'joao.silva@email.com', '+55 11 88888-5678', 'facebook', 3, 180.50, 'active', NOW() - INTERVAL '1 week')
    RETURNING id INTO customer_joao_id;

    INSERT INTO public.customers (user_id, name, email, phone_number, platform, total_orders, total_spent, status, last_order_date) VALUES
    (target_user_id, 'Ana Costa', 'ana.costa@email.com', '+55 11 77777-9012', 'whatsapp', 12, 890.75, 'active', NOW() - INTERVAL '3 days')
    RETURNING id INTO customer_ana_id;

    INSERT INTO public.customers (user_id, name, email, phone_number, platform, total_orders, total_spent, status, last_order_date) VALUES
    (target_user_id, 'Pedro Lima', 'pedro.lima@email.com', '+55 11 66666-3456', 'facebook', 1, 25.00, 'inactive', NOW() - INTERVAL '2 months')
    RETURNING id INTO customer_pedro_id;

    -- Insert sample orders
    INSERT INTO public.orders (user_id, customer_id, total_amount, status, platform) VALUES
    (target_user_id, customer_maria_id, 45.00, 'completed', 'whatsapp'),
    (target_user_id, customer_joao_id, 89.99, 'pending', 'facebook'),
    (target_user_id, customer_ana_id, 25.00, 'completed', 'whatsapp'),
    (target_user_id, customer_maria_id, 180.50, 'completed', 'whatsapp'),
    (target_user_id, customer_ana_id, 89.99, 'shipped', 'whatsapp');

    -- Insert sample chats
    INSERT INTO public.chats (user_id, customer_id, platform, last_message, unread_count, status) VALUES
    (target_user_id, customer_maria_id, 'whatsapp', 'Hi! Do you have the iPhone case in blue?', 2, 'active'),
    (target_user_id, customer_joao_id, 'facebook', 'Perfect! I''ll take 2 pieces', 0, 'active'),
    (target_user_id, customer_ana_id, 'whatsapp', 'When will my order be delivered?', 1, 'active'),
    (target_user_id, customer_pedro_id, 'facebook', 'Thank you for the quick delivery!', 0, 'active');

    RETURN 'Sample data seeded successfully for user: ' || target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage (replace with actual user ID):
-- SELECT seed_sample_data_for_user('your-user-id-here');
