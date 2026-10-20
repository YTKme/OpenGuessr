import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { requireAdmin } from '#/lib/auth-functions'
import { UploadCloud } from 'lucide-react'
import type { Coordinate } from '#/lib/schemas'
import { listMaps } from '#/server/functions/maps'
import { NEW_MAP, uploadPanorama } from '#/server/functions/upload'
import GuessMap from '#/components/GuessMap'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/upload')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  loader: () => listMaps(),
  component: UploadRoute,
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

function UploadRoute() {
  const maps = Route.useLoaderData()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [mapId, setMapId] = useState<string>(NEW_MAP)
  const [newMapName, setNewMapName] = useState('')
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null)
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const nameNeeded = mapId === NEW_MAP
  const canSubmit =
    Boolean(file) &&
    Boolean(coordinate) &&
    (!nameNeeded || newMapName.trim().length > 0) &&
    !submitting

  function reset() {
    setFile(null)
    setMapId(NEW_MAP)
    setNewMapName('')
    setCoordinate(null)
    setCaption('')
    setError(null)
    setDone(false)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!file) return setError('Choose a panorama image.')
    if (!coordinate) return setError('Click the map to set the location.')
    if (nameNeeded && !newMapName.trim()) return setError('Name your new map.')

    setSubmitting(true)
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('mapId', mapId)
      if (nameNeeded) form.set('newMapName', newMapName.trim())
      form.set('lat', String(coordinate.lat))
      form.set('lng', String(coordinate.lng))
      if (caption.trim()) form.set('caption', caption.trim())
      await uploadPanorama({ data: form })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="page-wrap px-4 py-16">
        <div className="island-shell mx-auto max-w-xl rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(79,184,178,0.16)]">
            <UploadCloud
              className="h-6 w-6 text-[var(--lagoon-deep)]"
              aria-hidden
            />
          </div>
          <p className="island-kicker mb-2">Uploaded</p>
          <h1 className="display-title mb-2 text-2xl font-bold text-[var(--sea-ink)]">
            Panorama added
          </h1>
          <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
            It’s now in the pool. Jump into a game to see it come up.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/play">Play now</Link>
            </Button>
            <Button variant="outline" onClick={reset}>
              Upload another
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      <div className="island-shell mx-auto max-w-3xl rounded-3xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Upload</p>
        <h1 className="display-title mb-6 text-3xl font-bold text-[var(--sea-ink)]">
          Add a panorama
        </h1>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">Panorama image</Label>
            <Input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-[var(--sea-ink-soft)]">
              {file
                ? `${file.name} · ${formatBytes(file.size)}`
                : 'Equirectangular 360° JPEG, PNG, or WebP (max 25 MB).'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="map">Map</Label>
              <select
                id="map"
                value={mapId}
                onChange={(event) => setMapId(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value={NEW_MAP}>+ New map</option>
                {maps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.name} ({map.portalCount})
                  </option>
                ))}
              </select>
            </div>
            {nameNeeded && (
              <div className="space-y-2">
                <Label htmlFor="mapName">New map name</Label>
                <Input
                  id="mapName"
                  value={newMapName}
                  onChange={(event) => setNewMapName(event.target.value)}
                  placeholder="e.g. My City"
                  maxLength={80}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Location{' '}
              <span className="text-xs font-normal text-[var(--sea-ink-soft)]">
                — click the map where this was taken
              </span>
            </Label>
            <div className="island-shell overflow-hidden rounded-2xl p-1.5">
              <GuessMap
                guess={coordinate}
                onGuessChange={setCoordinate}
                interactive
                className="h-72 w-full rounded-xl"
              />
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              {coordinate
                ? `Selected: ${coordinate.lat.toFixed(4)}, ${coordinate.lng.toFixed(4)}`
                : 'No location selected yet.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">
              Caption{' '}
              <span className="text-xs font-normal text-[var(--sea-ink-soft)]">
                (optional)
              </span>
            </Label>
            <Input
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="A short description"
              maxLength={160}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? 'Uploading…' : 'Upload panorama'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
