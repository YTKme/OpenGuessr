import { useEffect, useRef } from 'react'
import type { Viewer as PsvViewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'

interface PanoramaViewerProps {
  /** URL of the equirectangular panorama, e.g. /images/panoramas/tester.jpg */
  image: string
  className?: string
}

/**
 * Thin, client-only wrapper around @photo-sphere-viewer/core (no React binding
 * library). The engine is dynamically imported inside an effect so it never
 * touches `window`/WebGL during SSR. The viewer instance is created once and
 * reused; only the panorama is swapped when `image` changes.
 */
export default function PanoramaViewer({
  image,
  className,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<PsvViewer | null>(null)

  useEffect(() => {
    const lifecycle = { cancelled: false }
    let viewer: PsvViewer | undefined

    void (async () => {
      const { Viewer } = await import('@photo-sphere-viewer/core')
      if (lifecycle.cancelled || !containerRef.current) return
      viewer = new Viewer({
        container: containerRef.current,
        panorama: image,
        navbar: false,
        loadingTxt: 'Loading panorama…',
        defaultZoomLvl: 5,
      })
      viewerRef.current = viewer
    })()

    return () => {
      lifecycle.cancelled = true
      viewer?.destroy()
      viewerRef.current = null
    }
    // Intentionally run once; panorama swaps are handled by the effect below.
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (viewer) {
      void viewer.setPanorama(image, { showLoader: true }).catch(() => {})
    }
  }, [image])

  return <div ref={containerRef} className={className} />
}
