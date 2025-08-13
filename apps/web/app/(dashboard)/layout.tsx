import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { MainNav } from "@/components/layout/main-nav"
import { UserNav } from "@/components/layout/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { SessionProvider } from "@/components/providers/session-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="m8 3 4 8 5-5v11H6V3z" />
                </svg>
                <span className="font-bold">Product Catalog</span>
              </div>
            </div>
            <MainNav userRole={session.user.role} />
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </SessionProvider>
  )
}
