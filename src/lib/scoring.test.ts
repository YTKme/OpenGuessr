import { describe, expect, it } from 'vitest'
import {
  MAX_ROUND_SCORE,
  haversineKm,
  scoreForDistance,
  scoreGuess,
} from './scoring'

const NYC = { lat: 40.7128, lng: -74.006 }
const LONDON = { lat: 51.5074, lng: -0.1278 }

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm(NYC, NYC)).toBe(0)
  })

  it('matches the known NYC↔London great-circle distance (~5570 km)', () => {
    const d = haversineKm(NYC, LONDON)
    expect(d).toBeGreaterThan(5500)
    expect(d).toBeLessThan(5620)
  })

  it('is symmetric', () => {
    expect(haversineKm(NYC, LONDON)).toBeCloseTo(haversineKm(LONDON, NYC), 6)
  })

  it('approximates the antipodal distance (~20015 km)', () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 180 })
    expect(d).toBeCloseTo(20015, -2) // within ~100 km
  })
})

describe('scoreForDistance', () => {
  it('awards the maximum for a perfect guess', () => {
    expect(scoreForDistance(0)).toBe(MAX_ROUND_SCORE)
  })

  it('decreases monotonically with distance', () => {
    expect(scoreForDistance(100)).toBeGreaterThan(scoreForDistance(1000))
    expect(scoreForDistance(1000)).toBeGreaterThan(scoreForDistance(5000))
  })

  it('never returns a negative score', () => {
    expect(scoreForDistance(20015)).toBeGreaterThanOrEqual(0)
  })

  it('treats negative distances as zero', () => {
    expect(scoreForDistance(-100)).toBe(MAX_ROUND_SCORE)
  })
})

describe('scoreGuess', () => {
  it('returns max score and zero distance for an exact match', () => {
    const result = scoreGuess({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })
    expect(result.distanceKm).toBe(0)
    expect(result.score).toBe(MAX_ROUND_SCORE)
  })
})
