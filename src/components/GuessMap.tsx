import { useEffect, useRef, useState } from 'react'
import type {
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker,
  Polyline,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Coordinate } from '#/lib/schemas'

type LeafletModule = typeof import('leaflet')

const GUESS_COLOR = '#328f97'
const ANSWER_COLOR = '#e11d3f'

function pinIcon(L: LeafletModule, color: string) {
  return L.divIcon({
    className: 'og-pin',
    html: `<svg width="28" height="38" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 8.25 12 22 12 22s12-13.75 12-22C24 5.37 18.63 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="4.2" fill="white"/></svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
  })
}

interface GuessMapProps {
  guess: Coordinate | null
  /** When set, reveal the true location, draw the distance line, and fit both. */
  answer?: Coordinate | null
  onGuessChange?: (coordinate: Coordinate) => void
  interactive?: boolean
  className?: string
}

/**
 * Thin, client-only wrapper around Leaflet (no react-leaflet). Leaflet is
 * dynamically imported inside an effect so it never runs during SSR. Guess and
 * answer markers are kept in sync with props via refs + a `ready` flag.
 */
export default function GuessMap({
  guess,
  answer = null,
  onGuessChange,
  interactive = true,
  className,
}: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const LRef = useRef<LeafletModule | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const guessMarkerRef = useRef<Marker | null>(null)
  const answerMarkerRef = useRef<Marker | null>(null)
  const lineRef = useRef<Polyline | null>(null)
  const [ready, setReady] = useState(false)

  // Keep the click handler reading fresh props without re-binding.
  const interactiveRef = useRef(interactive)
  const onGuessChangeRef = useRef(onGuessChange)
  useEffect(() => {
    interactiveRef.current = interactive
    onGuessChangeRef.current = onGuessChange
  })

  useEffect(() => {
    const lifecycle = { cancelled: false }
    let map: LeafletMap | undefined
    let resizeObserver: ResizeObserver | undefined

    void (async () => {
      const L = await import('leaflet')
      if (lifecycle.cancelled || !containerRef.current) return
      LRef.current = L
      map = L.map(containerRef.current, {
        worldCopyJump: true,
        minZoom: 1,
      }).setView([20, 0], 1)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)
      map.on('click', (event: LeafletMouseEvent) => {
        if (!interactiveRef.current) return
        onGuessChangeRef.current?.({
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        })
      })
      mapRef.current = map
      // Keep Leaflet's internal size in sync when the container resizes,
      // otherwise tiles render gray after a layout change.
      resizeObserver = new ResizeObserver(() => map?.invalidateSize())
      resizeObserver.observe(containerRef.current)
      setReady(true)
    })()

    return () => {
      lifecycle.cancelled = true
      resizeObserver?.disconnect()
      map?.remove()
      mapRef.current = null
      guessMarkerRef.current = null
      answerMarkerRef.current = null
      lineRef.current = null
    }
  }, [])

  // Sync the guess marker.
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!ready || !L || !map) return

    if (!guess) {
      guessMarkerRef.current?.remove()
      guessMarkerRef.current = null
      return
    }
    const latlng: [number, number] = [guess.lat, guess.lng]
    if (guessMarkerRef.current) {
      guessMarkerRef.current.setLatLng(latlng)
    } else {
      guessMarkerRef.current = L.marker(latlng, {
        icon: pinIcon(L, GUESS_COLOR),
        keyboard: false,
      }).addTo(map)
    }
  }, [ready, guess])

  // Reveal the answer: true-location pin + distance line, fit to both.
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!ready || !L || !map) return

    answerMarkerRef.current?.remove()
    answerMarkerRef.current = null
    lineRef.current?.remove()
    lineRef.current = null
    if (!answer) return

    const answerLatLng: [number, number] = [answer.lat, answer.lng]
    answerMarkerRef.current = L.marker(answerLatLng, {
      icon: pinIcon(L, ANSWER_COLOR),
      keyboard: false,
    }).addTo(map)

    if (guess) {
      const guessLatLng: [number, number] = [guess.lat, guess.lng]
      lineRef.current = L.polyline([guessLatLng, answerLatLng], {
        color: ANSWER_COLOR,
        weight: 2,
        dashArray: '6 6',
      }).addTo(map)
      map.fitBounds(L.latLngBounds([guessLatLng, answerLatLng]).pad(0.35), {
        maxZoom: 6,
      })
    } else {
      map.setView(answerLatLng, 4)
    }
  }, [ready, answer, guess])

  return <div ref={containerRef} className={className} />
}
