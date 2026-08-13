import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Nav from '../components/Nav'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenGuessr' },
      {
        name: 'description',
        content:
          'Explore user-made 360° panoramas and guess where in the world you are.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/images/site/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/images/site/favicon-16x16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/images/site/apple-touch-icon.png',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <main className="page-wrap px-4 py-24 text-center">
      <p className="island-kicker mb-2">404</p>
      <h1 className="display-title mb-3 text-3xl font-bold text-[var(--sea-ink)]">
        This place doesn’t exist
      </h1>
      <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
        We couldn’t find the page you were looking for.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.16)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
      >
        Back home
      </Link>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <Nav />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-left',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
