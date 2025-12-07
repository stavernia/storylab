## StoryLab (Next.js)

- **Stack**: Next.js (App Router, TS), Tailwind, shadcn, Supabase (edge functions), domain-based API client in `src/api`.
- **Env**: copy `.env.example` → `.env.local` and fill:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DATABASE_URL` (Postgres for Prisma/NextAuth; new Supabase project)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (default `http://localhost:3000`)
- **Run dev**: `npm run dev` then open `http://localhost:3000`.
- **Entry**: `app/page.tsx` renders `src/App.tsx` (client).
- **API client**: shared client in `src/api/client.ts`; domains in `src/api/{manuscript,books,corkboard}.ts`.
- **Styling**: Tailwind tokens live in `app/globals.css` and `tailwind.config.ts`.

### Notes
- Prototype data uses the existing Supabase project for testing only. A new normalized schema (Prisma + NextAuth) will be added later.
- Prisma scaffold added (`prisma/schema.prisma`, `src/lib/prisma.ts`); run `npx prisma generate` after setting `DATABASE_URL`.
- NextAuth route is stubbed at `app/api/auth/[...nextauth]/route.ts`; configure real providers and adapter when ready.
- Vite-era entry files were removed; remaining legacy code will be cleaned as we migrate.
