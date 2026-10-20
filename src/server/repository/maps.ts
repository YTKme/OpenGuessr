import { and, eq } from 'drizzle-orm'
import type { GameMap, Portal } from '#/lib/schemas'
import { db } from '#/server/db'
import { maps, portals } from '#/server/db/schema'

/**
 * Data access for maps and portals, backed by SQLite (Drizzle + better-sqlite3).
 * Rows are mapped to the shared Zod domain types at the boundary. Same public
 * API as the previous file-based repository, so callers are unchanged.
 */

type MapRow = typeof maps.$inferSelect
type PortalRow = typeof portals.$inferSelect

function toPortal(row: PortalRow): Portal {
  return {
    id: row.id,
    image: row.image,
    coordinate: { lat: row.lat, lng: row.lng },
    markers: row.markers,
    caption: row.caption ?? undefined,
  }
}

function toGameMap(row: MapRow, portalRows: Array<PortalRow>): GameMap {
  return {
    id: row.id,
    name: row.name,
    portals: portalRows.map(toPortal),
    links: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listMaps(): Promise<Array<GameMap>> {
  const mapRows = db.select().from(maps).all()
  const portalRows = db.select().from(portals).all()
  const grouped = new Map<string, Array<PortalRow>>()
  for (const portal of portalRows) {
    const list = grouped.get(portal.mapId)
    if (list) list.push(portal)
    else grouped.set(portal.mapId, [portal])
  }
  return mapRows
    .map((row) => toGameMap(row, grouped.get(row.id) ?? []))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMap(id: string): Promise<GameMap | null> {
  const mapRow = db.select().from(maps).where(eq(maps.id, id)).get()
  if (!mapRow) return null
  const portalRows = db
    .select()
    .from(portals)
    .where(eq(portals.mapId, id))
    .all()
  return toGameMap(mapRow, portalRows)
}

export async function createMap(input: {
  id: string
  name: string
  ownerId?: string | null
}): Promise<GameMap> {
  const now = new Date().toISOString()
  const row: MapRow = {
    id: input.id,
    name: input.name,
    ownerId: input.ownerId ?? null,
    createdAt: now,
    updatedAt: now,
  }
  db.insert(maps).values(row).run()
  return toGameMap(row, [])
}

/** Insert or replace a portal (matched by id) and touch the owning map. */
export async function upsertPortal(
  mapId: string,
  portal: Portal,
): Promise<GameMap> {
  const owner = db
    .select({ id: maps.id })
    .from(maps)
    .where(eq(maps.id, mapId))
    .get()
  if (!owner) throw new Error(`Map not found: ${mapId}`)

  const fields = {
    image: portal.image,
    lat: portal.coordinate.lat,
    lng: portal.coordinate.lng,
    caption: portal.caption ?? null,
    markers: portal.markers,
  }
  db.insert(portals)
    .values({ id: portal.id, mapId, ...fields })
    .onConflictDoUpdate({ target: portals.id, set: { mapId, ...fields } })
    .run()
  db.update(maps)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(maps.id, mapId))
    .run()

  const result = await getMap(mapId)
  if (!result) throw new Error(`Map not found: ${mapId}`)
  return result
}

export async function getAllPortals(): Promise<
  Array<{ mapId: string; mapName: string; portal: Portal }>
> {
  const rows = db
    .select({ map: maps, portal: portals })
    .from(portals)
    .innerJoin(maps, eq(portals.mapId, maps.id))
    .all()
  return rows.map((row) => ({
    mapId: row.map.id,
    mapName: row.map.name,
    portal: toPortal(row.portal),
  }))
}

export async function getPortal(
  mapId: string,
  portalId: string,
): Promise<Portal | null> {
  const row = db
    .select()
    .from(portals)
    .where(and(eq(portals.mapId, mapId), eq(portals.id, portalId)))
    .get()
  return row ? toPortal(row) : null
}
