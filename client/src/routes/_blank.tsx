import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_blank')({
  component: BlankLayout,
})

function BlankLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
