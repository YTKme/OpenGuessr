import { useEffect, useRef, useState } from 'react'
import type { Viewer as PsvViewer } from '@photo-sphere-viewer/core'
import type { MarkersPlugin as MarkersPluginType } from '@photo-sphere-viewer/markers-plugin'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { Marker } from '#/lib/schemas'

// Half-size (radians, ~3.4°) of the diamond dropped for each link marker.
const MARKER_RADIUS = 0.06

function diamond(yaw: number, pitch: number): Array<[number, number]> {
  return [
    [yaw, pitch - MARKER_RADIUS],
    [yaw + MARKER_RADIUS, pitch],
    [yaw, pitch + MARKER_RADIUS],
    [yaw - MARKER_RADIUS, pitch],
  ]
}

const MARKER_STYLE = {
  fill: 'rgba(79, 184, 178, 0.35)',
  stroke: 'rgba(50, 143, 151, 0.9)',
  'stroke-width': '2px',
}

interface PanoramaEditorProps {
  image: string
  markers: Array<Marker>
  /** When true, a click on the panorama drops a new link marker. */
  drawing: boolean
  onDropMarker: (polygon: Array<[number, number]>) => void
  className?: string
}

/**
 * Client-only Photo Sphere Viewer with the markers plugin, for the editor.
 * Renders the given markers and, while `drawing`, drops a diamond link marker
 * at the clicked spherical position. Kept separate from the game's read-only
 * PanoramaViewer.
 */
export default function PanoramaEditor({
  image,
  markers,
  drawing,
  onDropMarker,
  className,
}: PanoramaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<PsvViewer | null>(null)
  const pluginRef = useRef<MarkersPluginType | null>(null)
  const [ready, setReady] = useState(false)

  // Keep the click handler reading fresh props without re-binding.
  const drawingRef = useRef(drawing)
  const onDropRef = useRef(onDropMarker)
  useEffect(() => {
    drawingRef.current = drawing
    onDropRef.current = onDropMarker
  })

  useEffect(() => {
    const lifecycle = { cancelled: false }
    let viewer: PsvViewer | undefined

    void (async () => {
      const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
        import('@photo-sphere-viewer/core'),
        import('@photo-sphere-viewer/markers-plugin'),
      ])
      if (lifecycle.cancelled || !containerRef.current) return
      viewer = new Viewer({
        container: containerRef.current,
        panorama: image,
        navbar: false,
        defaultZoomLvl: 5,
        plugins: [MarkersPlugin],
      })
      viewerRef.current = viewer
      pluginRef.current = viewer.getPlugin<MarkersPluginType>(MarkersPlugin)
      viewer.addEventListener('click', (event) => {
        if (!drawingRef.current || event.data.rightclick) return
        onDropRef.current(diamond(event.data.yaw, event.data.pitch))
      })
      setReady(true)
    })()

    return () => {
      lifecycle.cancelled = true
      viewer?.destroy()
      viewerRef.current = null
      pluginRef.current = null
    }
  }, [image])

  // Re-render the markers whenever they change.
  useEffect(() => {
    const plugin = pluginRef.current
    if (!ready || !plugin) return
    plugin.clearMarkers()
    for (const marker of markers) {
      plugin.addMarker({
        id: marker.id,
        polygon: marker.polygon,
        svgStyle: MARKER_STYLE,
      })
    }
  }, [ready, markers])

  return <div ref={containerRef} className={className} />
}
