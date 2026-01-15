import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

const isDev = import.meta.env.DEV
import appCss from '../styles.css?url'
import { AuthProvider } from '@/lib/supabase'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Spreadsheets-AGI',
      },
      {
        name: 'description',
        content:
          'Suite de productividad impulsada por IA. Crea hojas de cálculo, documentos y presentaciones usando lenguaje natural.',
      },
      {
        property: 'og:title',
        content: 'Spreadsheets-AGI',
      },
      {
        property: 'og:description',
        content:
          'Suite de productividad impulsada por IA. Crea hojas de cálculo, documentos y presentaciones usando lenguaje natural.',
      },
      {
        property: 'og:image',
        content: '/logo.svg', // Idealmente una imagen de 1200x630
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Spreadsheets-AGI',
      },
      {
        name: 'twitter:description',
        content:
          'Suite de productividad impulsada por IA. Crea hojas de cálculo, documentos y presentaciones usando lenguaje natural.',
      },
      {
        name: 'twitter:image',
        content: '/logo.svg',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/logo.svg',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        {isDev && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}

        <Scripts />
      </body>
    </html>
  )
}
