import { jwtAuth } from '@server/middlewares/jwt-auth'
import { Hono } from 'hono'

const app = new Hono()

app.use('/*', jwtAuth)

app.get('/', (c) => {
	return c.json({ message: 'Welcome to the Games API' })
})

export default app
