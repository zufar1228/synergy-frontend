# Synergy IoT Frontend — Spesifikasi Codebase Lengkap

> **Tujuan dokumen ini:** Memberikan pemahaman menyeluruh terhadap seluruh codebase frontend sehingga programmer baru atau AI model yang baru membuka proyek ini dapat langsung memahami konteks, melacak alur kode, dan melakukan debugging tanpa harus menelusuri codebase berulang kali.

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Stack Teknologi](#2-stack-teknologi)
3. [Struktur Direktori](#3-struktur-direktori)
4. [Environment Variables](#4-environment-variables)
5. [Route Tree & Page Map](#5-route-tree--page-map)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Layout & Navigation](#7-layout--navigation)
8. [Context Providers](#8-context-providers)
9. [Custom Hooks](#9-custom-hooks)
10. [API Layer](#10-api-layer)
11. [Data Fetching Patterns](#11-data-fetching-patterns)
12. [Fitur: Dashboard](#12-fitur-dashboard)
13. [Fitur: Keamanan (Kamera)](#13-fitur-keamanan-kamera)
14. [Fitur: Intrusi (Keamanan Pintu)](#14-fitur-intrusi-keamanan-pintu)
15. [Fitur: Lingkungan (Monitoring)](#15-fitur-lingkungan-monitoring)
16. [Fitur: Kalibrasi MPU6050](#16-fitur-kalibrasi-mpu6050)
17. [Fitur: Management (CRUD)](#17-fitur-management-crud)
18. [Fitur: Profile & Preferences](#18-fitur-profile--preferences)
19. [Fitur: Demo Mode](#19-fitur-demo-mode)
20. [Komponen Shared & UI](#20-komponen-shared--ui)
21. [PWA & Push Notification](#21-pwa--push-notification)
22. [Peta Dependensi Antar File](#22-peta-dependensi-antar-file)
23. [Pola & Konvensi Kode](#23-pola--konvensi-kode)
24. [Troubleshooting Guide](#24-troubleshooting-guide)

---

## 1. Ringkasan Proyek

Synergy IoT Frontend adalah aplikasi Next.js yang menyediakan web dashboard untuk monitoring dan pengelolaan ekosistem IoT gudang. Aplikasi ini menampilkan data realtime dari 3 domain: keamanan kamera, keamanan pintu (intrusi), dan monitoring lingkungan (suhu/kelembapan/CO₂). Dilengkapi dengan role-based access control, push notifications, Telegram integration, dan demo mode.

**Fitur utama:**
- Dashboard overview per gudang
- Monitoring realtime (Supabase Realtime + SSE untuk kalibrasi)
- CRUD management (gudang, area, perangkat, pengguna)
- Kontrol aktuator (fan, dehumidifier, ARM/DISARM, siren)
- Notifikasi (browser push + Telegram)
- Kalibrasi sensor MPU6050 (standalone tool)
- Demo mode untuk showcase tanpa backend

---

## 2. Stack Teknologi

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | Next.js | 16.0.8 |
| React | React | 19.1.0 |
| Language | TypeScript | 5 |
| Build | Turbopack | Built-in Next.js |
| Auth | Supabase SSR + supabase-js | Latest |
| Data Fetching | TanStack React Query | v5 |
| Tables | TanStack React Table | v8 |
| Forms | react-hook-form + zod | Latest |
| UI Framework | shadcn/ui (48 komponen) | Latest |
| UI Primitives | Radix UI (30+ packages) | Latest |
| Icons | Lucide React | Latest |
| Charts | Recharts | Latest |
| Styling | Tailwind CSS v4 | v4 |
| Animation | Motion (framer-motion) | Latest |
| Dates | date-fns + date-fns-tz | Latest |
| Toasts | Sonner | Latest |
| Env Validation | @t3-oss/env-nextjs | Latest |

---

## 3. Struktur Direktori

```
frontend/
├── package.json
├── next.config.ts                 # Image optimization, headers, CSP
├── middleware.ts                   # Auth guard (calls updateSession)
├── tsconfig.json                  # Path alias: @/* → ./*
├── components.json                # shadcn config
│
├── app/                           # ══════ ROUTES ══════
│   ├── layout.tsx                 # Root layout (fonts, ThemeProvider, Toaster, SW)
│   ├── page.tsx                   # Root → redirect("/login")
│   ├── globals.css                # Tailwind + custom theme (oklch, neobrutalist)
│   ├── actions.ts                 # (placeholder)
│   ├── manifest.ts                # PWA manifest
│   ├── global-error.tsx           # Error boundary
│   │
│   ├── login/                     # Auth pages
│   │   ├── page.tsx               # Login SSC
│   │   ├── actions.ts             # Server actions: login(), logout()
│   │   ├── demo-action.ts         # Server action: startDemo()
│   │   └── error.tsx
│   ├── setup-account/page.tsx     # Invitation password setup
│   ├── auth/callback/route.ts     # OAuth callback handler
│   ├── calibration/page.tsx       # Standalone calibration tool
│   │
│   └── (main)/                    # ══════ MAIN APP GROUP ══════
│       ├── layout.tsx             # Auth check + all providers
│       ├── error.tsx
│       ├── loading.tsx
│       ├── dashboard/page.tsx     # Dashboard
│       ├── profile/page.tsx       # User profile
│       ├── management/
│       │   ├── warehouses/page.tsx
│       │   ├── areas/page.tsx
│       │   ├── devices/page.tsx
│       │   └── users/page.tsx
│       └── [warehouseId]/
│           ├── dashboard/page.tsx
│           └── [areaId]/
│               └── [systemType]/page.tsx  # Feature views
│
├── components/                    # ══════ KOMPONEN ══════
│   ├── app-sidebar.tsx            # Desktop sidebar
│   ├── app-navigation.tsx         # Navigation links
│   ├── mobile-sidebar.tsx         # Mobile sidebar (Sheet)
│   ├── mobile-navigation.tsx      # Mobile nav
│   ├── site-header.tsx            # Top header
│   ├── warehouse-selector.tsx     # Dropdown pemilih gudang
│   ├── header-breadcrumbs.tsx     # Dynamic breadcrumbs
│   ├── nav-user.tsx               # User menu (avatar dropdown)
│   ├── login-form.tsx             # Login form
│   ├── demo-button.tsx            # Demo mode trigger
│   ├── demo-banner.tsx            # Demo mode banner
│   ├── logout-button.tsx
│   ├── session-refresh.tsx        # Supabase auth listener
│   ├── theme-provider.tsx         # next-themes wrapper
│   ├── theme-toggle.tsx           # Dark/light switcher
│   ├── warehouse-selector.tsx
│   ├── user-profile-display.tsx
│   ├── date-range-picker.tsx
│   │
│   ├── actions/                   # CRUD form dialogs
│   │   ├── WarehouseActions.tsx
│   │   ├── AreaActions.tsx
│   │   ├── DeviceActions.tsx
│   │   └── UserActions.tsx
│   ├── dashboard/                 # Dashboard components
│   │   └── WarehouseSummaryStats.tsx
│   ├── profile/                   # Profile forms
│   │   ├── UpdateProfileForm.tsx
│   │   ├── UpdatePasswordForm.tsx
│   │   ├── UpdatePreferencesForm.tsx
│   │   └── PushNotificationManager.tsx
│   ├── telegram/
│   │   └── TelegramManager.tsx
│   ├── shared/                    # Shared components
│   │   ├── WarehouseCard.tsx
│   │   ├── AnimatedPageTitle.tsx
│   │   └── copy-button.tsx
│   ├── providers/
│   │   └── query-provider.tsx     # TanStack QueryClient
│   ├── pwa/
│   │   └── service-worker-register.tsx
│   └── ui/                        # 48 shadcn components
│
├── features/                      # ══════ DOMAIN FEATURES ══════
│   ├── calibration/
│   │   ├── api/calibration.ts
│   │   ├── hooks/useCalibrationSSE.ts
│   │   ├── components/
│   │   │   ├── CalibrationControlPanel.tsx
│   │   │   ├── CalibrationStatusDisplay.tsx
│   │   │   └── CalibrationDataTable.tsx
│   │   └── index.ts
│   ├── keamanan/
│   │   └── components/
│   │       ├── KeamananView.tsx
│   │       ├── KeamananDataTable.tsx
│   │       └── SecurityStatusChart.tsx
│   ├── intrusi/
│   │   ├── api/intrusi.ts
│   │   └── components/
│   │       ├── IntrusiView.tsx
│   │       ├── IntrusiDataTable.tsx
│   │       ├── IntrusiDeviceControls.tsx
│   │       └── IntrusiEventChart.tsx
│   └── lingkungan/
│       ├── api/lingkungan.ts
│       └── components/
│           ├── LingkunganView.tsx
│           ├── LingkunganChart.tsx
│           └── LingkunganDataTable.tsx
│
├── contexts/                      # React Contexts
│   ├── WarehouseContext.tsx
│   └── DeviceStatusContext.tsx
│
├── hooks/                         # Custom hooks
│   ├── use-api-query.ts
│   ├── use-warehouses.ts
│   ├── use-nav-areas.ts
│   ├── use-user-profile.ts
│   ├── use-user-role.ts
│   ├── use-telegram-members.ts
│   ├── use-push-notification.ts
│   └── use-mobile.ts
│
├── lib/                           # Utilities & API
│   ├── api/                       # API client + endpoints
│   │   ├── client.ts              # Base fetch wrapper
│   │   ├── index.ts               # Barrel re-export
│   │   ├── types.ts               # 30+ type definitions
│   │   ├── warehouses.ts
│   │   ├── areas.ts
│   │   ├── devices.ts
│   │   ├── users.ts
│   │   ├── navigation.ts
│   │   ├── analytics.ts
│   │   ├── alerts.ts
│   │   └── telegram.ts
│   ├── supabase/                  # Supabase client config
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client (RSC)
│   │   └── middleware.ts          # Auth middleware logic
│   ├── demo/                      # Demo mode
│   │   ├── api-interceptor.ts     # Mock API responses
│   │   ├── context.tsx            # Demo context
│   │   └── mock-data.ts           # 20+ mock data objects
│   ├── env.ts                     # Validated env vars
│   └── utils.ts                   # cn() utility
│
├── certificates/                  # (SSL certs placeholder)
└── public/                        # Static assets
    ├── sw.js                      # Service worker
    ├── offline.html               # PWA offline page
    ├── icon-192x192.png           # PWA icon
    ├── icon-512x512.png           # PWA icon
    ├── logo_header-dark.png       # Header logo dark
    └── logo_header-light.png      # Header logo light
```

---

## 4. Environment Variables

Divalidasi via `@t3-oss/env-nextjs` di `lib/env.ts`.

| Variable | Scope | Fungsi |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | Client | URL backend API (e.g. `http://localhost:5001`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_PROJECT_REF` | Client (optional) | Supabase project ref |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client | Web Push VAPID public key |

---

## 5. Route Tree & Page Map

### 5.1 Route Structure

```
/                           → redirect ke /login
/login                      → Login page (SSC)
/setup-account              → Setup password dari invitation
/auth/callback              → OAuth callback (route handler)
/calibration                → Standalone calibration tool (TANPA sidebar)

/(main)/                    → Main app group (DENGAN sidebar + header)
  /dashboard                → Dashboard overview
  /profile                  → User profile + preferences
  /management/warehouses    → CRUD gudang
  /management/areas         → CRUD area
  /management/devices       → CRUD perangkat
  /management/users         → CRUD pengguna + Telegram
  /[warehouseId]/dashboard  → Warehouse detail drill-down
  /[warehouseId]/[areaId]/[systemType] → Feature view (keamanan/intrusi/lingkungan)
```

### 5.2 Page Rendering

| Page | Tipe | Data Fetching |
|------|------|---------------|
| `/login` | SSC | Supabase session check |
| `/setup-account` | Client | URL hash token parsing |
| `/dashboard` | Client | useApiQuery + Supabase Realtime |
| `/profile` | Client | useApiQuery + forms |
| `/management/*` | SSC | Server-side API fetch |
| `/[wid]/dashboard` | SSC | Server-side API fetch |
| `/[wid]/[aid]/[sys]` | SSC dispatch | Fetch analytics → render KeamananView\|IntrusiView\|LingkunganView |
| `/calibration` | Client | SSE + direct API calls |

### 5.3 Dynamic Route: Feature View Dispatch

`app/(main)/[warehouseId]/[areaId]/[systemType]/page.tsx`:

```ts
// SSC yang:
// 1. Fetch analytics data server-side
// 2. Render komponen berdasarkan systemType:
switch (systemType) {
  case 'keamanan':   return <KeamananView ... />
  case 'intrusi':    return <IntrusiView ... />
  case 'lingkungan': return <LingkunganView ... />
}
```

---

## 6. Authentication & Authorization

### 6.1 Login Flow

```
User                    Frontend                    Backend            Supabase
  │                        │                           │                  │
  ├─ Email/Password ──────→│                           │                  │
  │                        ├─ signInWithPassword() ───────────────────────→│
  │                        │◄──────────────────────── session + token ────┤
  │                        ├─ verifyUserAccess() ─────→│                  │
  │                        │                           ├─ check user_roles─┤
  │                        │◄────── { valid: true } ──┤                  │
  │◄─── redirect /dashboard┤                           │                  │
  │                        │                           │                  │
  ├─ Google OAuth ────────→│                           │                  │
  │                        ├─ signInWithOAuth() ──────────────────────────→│
  │                        │◄──────────────────── redirect to Google ─────┤
  │                        │              ... OAuth flow ...              │
  │                        │◄──────── /auth/callback?code=xxx ───────────┤
  │                        ├─ exchangeCodeForSession() ──────────────────→│
  │                        ├─ verifyUserAccess() ─────→│                  │
  │◄─── redirect /dashboard┤                           │                  │
```

### 6.2 Middleware (`middleware.ts` → `lib/supabase/middleware.ts`)

```
Setiap request:
  │
  ├─ Cookie "demo-mode" ada? → BYPASS (izinkan akses)
  │
  ├─ Public path (/login, /auth/callback, /setup-account, /calibration)?
  │   └─ Refresh session saja, lanjut
  │
  ├─ getUser() → user valid?
  │   ├─ TIDAK → redirect ke /login
  │   └─ YA → decode JWT untuk role check
  │       ├─ /management/* → butuh admin atau super_admin
  │       ├─ /management/users → butuh super_admin
  │       └─ Lainnya → izinkan
  │
  └─ Update session cookies
```

### 6.3 Roles

| Role | Akses Dashboard | Akses Monitoring | Akses Management | Akses Users |
|------|----------------|-----------------|------------------|-------------|
| `user` | ✅ | ✅ (read only) | ❌ | ❌ |
| `admin` | ✅ | ✅ (read + write) | ✅ | ❌ |
| `super_admin` | ✅ | ✅ (read + write) | ✅ | ✅ |

### 6.4 Session Refresh (`components/session-refresh.tsx`)

- Subscribe ke `onAuthStateChange`
- Handle events: `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`
- Listen custom event `auth:unauthorized` (dispatched oleh API layer saat 401)
- Auto-redirect ke `/login` pada unauthorized

---

## 7. Layout & Navigation

### 7.1 Root Layout (`app/layout.tsx`)

```
<html>
  <body>
    <ThemeProvider>
      <Toaster />
      <ServiceWorkerRegister />
      {children}
    </ThemeProvider>
  </body>
</html>
```

### 7.2 Main Layout (`app/(main)/layout.tsx`) — Provider Nesting

```
DemoProvider
  └── WarehouseProvider
      └── DeviceStatusProvider
          └── QueryProvider (TanStack)
              └── SessionRefresh
                  └── SidebarProvider (shadcn)
                      ├── AppSidebar
                      ├── SiteHeader
                      └── <main>{children}</main>
```

### 7.3 Sidebar Navigation (`components/app-navigation.tsx`)

```
SIDEBAR
├── [Header] WarehouseSelector dropdown
├── [Content]
│   ├── Platform
│   │   ├── Dashboard          → /dashboard
│   │   └── Profil             → /profile
│   ├── Monitoring
│   │   ├── Keamanan (collapsible)
│   │   │   ├── Area 1        → /[wid]/[aid]/keamanan
│   │   │   └── Area 2        → /[wid]/[aid]/keamanan
│   │   ├── Lingkungan (collapsible)
│   │   │   ├── Area 1        → /[wid]/[aid]/lingkungan
│   │   │   └── Area 2        → /[wid]/[aid]/lingkungan
│   │   └── Intrusi (collapsible)
│   │       ├── Area 1        → /[wid]/[aid]/intrusi
│   │       └── Area 2        → /[wid]/[aid]/intrusi
│   └── Management (role-gated: admin+)
│       ├── Gudang             → /management/warehouses
│       ├── Area               → /management/areas
│       ├── Perangkat          → /management/devices
│       └── Pengguna           → /management/users (super_admin only)
└── [Footer] NavUser (avatar + logout)
```

**Area sub-links difilter berdasarkan:**
- `selectedWarehouse` dari WarehouseContext
- Data dari `useNavAreas()` per system_type

### 7.4 Mobile Sidebar (`components/mobile-sidebar.tsx`)

- Sama strukturnya dengan desktop, dikemas dalam `Sheet` component
- Fetch data nav secara independen (tidak share state dengan desktop)

---

## 8. Context Providers

### 8.1 WarehouseContext (`contexts/WarehouseContext.tsx`)

```ts
// Exports:
export const WarehouseProvider      // Provider component
export function useWarehouse()      // Hook
// Returns:
{
  selectedWarehouse: string | null,   // warehouse ID atau "all"
  setSelectedWarehouse: (id) => void,
  isInitialized: boolean
}
```

- Default: `"all"` (semua gudang)
- Persistence: `localStorage.selectedWarehouse`
- Digunakan di: sidebar nav, warehouse selector, dashboard, semua feature views

### 8.2 DeviceStatusContext (`contexts/DeviceStatusContext.tsx`)

```ts
// Exports:
export const DeviceStatusProvider    // Provider component
export function useDeviceStatus()    // Hook
// Returns:
{
  updateDeviceStatus: (areaId, systemType, isOnline) => void,
  getDeviceStatus: (areaId, systemType) => DeviceStatus | undefined,
  isDeviceOnline: (areaId, systemType) => boolean
}
```

- State: `Map<string, DeviceStatus>` via `useReducer`
- Key format: `${areaId}_${systemType}`
- Auto cleanup: Device dianggap offline setelah 10 menit tanpa update
- Cleanup interval: setiap 60 detik
- Digunakan di: LingkunganView, IntrusiView (update saat data realtime masuk)

### 8.3 DemoContext (`lib/demo/context.tsx`)

```ts
// Exports:
export const DemoProvider
export function useDemo()
// Returns:
{ isDemo: boolean, exitDemo: () => void }
```

- `exitDemo()`: hapus cookie `demo-mode`, redirect ke `/login`

---

## 9. Custom Hooks

### 9.1 Data Fetching Hooks

#### `useApiQuery` / `useApiMutation` (`hooks/use-api-query.ts`)

Wrapper di atas TanStack React Query yang otomatis inject Supabase auth token:

```ts
function useApiQuery<T>(
  queryKey: QueryKey,
  queryFn: (token: string) => Promise<T>,
  options?: UseQueryOptions
)
// token diambil dari supabase.auth.getSession()
// Demo mode: return static "demo-token"

function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables, token: string) => Promise<TData>,
  options?: UseMutationOptions
)
```

#### `useWarehouses` (`hooks/use-warehouses.ts`)

```ts
function useWarehouses()
// Returns: TanStack Query result untuk getWarehouses()
// QueryKey: ['warehouses']
```

#### `useNavAreas` (`hooks/use-nav-areas.ts`)

```ts
function useNavAreas()
// Returns: { keamanan: NavArea[], intrusi: NavArea[], lingkungan: NavArea[] }
// Fetch 3 parallel queries: getNavAreasBySystem untuk setiap system_type
// QueryKeys: ['navAreas', systemType]
```

#### `useUserProfile` (`hooks/use-user-profile.ts`)

```ts
function useUserProfile()
// Returns: TanStack Query result untuk getMyProfile()
// QueryKey: ['userProfile']
```

#### `useUserRole` (`hooks/use-user-role.ts`)

```ts
function useUserRole()
// Returns: { role: string, isAdmin: boolean, isLoading: boolean }
// isAdmin = role === 'admin' || role === 'super_admin'
// Derived dari useUserProfile()
```

#### `useTelegramMembers` (`hooks/use-telegram-members.ts`)

```ts
function useTelegramMembers()
// Returns: TanStack Query result untuk getTelegramMembers()
// QueryKey: ['telegramMembers']
```

### 9.2 Utility Hooks

#### `usePushNotification` (`hooks/use-push-notification.ts`)

```ts
function usePushNotification()
// Returns: {
//   isSubscribed: boolean,
//   isSupported: boolean,
//   subscribe: () => Promise<void>,
//   unsubscribe: () => Promise<void>,
//   testNotification: () => Promise<void>
// }
```

#### `useIsMobile` (`hooks/use-mobile.ts`)

```ts
function useIsMobile()
// Returns: boolean (window.innerWidth < 768)
```

---

## 10. API Layer

### 10.1 Base Client (`lib/api/client.ts`)

```ts
export const API_BASE_URL: string   // dari env.NEXT_PUBLIC_API_URL
export function apiFetch<T>(path, options?, token?): Promise<T>
export function apiFetchSafe<T>(path, options?, token?): Promise<T | null>
```

**`apiFetch` flow:**
1. Cek demo mode → return mock data
2. Add `Authorization: Bearer {token}` header
3. Fetch dari `${API_BASE_URL}${path}`
4. Pada 401: dispatch custom event `auth:unauthorized`
5. Parse JSON, throw error jika tidak OK

**`apiFetchSafe`:** Sama tapi return `null` jika error (tidak throw)

### 10.2 API Functions per Domain

#### Warehouses (`lib/api/warehouses.ts`)

| Fungsi | Method | Path | Keterangan |
|--------|--------|------|------------|
| `getWarehouses(token)` | GET | `/api/warehouses` | List with stats |
| `createWarehouse(data, token)` | POST | `/api/warehouses` | |
| `updateWarehouse(id, data, token)` | PUT | `/api/warehouses/:id` | |
| `deleteWarehouse(id, token)` | DELETE | `/api/warehouses/:id` | |
| `getWarehouseDetails(id, token)` | GET | `/api/warehouses/:id/areas-with-systems` | Detail drill-down |

#### Areas (`lib/api/areas.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getAreas(token)` | GET | `/api/areas` |
| `createArea(data, token)` | POST | `/api/areas` |
| `updateArea(id, data, token)` | PUT | `/api/areas/:id` |
| `deleteArea(id, token)` | DELETE | `/api/areas/:id` |
| `getAreasByWarehouse(warehouseId, token)` | GET | `/api/areas?warehouse_id=` |

#### Devices (`lib/api/devices.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getDevices(token)` | GET | `/api/devices` |
| `createDevice(data, token)` | POST | `/api/devices` |
| `updateDevice(id, data, token)` | PUT | `/api/devices/:id` |
| `deleteDevice(id, token)` | DELETE | `/api/devices/:id` |
| `getDeviceDetailsByArea(areaId, systemType, token)` | GET | `/api/devices/details?area_id&system_type` |

#### Users (`lib/api/users.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `verifyUserAccess(token)` | GET | `/api/users/verify-access` |
| `getUsers(token)` | GET | `/api/users` |
| `inviteUser(data, token)` | POST | `/api/users/invite` |
| `deleteUser(id, token)` | DELETE | `/api/users/:id` |
| `getMyProfile(token)` | GET | `/api/users/me` |
| `updateMyProfile(data, token)` | PUT | `/api/users/me` |
| `updateUserRole(id, role, token)` | PUT | `/api/users/:id/role` |
| `updateUserStatus(id, status, token)` | PUT | `/api/users/:id/status` |
| `getMyPreferences(token)` | GET | `/api/users/me/preferences` |
| `updateMyPreferences(prefs, token)` | PUT | `/api/users/me/preferences` |
| `getVapidPublicKey(token)` | GET | `/api/users/push/vapid-key` |
| `subscribeToPush(sub, token)` | POST | `/api/users/push/subscribe` |
| `testPushNotification(token)` | POST | `/api/users/push/test` |

#### Navigation (`lib/api/navigation.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getNavAreasBySystem(systemType, token)` | GET | `/api/navigation/areas-by-system?system_type=` |

#### Analytics (`lib/api/analytics.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getAnalytics(systemType, params, token)` | GET | `/api/analytics/:systemType?area_id&page&per_page&from&to` |
| `getAnalyticsDataForSystem(systemType, areaId, params, token)` | GET | Same (convenience wrapper) |

#### Alerts (`lib/api/alerts.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getActiveAlerts(warehouseId, token)` | GET | `/api/alerts/active?warehouse_id=` |
| `updateIncidentStatus(id, data, token)` | PUT | `/api/incidents/:id/status` |
| `updateKeamananLogStatus(id, data, token)` | PUT | `/api/security-logs/:id/status` |

#### Telegram (`lib/api/telegram.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getTelegramMembers(token)` | GET | `/api/telegram/members` |
| `generateTelegramInvite(token)` | POST | `/api/telegram/invite` |
| `kickTelegramMember(userId, token)` | POST | `/api/telegram/kick` |
| `sendTelegramTestAlert(token)` | POST | `/api/telegram/test-alert` |

### 10.3 Feature-Specific APIs

#### Intrusi (`features/intrusi/api/intrusi.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getIntrusiLogs(deviceId, params, token)` | GET | `/api/intrusi/devices/:id/logs` |
| `getIntrusiSummary(deviceId, token)` | GET | `/api/intrusi/devices/:id/summary` |
| `getIntrusiStatus(deviceId, token)` | GET | `/api/intrusi/devices/:id/status` |
| `updateIntrusiLogStatus(logId, data, token)` | PUT | `/api/intrusi/logs/:id/status` |
| `sendIntrusiCommand(deviceId, command, token)` | POST | `/api/intrusi/devices/:id/command` |

#### Lingkungan (`features/lingkungan/api/lingkungan.ts`)

| Fungsi | Method | Path |
|--------|--------|------|
| `getLingkunganStatus(deviceId, token)` | GET | `/api/lingkungan/devices/:id/status` |
| `getLingkunganChart(deviceId, params, token)` | GET | `/api/lingkungan/devices/:id/chart` |
| `sendLingkunganControl(deviceId, command, token)` | POST | `/api/lingkungan/devices/:id/control` |
| `updateLingkunganLogStatus(logId, data, token)` | PUT | `/api/lingkungan/logs/:id/status` |

#### Kalibrasi (`features/calibration/api/calibration.ts`)

**Berbeda dari API utama** — menggunakan base URL `/api-cal` (bukan `/api`) dan TANPA auth token.

| Fungsi | Method | Path |
|--------|--------|------|
| `sendCommand(command)` | POST | `/api-cal/command` |
| `getDeviceStatus(deviceId)` | GET | `/api-cal/status/:deviceId` |
| `getRawData(params)` | GET | `/api-cal/data` |
| `getSessions(deviceId)` | GET | `/api-cal/sessions` |
| `getStatistics(deviceId)` | GET | `/api-cal/statistics` |
| `getSessionStats(deviceId)` | GET | `/api-cal/session-stats` |
| `getTrialPeaks(deviceId)` | GET | `/api-cal/trial-peaks` |
| `getPeakSummary(deviceId)` | GET | `/api-cal/peak-summary` |
| `getSummaryData(deviceId)` | GET | `/api-cal/summary` |

---

## 11. Data Fetching Patterns

### 11.1 Server Components (SSC)

```ts
// Digunakan di: management pages, analytics dispatch
const supabase = await createClient()  // Server client
const { data: { session } } = await supabase.auth.getSession()
const data = await getWarehouses(session?.access_token || '')
```

Demo mode: cek cookie `demo-mode` → return mock data langsung.

### 11.2 Client Components (TanStack Query)

```ts
// Digunakan di: dashboard, profile, sidebar
const { data, isLoading, error } = useApiQuery(
  ['queryKey'],
  (token) => fetchFunction(token)
)
```

- Token otomatis diambil dari `supabase.auth.getSession()`
- Demo mode: return `"demo-token"` → intercepted by `apiFetch`
- `staleTime`: 5 detik
- Retry: 3x (skip retry untuk 401/403)

### 11.3 Supabase Realtime

```ts
// Digunakan di: dashboard, keamanan, intrusi, lingkungan views
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: 'INSERT',  // atau '*' untuk semua
    schema: 'public',
    table: 'table_name',
    filter: 'device_id=eq.xxx'
  }, (payload) => {
    // Update local state
  })
  .subscribe()
```

| View | Tabel | Event | Filter |
|------|-------|-------|--------|
| Dashboard | `devices`, `areas` | `*` | - |
| KeamananView | `keamanan_logs` | `INSERT`, `UPDATE` | `device_id` |
| IntrusiView | `intrusi_logs` | `INSERT`, `UPDATE` | `device_id` |
| LingkunganView | `lingkungan_logs` | `INSERT` | `device_id` |

### 11.4 SSE (Server-Sent Events)

```ts
// Hanya untuk kalibrasi
const { calState, status, connected } = useCalibrationSSE(deviceId)
// EventSource ke /api-cal/events/:deviceId
// Fallback: HTTP polling 3 detik jika SSE disconnect
```

### 11.5 URL State

- Date range: `?from=2026-01-01&to=2026-12-31` via `DateRangePicker`
- Pagination: `?page=1&per_page=50`
- Filters: `?status=unacknowledged&event_type=ARMED,DISARM`

---

## 12. Fitur: Dashboard

### File: `app/(main)/dashboard/page.tsx`

**Client component** yang:
1. Menggunakan `useWarehouse()` untuk filter gudang
2. `useApiQuery` untuk fetch warehouse details
3. Subscribe ke Supabase Realtime (`devices`, `areas` tabel)
4. Menampilkan:
   - `WarehouseSummaryStats` — kartu ringkasan (jumlah area, device, online/offline)
   - `WarehouseCard` per gudang — overview status
   - Active alerts dari `getActiveAlerts()`

---

## 13. Fitur: Keamanan (Kamera)

### File: `features/keamanan/components/KeamananView.tsx`

**Props:** `{ areaId, deviceId, initialData, warehouseId }`

**Sections:**
1. **Alert banner** — muncul jika ada deteksi unacknowledged
2. **Latest photo preview** — gambar terakhir dari kamera
3. **Summary cards** — total deteksi, unacknowledged
4. **Data table** (`KeamananDataTable`) — log deteksi dengan thumbnail

**Realtime:** Subscribe ke `keamanan_logs` INSERT/UPDATE → auto-refresh
**Browser notifications:** `new Notification()` saat deteksi baru masuk

### File: `features/keamanan/components/KeamananDataTable.tsx`

- TanStack React Table
- Kolom: timestamp, gambar, detected, confidence, atribut, status
- Status update dialog (acknowledge/resolve/false_alarm)
- Pagination

---

## 14. Fitur: Intrusi (Keamanan Pintu)

### File: `features/intrusi/components/IntrusiView.tsx`

**Props:** `{ areaId, deviceId, initialData, initialStatus, warehouseId }`

**Sections:**
1. **Summary cards** — total events, alarm, impact, unacknowledged, acknowledge rate
2. **Alert banner** — peringatan aktif
3. **Device controls** (`IntrusiDeviceControls`)
4. **Event chart** (`IntrusiEventChart`) — timeline
5. **Data table** (`IntrusiDataTable`) — log events

**Realtime:** Subscribe ke `intrusi_logs` INSERT/UPDATE
**Browser notifications:** Alarm events → browser notification

### File: `features/intrusi/components/IntrusiDeviceControls.tsx`

**Commands:**
- ARM — aktifkan sistem
- DISARM — matikan sistem
- SIREN_SILENCE — matikan sirene

Tombol di-gate berdasarkan role (admin+ only) dan device state.

### File: `features/intrusi/components/IntrusiDataTable.tsx`

- Kolom: timestamp, event_type, system_state, door_state, peak_delta_g, hit_count, status
- Badge warna per event type
- Status update dialog
- Pagination + filters

---

## 15. Fitur: Lingkungan (Monitoring)

### File: `features/lingkungan/components/LingkunganView.tsx`

**Props:** `{ areaId, deviceId, initialData, initialStatus, warehouseId }`

**Sections:**
1. **Status cards** — suhu, kelembapan, CO₂ (actual + prediction)
   - Warna: hijau (normal), kuning (waspada), merah (bahaya)
   - Prediction overlay jika ada
2. **Actuator controls** (admin only):
   - Fan ON/OFF
   - Dehumidifier ON/OFF
   - Switch ke mode AUTO
3. **Chart** (`LingkunganChart`) — actual vs predicted
4. **Data table** (`LingkunganDataTable`) — log readings

**Realtime:** Subscribe ke `lingkungan_logs` INSERT → update status + DeviceStatusContext

### File: `features/lingkungan/components/LingkunganChart.tsx`

- Recharts LineChart
- 3 series: temperature, humidity, CO₂
- Prediction overlay (dashed lines)
- Configurable date range

### File: `features/lingkungan/components/LingkunganDataTable.tsx`

- Kolom: timestamp, temperature, humidity, co2, status
- Status update dialog
- Pagination

---

## 16. Fitur: Kalibrasi MPU6050

### File: `app/calibration/page.tsx`

**Standalone page** (tanpa sidebar layout). Client component.

**Structure:**
```
CalibrationPage
├── Device ID input (collapsible)
├── Badge koneksi: "● Live" (SSE) atau "○ Polling" (fallback)
├── useCalibrationSSE(deviceId) — lifted ke page level
├── Grid:
│   ├── CalibrationControlPanel (calState prop)
│   └── CalibrationStatusDisplay (sseStatus + sseConnected props)
└── CalibrationDataTable
```

### File: `features/calibration/hooks/useCalibrationSSE.ts`

```ts
function useCalibrationSSE(deviceId: string | null)
// Returns: { calState: string, status: CalibrationDeviceStatus | null, connected: boolean }
```

**Flow:**
1. Open `EventSource` ke `${API_BASE_URL}/api-cal/events/${deviceId}`
2. `onopen` → `connected = true`, stop fallback polling
3. `onmessage` → parse JSON, map ke `CalibrationDeviceStatus`, update state
4. `onerror` → `connected = false`, start fallback polling (3s interval)
5. Cleanup: close EventSource + clear interval on unmount

### File: `features/calibration/components/CalibrationControlPanel.tsx`

**Props:** `{ deviceId, calState }`

**State:**
- `activeSession` — Tab A/B/C/D
- `loading` — Button loading tracker
- `completedTrials` — `Set<string>` progress
- `lastMessage` — Success/error feedback

**Trial Presets:**
| Session | Trials | Contoh |
|---------|--------|--------|
| A | 1 | Full ambient baseline |
| B | 8 | Ketuk 1x pelan, Ketuk 1x kuat, dll |
| C | 10 | Congkel obeng, Pahat di engsel, dll |
| D | 10 | Dorong badan, Tendang 1x, dll |

**Flow:**
1. Klik trial → `quickStart()`: SET_SESSION + START via POST `/api-cal/command`
2. Phase indicator berdasarkan `calState` prop:
   - ⏳ COUNTDOWN
   - 🔄 KALIBRASI
   - 🟢 MULAI! (RECORDING)
3. Audio cues: `playStart()`, `playBeep()`, `playStop()`, `playError()`
4. STOP → POST command, trial auto-increment di firmware

### File: `features/calibration/components/CalibrationStatusDisplay.tsx`

**Props:** `{ deviceId, sseStatus?, sseConnected? }`

Menampilkan grid metrik:
- `cal_state`, session, trial, door_state
- WiFi RSSI, uptime, free heap, last seen

**Data source:** Prioritas SSE, fallback HTTP polling 5s jika SSE disconnected.

### File: `features/calibration/components/CalibrationDataTable.tsx`

**6 Tab:**

| Tab | API Call | Data |
|-----|----------|------|
| Session Stats | `getSessionStats()` | Agregat per-session + percentiles |
| Summary (A) | `getSummaryData()` | Periodic 5s windows |
| Per-Trial | `getStatistics()` | Stats per trial + filter |
| Trial Peaks | `getTrialPeaks()` | Max Δg per trial |
| Peak Summary | `getPeakSummary()` | Peak stats across trials |
| Raw Data | `getRawData()` | Individual readings, pagination limit=50 |

---

## 17. Fitur: Management (CRUD)

### 17.1 Pattern CRUD

Semua management pages mengikuti pattern yang sama:

```
Page (SSC)
├── Fetch data server-side
├── Render tabel + action buttons
├── AddButton → Dialog form (react-hook-form + zod)
├── ActionButtons → Dropdown menu
│   ├── Edit → Dialog form
│   └── Delete → Confirmation dialog
└── Mutations via apiFetch + Supabase token
```

### 17.2 Warehouses (`management/warehouses/page.tsx`)

| Action | Fungsi | Role |
|--------|--------|------|
| List | `getWarehouses()` | user+ |
| Create | `createWarehouse()` | admin+ |
| Update | `updateWarehouse()` | admin+ |
| Delete | `deleteWarehouse()` | admin+ |

### 17.3 Areas (`management/areas/page.tsx`)

| Action | Fungsi | Role |
|--------|--------|------|
| List | `getAreas()` | user+ |
| Create | `createArea({ warehouse_id, name })` | admin+ |
| Update | `updateArea()` | admin+ |
| Delete | `deleteArea()` | admin+ |

Form termasuk warehouse selector dropdown.

### 17.4 Devices (`management/devices/page.tsx`)

| Action | Fungsi | Role |
|--------|--------|------|
| List | `getDevices()` | user+ |
| Create | `createDevice({ area_id, name, system_type })` | admin+ |
| Update | `updateDevice()` | admin+ |
| Delete | `deleteDevice()` | admin+ |

- Create response termasuk MQTT credentials → ditampilkan sekali
- Form: warehouse → area cascade dropdown

### 17.5 Users (`management/users/page.tsx`)

| Action | Fungsi | Role |
|--------|--------|------|
| List | `getUsers()` | super_admin |
| Invite | `inviteUser({ email, role })` | super_admin |
| Change role | `updateUserRole(id, role)` | super_admin |
| Toggle status | `updateUserStatus(id, status)` | super_admin |
| Delete | `deleteUser(id)` | super_admin |
| Telegram | `TelegramManager` component | super_admin |

---

## 18. Fitur: Profile & Preferences

### File: `app/(main)/profile/page.tsx`

4 sections:

1. **UpdateProfileForm** — edit username via `updateMyProfile()`
2. **UpdatePasswordForm** — change password via `supabase.auth.updateUser()`
3. **UpdatePreferencesForm** — toggle notifikasi per system_type via `updateMyPreferences()`
4. **PushNotificationManager** — subscribe/unsubscribe/test browser push

---

## 19. Fitur: Demo Mode

### Flow

1. User klik "Coba Demo" → `startDemo()` server action → set cookie `demo-mode=true`
2. Middleware detect cookie → bypass auth
3. `DemoProvider` set `isDemo = true`
4. `apiFetch()` detect demo mode via `isDemoMode()` → return mock data dari `getDemoResponse()`
5. Exit: `exitDemo()` → hapus cookie, redirect `/login`

### Mock Data (`lib/demo/mock-data.ts`)

20+ konstanta mock untuk semua API endpoints:
- `DEMO_WAREHOUSES`, `DEMO_AREAS`, `DEMO_DEVICES`
- `DEMO_NAV_AREAS` (per system_type)
- `DEMO_WAREHOUSE_DETAILS`
- `DEMO_ACTIVE_ALERTS`
- `DEMO_PROFILE`, `DEMO_USERS`, `DEMO_PREFERENCES`
- `DEMO_TELEGRAM_MEMBERS`
- `DEMO_LINGKUNGAN_*`, `DEMO_INTRUSI_*`, `DEMO_KEAMANAN_*`
- `getDemoAnalytics()` — dynamic mock berdasarkan system_type

### API Interceptor (`lib/demo/api-interceptor.ts`)

`getDemoResponse(path, method)` — match 50+ URL patterns → return mock data.

---

## 20. Komponen Shared & UI

### 20.1 CRUD Action Components (`components/actions/`)

| File | Exports | Pattern |
|------|---------|---------|
| `WarehouseActions.tsx` | `AddWarehouseButton`, `WarehouseActionButtons` | Dialog form → API mutation |
| `AreaActions.tsx` | `AddAreaButton`, `AreaActionButtons` | + warehouse cascading select |
| `DeviceActions.tsx` | `AddDeviceButton`, `DeviceActionButtons` | + MQTT creds display on create |
| `UserActions.tsx` | `InviteUserButton`, `UserActionButtons` | + role dropdown, status toggle |

### 20.2 Shared Components (`components/shared/`)

| File | Export | Fungsi |
|------|--------|--------|
| `WarehouseCard.tsx` | `WarehouseCard` | Overview card dengan status badge |
| `AnimatedPageTitle.tsx` | `AnimatedPageTitle` | Animated text cycling (ContainerTextFlip) |
| `copy-button.tsx` | `CopyButton` | Copy to clipboard dengan tooltip |

### 20.3 UI Components (`components/ui/`)

48 shadcn/ui wrappers built on Radix UI:

`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `container-text-flip`, `context-menu`, `date-range-picker`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `image-card`, `input-otp`, `input`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle-group`, `toggle`, `tooltip`

Extra: `flickering-grid` (login background), `theme-switcher`

---

## 21. PWA & Push Notification

### 21.1 Service Worker (`public/sw.js`)

- Handles push events → `self.registration.showNotification()`
- Click handler → `clients.openWindow(url)`
- Skip waiting on install

### 21.2 Registration (`components/pwa/service-worker-register.tsx`)

- Registers `/sw.js` on mount
- Calls `skipWaiting()` when update available

### 21.3 Manifest (`app/manifest.ts`)

```ts
{
  name: 'Synergy IoT',
  display: 'standalone',
  start_url: '/dashboard',
  icons: [192x192, 512x512]
}
```

### 21.4 Push Notification Flow

```
1. User click "Enable Push" → usePushNotification.subscribe()
2. Request permission → navigator.serviceWorker.pushManager.subscribe()
3. POST /api/users/push/subscribe → save subscription in DB
4. Backend alert → webPushService.sendPushNotification()
5. SW receives push → showNotification()
6. User click notification → openWindow(url)
```

---

## 22. Peta Dependensi Antar File

```
app/layout.tsx (Root)
  └── app/(main)/layout.tsx
        ├── DemoProvider (lib/demo/context.tsx)
        ├── WarehouseProvider (contexts/WarehouseContext.tsx)
        ├── DeviceStatusProvider (contexts/DeviceStatusContext.tsx)
        ├── QueryProvider (components/providers/query-provider.tsx)
        ├── AppSidebar → AppNavigation → useNavAreas + useWarehouse
        └── Pages:
            ├── dashboard/ → useApiQuery + Supabase Realtime
            ├── profile/ → useApiQuery + Forms
            ├── management/ → SSC + CRUD Actions
            └── [wid]/[aid]/[sys]/ → SSC → FeatureView

FeatureViews:
  ├── KeamananView → getAnalytics + Supabase Realtime(keamanan_logs)
  ├── IntrusiView → intrusi API + Supabase Realtime(intrusi_logs)
  │   └── IntrusiDeviceControls → sendIntrusiCommand
  └── LingkunganView → lingkungan API + Supabase Realtime(lingkungan_logs)
      └── Controls → sendLingkunganControl

CalibrationPage (standalone):
  └── useCalibrationSSE → EventSource(/api-cal/events/:deviceId)
      ├── CalibrationControlPanel → sendCommand(/api-cal/command)
      ├── CalibrationStatusDisplay → SSE data + fallback polling
      └── CalibrationDataTable → multiple /api-cal/* endpoints

API Layer:
  lib/api/client.ts → apiFetch (token injection, demo intercept, 401 handler)
  lib/api/*.ts → domain-specific API functions
  features/*/api/*.ts → feature-specific API functions

Auth:
  middleware.ts → lib/supabase/middleware.ts (session refresh, role check)
  components/session-refresh.tsx (auth state listener)
  hooks/use-api-query.ts (auto token injection)
```

---

## 23. Pola & Konvensi Kode

### Component Pattern

```tsx
// SSC (Server Component)
export default async function Page() {
  const supabase = await createClient()
  const data = await fetchData(token)
  return <ClientComponent initialData={data} />
}

// Client Component
'use client'
export function Component({ initialData }: Props) {
  const { data } = useApiQuery(['key'], (token) => fetchFn(token), {
    initialData
  })
  // ...
}
```

### Form Pattern

```tsx
// react-hook-form + zod + shadcn/ui Form
const schema = z.object({ name: z.string().min(1) })
const form = useForm({ resolver: zodResolver(schema) })
<Form {...form}>
  <FormField control={form.control} name="name" render={({ field }) => (
    <FormItem><FormControl><Input {...field} /></FormControl></FormItem>
  )} />
</Form>
```

### Realtime Pattern

```tsx
useEffect(() => {
  const channel = supabase
    .channel(`${table}-${deviceId}`)
    .on('postgres_changes', { event: 'INSERT', table, filter: `device_id=eq.${deviceId}` },
      (payload) => { setData(prev => [payload.new, ...prev]) }
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [deviceId])
```

### Error Handling

```tsx
// API errors
try {
  await apiFetch('/path', options, token)
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
}

// Error boundaries
// app/global-error.tsx — catches root errors
// app/(main)/error.tsx — catches main group errors
```

### Styling Conventions

- Tailwind utility-first
- `cn()` helper untuk conditional classes: `cn('base', condition && 'active')`
- Neobrutalist design: custom `--shadow` CSS variable
- oklch color system (light + dark themes)
- Responsive: `sm:`, `md:`, `lg:` breakpoints
- Touch-friendly: `min-h-[72px]` untuk tombol mobile

---

## 24. Troubleshooting Guide

### Halaman blank / loading tanpa akhir

1. Cek console browser untuk error
2. Cek `NEXT_PUBLIC_API_URL` — harus mengarah ke backend yang berjalan
3. Cek `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Jika 401: session expired → logout dan login ulang

### Data tidak realtime

1. Cek koneksi Supabase Realtime di browser DevTools → Network → WS
2. Pastikan tabel memiliki `REPLICA IDENTITY FULL` (untuk UPDATE events)
3. Cek filter `device_id` di subscription sesuai dengan device yang ditampilkan
4. Untuk kalibrasi: cek SSE di Network tab → `events/` stream

### Sidebar navigation kosong

1. Cek `useNavAreas()` — apakah ada data?
2. Cek `selectedWarehouse` di WarehouseContext
3. Jika "Semua Gudang": semua area ditampilkan
4. Jika gudang tertentu: hanya area di gudang tersebut

### Demo mode tidak berfungsi

1. Cek cookie `demo-mode` di browser DevTools
2. Cek `lib/demo/mock-data.ts` — mock data lengkap?
3. Cek `lib/demo/api-interceptor.ts` — pattern matching untuk URL

### Push notification tidak muncul

1. Cek browser permission: `Notification.permission`
2. Cek service worker registered: DevTools → Application → Service Workers
3. Cek VAPID key cocok antara frontend dan backend
4. Test: POST `/api/users/push/test` dari backend

### Form validation error

1. Cek Zod schema di komponen yang relevan
2. react-hook-form error messages muncul via `FormMessage` component
3. Server-side validation error di-return sebagai JSON error dari backend

### Management page 403

1. Cek role user: harus `admin` atau `super_admin`
2. User management butuh `super_admin` khusus
3. Role di-check di middleware.ts (server-side) DAN di komponen (client-side)
4. Sinkronkan role: `POST /api/users/sync-roles` dari backend

### Kalibrasi SSE tidak connect

1. Cek URL: `${NEXT_PUBLIC_API_URL}/api-cal/events/${deviceId}`
2. Cek DevTools Network → EventSource request
3. Jika fallback polling: SSE mungkin diblokir proxy (cek `X-Accel-Buffering` header)
4. Badge "○ Polling" = SSE gagal, menggunakan HTTP polling 3 detik
