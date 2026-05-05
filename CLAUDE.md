# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**EduGestión** — school management system for IE Ramón Messa Londoño (Sincé, Sucre, Colombia).

Stack: Next.js 16.2.4 · React 19 · TypeScript · Tailwind CSS v4 · Supabase (auth + DB) · Zustand

## Commands

All commands run from `gestion-escolar/`:

```bash
npm run dev      # development server (Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

No test framework is configured yet.

## Architecture

### Route groups

```
src/app/
  (auth)/login/        — public login page (client component)
  (dashboard)/         — protected shell: Navbar + main content
    page.tsx           — home dashboard with role-filtered module cards
    asistencia/        — placeholder (in development)
    notas/             — placeholder (in development)
    inventario/        — placeholder (in development)
```

`src/middleware.ts` guards `/`, `/asistencia`, `/notas`, `/inventario` — redirects unauthenticated users to `/login` and authenticated users away from `/login`.

The dashboard layout (`(dashboard)/layout.tsx`) performs a second server-side auth check and fetches the user's `profiles` row, then passes `nombre`, `apellido`, and `rol` to the Navbar.

### Supabase clients

Two factories — **never mix them**:

| File | When to use |
|------|-------------|
| `src/lib/supabase/client.ts` | Client components (`'use client'`) |
| `src/lib/supabase/server.ts` | Server components, layouts, Server Actions, Route Handlers |

The middleware uses its own inline `createServerClient` (required by the SSR cookie-forwarding pattern).

### Auth & roles

Roles are `rector | docente | administrativo` (defined in `src/types/database.ts`).

Module visibility on the dashboard:
- **Asistencia + Notas**: `rector` and `docente`
- **Inventario**: `rector` and `administrativo`

The Zustand store (`src/stores/auth-store.ts` → `useAuthStore`) holds the client-side profile and derived `rol` for use in client components. Populate it via `setProfile(profile)` after fetching from Supabase.

### Database types

All Supabase table shapes live in `src/types/database.ts` and are passed as the generic to the Supabase clients (`createBrowserClient<Database>`, `createServerClient<Database>`). Always use typed queries through these clients rather than casting manually.

Key tables: `profiles`, `grados`, `grupos`, `estudiantes`, `materias`, `periodos`, `asignaciones`, `asistencia`, `notas`, `categorias_inventario`, `recursos`, `prestamos`.

### Tailwind v4

The theme is defined in `src/app/globals.css` inside an `@theme {}` block — there is no `tailwind.config.*` file. Custom color palettes:
- `primary-*` — institutional blue
- `secondary-*` — emerald green
- `accent-*` — amber

Use these tokens for all new UI rather than arbitrary hex values.

### Server Actions

All Supabase mutations from forms go through `src/actions/`. Each module has its own file:

| File | Exports |
|------|---------|
| `src/actions/asistencia.ts` | `registrarAsistencia`, `getAsistencia`, `getResumenAsistencia` |
| `src/actions/notas.ts` | `guardarNota`, `getNotasByAsignacion`, `getNotasByEstudiante` |
| `src/actions/inventario.ts` | `getRecursos`, `crearRecurso`, `actualizarRecurso`, `registrarPrestamo`, `marcarDevuelto`, `getPrestamosActivos` |

All action files use `'use server'` and call `createClient` from `@/lib/supabase/server`. They throw on error — catch in the calling component.

### UI components

```
src/components/
  ui/              ← Button, Input, icons (shared primitives)
  layout/          ← Navbar (floating top nav), Sidebar (lateral, ready but unused)
  asistencia/      ← AsistenciaTable
  notas/           ← NotasTable
  inventario/      ← RecursosTable
```

Module components (`asistencia/`, `notas/`, `inventario/`) are client components that receive typed props and callbacks — the page fetches data server-side, passes it down, and calls the corresponding Server Action on mutation.
