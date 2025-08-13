import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import type { UserRole } from "@db/client"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export function hasPermission(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole)
}

export function canEditProduct(userRole: string, productCreatorId: string, currentUserId: string): boolean {
  if (["ADMIN", "MANAGER"].includes(userRole)) {
    return true
  }
  if (userRole === "CONTRIBUTOR") {
    return productCreatorId === currentUserId
  }
  return false
}

export function canDeleteProduct(userRole: string): boolean {
  return ["ADMIN", "MANAGER"].includes(userRole)
}

export function canManageUsers(userRole: string): boolean {
  return userRole === "ADMIN"
}

export function canImportProducts(userRole: string): boolean {
  return ["ADMIN", "MANAGER", "CONTRIBUTOR"].includes(userRole)
}

export function canExportProducts(userRole: string): boolean {
  return true // All authenticated users can export
}
