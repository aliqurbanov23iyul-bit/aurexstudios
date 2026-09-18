# Aurex Studio — clean Vercel build

Bu versiyada admin qovluğu yoxdur. Admin birbaşa root `admin.html` faylıdır və Vercel rewrite ilə `/admin` ünvanından açılır.

## Vercel environment variables

- `ADMIN_PASSWORD`
- `ADMIN_SECRET`
- Database üçün bunlardan biri kifayətdir:
  - `DATABASE_URL`
  - `POSTGRES_URL`
  - `POSTGRES_URL_NON_POOLING`
  - `NEON_DATABASE_URL`

Database cədvəllərini əl ilə yaratmaq məcburi deyil. API ilk database sorğusunda `site_state`, `contact_messages` və `subscribers` cədvəllərini `CREATE TABLE IF NOT EXISTS` ilə avtomatik hazırlayır.

## Yoxlama linkləri

- `/` — sayt
- `/admin` — admin login + panel
- `/api/health` — Neon bağlantı yoxlaması
- `/api/content` — sayt məzmunu

`/api/health` nəticəsi `database: "connected"` qaytarırsa Neon işləyir.

## Məlumat modeli

Saytın CMS məzmunu vahid `site_state` JSON sətrində saxlanır. Oyunlar üçün ayrıca ikinci database source saxlanmır. Bu, əvvəldəki `games` cədvəli ilə `site_state` arasında yaranan sinxronizasiya problemlərini aradan qaldırır.

Steam import yalnız Steam məlumatını gətirir. Admin preview-dən sonra oyun CMS content-ə yazılır və `site_state` vasitəsilə sayta çıxır.
