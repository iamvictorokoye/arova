# Setup

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable` will give you it, or `npm i -g pnpm`)
- A [Supabase](https://supabase.com) project
- A [Stream](https://getstream.io) app (Chat + Video enabled)

## 1. Install

```bash
pnpm install
```

This also runs `pnpm prepare`, which installs the Husky git hook that runs
lint-staged (ESLint + Prettier) on every commit — see
[GIT-HOOKS.md](./GIT-HOOKS.md) if you're setting this up in a fresh git repo.

## 2. Environment variables

Copy `.env.local` (already present) or create one with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stream
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_API_SECRET=
```

- Supabase keys: Project Settings → API in your Supabase dashboard.
- Stream keys: your app's dashboard at getstream.io.

## 3. Database setup

See [DATABASE.md](./DATABASE.md) for the full schema to run in the Supabase
SQL editor, plus the storage bucket you need to create manually for photo
uploads.

### Seed data (optional)

```bash
pnpm create-fake-profiles
```

Populates the `users` table with fake profiles for local testing — see
`scripts/create-fake-profiles.ts`. It uses the `SUPABASE_SERVICE_ROLE_KEY`,
so keep that key server-side only and never expose it to the client.

## 4. Run it

```bash
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier, writes in place |
| `pnpm create-fake-profiles` | Seed fake users into Supabase |
