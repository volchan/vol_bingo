import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/error-boundary'
import { useAuth } from '@/hooks/use-auth'
import { isApiError, isAuthError } from '@/lib/errors'
import { setQueryUtils } from '@/lib/query-utils'
import { router } from '@/lib/router'
import { AuthProvider } from '@/providers/auth-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isApiError(error) || isAuthError(error)) return false
        return failureCount < 3
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
      throwOnError: (error) => {
        if (isAuthError(error)) {
          localStorage.removeItem('auth_tokens')
          queryClient.removeQueries({ queryKey: ['auth'] })
        }
        return false
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false
        return failureCount < 1
      },
      networkMode: 'offlineFirst',
      onError: (error) => {
        if (isAuthError(error)) {
          localStorage.removeItem('auth_tokens')
          queryClient.removeQueries({ queryKey: ['auth'] })
        }
      },
    },
  },
})

setQueryUtils(queryClient)

function RouterWrapper() {
  const authContext = useAuth()

  return (
    <RouterProvider router={router} context={{ authentication: authContext }} />
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterWrapper />
      </AuthProvider>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
