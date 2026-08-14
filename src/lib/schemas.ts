import { z } from 'zod'

/**
 * Shared Zod schemas — the single source of truth for the data model, used by
 * both the server (validation + persistence) and the client (typed data).
 */

/** A real-world location. `coordinate` is the answer the player is guessing. */
export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
export type Coordinate = z.infer<typeof coordinateSchema>

/**
 * A polygon "transport" marker drawn in the editor, linking one panorama to
 * another. Points are `[longitude, latitude]` pairs in radians, matching the
 * Photo Sphere Viewer markers-plugin coordinate space.
 */
export const markerSchema = z.object({
  id: z.string(),
  linkPortalId: z.string().optional(),
  polygon: z.array(z.tuple([z.number(), z.number()])),
})
export type Marker = z.infer<typeof markerSchema>

/** A single 360° panorama with its true location and any transport markers. */
export const portalSchema = z.object({
  id: z.string(),
  image: z.string(), // filename served from /images/panoramas/<image>
  coordinate: coordinateSchema,
  markers: z.array(markerSchema).default([]),
  caption: z.string().optional(),
})
export type Portal = z.infer<typeof portalSchema>

/** A directional link between two portals within a map. */
export const mapLinkSchema = z.object({
  fromPortalId: z.string(),
  toPortalId: z.string(),
})
export type MapLink = z.infer<typeof mapLinkSchema>

/** A named collection of portals — the unit users create and play. */
export const gameMapSchema = z.object({
  id: z.string(),
  name: z.string(),
  portals: z.array(portalSchema).default([]),
  links: z.array(mapLinkSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type GameMap = z.infer<typeof gameMapSchema>

/** Lightweight map info for lists and pickers (omits the portal payload). */
export const mapSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  portalCount: z.number().int(),
  previewImage: z.string().nullable(),
})
export type MapSummary = z.infer<typeof mapSummarySchema>

/**
 * What the client receives for a single game round. Deliberately excludes the
 * true `coordinate` so the answer is never sent to the browser before the
 * player guesses — scoring is done server-side.
 */
export const roundSchema = z.object({
  mapId: z.string(),
  mapName: z.string(),
  portalId: z.string(),
  image: z.string(), // resolved URL, e.g. /images/panoramas/tester.jpg
  caption: z.string().optional(),
})
export type Round = z.infer<typeof roundSchema>

/** The server-authoritative result of scoring a player's guess. */
export const guessResultSchema = z.object({
  guess: coordinateSchema,
  trueCoordinate: coordinateSchema,
  distanceKm: z.number(),
  score: z.number().int(),
})
export type GuessResult = z.infer<typeof guessResultSchema>
