import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/upload')({ component: UploadRoute })

function UploadRoute() {
  return (
    <main className="page-wrap px-4 py-16">
      <div className="island-shell rounded-2xl p-8">
        <p className="island-kicker mb-2">Upload</p>
        <h1 className="display-title mb-2 text-2xl font-bold text-[var(--sea-ink)]">
          Upload a panorama
        </h1>
        <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
          Uploading your own 360° photospheres with a location tag is coming
          next.
        </p>
      </div>
    </main>
  )
}
