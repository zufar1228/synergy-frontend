# Synergy IoT Frontend

Frontend dashboard untuk platform monitoring gudang Synergy IoT.

## Ringkasan

Aplikasi ini dibangun dengan Next.js App Router dan berfungsi sebagai antarmuka untuk:

- Monitoring sistem intrusi, keamanan, dan lingkungan per area gudang
- Manajemen data master (warehouse, area, device, user) berbasis role
- Integrasi notifikasi (Web Push dan Telegram management)
- Tool kalibrasi MPU6050 di halaman terpisah
- Demo mode untuk presentasi tanpa backend aktif

## Stack Utama

- Next.js 16 + React 19 + TypeScript
- TanStack React Query untuk data fetching client-side
- Wrapper API terpusat di `lib/api` dengan timeout default + abort handling per request
- Supabase SSR untuk session/auth flow
- Tailwind CSS v4 + shadcn/ui
- Recharts untuk visualisasi data
- PWA support (manifest + service worker)

## Prasyarat

- Node.js 20+
- pnpm

## Setup Lokal

1. Install dependency:

```bash
pnpm install
```

2. Buat file environment:

```bash
cp .env.local.example .env.local
```

3. Isi variable yang dibutuhkan:

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_SUPABASE_PROJECT_REF (opsional)
- NEXT_PUBLIC_VAPID_PUBLIC_KEY

4. Jalankan development server:

```bash
pnpm run dev
```

5. Buka aplikasi di browser:

http://localhost:3000

## NPM Scripts

- pnpm run dev: Jalankan Next.js dev server (Turbopack)
- pnpm run build: Build production
- pnpm run start: Jalankan build production
- pnpm run lint: Jalankan ESLint

## Struktur Folder Inti

- app: Route tree (login, main app shell, calibration, dll)
- features: Modul domain (intrusi, keamanan, lingkungan, calibration)
- components: Komponen shared dan UI
- lib/api: API client dan endpoint wrappers
- lib/supabase: Setup client/server/middleware auth
- lib/demo: Mock data + interceptor demo mode
- contexts: Context global (warehouse, device status)

## Catatan PWA

- Manifest: /manifest.webmanifest
- Service worker: public/sw.js
- Offline fallback: public/offline.html

Untuk validasi PWA, jalankan:

```bash
pnpm run build && pnpm run start
```

## Dokumentasi Lanjutan

- APP_DOCUMENTATION.md
- CODEBASE_SPECIFICATION.md
- DEVELOPER_SOP.md
- PANDUAN_HALAMAN_KALIBRASI.md
