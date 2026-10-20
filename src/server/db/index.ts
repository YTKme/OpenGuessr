import { mkdirSync } from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as appSchema from './schema'
import * as authSchema from './auth-schema'
import { maps, portals } from './schema'

const schema = { ...appSchema, ...authSchema }

// Load .env into process.env (Node built-in). This module is imported first by
// all server code, so auth/config env vars are available everywhere. No-op if
// the file is absent (production sets real env vars).
try {
  process.loadEnvFile()
} catch {
  // .env is optional
}

/**
 * The single SQLite connection + Drizzle instance (server-only). Migrations and
 * a one-time seed run on first import so the app is self-setting-up in dev.
 */

const dbPath =
  process.env.DATABASE_URL ??
  path.resolve(process.cwd(), 'data', 'openguessr.db')

if (dbPath !== ':memory:') {
  mkdirSync(path.dirname(dbPath), { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') })
seed()

/** Insert the demo "Tester" map on a fresh database. */
function seed() {
  const existing = db.select({ id: maps.id }).from(maps).limit(1).all()
  if (existing.length > 0) return
  const now = '2021-05-01T00:00:00.000Z'
  db.insert(maps)
    .values({
      id: 'tester',
      name: 'Tester',
      ownerId: null,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  db.insert(portals)
    .values({
      id: 'portaltest',
      mapId: 'tester',
      image: 'tester.jpg',
      lat: 42.3601,
      lng: -71.0589,
      caption: 'Seed panorama',
      markers: [],
    })
    .run()
}

export { schema, sqlite }
