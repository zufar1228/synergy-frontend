# Synergy IoT App Documentation (Non-Keamanan, Non-Lingkungan, Non-ML)

## 1. Scope of This Document

This document describes the Synergy IoT application from product and system perspectives, including:

- App purpose and architecture
- User roles and permissions
- Main user flows
- Frontend pages and what each page shows
- Backend APIs and core services
- Realtime and notification behavior

This document intentionally excludes:

- Keamanan system details and flows
- Lingkungan system details and flows
- ML server architecture and prediction flow

The focus is on shared platform behavior, intrusi flow, management modules, authentication, and integrations.

---

## 2. Product Overview

Synergy IoT is a warehouse monitoring and operations platform with:

- Multi-warehouse and multi-area structure
- Role-based user access
- Device and system monitoring views
- Incident/alert visibility
- Admin management tools
- Telegram and web push notification support

In practical use, users:

1. Log in with Supabase authentication
2. Enter dashboard and select a warehouse context
3. Observe area/system status and alerts
4. Open analytics pages per area/system
5. Manage warehouses, areas, devices, and users (based on role)

---

## 3. High-Level Architecture

## 3.1 Frontend

- Next.js App Router application
- Supabase auth session on server and client
- Role-aware navigation and page access
- TanStack React Query for client-side fetching with shared API client wrappers
- Shared API wrappers apply default timeout/abort behavior with per-endpoint overrides
- App Router server pages consume typed API wrappers for initial page data
- Context providers for selected warehouse and device online state

## 3.2 Backend

- Express TypeScript API
- JWT auth middleware (Supabase token verification)
- Role-based authorization middleware
- Modular route/controller/service architecture
- Drizzle ORM as the primary DB access layer
- Sequelize runtime artifacts have been removed; legacy JS migrations are archived under `backend/legacy/sequelize-migrations`
- MQTT consumer for device heartbeat and sensor events
- Background jobs for health and alert-related processing

## 3.3 Data/Integration Dependencies

- Supabase Auth for identity and session
- Relational database (PostgreSQL) with Drizzle schema and query layer
- MQTT broker for realtime device data
- Telegram bot integration for group management and alert delivery
- Browser Push API (VAPID) for web push notifications

---

## 4. User Roles and Access

Role model used in the app:

- user: regular user access to monitoring and profile features
- admin: user permissions plus warehouse/area/device management
- super_admin: admin permissions plus user management and Telegram admin actions

Important behavior:

- Role is resolved from backend profile endpoint, not trusted directly from frontend state.
- Unauthorized authenticated users are rejected by backend access verification flow.

---

## 5. Main End-to-End Flows

## 5.1 Authentication and Access Verification Flow

1. Landing page redirects to login.
2. User signs in via Supabase auth.
3. Auth callback exchanges code for session.
4. Frontend calls backend verify-access endpoint.
5. If authorized, user is redirected into app.
6. If not authorized, session is revoked and user is sent back to login with message.

Invite onboarding flow:

- Super admin invites user.
- Invited user opens setup-account page.
- User sets password and enters dashboard.

## 5.2 Main App Shell Flow

1. Server layout checks session.
2. Layout requests current profile to determine role.
3. App renders sidebar, header, breadcrumb, and page content.
4. Warehouse context initializes from localStorage (default all).
5. Navigation and page data adapt to selected warehouse and role.

## 5.3 Dashboard Flow

1. If warehouse selection is all, dashboard shows all warehouse cards and summary stats.
2. If specific warehouse selected, dashboard shows:
   - warehouse identity
   - area cards
   - active systems per area
   - alert markers for active issues
   - online/offline visual state per system
3. Dashboard subscribes to DB changes and revalidates data for near realtime updates.

## 5.4 Management CRUD Flow

For each management domain (warehouses, areas, devices, users):

1. User opens management page.
2. Server checks active session.
3. Frontend fetches list data from backend APIs with access token.
4. User performs create/edit/delete actions.
5. UI refreshes table data after action completion.

## 5.5 Notification Flow

- User-level preferences can be configured from profile.
- Push subscription can be registered from browser.
- Super admin can manage Telegram group integration and send test alert.
- Active alerts are surfaced in dashboard state and analytics views.

---

## 6. Frontend Feature Breakdown

## 6.1 Public/Auth Pages

- Login page:
  - Branding and sign-in form
  - Redirect to dashboard if already authenticated
  - Displays auth/access error message from callback
- Setup account page:
  - Invited user sets password from invite token session

## 6.2 Main Layout Experience

Main shell includes:

- Sidebar navigation (desktop)
- Mobile sidebar/sheet navigation
- Header with:
  - sidebar toggle
  - dynamic breadcrumbs
  - theme toggle
- Scrollable content area beneath sticky header

## 6.3 Navigation Model

Sidebar sections:

- Platform:
  - Dashboard
  - Profil
- Monitoring:
  - Intrusi Pintu (area-based links)
  - Other monitoring groups exist in app but are not documented in this file by request
- Manajemen (admin/super_admin only):
  - Gudang
  - Area
  - Perangkat
  - Pengguna (super_admin only)

Navigation behavior:

- Active route highlighting
- Collapsible monitoring groups
- Area list fetched dynamically from backend and filtered by selected warehouse

## 6.4 Dashboard and Warehouse Views

Main dashboard page shows:

- Title and top-level overview
- Warehouse cards when all warehouses are selected
- Per-card stats such as area and device counts

When single warehouse is selected:

- Warehouse summary block
- Area cards with active systems
- Per-system state indicator:
  - alert state
  - online state
  - offline state
- Direct links to system analytics pages

Warehouse-specific dashboard route shows:

- Warehouse name and location
- Area list
- Active systems per area with device count

## 6.5 Analytics Page Dispatcher

Dynamic analytics route pattern:

- warehouseId/areaId/systemType

This page:

- Reads query filters (date range, status, pagination, event filters)
- Calls backend analytics endpoint
- Dispatches render by systemType
- Shows fallback error and reload path when data fails

In this document scope, only intrusi analytics experience is included.

## 6.6 Management Modules

## 6.6.1 Warehouse Management

Shows table of warehouses:

- Name
- Location
- Action buttons for CRUD operations

## 6.6.2 Area Management

Shows table of areas:

- Area name
- Parent warehouse
- Action buttons for CRUD operations

## 6.6.3 Device Management

Shows table of devices:

- Device name (with copy-id utility)
- System type
- Area
- Warehouse
- Action buttons for CRUD operations

## 6.6.4 User Management (super_admin)

Shows user administration table:

- Email
- Role badge
- Active/nonactive status
- Last login date
- User action controls (role/status/delete)

Also includes Telegram integration panel for:

- Invite link generation
- Member listing
- Member removal
- Test alert sending

## 6.7 Profile Module

Profile page sections:

- Update profile identity
- Update password
- Notification preference configuration
- Push notification management

---

## 7. Backend Feature Breakdown

## 7.1 Core API Characteristics

- All protected APIs use Bearer token auth.
- JWT verification supports asymmetric/symmetric token modes.
- Role-based middleware enforces admin/super_admin controls where needed.
- Global rate limiter is enabled.
- CORS is configured to frontend URL.

## 7.2 Health and Runtime Endpoints

- Root status endpoint
- health endpoint
- keep-alive endpoint

These endpoints support runtime checks and hosting keep-alive behavior.

## 7.3 Functional API Domains (Within This Document Scope)

### Warehouses

- List warehouses
- Get warehouse by id
- Get warehouse with areas and active systems
- Create/update/delete warehouse (admin/super_admin)

### Areas

- List areas
- Create/update/delete area

### Devices

- List devices
- Get device by id
- Get device details by area and system type
- Create/update/delete device

### Users and Profile

- Verify access eligibility
- List users (super_admin)
- Invite user (super_admin)
- Delete user (super_admin)
- Update user role/status (super_admin)
- Get/update own profile
- Get/update own notification preferences
- Push VAPID key, subscribe, and test push endpoints
- Role sync endpoint for metadata alignment

### Navigation

- List areas by system type for sidebar generation

### Alerts

- List active alerts for a warehouse

### Analytics

- Unified analytics endpoint by system type with pagination and filters

### Telegram Integration

- Public webhook receiver
- Super-admin management endpoints:
  - create single-use invite
  - list members
  - kick member
  - webhook info
  - setup webhook
  - send test alert

---

## 8. Realtime and Background Behavior

## 8.1 MQTT Ingestion

Backend subscribes to MQTT topics for:

- Device heartbeat/status updates
- System sensor/events for supported monitoring domains
- Processing path is modularized (`mqtt/client.ts` orchestrator + `mqtt/messageRouter.ts` handlers + utility modules)

Within this document scope:

- Intrusi events are ingested and persisted.
- Device heartbeat updates online/offline related state.

## 8.2 Jobs

Backend starts recurring jobs for:

- Heartbeat checks
- Repeat detection processing
- Disarm reminder processing

## 8.3 Frontend Near-Realtime Updates

- Dashboard uses Supabase channel subscriptions for database changes.
- DeviceStatus context maintains online state with time-based cleanup.

---

## 9. What Users See in Daily Operation

Typical operator view:

- Login screen with product branding
- Dashboard of warehouses/areas and system activity status
- Monitoring page for intrusi events and filtered history
- Profile page with account and notification settings

Typical admin/super_admin view additionally sees:

- Warehouse/area/device management tables and CRUD actions
- User administration screen (super_admin)
- Telegram integration management controls (super_admin)

---

## 10. Security and Access Notes

- Protected routes require valid bearer token.
- Role checks are enforced in backend routes.
- Unauthorized users are blocked by verify-access logic.
- Some endpoints are intentionally public for integration callbacks (Telegram webhook).

---

## 11. Deployment and Operational Notes

Frontend:

- Supports PWA install behavior (manifest, service worker, offline fallback).

Backend:

- Boots API server first, then initializes DB sync (non-prod), MQTT, jobs, and Telegram webhook setup in background.
- Provides readiness and keep-alive endpoints for cloud runtime stability.

---

## 12. Explicit Exclusions for This Document

The following are intentionally not explained here based on request:

- Keamanan module details, UI behavior, and API flow
- Lingkungan module details, UI behavior, and API flow
- ML server components, model/scaler artifacts, and prediction pipeline

---

## 13. Quick Feature Inventory Summary

Implemented core platform capabilities covered by this document:

- Auth login + invite onboarding
- Role-based navigation and permissions
- Multi-warehouse dashboard with area/system drilldown
- Intrusi monitoring analytics route flow
- Warehouse, area, and device management
- User lifecycle and role/status management
- Profile and notification preferences
- Push notification registration/testing
- Telegram group administration and alert test flow
- Realtime device/event ingestion and periodic background jobs
