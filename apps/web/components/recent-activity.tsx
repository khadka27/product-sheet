import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components"

interface RecentActivityProps {
  className?: string
}

export function RecentActivity({ className }: RecentActivityProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest changes to your product catalog</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="flex items-center">
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">New product added: iPhone 15 Pro Max</p>
              <p className="text-sm text-muted-foreground">by admin@example.com • 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">Duplicate detected: Galaxy S24 Ultra</p>
              <p className="text-sm text-muted-foreground">Similar to existing product • 4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">Import completed: Electronics_Q4.xlsx</p>
              <p className="text-sm text-muted-foreground">45 products imported • 1 day ago</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
