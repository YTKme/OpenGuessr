import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Play } from 'lucide-react'
import { requireUser } from '#/lib/auth-functions'
import { getMap } from '#/server/functions/maps'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/maps/$mapId')({
  beforeLoad: async () => {
    await requireUser()
  },
  loader: async ({ params }) => {
    const map = await getMap({ data: { id: params.mapId } })
    if (!map) throw notFound()
    return map
  },
  component: MapDetail,
})

function MapDetail() {
  const map = Route.useLoaderData()
  const count = map.portals.length

  return (
    <main className="page-wrap px-4 py-10">
      <Link
        to="/maps"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All maps
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="island-kicker mb-2">Map</p>
          <h1 className="display-title text-3xl font-bold text-[var(--sea-ink)]">
            {map.name}
          </h1>
          <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
            {count} {count === 1 ? 'panorama' : 'panoramas'}
          </p>
        </div>
        {count > 0 && (
          <Button asChild>
            <Link to="/play" search={{ mapId: map.id }}>
              <Play className="h-4 w-4" aria-hidden /> Play this map
            </Link>
          </Button>
        )}
      </div>

      {count === 0 ? (
        <div className="island-shell rounded-2xl p-8 text-center text-sm text-[var(--sea-ink-soft)]">
          This map has no panoramas yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {map.portals.map((portal) => (
            <div
              key={portal.id}
              className="island-shell overflow-hidden rounded-2xl"
            >
              <div className="aspect-video w-full overflow-hidden bg-[var(--sand)]">
                <img
                  src={`/images/panoramas/${portal.image}`}
                  alt={portal.caption ?? ''}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                {portal.caption && (
                  <p className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">
                    {portal.caption}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                    {portal.coordinate.lat.toFixed(3)},{' '}
                    {portal.coordinate.lng.toFixed(3)}
                  </p>
                  <Link
                    to="/editor/$mapId/$portalId"
                    params={{ mapId: map.id, portalId: portal.id }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
