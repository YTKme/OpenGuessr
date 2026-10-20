import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Marker } from '#/lib/schemas'

type MapsRepo = typeof import('#/server/repository/maps')
type PanoramaRepo = typeof import('#/server/repository/panoramas')

// Minimal valid 1x1 PNG — content is irrelevant, we only test storage.
const TINY_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
])

let tmpBase: string
let repo: MapsRepo
let panoramas: PanoramaRepo

beforeAll(async () => {
  tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'openguessr-'))
  process.env.DATABASE_URL = path.join(tmpBase, 'test.db')
  process.env.OPENGUESSR_PANORAMA_DIR = path.join(tmpBase, 'panoramas')
  // Import after setting env: importing the repo boots the DB against the temp
  // file (runs migrations + seed).
  repo = await import('#/server/repository/maps')
  panoramas = await import('#/server/repository/panoramas')
})

afterAll(async () => {
  await fs.rm(tmpBase, { recursive: true, force: true })
})

describe('savePanoramaImage', () => {
  it('writes the bytes and returns a generated filename', async () => {
    const name = await panoramas.savePanoramaImage('image/png', TINY_PNG)
    expect(name).toMatch(/^[\w-]+\.png$/)
    const written = await fs.readFile(path.join(tmpBase, 'panoramas', name))
    expect(written.byteLength).toBe(TINY_PNG.byteLength)
  })

  it('rejects unsupported content types', async () => {
    await expect(
      panoramas.savePanoramaImage('image/gif', TINY_PNG),
    ).rejects.toThrow(/Unsupported/)
  })

  it('rejects empty files', async () => {
    await expect(
      panoramas.savePanoramaImage('image/png', new Uint8Array()),
    ).rejects.toThrow(/empty/)
  })
})

describe('maps repository (SQLite)', () => {
  it('seeds and reads the tester map', async () => {
    const tester = await repo.getMap('tester')
    expect(tester?.name).toBe('Tester')
    expect(tester?.portals[0]?.coordinate).toEqual({
      lat: 42.3601,
      lng: -71.0589,
    })
  })

  it('creates a map and upserts a located portal with markers', async () => {
    const marker: Marker = {
      id: 'm1',
      polygon: [
        [0, 0],
        [0.1, 0],
        [0, 0.1],
      ],
    }
    const map = await repo.createMap({ id: randomUUID(), name: 'Test City' })
    await repo.upsertPortal(map.id, {
      id: 'portal-1',
      image: 'a.jpg',
      coordinate: { lat: 48.8584, lng: 2.2945 },
      markers: [marker],
      caption: 'Eiffel Tower',
    })

    const loaded = await repo.getMap(map.id)
    expect(loaded?.portals).toHaveLength(1)
    expect(loaded?.portals[0].image).toBe('a.jpg')
    expect(loaded?.portals[0].coordinate).toEqual({ lat: 48.8584, lng: 2.2945 })
    expect(loaded?.portals[0].markers).toEqual([marker])
  })

  it('replaces a portal with the same id rather than duplicating', async () => {
    const map = await repo.createMap({ id: randomUUID(), name: 'Dedupe' })
    const base = {
      id: 'p',
      image: 'a.jpg',
      coordinate: { lat: 1, lng: 1 },
      markers: [],
    }
    await repo.upsertPortal(map.id, base)
    await repo.upsertPortal(map.id, { ...base, image: 'b.jpg' })
    const loaded = await repo.getMap(map.id)
    expect(loaded?.portals).toHaveLength(1)
    expect(loaded?.portals[0].image).toBe('b.jpg')
  })

  it('lists all maps including newly created ones', async () => {
    const before = (await repo.listMaps()).length
    await repo.createMap({ id: randomUUID(), name: 'Another' })
    expect((await repo.listMaps()).length).toBe(before + 1)
  })

  it('exposes every portal via getAllPortals', async () => {
    const all = await repo.getAllPortals()
    expect(all.some((entry) => entry.mapId === 'tester')).toBe(true)
    expect(all.every((entry) => 'lat' in entry.portal.coordinate)).toBe(true)
  })
})
