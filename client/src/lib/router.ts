import { createRouter } from '@tanstack/react-router'
import type { RouterContext } from '@/contexts/router-context'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  context: {
    authentication: undefined,
  } as RouterContext,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
