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

## اختبار الاتصال
يمكنك اختبار الاتصال بـ Supabase عبر الذهاب إلى:
- `http://localhost:3000/api/test-env` - اختبار متغيرات البيئة والاتصال
- `http://localhost:3000/api/health` - فحص صحة الاتصال السريع

## استكشاف الأخطاء في الإنتاج

### 1. فحص متغيرات البيئة
```bash
# في Vercel Dashboard
1. اذهب إلى Project Settings
2. Environment Variables
3. تأكد من وجود:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
```

### 2. اختبار الاتصال في الإنتاج
```bash
# زُر هذه الروابط في الإنتاج:
https://your-app.vercel.app/api/health
https://your-app.vercel.app/api/test-env
```

### 3. فحص سجلات Vercel
```bash
# في Vercel Dashboard
1. اذهب إلى Functions
2. اختر Function مع مشكلة
3. راجع Logs للبحث عن أخطاء
```

### 4. مشاكل الاتصال الشائعة
- **Timeout Errors**: زيادة مهلة الاتصال (تم إصلاحها)
- **RLS Policy Issues**: تأكد من تشغيل سياسات RLS
- **Environment Variables**: تأكد من صحة المتغيرات في Vercel

## ملاحظات إضافية
- تأكد من أن ملف `.env.local` موجود في المجلد الجذر وليس في مجلد فرعي
- لا تشارك قيم `SUPABASE_SERVICE_ROLE_KEY` مع أحد
- تأكد من إعادة تشغيل الخادم بعد إضافة متغيرات البيئة
- في الإنتاج، قد تستغرق الاتصالات وقتًا أطول - تم إضافة منطق إعادة المحاولة

## اختبار الاتصال
يمكنك اختبار الاتصال بـ Supabase عبر الذهاب إلى:
`http://localhost:3000/api/test-env`

هذا سيظهر لك حالة متغيرات البيئة والاتصال بقاعدة البيانات.