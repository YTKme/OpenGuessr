import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

/**
 * Storage for uploaded panorama images. They live under
 * `public/images/panoramas/` so TanStack Start serves them statically at
 * `/images/panoramas/<file>`. The directory is configurable for testing.
 */

const PANORAMA_DIR =
  process.env.OPENGUESSR_PANORAMA_DIR ??
  path.resolve(process.cwd(), 'public', 'images', 'panoramas')

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Persist a panorama image and return its generated filename. The extension is
 * derived from the MIME type (never the user-supplied name), and the filename
 * is a random UUID, so a caller can neither pick the path nor traverse it.
 */
export async function savePanoramaImage(
  contentType: string,
  data: Uint8Array,
): Promise<string> {
  const ext = EXT_BY_TYPE[contentType]
  if (!ext) {
    throw new Error('Unsupported image type — use JPEG, PNG, or WebP.')
  }
  if (data.byteLength === 0) {
    throw new Error('The image file is empty.')
  }
  if (data.byteLength > MAX_BYTES) {
    throw new Error('Image is too large (max 25 MB).')
  }

  await fs.mkdir(PANORAMA_DIR, { recursive: true })
  const filename = `${randomUUID()}.${ext}`
  await fs.writeFile(path.join(PANORAMA_DIR, filename), data)
  return filename
}
