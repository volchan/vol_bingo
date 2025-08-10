import { BlockGameIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { createFileRoute } from '@tanstack/react-router'
import { ContentContainer } from '@/components/content-container'
import { TwitchButton } from '@/components/twitch-button'

export const Route = createFileRoute('/login')({
	component: Index
})

function Index() {
	return (
		<ContentContainer>
			<h1 className="scroll-m-20 text-center text-8xl font-extrabold antialiased mb-6 flex items-center justify-center gap-2">
				<HugeiconsIcon size={96} icon={BlockGameIcon} />
				Vol Bingo
			</h1>
			<TwitchButton />
		</ContentContainer>
	)
}
