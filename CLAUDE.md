# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Lint with zero-warnings policy (next lint --max-warnings=0)
```

There is no test runner configured. Lint must pass cleanly before considering work done.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS** with CSS variables for theming (dark/light via `next-themes`)
- **Radix UI** primitives wrapped in `/src/components/ui/`
- **TanStack Query v5** for server state; React Context + `useReducer` for UI state
- **React Hook Form** for forms
- **Recharts** for analytics charts; **Framer Motion** for animations
- **Sonner** for toasts

## Architecture

### Route Groups

```
src/app/
├── (auth)/          # Unauthenticated: /login, /signup, /pin, /forgot-password
└── (protected)/     # Auth-gated; all business routes live here
```

Root `/` redirects to `/login`. The protected layout enforces auth before rendering.

### Page Components vs. Views

Pages in `src/app/(protected)/*/page.tsx` are thin — they just render a single view component from `src/views/`. All real page logic lives in the view. When adding a new page, follow this pattern.

### Provider Stack (order matters)

Defined in `src/common/providers/app-providers.tsx`:

```
ThemeProvider → AppQueryProvider → TooltipProvider → AuthProvider
  → ClockProvider → UiProvider → UpgradePlanProvider
```

### Auth Flow

`src/contexts/AuthContext.tsx` manages session state persisted to `sessionStorage` under key `servixos-auth-state`. State shape: `{ isLoggedIn, isPinVerified, userEmail, accessToken, user }`. Login alone doesn't grant access — PIN verification (`isPinVerified`) is also required. Token refresh is triggered via a custom event and handled inside `AuthContext`.

### API Layer

- **`src/lib/api-client.ts`** — all endpoint definitions and response types. Add new endpoints here.
- **`src/common/network/http-client.ts`** — `fetchJson<T>()` wraps fetch with: offline check, 15 s timeout via `AbortController`, and structured error extraction.
- **Error types:** `NetworkOfflineError`, `RequestTimeoutError`, `HttpError`. Use `getApiErrorMessage()` to extract user-facing strings from nested API error responses.
- **Base URL:** `NEXT_PUBLIC_API_BASE_URL` env var (defaults to `api-dev.servixos.com/api`).
- **Response envelope:** `{ success, statusCode, message, data }`.

### TanStack Query Defaults

Configured in `src/common/providers/`:
- `staleTime`: 60 s, `gcTime`: 5 min
- `networkMode`: `"offlineFirst"`
- `retry: 0`, `refetchOnWindowFocus: false`

Query hooks live in `src/hooks/queries/`; mutation hooks in `src/hooks/mutations/`.

### UI State

`UiContext` (in `src/common/state/ui-context.tsx`) manages sidebar and AI panel visibility via `useReducer`. Access via `useUiContext()`.

### Path Alias

`@/*` maps to `src/*`. Always use this alias for imports.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/api-client.ts` | All API endpoints, request/response types |
| `src/contexts/AuthContext.tsx` | Session state and token management |
| `src/common/network/http-client.ts` | HTTP client, error classes |
| `src/common/providers/app-providers.tsx` | Full provider hierarchy |
| `src/components/AppLayout.tsx` | Main shell (sidebar + header + content) |
| `src/views/` | All page-level business logic components |
