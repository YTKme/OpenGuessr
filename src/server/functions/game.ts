import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { coordinateSchema } from '#/lib/schemas'
import type { GuessResult, Round } from '#/lib/schemas'
import { getAllPortals, getPortal } from '#/server/repository/maps'
import { scoreGuess } from '#/lib/scoring'

export const DEFAULT_ROUNDS = 5

/** Fisher–Yates sample without replacement. */
function sample<T>(items: Array<T>, count: number): Array<T> {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

/**
 * Build a game: a set of rounds picked at random from all uploaded panoramas.
 * Deliberately returns the panorama image but NOT its coordinate — the answer
 * stays server-side until the player guesses (see {@link submitGuess}).
 */
export const getRounds = createServerFn({ method: 'GET' })
  .validator(z.object({ count: z.number().int().min(1).max(20) }))
  .handler(async ({ data }): Promise<Array<Round>> => {
    const portals = await getAllPortals()
    if (portals.length === 0) {
      throw new Error('No panoramas are available to play yet.')
    }
    const chosen = sample(portals, Math.min(data.count, portals.length))
    return chosen.map(({ mapId, mapName, portal }) => ({
      mapId,
      mapName,
      portalId: portal.id,
      image: `/images/panoramas/${portal.image}`,
      caption: portal.caption,
    }))
  })

/** Score a player's guess for a round, server-authoritatively. */
export const submitGuess = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      mapId: z.string(),
      portalId: z.string(),
      guess: coordinateSchema,
    }),
  )
  .handler(async ({ data }): Promise<GuessResult> => {
    const portal = await getPortal(data.mapId, data.portalId)
    if (!portal) {
      throw new Error('That round could not be found.')
    }
    const { distanceKm, score } = scoreGuess(data.guess, portal.coordinate)
    return {
      guess: data.guess,
      trueCoordinate: portal.coordinate,
      distanceKm,
      score,
    }
  })
