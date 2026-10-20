import { createServerFn } from '@tanstack/react-start'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { adminMiddleware } from '#/lib/auth-functions'
import { createMap, getMap, upsertPortal } from '#/server/repository/maps'
import { savePanoramaImage } from '#/server/repository/panoramas'

export const NEW_MAP = 'new'

const uploadFieldsSchema = z.object({
  mapId: z.string().min(1),
  newMapName: z.string().trim().min(1).max(80).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  caption: z.string().trim().max(160).optional(),
})

/**
 * Handle a panorama upload: persist the image, then create or extend a map with
 * a portal at the given coordinate. Accepts multipart FormData so the browser
 * can stream the file directly.
 */
export const uploadPanorama = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected multipart form data.')
    }
    const file = data.get('file')
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('A panorama image is required.')
    }
    const latRaw = data.get('lat')
    const lngRaw = data.get('lng')
    if (typeof latRaw !== 'string' || typeof lngRaw !== 'string') {
      throw new Error('Please pick a location on the map.')
    }
    const fields = uploadFieldsSchema.parse({
      mapId: String(data.get('mapId') ?? ''),
      newMapName: data.get('newMapName')?.toString().trim() || undefined,
      lat: Number(latRaw),
      lng: Number(lngRaw),
      caption: data.get('caption')?.toString().trim() || undefined,
    })
    return { file, ...fields }
  })
  .handler(
    async ({ data, context }): Promise<{ mapId: string; image: string }> => {
      const bytes = new Uint8Array(await data.file.arrayBuffer())
      const image = await savePanoramaImage(data.file.type, bytes)

      let mapId = data.mapId
      if (mapId === NEW_MAP) {
        const name = data.newMapName
        if (!name) throw new Error('Please name your new map.')
        const map = await createMap({
          id: randomUUID(),
          name,
          ownerId: context.user.id,
        })
        mapId = map.id
      } else if (!(await getMap(mapId))) {
        throw new Error('That map no longer exists.')
      }

      await upsertPortal(mapId, {
        id: randomUUID(),
        image,
        coordinate: { lat: data.lat, lng: data.lng },
        markers: [],
        caption: data.caption,
      })

      return { mapId, image }
    },
  )
