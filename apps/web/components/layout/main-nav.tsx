"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@ui/components"
import { Package, Users, Upload, BarChart3, Settings } from "lucide-react"

interface MainNavProps {
  userRole: string
}

export function MainNav({ userRole }: MainNavProps) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: BarChart3,
      active: pathname === "/",
    },
    {
      href: "/products",
      label: "Products",
      icon: Package,
      active: pathname.startsWith("/products"),
    },
    {
      href: "/imports",
      label: "Imports",
      icon: Upload,
      active: pathname.startsWith("/imports"),
      roles: ["ADMIN", "MANAGER", "CONTRIBUTOR"],
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
      roles: ["ADMIN"],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes
        .filter((route) => !route.roles || route.roles.includes(userRole))
        .map((route) => {
          const Icon = route.icon
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-black dark:text-white" : "text-muted-foreground",
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {route.label}
            </Link>
          )
        })}
    </nav>
  )
}
