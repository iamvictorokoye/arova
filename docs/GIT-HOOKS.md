# Git hooks

Husky is wired up via the `prepare` script (`.husky/pre-commit`), which
runs `pnpm lint-staged` on every commit:

- `*.{js,jsx,ts,tsx}` → `eslint --fix`
- `*.{js,jsx,ts,tsx,json,css,md}` → `prettier --write`

If you clone this repo fresh, `pnpm install` re-runs `prepare` and
re-installs the hook automatically — no manual step needed, as long as
you run `pnpm install` from inside a git repository (`git init` first if
this folder isn't one yet).
