import { TwitchIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'

export function TwitchButton() {
	const { login } = useAuth()

	return (
		<Button
			variant="twitch"
			size="lg"
			onClick={login}
			className="font-semibold flex items-center gap-2"
		>
			<HugeiconsIcon
				icon={TwitchIcon}
				size={64}
				color="currentColor"
				strokeWidth={2}
			/>
			Connect with Twitch
		</Button>
	)
}
