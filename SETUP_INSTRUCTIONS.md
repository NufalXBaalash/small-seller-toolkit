# Setup Instructions - حل مشكلة Loading في صفحة تسجيل الدخول

## المشكلة الحالية
عند الضغط على زر "Log In" في صفحة الهبوط، تظهر صفحة تسجيل الدخول مع loading دائم. هذا يحدث بسبب عدم وجود متغيرات البيئة المطلوبة للاتصال بـ Supabase.

## الحل

### 1. إنشاء ملف متغيرات البيئة
قم بإنشاء ملف `.env.local` في المجلد الجذر للمشروع مع المحتوى التالي:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional configurations
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. الحصول على قيم Supabase
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك أو أنشئ مشروع جديد
3. اذهب إلى Settings → API
4. انسخ القيم التالية:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. إعداد قاعدة البيانات
قم بتشغيل الـ SQL scripts الموجودة في مجلد `scripts/` في Supabase SQL Editor:

```bash
1. scripts/create-tables.sql
2. scripts/create-profile-function.sql
3. scripts/fix-rls-policies.sql
```

### 4. إعادة تشغيل الخادم
```bash
npm run dev
# أو
yarn dev
# أو
pnpm dev
```

## التحقق من الحل
1. اذهب إلى صفحة الهبوط
2. اضغط على "Log In"
3. يجب أن تظهر صفحة تسجيل الدخول بدون loading دائم
4. جرب إنشاء حساب جديد أو تسجيل الدخول

## ملاحظات إضافية
- تأكد من أن ملف `.env.local` موجود في المجلد الجذر وليس في مجلد فرعي
- لا تشارك قيم `SUPABASE_SERVICE_ROLE_KEY` مع أحد
- تأكد من إعادة تشغيل الخادم بعد إضافة متغيرات البيئة

## اختبار الاتصال
يمكنك اختبار الاتصال بـ Supabase عبر الذهاب إلى:
`http://localhost:3000/api/test-env`

هذا سيظهر لك حالة متغيرات البيئة والاتصال بقاعدة البيانات.