# Developer Standard Operating Procedure (SOP)

This guide explains how to collaborate on the **Synergy IoT Frontend** using Feature-Sliced Design with domain isolation.

---

## 📋 Team Structure

| Domain                       | Developer      | Folder                              | Responsibilities                        |
| ---------------------------- | -------------- | ----------------------------------- | --------------------------------------- |
| **Lingkungan** (Environment) | @keyeicheiaren | `/features/lingkungan/`             | Environment dashboard, charts, controls |
| **Keamanan** (Security)      | @Egan354       | `/features/keamanan/`               | Security dashboard, alerts, status      |
| **Intrusi** (Intrusion)      | @zufar1228     | `/features/intrusi/`                | Intrusion dashboard, device controls    |
| **Core**                     | @zufar1228     | `/app`, `/components`, `/lib`, etc. | Shared layout, auth, utilities          |

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/zufar1228/synergy-frontend.git
cd synergy-frontend
git pull origin main
pnpm install
```

### 2. Create Feature Branch

```bash
git pull origin main
git checkout -b feat/your-feature-name
```

**Branch naming convention:**

- `feat/your-feature` — new feature
- `fix/bug-description` — bug fix
- `refactor/description` — code refactor
- `docs/description` — documentation

### 3. Make Changes in Your Domain

**Only edit files in your assigned domain:**

- **Lingkungan**: `/features/lingkungan/`
- **Keamanan**: `/features/keamanan/`
- **Intrusi**: `/features/intrusi/`

❌ **Never edit core files** without approval:

- `/app/`
- `/components/` (only `/components/shared/` is neutral)
- `/lib/`
- `/contexts/`
- `/hooks/`
- `/middleware.ts`
- `next.config.ts`
- `/package.json`

### 4. Commit & Push

```bash
git add .
git commit -m "feat(lingkungan): add sensor chart

- Implement time-series chart visualization
- Add real-time data subscription with React Query
- Add responsive mobile layout"

git push origin feat/your-feature-name
```

**Commit message format:**

```
type(domain): short description

- Bullet point details
- More details
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### 5. Open Pull Request on GitHub

1. Go to [synergy-frontend](https://github.com/zufar1228/synergy-frontend) → **Pull Requests**
2. Click **New Pull Request**
3. Base: `main` | Compare: your branch
4. Add description of changes
5. Click **Create Pull Request**

### 6. Wait for Approval

GitHub automatically requires:

- ✅ **Validation**: lint, typecheck, build must pass
- ✅ **CODEOWNERS Review**: the owner of your domain must approve

GitHub enforces this—you cannot merge without approval.

### 7. Merge

Once approved and checks pass, click **Merge Pull Request**

Vercel automatically deploys to production when main is updated.

---

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── (auth)/                  # Login, signup
│   ├── (main)/                  # Dashboard layout + router
│   ├── layout.tsx
│   └── page.tsx                 # Landing
├── features/
│   ├── lingkungan/
│   │   ├── components/          # UI components
│   │   ├── api/                 # API calls
│   │   ├── index.ts             # Barrel export
│   │   └── lingkungan.types.ts  # Types (if needed)
│   ├── keamanan/
│   │   ├── components/
│   │   ├── api/
│   │   └── index.ts
│   └── intrusi/
│       ├── components/
│       ├── api/
│       └── index.ts
├── components/
│   ├── shared/                  # Shared across domains
│   │   ├── AnimatedPageTitle.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── ui/                      # shadcn/ui components
│   └── ...
├── lib/
│   ├── api/
│   │   ├── client.ts            # Fetch utility
│   │   ├── types.ts             # All TypeScript interfaces
│   │   └── index.ts             # Barrel re-export
│   ├── hooks.ts
│   └── utils.ts
├── contexts/                    # Auth, theme context
├── hooks/                       # Custom React hooks
├── middleware.ts                # Auth middleware
├── .github/
│   ├── workflows/
│   │   └── validate.yml         # PR validation
│   └── CODEOWNERS               # Access control
└── package.json
```

---

## 📝 Import Rules

### **Within Your Domain** ✅

```typescript
// In /features/lingkungan/components/LingkunganView.tsx
import { LingkunganChart } from './LingkunganChart';
import { lingkunganAPI } from '../api/lingkungan';
```

### **Import Shared UI** ✅

```typescript
// In /features/lingkungan/components/LingkunganView.tsx
import { AnimatedPageTitle } from '@/components/shared/AnimatedPageTitle';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
```

### **Import Core API** ✅

```typescript
// In /features/lingkungan/api/lingkungan.ts
import { fetcher } from '@/lib/api/client';
import type { SensorReading } from '@/lib/api/types';
```

### **Cross-Domain** ❌ (Avoid)

```typescript
// DON'T do this - cross-domain imports
import { KeamananChart } from '@/features/keamanan/components/KeamananChart';
```

If you need another domain's data:

1. Use the shared API at `/lib/api/index.ts`
2. Call it separately in your component
3. Or ask @zufar1228 to add a cross-domain component to `/components/shared/`

---

## 🎨 Component Guidelines

### Domain Component Structure

```
features/lingkungan/components/
├── LingkunganView.tsx           # Main page component
├── LingkunganChart.tsx          # Sub-component
├── LingkunganDataTable.tsx      # Sub-component
└── LingkunganCard.tsx           # Reusable card
```

### Shared Component Structure

```
components/shared/
├── AnimatedPageTitle.tsx        # Used by all domains
├── Navbar.tsx
├── Footer.tsx
└── ...
```

---

## ⚠️ Common Issues

### "TypeScript error in my component"

```bash
git pull origin main
pnpm run build
```

Check the error output. Usually it's import or type issues. Run `npx tsc --noEmit` to see all errors.

### "GitHub says I need approval but I own the domain"

This happens when your PR also touches **core files**. Examples:

- Modified `/app/` → need @zufar1228's approval
- Modified `/lib/api/types.ts` → need @zufar1228's approval
- Modified `next.config.ts` → need @zufar1228's approval

**Solution:** Only edit files in `/features/{your-domain}/`

### "I need to share a component across domains"

Ask @zufar1228 to move it to `/components/shared/`. Don't import between domains directly.

### "My styles don't apply"

Check:

1. Are you using `@/` path alias? (`import from '@/features/...` not `import from '../features/...'`)
2. Is Tailwind CSS loaded? Check `globals.css`
3. Did you rebuild? Run `pnpm run build`

---

## 🔄 CI/CD Pipeline

### On Pull Request

1. GitHub Actions runs `validate` job:
   - `pnpm run lint`
   - `npx tsc --noEmit`
   - `pnpm run build`
2. All checks must pass
3. CODEOWNERS review required

### On Push to Main

1. Same validation as PR
2. If validation passes, Vercel auto-deploys
3. Live in ~3 minutes

---

## 📱 Testing Locally

### Development Server

```bash
pnpm run dev
# Open http://localhost:3000
```

### Full Build & Check

```bash
pnpm run typecheck
pnpm run lint --fix
pnpm run build
```

### On Your Domain Only

```bash
# Edit your feature components
pnpm run lint -- --scope "features/lingkungan"
pnpm run build
```

---

## 🆘 Need Help?

- **TypeScript errors?** Run `pnpm run build` to see detailed errors
- **Lint issues?** Run `pnpm run lint --fix` to auto-fix
- **Component not showing?** Check `app/(main)/[warehouseId]/[areaId]/[systemType]/page.tsx` to see if your domain is registered
- **Need core changes?** Open issue for @zufar1228
- **Another domain's bug?** Notify the domain owner

---

## ✅ Checklist Before Pushing

- [ ] Changes only in my feature folder (`/features/{domain}/`)
- [ ] No changes to core files (`/app/`, `/lib/`, etc.) without approval
- [ ] No cross-domain imports
- [ ] Ran `pnpm run lint --fix` locally
- [ ] Ran `pnpm run typecheck` locally (0 errors)
- [ ] Ran `pnpm run build` locally (success)
- [ ] Tested on http://localhost:3000
- [ ] Commit message is descriptive
- [ ] Ready for code review
