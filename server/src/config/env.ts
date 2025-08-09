// check if env variables are set
const requiredEnvVars = [
	'APP_URL',
	'APP_PORT',
	'FRONTEND_URL',
	'TWITCH_API_URL',
	'TWITCH_OAUTH_URL',
	'TWITCH_ID',
	'TWITCH_SECRET',
	'TWITCH_REDIRECT_PATH'
]

const missingEnvVars = requiredEnvVars.filter((varName) => !Bun.env[varName])

if (missingEnvVars.length > 0) {
	console.log(`Missing required environment variables:`)
	missingEnvVars.forEach((varName) => console.log(`- ${varName}`))

	process.exit(1)
}

const appUrl = Bun.env.APP_URL!.replace('<port>', String(Bun.env.APP_PORT))
const twitchRedirectUri = Bun.env.TWITCH_REDIRECT_PATH!.replace(
	'<appUrl>',
	appUrl
)

type ENV = {
	APP_URL: string
	APP_PORT: number
	FRONTEND_URL: string
	TWITCH_API_URL: string
	TWITCH_OAUTH_URL: string
	TWITCH_ID: string
	TWITCH_SECRET: string
	TWITCH_REDIRECT_URI: string
	TWITCH_OAUTH_SCOPES: string[]
}

const env: ENV = {
	APP_URL: appUrl!,
	APP_PORT: Number(Bun.env.APP_PORT),

	FRONTEND_URL: Bun.env.FRONTEND_URL!,

	TWITCH_API_URL: Bun.env.TWITCH_API_URL!,
	TWITCH_OAUTH_URL: Bun.env.TWITCH_OAUTH_URL!,
	TWITCH_ID: Bun.env.TWITCH_ID!,
	TWITCH_SECRET: Bun.env.TWITCH_SECRET!,
	TWITCH_REDIRECT_URI: twitchRedirectUri!,
	TWITCH_OAUTH_SCOPES: Bun.env.TWITCH_OAUTH_SCOPES?.split(',') || []
} as const

export default env
