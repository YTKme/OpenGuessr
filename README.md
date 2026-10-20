# OpenGuessr

A GeoGuessr-style game built around user-uploaded 360° panoramas: you're dropped
into an immersive photosphere, you drop a pin on the world map where you think it
is, and you're scored by how close you are — across a series of rounds.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** — full-stack React framework
  (file-based routing via TanStack Router, SSR, server functions)
- **[TanStack Query](https://tanstack.com/query)** — server-state integration
- **TypeScript** (strict) with **[Zod](https://zod.dev)** schemas shared across
  client and server
- **[shadcn/ui](https://ui.shadcn.com)** + **Tailwind CSS v4** — design system
- **SQLite** via **[Drizzle ORM](https://orm.drizzle.team)** +
  **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** — map/portal + user data
- **[Better Auth](https://better-auth.com)** — accounts, sessions, and admin/user roles
- **[Photo Sphere Viewer](https://photo-sphere-viewer.js.org) v5** — 360° panoramas
- **[Leaflet](https://leafletjs.com)** + OpenStreetMap — the guess map
- **Vitest** — unit/integration tests

The panorama viewer and the map are thin, self-written `useEffect` wrappers around
their engines (no `react-photo-sphere-viewer` / `react-leaflet` binding libraries),
keeping the dependency surface small.

## Accounts & roles

- **Login is required to play.** Playing, browsing maps, and guessing all require a
  signed-in account; open email + password sign-up creates a **user**.
- **Admins** can additionally upload panoramas and use the marker editor.
- The first **admin** is seeded on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  (see `.env`).
- Access is enforced **server-side** (server-function middleware) and mirrored in the
  UI with route guards.

## Architecture

- `src/routes/` — file-based routes: `index`, `login`, `signup`, `play`, `maps`,
  `upload`, `editor/$mapId/$portalId`, and the Better Auth handler at `api/auth/$`.
- `src/lib/auth.ts` / `auth-client.ts` / `auth-functions.ts` — Better Auth server
  instance, browser client, and `getSession` + `requireUser`/`requireAdmin` helpers
  and server-function middleware.
- `src/server/db/` — Drizzle schema (`schema.ts` app tables, `auth-schema.ts`
  generated auth tables) and the SQLite connection (`index.ts`, migrates + seeds on
  startup).
- `src/server/repository/maps.ts` — typed data access (Drizzle); `panoramas.ts`
  stores uploaded images on disk under `public/images/panoramas/`.
- `src/server/functions/` — `createServerFn` RPCs (`getRounds`, `submitGuess`,
  `listMaps`, `getMap`, `uploadPanorama`, `savePortal`), gated by auth middleware.
- `src/lib/schemas.ts` — Zod data model; `src/lib/scoring.ts` — haversine + score curve.

## Getting started

```bash
npm install
cp .env.example .env   # then edit: set BETTER_AUTH_SECRET and the ADMIN_* values
npm run dev
```

Open http://localhost:3000. On first run the database is created and migrated
automatically, a demo "Tester" map is seeded, and the admin account is created from
your `.env`. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or sign up as a player.

Configuration (`.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Scripts

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start the dev server on port 3000            |
| `npm run build`       | Production build (client + server)           |
| `npm start`           | Run the production server (after `build`)    |
| `npm test`            | Run unit/integration tests (Vitest)          |
| `npm run lint`        | Lint with ESLint                             |
| `npm run typecheck`   | Generate routes and type-check               |
| `npm run format`      | Format with Prettier + ESLint `--fix`        |
| `npm run db:generate` | Generate a Drizzle migration from the schema |
| `npm run db:migrate`  | Apply migrations                             |

To regenerate the auth tables after changing Better Auth config:
`npx @better-auth/cli generate --config src/lib/auth.ts --output src/server/db/auth-schema.ts`,
then `npm run db:generate`.

## License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)
