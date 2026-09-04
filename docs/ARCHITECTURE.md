# Architecture

## Project structure

```
app/                 Routes (App Router) — one folder per page
components/          Feature components (Navbar, MatchCard, chat, video, …)
components/ui/       shadcn/ui primitives (Button, Dialog, Sheet, Form, …)
hooks/               React Query hooks (use-profile, use-matches)
store/               Zustand stores (auth-store, call-store)
providers/           App-wide providers (React Query, Supabase auth, toaster)
lib/actions/         Server actions (Supabase + Stream calls)
lib/schemas.ts        Zod schemas for forms
lib/types.ts          Shared domain types
lib/supabase/         Supabase client factories (browser, server, middleware)
```
