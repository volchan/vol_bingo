import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import {
  ForbiddenError,
  ServerError,
  UnauthorizedError,
} from '@/components/error-pages'
import { LoadingPage } from '@/components/loading'
import type { RouterContext } from '@/contexts/router-context'
import { getErrorType } from '@/lib/error-utils'
import { NotFound } from '@/pages/NotFound'

export const Route = createRootRoute({
  component: RootComponent,
  context: (): RouterContext => ({
    authentication: {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: () => {},
      logout: async () => {},
      refetch: () => {},
    },
  }),
  notFoundComponent: NotFound,
  pendingComponent: () => <LoadingPage message="Loading page..." />,
  errorComponent: ({ error }) => {
    const errorType = getErrorType(error)

    switch (errorType) {
      case 'not-found':
        return <NotFound />
      case 'unauthorized':
        return <UnauthorizedError />
      case 'forbidden':
        return <ForbiddenError />
      default:
        return <ServerError error={error} />
    }
  },
})

function RootComponent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingPage />}>
        <Outlet />
      </Suspense>
      {import.meta.env.VITE_APP_ENV && (
        <>
          <ReactQueryDevtools initialIsOpen={false} position="right" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      )}
    </ErrorBoundary>
  )
}
