import auth from '@server/middlewares/auth'
import { Hono } from 'hono'

const router = new Hono()

router.use('/*', auth)

router.get('/', (c) => {
	return c.json({ message: 'Welcome to the Games API' })
})

export default router
