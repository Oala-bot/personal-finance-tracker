# Personal Finance Tracker

Next.js, React, TypeScript, and Bootstrap. Requires Node.js 22.13.1 and npm 10.9.2.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` and set your
Supabase project URL and publishable key. Never use a secret/service-role key.
The layout preview runs without these values; database features require them.

The initial migration is already applied to the connected development project.
For a fresh project, run the SQL in `supabase/migrations/` in filename order. It creates private tables with
row-level security. Authentication screens are the next milestone.

```sh
npm run check   # Formatting, lint, and TypeScript
npm run format  # Apply formatting
npm run build  # Production build
npm start      # Serve the production build
```
