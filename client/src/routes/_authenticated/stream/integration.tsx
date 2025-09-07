import { createFileRoute } from '@tanstack/react-router'
import {
  Copy,
  Info,
  Link,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  Tv,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRollStreamToken } from '@/hooks/api/users.hooks'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated/stream/integration')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, refetch: refetchUser } = useAuth()
  const [isCopied, setIsCopied] = useState(false)
  const [showRollConfirm, setShowRollConfirm] = useState(false)

  const rollStreamToken = useRollStreamToken()

  const handleRollToken = async () => {
    try {
      await rollStreamToken.mutateAsync()
      refetchUser()
      setShowRollConfirm(false)
    } catch (error) {
      console.error('Failed to roll stream token:', error)
    }
  }

  const handleCopyToken = async () => {
    if (!user?.streamIntegrationToken) return

    try {
      await navigator.clipboard.writeText(user.streamIntegrationToken)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  if (!user) {
    return (
      <div className="p-4">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tv className="h-8 w-8" />
            Stream Integration
          </h1>
          <p className="text-muted-foreground">
            Display your bingo game on stream with real-time updates
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-8 border-2 border-dashed border-muted-foreground/30 mb-4">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Loading User Data</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Please wait while we load your profile information.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Tv className="h-8 w-8" />
          Stream Integration
        </h1>
        <p className="text-muted-foreground">
          Live bingo game display for streaming
        </p>
      </div>

      {/* Stream Integration Token */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Stream Integration Token
          </CardTitle>
          <CardDescription>
            Configure token for stream overlay integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={user.streamIntegrationToken}
                    disabled
                    className="pr-12 font-mono"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <TooltipProvider>
                      <Tooltip open={isCopied}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyToken}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copied to clipboard!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                Use this token to authenticate your stream integration.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="flex item-center gap-2 font-semibold">
                <ShieldAlert />
                Security
              </h4>
              <p className="text-muted-foreground">
                Roll your token to invalidate the current one and generate a new
                one.
              </p>
              <p className="text-destructive font-semibold">
                This will require updating your streaming software with the new
                token.
              </p>
            </div>
            <Dialog open={showRollConfirm} onOpenChange={setShowRollConfirm}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  Roll Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Roll Stream Integration Token</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to roll your stream integration token?
                    This will invalidate the current token and generate a new
                    one. You'll need to update your streaming software with the
                    new token.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRollConfirm(false)}
                    disabled={rollStreamToken.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRollToken}
                    disabled={rollStreamToken.isPending}
                    className="flex items-center gap-2"
                  >
                    {rollStreamToken.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Rolling...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Roll Token
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-6 w-6" />
            Stream Display URL
          </CardTitle>
          <CardDescription>
            Configure token for stream overlay integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="p-3 bg-muted/50 rounded-md border">
              <code className="font-mono break-all">
                {window.location.origin}/stream/display?token=
                {user.streamIntegrationToken}
              </code>
            </div>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/stream/display?token=${user.streamIntegrationToken}`,
                )
              }}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Display URL
            </Button>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-semibold flex item-center gap-2 text-lg">
              <Info /> How to Use
            </h4>
            <div className="text-muted-foreground space-y-1">
              <p>1. Copy the display URL above</p>
              <p>
                2. Add it as a Browser Source in your streaming software (OBS,
                etc.)
              </p>
              <p>
                3. <strong>Recommended resolution:</strong> Set browser source
                to <strong>900x900</strong> pixels for best fit
              </p>
              <p>
                4. Toggle "Display on Stream" for the game you want to show live
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
