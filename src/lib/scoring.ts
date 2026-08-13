import type { Coordinate } from './schemas'

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle (haversine) distance between two coordinates, in kilometres. */
export function haversineKm(a: Coordinate, b: Coordinate): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Maximum points awarded for a perfect guess in a single round. */
export const MAX_ROUND_SCORE = 5000

/**
 * GeoGuessr-style score: {@link MAX_ROUND_SCORE} for a perfect guess, decaying
 * exponentially with distance. `scaleKm` sets how quickly points fall off — it
 * is roughly the distance at which you score 1/e (~37%) of the maximum.
 */
export function scoreForDistance(distanceKm: number, scaleKm = 2000): number {
  const clamped = Math.max(0, distanceKm)
  return Math.round(MAX_ROUND_SCORE * Math.exp(-clamped / scaleKm))
}

/** Score a guess against the true location, returning distance and points. */
export function scoreGuess(
  guess: Coordinate,
  answer: Coordinate,
): { distanceKm: number; score: number } {
  const distanceKm = haversineKm(guess, answer)
  return { distanceKm, score: scoreForDistance(distanceKm) }
}
