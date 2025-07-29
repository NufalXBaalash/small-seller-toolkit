-- First, let's see all users in the system
SELECT 
    id,
    email,
    first_name,
    last_name,
    business_name,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- After you identify your user ID from above, replace 'YOUR_USER_ID_HERE' with the actual ID
-- SELECT seed_sample_data_for_user('YOUR_USER_ID_HERE');

-- To check if data was seeded correctly, run these queries:
-- SELECT COUNT(*) as product_count FROM public.products WHERE user_id = 'YOUR_USER_ID_HERE';
-- SELECT COUNT(*) as customer_count FROM public.customers WHERE user_id = 'YOUR_USER_ID_HERE';
-- SELECT COUNT(*) as order_count FROM public.orders WHERE user_id = 'YOUR_USER_ID_HERE';
-- SELECT COUNT(*) as chat_count FROM public.chats WHERE user_id = 'YOUR_USER_ID_HERE';
