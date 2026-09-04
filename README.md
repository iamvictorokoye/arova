# Arova — Dating App

Arova is a full-stack dating app: swipe-based matching, real-time chat, and
live video calls, built on Next.js (App Router), Supabase, and Stream.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database / Auth / Storage | Supabase (Postgres, Row Level Security, Auth, Storage) |
| Realtime chat & video | Stream Chat + Stream Video React SDK |
| Server state | TanStack React Query |
| Client/UI state | Zustand (`store/auth-store.ts`, `store/call-store.ts`) |
| Forms & validation | React Hook Form + Zod |
| UI components | shadcn/ui (Radix primitives) + Tailwind CSS v4 |
| Icons | lucide-react |
| Toasts | Sonner |
| Git hooks | Husky + lint-staged + Prettier |

## Features

- Email/password auth with Supabase, route protection via middleware
- Swipeable discovery deck with like/pass, mutual-match detection
- Match list and conversation list, both backed by React Query
- Real-time 1:1 messaging (Stream Chat), with typing indicators
- One-tap video calling from a conversation (Stream Video), with an
  incoming-call prompt shared globally via the Zustand call store
- Editable profile (name, username, gender, birthday, bio, avatar) with
  Zod-validated forms and photo upload to Supabase Storage
- Loading, empty, and error states everywhere data is fetched
- Responsive layout with a mobile Sheet nav and desktop dropdown menu

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
lint-staged (ESLint + Prettier) on every commit — see [Git hooks](#git-hooks)
below if you're setting this up in a fresh git repo.

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

## 3. Database setup (Supabase)

Run this in the Supabase SQL editor (or as a migration) on a fresh project:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
    birthdate DATE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"age_range": {"min": 18, "max": 50}, "distance": 25, "gender_preference": []}'::jsonb,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE public.matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_gender ON public.users(gender);
CREATE INDEX idx_users_birthdate ON public.users(birthdate);
CREATE INDEX idx_users_location ON public.users(location_lat, location_lng);
CREATE INDEX idx_users_last_active ON public.users(last_active);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_likes_from_user ON public.likes(from_user_id);
CREATE INDEX idx_likes_to_user ON public.likes(to_user_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at);
CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX idx_matches_created_at ON public.matches(created_at);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.likes
        WHERE from_user_id = NEW.to_user_id
        AND to_user_id = NEW.from_user_id
    ) THEN
        INSERT INTO public.matches (user1_id, user2_id)
        VALUES (
            LEAST(NEW.from_user_id, NEW.to_user_id),
            GREATEST(NEW.from_user_id, NEW.to_user_id)
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER create_match_trigger AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION create_match_on_mutual_like();

CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users SET last_active = NOW() WHERE id = NEW.from_user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_last_active_trigger AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION update_last_active();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, full_name, username, email, gender, birthdate, bio, avatar_url, preferences
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user'),
        NEW.email,
        'other',
        CURRENT_DATE,
        '',
        NULL,
        '{"age_range": {"min": 18, "max": 50}, "distance": 25, "gender_preference": []}'::jsonb
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own likes" ON public.likes
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = from_user_id);

CREATE POLICY "Users can view their own matches" ON public.matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
```

> **Note:** the discovery feed (`getPotentialMatches`) currently reads
> `public.users` directly, so for a real deployment you'll want an
> additional `SELECT` policy (or a security-definer RPC) that lets
> authenticated users read *other* users' public fields — the policy above
> only covers viewing your own row.

### Storage bucket (required for photo uploads)

The profile photo uploader writes to a bucket named **`profile-photos`**,
which is not created by the SQL above:

1. Supabase Dashboard → **Storage** → **New bucket** → name it
   `profile-photos` → make it **public** (or add a signed-URL policy if you
   prefer private storage — `uploadProfilePhoto` in
   `lib/actions/profile.ts` uses `getPublicUrl`, so a private bucket needs
   a code change too).
2. Add a storage policy so authenticated users can upload:
   ```sql
   CREATE POLICY "Authenticated users can upload profile photos"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

   CREATE POLICY "Public can view profile photos"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'profile-photos');
   ```

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

## Git hooks

Husky is wired up via the `prepare` script (`.husky/pre-commit`), which
runs `pnpm lint-staged` on every commit:

- `*.{js,jsx,ts,tsx}` → `eslint --fix`
- `*.{js,jsx,ts,tsx,json,css,md}` → `prettier --write`

If you clone this repo fresh, `pnpm install` re-runs `prepare` and
re-installs the hook automatically — no manual step needed, as long as
you run `pnpm install` from inside a git repository (`git init` first if
this folder isn't one yet).

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

## Deploying

Works out of the box on Vercel:

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables as `.env.local`, including the
   server-only `SUPABASE_SERVICE_ROLE_KEY` and `STREAM_API_SECRET`.
4. Deploy.
