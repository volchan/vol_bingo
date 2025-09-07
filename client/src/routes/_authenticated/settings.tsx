import { createFileRoute } from '@tanstack/react-router'
import { Settings, Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()

  return (
    <div className="p-4">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your Twitch account informations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={user?.displayName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={user?.login || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
