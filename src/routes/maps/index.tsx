import { Link, createFileRoute } from '@tanstack/react-router'
import { ImageOff } from 'lucide-react'
import { requireUser } from '#/lib/auth-functions'
import { listMaps } from '#/server/functions/maps'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/maps/')({
  beforeLoad: async () => {
    await requireUser()
  },
  loader: () => listMaps(),
  component: MapsIndex,
})

function MapsIndex() {
  const maps = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 py-10">
      <p className="island-kicker mb-2">Maps</p>
      <h1 className="display-title mb-6 text-3xl font-bold text-[var(--sea-ink)]">
        Community maps
      </h1>

      {maps.length === 0 ? (
        <div className="island-shell rounded-2xl p-8 text-center">
          <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
            No maps yet. Upload a panorama to create one.
          </p>
          <Button asChild>
            <Link to="/upload">Upload a panorama</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => (
            <Link
              key={map.id}
              to="/maps/$mapId"
              params={{ mapId: map.id }}
              className="island-shell feature-card group overflow-hidden rounded-2xl no-underline"
            >
              <div className="aspect-video w-full overflow-hidden bg-[var(--sand)]">
                {map.previewImage ? (
                  <img
                    src={map.previewImage}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--sea-ink-soft)]">
                    <ImageOff className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="mb-0.5 text-base font-semibold text-[var(--sea-ink)]">
                  {map.name}
                </h2>
                <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
                  {map.portalCount}{' '}
                  {map.portalCount === 1 ? 'panorama' : 'panoramas'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
