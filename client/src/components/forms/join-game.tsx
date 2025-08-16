import { zodResolver } from '@hookform/resolvers/zod'
import { Swords } from 'lucide-react'
import { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DashboardFormSkeleton } from '../loading'

export default function JoinGameForm() {
	const FormSchema = z.object({
		gameId: z.string(),
	})

	const form = useForm({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			gameId: '',
		},
	})

	function onSubmitForm(data: z.infer<typeof FormSchema>) {
		console.log('Join game form submitted:', data)
	}

	return (
		<Suspense fallback={<DashboardFormSkeleton />}>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmitForm)}
					className="flex-1 flex flex-col gap-5 p-5 border rounded-lg bg-card"
				>
					<FormField
						control={form.control}
						name="gameId"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										placeholder="Enter the ID of the game to join"
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit">
						<Swords />
						Join an existing game
					</Button>
				</form>
			</Form>
		</Suspense>
	)
}
