import { authMiddleware } from '@server/middlewares'
import usersRepository from '@server/repositories/users'
import { Hono } from 'hono'

const app = new Hono()

app.use('*', authMiddleware)

app.get('/games/played', async (c) => {
  const currentUser = c.get('currentUser')
  const playedGames = await usersRepository.getPlayedGames(currentUser.id)

  return c.json(playedGames, 200)
})

// Generate stream integration token (if none exists)
app.post('/stream_integration/generate_token', async (c) => {
  try {
    const currentUser = c.get('currentUser')
    const token = await usersRepository.generateStreamIntegrationToken(
      currentUser.id,
    )

    return c.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('Error generating stream token:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to generate stream token',
      },
      500,
    )
  }
})

// Roll (regenerate) stream integration token
app.post('/stream_integration/roll_token', async (c) => {
  try {
    const currentUser = c.get('currentUser')
    const token = await usersRepository.rollStreamIntegrationToken(
      currentUser.id,
    )

    return c.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('Error rolling stream token:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to roll stream token',
      },
      500,
    )
  }
})

export default app
