import { Hono } from 'hono'

import auth from './auth.routes'

const app = new Hono()

const routes = app.route('/auth', auth)

export type AppType = typeof routes
export default app
