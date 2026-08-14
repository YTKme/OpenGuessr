# OpenGuessr

A GeoGuessr-style game built around user-uploaded 360° panoramas: you're dropped
into an immersive photosphere, you drop a pin on the world map where you think it
is, and you're scored by how close you are — across a series of rounds.

> **Status: in progress.** The app has been rewritten from an Express + EJS
> server onto a modern, type-safe TanStack stack. The **home page** and the
> **play/guess/score game loop** are complete; **Maps**, **Upload** (with a
> location picker), and the marker **Editor** are stubbed and coming next.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** — full-stack React framework
  (file-based routing via TanStack Router, SSR, server functions)
- **[TanStack Query](https://tanstack.com/query)** — server-state integration
- **TypeScript** (strict) with **[Zod](https://zod.dev)** schemas shared across
  client and server — one source of truth for the data model
- **[shadcn/ui](https://ui.shadcn.com)** + **Tailwind CSS v4** — design system
- **[Photo Sphere Viewer](https://photo-sphere-viewer.js.org) v5** — 360° panoramas
- **[Leaflet](https://leafletjs.com)** + OpenStreetMap — the guess map
- **Vitest** — unit tests

The panorama viewer and the map are thin, self-written `useEffect` wrappers around
their engines (no `react-photo-sphere-viewer` / `react-leaflet` binding libraries),
keeping the dependency surface small.

## Architecture

- `src/routes/` — file-based routes (`index`, `play`, `maps`, `upload`).
- `src/server/functions/` — `createServerFn` RPCs (`getRounds`, `submitGuess`).
  Scoring is **server-authoritative**: the true location is never sent to the
  browser until after you guess.
- `src/server/repository/maps.ts` — the only module that touches the filesystem.
  Maps are stored as JSON under `data/maps/` (swap this one module for a database
  later without touching callers). Panoramas are served from
  `public/images/panoramas/`.
- `src/lib/schemas.ts` — Zod data model; `src/lib/scoring.ts` — haversine +
  GeoGuessr-style score curve.
- `src/components/` — `PanoramaViewer`, `GuessMap`, `Nav`, `ThemeToggle`, and the
  shadcn `ui/` primitives.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the dev server on port 3000         |
| `npm run build`     | Production build (client + server)        |
| `npm start`         | Run the production server (after `build`) |
| `npm test`          | Run unit tests (Vitest)                   |
| `npm run lint`      | Lint with ESLint                          |
| `npm run typecheck` | Generate routes and type-check            |
| `npm run format`    | Format with Prettier + ESLint `--fix`     |

## License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)
