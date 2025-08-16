import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DashboardFormSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateGame } from '@/hooks/api/games.hooks'

export default function NewGameForm() {
	const FormSchema = z.object({
		title: z.string().min(10, {
			message: 'Username must be at least 10 characters.',
		}),
	})

	const form = useForm({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			title: '',
		},
	})

	const createGameMutation = useCreateGame()

	function onSubmitForm(data: z.infer<typeof FormSchema>) {
		createGameMutation.mutate(
			{ title: data.title },
			{
				onSuccess: (newGame) => {
					// Handle success - maybe show a toast notification
					console.log('Game created successfully:', newGame)
					form.reset() // Reset the form
				},
				onError: (error) => {
					// Handle error - maybe show an error toast
					console.error('Failed to create game:', error)
				},
			},
		)
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
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										placeholder="Enter a name for the Bingo game"
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" disabled={createGameMutation.isPending}>
						{createGameMutation.isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Creating the game
							</>
						) : (
							<>
								<Plus className="h-4 w-4" />
								Create a new game
							</>
						)}
					</Button>
				</form>
			</Form>
		</Suspense>
	)
}
