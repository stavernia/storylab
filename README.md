## StoryLab (Next.js)

- **Stack**: Next.js (App Router, TS), Tailwind, shadcn, domain-based API helpers in `src/api`.
- **Env**: copy `.env.example` → `.env.local` and fill:
  - `DATABASE_URL` (Postgres for Prisma/NextAuth)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (default `http://localhost:3000`).
- **Run dev**: `npm run dev` then open `http://localhost:3000`.
- **Entry**: `app/page.tsx` renders `src/App.tsx` (client).
- **API client**: domain helpers in `src/api/{manuscript,books,corkboard}.ts` call local API routes.
- **Styling**: Tailwind tokens live in `app/globals.css` and `tailwind.config.ts`.

### Notes

- Prisma scaffold added (`prisma/schema.prisma`, `src/lib/prisma.ts`); run `npx prisma generate` after setting `DATABASE_URL`.
- NextAuth route is stubbed at `app/api/auth/[...nextauth]/route.ts`; configure real providers and adapter when ready.
- Vite-era entry files were removed; remaining legacy code will be cleaned as we migrate.
