# Synergy IoT — Frontend Developer SOP

## Architecture: Modular Monolith (Feature-Sliced Design)

```
frontend/
├── app/                         # Next.js App Router pages (CORE — do not modify)
│   ├── (main)/                  #   Authenticated routes (dashboard, management, profile)
│   │   └── [warehouseId]/[areaId]/[systemType]/
│   │       └── page.tsx         #   Dynamic dispatcher → imports from features/
│   ├── login/                   #   Auth pages
│   └── layout.tsx               #   Root layout
├── features/                    # DOMAIN FEATURE SLICES
│   ├── lingkungan/              # Environment monitoring (Dev: @org/lingkungan-dev)
│   │   ├── components/          #   LingkunganView, LingkunganChart, LingkunganDataTable
│   │   ├── api/                 #   lingkungan.ts (API functions)
│   │   └── index.ts             #   Barrel export
│   ├── keamanan/                # Security detection (Dev: @org/keamanan-dev)
│   │   ├── components/          #   KeamananView, KeamananDataTable
│   │   └── index.ts
│   └── intrusi/                 # Intrusion detection (Dev: @org/intrusi-dev)
│       ├── components/          #   IntrusiView, IntrusiDataTable, IntrusiDeviceControls
│       ├── api/                 #   intrusi.ts (API functions)
│       └── index.ts
├── components/                  # Core shared components
│   ├── ui/                      #   shadcn/ui design system (40+ components)
│   ├── shared/                  #   AnalyticsView, WarehouseCard, AnimatedPageTitle
│   ├── actions/                 #   CRUD action components
│   ├── dashboard/               #   Dashboard components
│   ├── profile/                 #   Profile components
│   └── [root-level]             #   Sidebar, header, navigation, theme
├── contexts/                    # React Context providers
├── hooks/                       # Shared React hooks
├── lib/                         # Core libraries
│   ├── api/                     #   API client, types, core API modules
│   │   ├── client.ts            #   Central fetch wrapper (apiFetch)
│   │   ├── types.ts             #   All TypeScript interfaces
│   │   └── index.ts             #   Barrel re-export (backward compat)
│   └── supabase/                #   Supabase client configuration
└── middleware.ts                 # Auth middleware
```

## Rules for Domain Developers

### 1. Stay in Your Feature Directory

- **Lingkungan dev** works ONLY in `features/lingkungan/`
- **Keamanan dev** works ONLY in `features/keamanan/`
- **Intrusi dev** works ONLY in `features/intrusi/`

### 2. Import Rules

```
✅ Feature → Core:     import { Button } from '@/components/ui/button';
✅ Feature → Core:     import type { IntrusiLog } from '@/lib/api/types';
✅ Feature → Feature:   import within your OWN feature (relative paths)
❌ Feature → Feature:   NEVER import from another feature's directory
❌ Feature → Core edit: NEVER modify core files without approval
```

### 3. Adding New Functionality

If your feature needs a new component:

1. Create it in `features/<your-feature>/components/`
2. If it needs API functions, add them in `features/<your-feature>/api/`
3. Import shared UI from `@/components/ui/`
4. Import shared types from `@/lib/api/types`
5. Export from `features/<your-feature>/index.ts`

If you need a **new shared type or API client change**, open a PR tagging `@org/core-team`.

## Git Workflow (MANDATORY)

### Before Starting Work

```bash
git checkout main
git pull origin main
git checkout -b feature/<your-domain>/<description>
# Example: feature/intrusi/add-battery-status-indicator
```

### While Working

```bash
# Stage ONLY your feature files
git add features/<your-domain>/

# Commit with conventional format
git commit -m "feat(intrusi): add battery status indicator"
```

### Before Pushing

```bash
# ALWAYS pull latest main and rebase BEFORE pushing
git fetch origin main
git rebase origin/main

# Fix any conflicts, then:
git push origin feature/<your-domain>/<description>
```

### Create a Pull Request

1. Open a PR targeting `main`
2. CI will automatically run **lint + typecheck + build** — all MUST pass
3. CODEOWNERS will auto-assign the correct reviewer
4. Vercel will create a Preview Deployment for visual review
5. If your PR touches files outside your feature directory, the core-team will be notified

### Commit Message Convention

```
feat(<domain>): short description     # New feature
fix(<domain>): short description      # Bug fix
refactor(<domain>): short description # Code restructuring
```

## CI/CD Pipeline

| Trigger        | Validation                                | Deploy                       |
| -------------- | ----------------------------------------- | ---------------------------- |
| Push to `main` | Vercel auto-build                         | Vercel production deployment |
| PR to `main`   | Lint + TypeCheck + Build (GitHub Actions) | Vercel preview deployment    |

**Failing lint, typecheck, or build will BLOCK the merge.**

## Running Locally

```bash
pnpm install
pnpm run dev          # Start dev server (Turbopack)
pnpm run lint         # ESLint check
npx tsc --noEmit      # TypeScript validation (run before pushing!)
pnpm run build        # Full production build
```

## Key Patterns

### Supabase Realtime

Each domain view subscribes to Supabase Realtime for live updates. The subscription pattern is:

```tsx
const channel = supabase
  .channel('my-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'my_table' },
    callback
  )
  .subscribe();
```

### SWR Data Fetching

Use the `useApiSWR` hook from `@/hooks/use-swr-api` for authenticated API calls:

```tsx
const { data, error, mutate } = useApiSWR(token, (t) => myApiFn(t, params));
```

### Path Alias

The `@/` alias maps to the project root. Always use it for cross-directory imports.
