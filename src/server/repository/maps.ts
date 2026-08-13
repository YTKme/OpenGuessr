import { promises as fs } from 'node:fs'
import path from 'node:path'
import { gameMapSchema } from '#/lib/schemas'
import type { GameMap, Portal } from '#/lib/schemas'

/**
 * File-based data layer — the single module that touches the filesystem. Maps
 * are stored as JSON at `data/maps/<id>.json` (not web-served). Swapping this
 * for a database later means reimplementing only this module; callers are
 * insulated behind the async, typed API below.
 */

const DATA_DIR = path.resolve(process.cwd(), 'data', 'maps')

/** Only allow simple ids so a caller can never traverse outside DATA_DIR. */
const SAFE_ID = /^[a-zA-Z0-9_-]+$/

function assertSafeId(id: string): void {
  if (!SAFE_ID.test(id)) {
    throw new Error(`Invalid map id: ${JSON.stringify(id)}`)
  }
}

function mapPath(id: string): string {
  assertSafeId(id)
  return path.join(DATA_DIR, `${id}.json`)
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readMapFile(id: string): Promise<GameMap | null> {
  let raw: string
  try {
    raw = await fs.readFile(mapPath(id), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
  return gameMapSchema.parse(JSON.parse(raw))
}

/** All maps on disk, sorted by name. */
export async function listMaps(): Promise<GameMap[]> {
  await ensureDataDir()
  const entries = await fs.readdir(DATA_DIR)
  const maps = await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.json'))
      .map((entry) => readMapFile(entry.replace(/\.json$/, ''))),
  )
  return maps
    .filter((map): map is GameMap => map !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMap(id: string): Promise<GameMap | null> {
  return readMapFile(id)
}

export async function saveMap(map: GameMap): Promise<GameMap> {
  await ensureDataDir()
  const next: GameMap = { ...map, updatedAt: new Date().toISOString() }
  const validated = gameMapSchema.parse(next)
  await fs.writeFile(
    mapPath(validated.id),
    `${JSON.stringify(validated, null, 2)}\n`,
    'utf8',
  )
  return validated
}

export async function createMap(input: {
  id: string
  name: string
}): Promise<GameMap> {
  const now = new Date().toISOString()
  return saveMap({
    id: input.id,
    name: input.name,
    portals: [],
    links: [],
    createdAt: now,
    updatedAt: now,
  })
}

/** Insert or replace a portal (matched by id) within a map. */
export async function upsertPortal(
  mapId: string,
  portal: Portal,
): Promise<GameMap> {
  const map = await getMap(mapId)
  if (!map) throw new Error(`Map not found: ${mapId}`)
  const portals = map.portals.filter((p) => p.id !== portal.id)
  portals.push(portal)
  return saveMap({ ...map, portals })
}

/** Every portal across every map, tagged with its owning map. */
export async function getAllPortals(): Promise<
  Array<{ mapId: string; mapName: string; portal: Portal }>
> {
  const maps = await listMaps()
  return maps.flatMap((map) =>
    map.portals.map((portal) => ({
      mapId: map.id,
      mapName: map.name,
      portal,
    })),
  )
}

export async function getPortal(
  mapId: string,
  portalId: string,
): Promise<Portal | null> {
  const map = await getMap(mapId)
  return map?.portals.find((p) => p.id === portalId) ?? null
}
