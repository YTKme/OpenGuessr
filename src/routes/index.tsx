import { createFileRoute, Link } from '@tanstack/react-router'
import { MapPin, Play, Upload } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

const FEATURES = [
  {
    to: '/play',
    icon: Play,
    title: 'Play',
    desc: 'Drop into a random 360° panorama and pin where you think it is on the world map.',
  },
  {
    to: '/upload',
    icon: Upload,
    title: 'Upload',
    desc: 'Add your own 360° photospheres and tag them with a real-world location.',
  },
  {
    to: '/maps',
    icon: MapPin,
    title: 'Maps',
    desc: 'Browse community maps and the panoramas inside them.',
  },
] as const

function Home() {
  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Open-source geo guessing</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Guess where in the world you are.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Explore immersive 360° panoramas uploaded by the community, then drop
          a pin to guess the location. The closer you get, the more you score.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/play"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.16)] px-6 py-3 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.26)]"
          >
            <Play className="h-4 w-4" aria-hidden /> Start playing
          </Link>
          <Link
            to="/maps"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-6 py-3 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
          >
            Browse maps
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Link
            key={feature.to}
            to={feature.to}
            className="island-shell feature-card rise-in rounded-2xl p-6 no-underline"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <feature.icon
              className="mb-3 h-6 w-6 text-[var(--lagoon-deep)]"
              aria-hidden
            />
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {feature.title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              {feature.desc}
            </p>
          </Link>
        ))}
      </section>
    </main>
  )
}
