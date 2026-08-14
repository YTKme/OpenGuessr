import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { portalSchema } from '#/lib/schemas'
import { upsertPortal } from '#/server/repository/maps'

/** Persist edits to a portal (caption, coordinate, markers) within its map. */
export const savePortal = createServerFn({ method: 'POST' })
  .validator(z.object({ mapId: z.string(), portal: portalSchema }))
  .handler(async ({ data }) => {
    return upsertPortal(data.mapId, data.portal)
  })
