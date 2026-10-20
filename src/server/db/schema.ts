import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
// Relative import (not the `#/` alias) so drizzle-kit's loader resolves it.
import type { Marker } from '../../lib/schemas'

/** A map — a named collection of panoramas. `ownerId` → users.id (auth, app-enforced). */
export const maps = sqliteTable('maps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

/** A panorama within a map, with its true location and transport markers. */
export const portals = sqliteTable('portals', {
  id: text('id').primaryKey(),
  mapId: text('map_id')
    .notNull()
    .references(() => maps.id, { onDelete: 'cascade' }),
  image: text('image').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  caption: text('caption'),
  markers: text('markers', { mode: 'json' }).$type<Array<Marker>>().notNull(),
})
