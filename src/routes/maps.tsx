import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/maps')({ component: MapsRoute })

function MapsRoute() {
  return (
    <main className="page-wrap px-4 py-16">
      <div className="island-shell rounded-2xl p-8">
        <p className="island-kicker mb-2">Maps</p>
        <h1 className="display-title mb-2 text-2xl font-bold text-[var(--sea-ink)]">
          Community maps
        </h1>
        <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
          Browsing maps and their panoramas is coming next.
        </p>
      </div>
    </main>
  )
}
