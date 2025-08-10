import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
	routeTree,
	context: {
		authentication: {
			user: null,
			isAuthenticated: false,
			isLoading: true
		}
	}
})

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
)
