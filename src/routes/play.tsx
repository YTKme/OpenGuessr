import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { MapPin, Trophy } from 'lucide-react'
import { DEFAULT_ROUNDS, getRounds, submitGuess } from '#/server/functions/game'
import type { Coordinate, GuessResult, Round } from '#/lib/schemas'
import { MAX_ROUND_SCORE } from '#/lib/scoring'
import PanoramaViewer from '#/components/PanoramaViewer'
import GuessMap from '#/components/GuessMap'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Progress } from '#/components/ui/progress'

export const Route = createFileRoute('/play')({
  loader: () => getRounds({ data: { count: DEFAULT_ROUNDS } }),
  component: PlayRoute,
  errorComponent: NoPanoramas,
})

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString()} km`
}

function PlayRoute() {
  const initialRounds = Route.useLoaderData()
  const [rounds, setRounds] = useState<Array<Round>>(initialRounds)
  const [index, setIndex] = useState(0)
  const [guess, setGuess] = useState<Coordinate | null>(null)
  const [reveal, setReveal] = useState<GuessResult | null>(null)
  const [results, setResults] = useState<Array<GuessResult>>([])
  const [pending, setPending] = useState(false)
  const [finished, setFinished] = useState(false)

  const round = rounds[index]
  const total = results.reduce((sum, r) => sum + r.score, 0)

  async function onSubmitGuess() {
    if (!guess || pending) return
    setPending(true)
    try {
      const result = await submitGuess({
        data: { mapId: round.mapId, portalId: round.portalId, guess },
      })
      setReveal(result)
      setResults((prev) => [...prev, result])
    } finally {
      setPending(false)
    }
  }

  function onNext() {
    if (index + 1 >= rounds.length) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setGuess(null)
    setReveal(null)
  }

  async function onPlayAgain() {
    const fresh = await getRounds({ data: { count: DEFAULT_ROUNDS } })
    setRounds(fresh)
    setIndex(0)
    setGuess(null)
    setReveal(null)
    setResults([])
    setFinished(false)
  }

  if (finished) {
    return (
      <Summary rounds={rounds} results={results} onPlayAgain={onPlayAgain} />
    )
  }

  return (
    <main className="relative h-[calc(100svh-4.25rem)] min-h-[520px] w-full overflow-hidden">
      <PanoramaViewer
        key={round.portalId + index}
        image={round.image}
        className="absolute inset-0 h-full w-full"
      />

      {/* Round + score status */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <Badge className="pointer-events-auto bg-[var(--surface-strong)] text-[var(--sea-ink)] shadow-md backdrop-blur">
          Round {index + 1} / {rounds.length}
        </Badge>
        <Badge className="pointer-events-auto gap-1 bg-[var(--surface-strong)] text-[var(--sea-ink)] shadow-md backdrop-blur">
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          {total.toLocaleString()}
        </Badge>
      </div>

      {/* Guess panel */}
      <div className="absolute bottom-4 right-4 z-10 w-[min(92vw,26rem)]">
        <div className="island-shell overflow-hidden rounded-2xl p-1.5">
          <GuessMap
            guess={guess}
            answer={reveal?.trueCoordinate ?? null}
            onGuessChange={setGuess}
            interactive={!reveal}
            className="h-[clamp(11rem,32vh,20rem)] w-full rounded-xl"
          />
          <div className="px-2 pb-1.5 pt-2">
            <p className="m-0 mb-2 text-center text-xs text-[var(--sea-ink-soft)]">
              {reveal ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--sea-ink)]">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {formatDistance(reveal.distanceKm)} away · +
                  {reveal.score.toLocaleString()} points
                </span>
              ) : guess ? (
                'Ready when you are.'
              ) : (
                'Click the map to place your guess.'
              )}
            </p>
            {reveal ? (
              <Button className="w-full" onClick={onNext}>
                {index + 1 >= rounds.length ? 'See results' : 'Next round'}
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={!guess || pending}
                onClick={onSubmitGuess}
              >
                {pending ? 'Scoring…' : 'Guess'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function Summary({
  rounds,
  results,
  onPlayAgain,
}: {
  rounds: Array<Round>
  results: Array<GuessResult>
  onPlayAgain: () => void
}) {
  const total = results.reduce((sum, r) => sum + r.score, 0)
  const max = rounds.length * MAX_ROUND_SCORE
  const pct = max > 0 ? Math.round((total / max) * 100) : 0

  return (
    <main className="page-wrap px-4 py-12">
      <div className="island-shell mx-auto max-w-2xl rounded-3xl p-8">
        <p className="island-kicker mb-2">Game over</p>
        <h1 className="display-title mb-1 text-3xl font-bold text-[var(--sea-ink)]">
          {total.toLocaleString()}{' '}
          <span className="text-[var(--sea-ink-soft)]">
            / {max.toLocaleString()}
          </span>
        </h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          You scored {pct}% across {rounds.length}{' '}
          {rounds.length === 1 ? 'round' : 'rounds'}.
        </p>
        <Progress value={pct} className="mb-6" />

        <ol className="mb-8 space-y-2">
          {results.map((result, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm"
            >
              <span className="font-semibold text-[var(--sea-ink)]">
                Round {i + 1}
              </span>
              <span className="text-[var(--sea-ink-soft)]">
                {formatDistance(result.distanceKm)} away
              </span>
              <span className="font-semibold text-[var(--lagoon-deep)]">
                +{result.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onPlayAgain}>Play again</Button>
          <Button asChild variant="outline">
            <Link to="/maps">Browse maps</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

function NoPanoramas() {
  return (
    <main className="page-wrap px-4 py-16">
      <div className="island-shell mx-auto max-w-xl rounded-2xl p-8 text-center">
        <p className="island-kicker mb-2">Nothing to explore yet</p>
        <h1 className="display-title mb-2 text-2xl font-bold text-[var(--sea-ink)]">
          No panoramas are available
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Upload a 360° photosphere and tag its location to start playing.
        </p>
        <Button asChild>
          <Link to="/upload">Upload a panorama</Link>
        </Button>
      </div>
    </main>
  )
}
