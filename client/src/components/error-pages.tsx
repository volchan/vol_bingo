import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Home, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface BaseErrorPageProps {
  title: string
  description: string
  statusCode?: number
  icon: React.ReactNode
  showHomeButton?: boolean
  showRefreshButton?: boolean
  customActions?: React.ReactNode
}

function BaseErrorPage({
  title,
  description,
  statusCode,
  icon,
  showHomeButton = true,
  showRefreshButton = false,
  customActions,
}: BaseErrorPageProps) {
  const navigate = useNavigate()

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">{icon}</div>
          </div>
          <CardTitle className="text-2xl">
            {statusCode && (
              <span className="text-muted-foreground mr-2">{statusCode}</span>
            )}
            {title}
          </CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {customActions && <div className="pb-3">{customActions}</div>}
          <div className="flex flex-col gap-2">
            {showRefreshButton && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            {showHomeButton && (
              <Button onClick={handleGoHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function NotFoundError() {
  return (
    <BaseErrorPage
      statusCode={404}
      title="Page Not Found"
      description="The page you're looking for doesn't exist. It might have been moved or deleted."
      icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
      showHomeButton={true}
    />
  )
}

export function ServerError({ error }: { error?: Error }) {
  return (
    <BaseErrorPage
      statusCode={500}
      title="Server Error"
      description={
        error?.message ||
        "Something went wrong on our end. We're working to fix it."
      }
      icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
      showHomeButton={true}
      showRefreshButton={true}
    />
  )
}

export function NetworkError() {
  return (
    <BaseErrorPage
      title="Network Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      icon={<WifiOff className="w-8 h-8 text-destructive" />}
      showRefreshButton={true}
    />
  )
}

export function UnauthorizedError() {
  return (
    <BaseErrorPage
      statusCode={401}
      title="Unauthorized"
      description="You need to sign in to access this page."
      icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
      customActions={
        <Button asChild className="w-full">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Sign In
          </Link>
        </Button>
      }
    />
  )
}

export function ForbiddenError() {
  return (
    <BaseErrorPage
      statusCode={403}
      title="Access Denied"
      description="You don't have permission to access this resource."
      icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
      showHomeButton={true}
    />
  )
}

export function GameNotFoundError({ gameId }: { gameId?: string }) {
  return (
    <BaseErrorPage
      title="Game Not Found"
      description={
        gameId
          ? `The game with ID "${gameId}" could not be found. It might have been deleted or the ID is incorrect.`
          : "The game you're looking for could not be found."
      }
      icon={<AlertTriangle className="w-8 h-8 text-destructive" />}
      showHomeButton={true}
      customActions={
        <Button asChild variant="outline" className="w-full">
          <Link to="/dashboard">View My Games</Link>
        </Button>
      }
    />
  )
}

export function ConnectionError() {
  return (
    <BaseErrorPage
      title="Connection Lost"
      description="The connection to the game server has been lost. Please check your internet connection."
      icon={<WifiOff className="w-8 h-8 text-destructive" />}
      showRefreshButton={true}
      customActions={
        <div className="text-center">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Wifi className="w-4 h-4 mr-1" />
            <span>Attempting to reconnect...</span>
          </div>
        </div>
      }
    />
  )
}

export function MaintenanceError() {
  return (
    <BaseErrorPage
      title="Under Maintenance"
      description="We're currently performing scheduled maintenance. Please try again in a few minutes."
      icon={<AlertTriangle className="w-8 h-8 text-warning" />}
      showRefreshButton={true}
    />
  )
}
