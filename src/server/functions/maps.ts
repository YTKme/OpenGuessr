import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { userMiddleware } from '#/lib/auth-functions'
import type { GameMap, MapSummary } from '#/lib/schemas'
import {
  getMap as getMapRepo,
  listMaps as listMapsRepo,
} from '#/server/repository/maps'

/** Lightweight list of maps for pickers and the Maps page. */
export const listMaps = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .handler(async (): Promise<Array<MapSummary>> => {
    const maps = await listMapsRepo()
    return maps.map((map) => ({
      id: map.id,
      name: map.name,
      portalCount: map.portals.length,
      previewImage: map.portals[0]
        ? `/images/panoramas/${map.portals[0].image}`
        : null,
    }))
  })

/** A single map with its full portal list (for the map detail page). */
export const getMap = createServerFn({ method: 'GET' })
  .middleware([userMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<GameMap | null> => {
    return getMapRepo(data.id)
  })
