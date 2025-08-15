import { jwtAuth } from '@server/middlewares/jwtAuth'
import { Hono } from 'hono'

const router = new Hono()

router.use('/*', jwtAuth)

router.get('/', (c) => {
	return c.json({ message: 'Welcome to the Games API' })
})

export default router
