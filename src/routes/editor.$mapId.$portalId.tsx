import { useEffect, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Check, MapPinned, Plus, Trash2 } from 'lucide-react'
import type { Coordinate, Marker } from '#/lib/schemas'
import { getMap } from '#/server/functions/maps'
import { savePortal } from '#/server/functions/portal'
import PanoramaEditor from '#/components/PanoramaEditor'
import GuessMap from '#/components/GuessMap'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/editor/$mapId/$portalId')({
  loader: async ({ params }) => {
    const map = await getMap({ data: { id: params.mapId } })
    if (!map) throw notFound()
    const portal = map.portals.find((p) => p.id === params.portalId)
    if (!portal) throw notFound()
    return { map, portal }
  },
  component: EditorRoute,
})

const SELECT_CLASS =
  'h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

function portalLabel(caption: string | undefined, id: string): string {
  return caption?.trim() ? caption : `Panorama ${id.slice(0, 6)}`
}

function EditorRoute() {
  const { map, portal } = Route.useLoaderData()
  const otherPortals = map.portals.filter((p) => p.id !== portal.id)

  const [markers, setMarkers] = useState<Array<Marker>>(portal.markers)
  const [caption, setCaption] = useState(portal.caption ?? '')
  const [coordinate, setCoordinate] = useState<Coordinate>(portal.coordinate)
  const [drawing, setDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(timer)
  }, [saved])

  function markChanged() {
    setSaved(false)
    setError(null)
  }

  function onDropMarker(polygon: Array<[number, number]>) {
    setMarkers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), polygon, linkPortalId: undefined },
    ])
    setDrawing(false)
    markChanged()
  }

  function setMarkerLink(markerId: string, linkPortalId: string | undefined) {
    setMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, linkPortalId } : m)),
    )
    markChanged()
  }

  function deleteMarker(markerId: string) {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId))
    markChanged()
  }

  async function onSave() {
    setSaving(true)
    setError(null)
    try {
      await savePortal({
        data: {
          mapId: map.id,
          portal: {
            ...portal,
            caption: caption.trim() || undefined,
            coordinate,
            markers,
          },
        },
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-wrap px-4 py-8">
      <Link
        to="/maps/$mapId"
        params={{ mapId: map.id }}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {map.name}
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="island-kicker mb-2">Edit panorama</p>
          <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)]">
            {portalLabel(caption, portal.id)}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </span>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--lagoon-deep)]">
              <Check className="h-4 w-4" aria-hidden /> Saved
            </span>
          )}
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="island-shell overflow-hidden rounded-2xl p-1.5">
            <PanoramaEditor
              image={`/images/panoramas/${portal.image}`}
              markers={markers}
              drawing={drawing}
              onDropMarker={onDropMarker}
              className="h-[52vh] min-h-[320px] w-full rounded-xl"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={drawing ? 'default' : 'outline'}
              onClick={() => setDrawing((d) => !d)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {drawing ? 'Click the panorama…' : 'Add link marker'}
            </Button>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              {drawing
                ? 'Click where the link should appear in the scene.'
                : `${markers.length} ${markers.length === 1 ? 'marker' : 'markers'} on this panorama.`}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="island-shell rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--sea-ink)]">
              Details
            </h2>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(event) => {
                  setCaption(event.target.value)
                  markChanged()
                }}
                placeholder="A short description"
                maxLength={160}
              />
            </div>
          </section>

          <section className="island-shell rounded-2xl p-5">
            <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--sea-ink)]">
              <MapPinned className="h-4 w-4 text-[var(--lagoon-deep)]" aria-hidden />
              Location
            </h2>
            <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
              Click to move where this panorama is on the map.
            </p>
            <div className="island-shell overflow-hidden rounded-xl p-1">
              <GuessMap
                guess={coordinate}
                onGuessChange={(next) => {
                  setCoordinate(next)
                  markChanged()
                }}
                interactive
                className="h-44 w-full rounded-lg"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
              {coordinate.lat.toFixed(4)}, {coordinate.lng.toFixed(4)}
            </p>
          </section>

          <section className="island-shell rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--sea-ink)]">
              Link markers
            </h2>
            {markers.length === 0 ? (
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                No markers yet. Use “Add link marker” to place one.
              </p>
            ) : (
              <ul className="space-y-2">
                {markers.map((marker, index) => (
                  <li
                    key={marker.id}
                    className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-[var(--sea-ink)]">
                      {index + 1}
                    </span>
                    <select
                      aria-label={`Link target for marker ${index + 1}`}
                      value={marker.linkPortalId ?? ''}
                      onChange={(event) =>
                        setMarkerLink(marker.id, event.target.value || undefined)
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="">No link</option>
                      {otherPortals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {portalLabel(p.caption, p.id)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => deleteMarker(marker.id)}
                      aria-label={`Delete marker ${index + 1}`}
                      className="shrink-0 rounded-md p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
