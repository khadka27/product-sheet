import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentActivity } from "@/components/recent-activity"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <DashboardStats />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <RecentActivity className="col-span-4" />
        </div>
      </div>
    </div>
  )
}
