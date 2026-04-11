# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm i

# Run in development (starts Vite dev server + Tauri window)
pnpm tauri dev

# Build for production
pnpm tauri build

# Vite-only (frontend preview without Tauri)
pnpm dev
pnpm build
pnpm preview
```

Signing keys must be set before building a signed release:
```powershell
$env:TAURI_SIGNING_PRIVATE_KEY="<key content or path>"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
```

## Architecture

iPharma is a **Tauri v2 desktop app** — a React/TypeScript frontend embedded in a Rust shell. The Rust backend (`src-tauri/`) is minimal and delegates most logic to the frontend.

### Startup flow

`src/main.tsx` → `src/app.tsx` → calls `getDb()` to initialize SQLite, then checks the `userIDPresent` app setting. If absent/false, renders `<Login />` directly (no router); if true, renders `<Dashboard />` directly (also no router). The `RouterProvider` / hash-based router (`src/config/routes.tsx`) is defined but not yet the primary navigation mechanism — routing is currently handled imperatively via `useNavigate`.

### Data layer

- **SQLite** via `@tauri-apps/plugin-sql` — accessed through `src/lib/db/index.ts` which exports `getDb()` (singleton), `getSetting`, `setSetting`, `getBooleanSetting`.
- **Migrations** are defined in `src/lib/db/schema.ts` as versioned `Migration[]`. Add a new entry to `MIGRATIONS` with the next version number to apply schema changes.
- **App settings** are stored in the `app_settings` table (key/value). Default settings (`terminal_initialized`, `auto_update_enabled`, `auto_update_last_checked_at`) are seeded via `getMissingDefaultSettings` in `src/lib/db/settings-utils.ts`.

### API layer

- `src/apis/normal-api.ts` — unauthenticated Axios instance (baseURL: `VITE_APP_URL`)
- `src/apis/secure-api.ts` — authenticated Axios instance (baseURL: `VITE_APP_URL + VITE_API_URL`), attaches JWT from app settings, auto-refreshes on 401
- Token constants (`TOKEN`, `REFRESH_TOKEN`, `CLAIM_*`, `ROLE_ADMIN`, `ROLE_SHOP_USER`) are exported from `src/config/vars.tsx`
- Query key factories for TanStack Query are in `src/apis/keys.ts`
- Service functions are organized by domain in `src/apis/services/`

### Auth

Tokens are stored in SQLite `app_settings` (not cookies) via `setSetting`. `useAuthOperations` hook (`src/hooks/use-auth-operations.ts`) handles login: decodes JWT, stores `TOKEN`, `REFRESH_TOKEN`, `USER_NAME`, `SHOP_ID` in app settings, then navigates to `/sync`. User state store (`src/stores/user-details-store`) is not yet created. Roles: `ROLE_ADMIN` / `ROLE_SHOP_USER`.

### State management

- **Server/async state**: `@tanstack/react-query` — query key factories in `src/apis/keys.ts`
- **Client state**: `zustand` — stores expected at `src/stores/` (not yet populated)
- **Forms**: `@tanstack/react-form` + `valibot` for schema validation

### Layouts & routing

- `AppLayout` (`src/layouts/toplevelnav/app-layout.tsx`) — top-level shell with fixed header and `<Outlet />`
- `AuthLayout` (`src/layouts/auth/auth-layout.tsx`) — exists but not yet wired into routes
- Menu definitions (with role-based variants) live in `src/config/menu.tsx`: `adminMenu` vs `shopUserMenu`
- Router uses `createHashRouter` (hash-based URLs for Tauri compatibility)

### UI components

- `src/components/ui/` — shadcn/ui primitives (Radix-based)
- `src/components/common/` — shared layout helpers (`Section`, `Between`, `Center`, `Text`, `Logo`, etc.)
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`), `tw-animate-css`, `tailwind-merge` + `clsx` (use `cn()` from `src/lib/utils.ts`)
- Icons: `lucide-react` and `@hugeicons/react`
- Notifications: `sonner` toast library
- PDF generation: `jspdf`

### Domain types

All domain types are in `src/types/` and re-exported from `src/types/domain.ts`. Key types: `ProductType`, `ProductBatchType`, `ProductSkuType` (composite product+batch), `SaleType`, `PurchaseType`, `LocationType`, `UserType`, `Supplier`. `buildSkuType()` in `base.ts` constructs a `ProductSkuType` from product + batch.

### Auto-update

The updater plugin (`tauri-plugin-updater`) is only compiled in **release mode** (`#[cfg(not(debug_assertions))]`). GitHub Actions replaces `__TAURI_UPDATER_PUBKEY__` and `__TAURI_UPDATER_ENDPOINT__` placeholders in `tauri.conf.json` at release time. See `AUTO_UPDATE.md` for the full release flow.

### Environment variables

Required in a `.env` file (Vite-prefixed):
- `VITE_APP_URL` — backend base URL
- `VITE_API_URL` — API path suffix appended for authenticated requests
