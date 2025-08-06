# كيفية تسجيل الخروج واختبار صفحة تسجيل الدخول

## المشكلة الحالية
عند الضغط على "Log In" في صفحة الهبوط، يتم توجيهك مباشرة إلى Dashboard لأنك مسجل دخول بالفعل.

## الحل
الآن عند الضغط على "Log In" ستظهر لك صفحة تخبرك أنك مسجل دخول بالفعل مع خيارات:

1. **Go to Dashboard** - للذهاب إلى لوحة التحكم
2. **Sign Out & Login as Different User** - لتسجيل الخروج وتسجيل دخول بحساب آخر
3. **Back to Home** - للعودة إلى الصفحة الرئيسية

## طرق أخرى لتسجيل الخروج

### من المتصفح:
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. اكتب: `localStorage.clear(); sessionStorage.clear(); location.reload()`

### من التطبيق:
- اذهب إلى Dashboard وابحث عن زر Sign Out

## اختبار صفحة تسجيل الدخول
بعد تسجيل الخروج:
1. اذهب إلى الصفحة الرئيسية
2. اضغط على "Log In"
3. ستظهر صفحة تسجيل الدخول العادية

## تشغيل الخادم
إذا لم يكن الخادم يعمل، استخدم:

```bash
# في Command Prompt (بدلاً من PowerShell)
npm run dev
```

أو

```bash
# في PowerShell (بعد تفعيل execution policy)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm run dev
```