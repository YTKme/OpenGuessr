import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

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
  process.env.OPENGUESSR_DATA_DIR = path.join(tmpBase, 'maps')
  process.env.OPENGUESSR_PANORAMA_DIR = path.join(tmpBase, 'panoramas')
  // Import after setting env so the modules resolve the temp directories.
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

describe('upload persistence pipeline', () => {
  it('creates a map and upserts a located portal', async () => {
    const image = await panoramas.savePanoramaImage('image/jpeg', TINY_PNG)
    const map = await repo.createMap({ id: randomUUID(), name: 'Test City' })

    await repo.upsertPortal(map.id, {
      id: 'portal-1',
      image,
      coordinate: { lat: 48.8584, lng: 2.2945 },
      markers: [],
      caption: 'Eiffel Tower',
    })

    const loaded = await repo.getMap(map.id)
    expect(loaded?.name).toBe('Test City')
    expect(loaded?.portals).toHaveLength(1)
    expect(loaded?.portals[0].image).toBe(image)
    expect(loaded?.portals[0].coordinate).toEqual({ lat: 48.8584, lng: 2.2945 })
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
})
