"use client"

import { useState, useEffect } from "react"
import { type User, UserRole } from "@db/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components"
import { MoreHorizontal, Shield, ShieldCheck, Eye, Edit } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface UserWithoutPassword extends Omit<User, "passwordHash"> {}

export function UsersTable() {
  const [users, setUsers] = useState<UserWithoutPassword[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast.success("User role updated successfully")
        fetchUsers()
      } else {
        toast.error("Failed to update user role")
      }
    } catch (error) {
      toast.error("Failed to update user role")
    }
  }

  const resetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Password reset. New password: ${data.newPassword}`)
      } else {
        toast.error("Failed to reset password")
      }
    } catch (error) {
      toast.error("Failed to reset password")
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <ShieldCheck className="h-4 w-4" />
      case UserRole.MANAGER:
        return <Shield className="h-4 w-4" />
      case UserRole.CONTRIBUTOR:
        return <Edit className="h-4 w-4" />
      case UserRole.VIEWER:
        return <Eye className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "destructive"
      case UserRole.MANAGER:
        return "default"
      case UserRole.CONTRIBUTOR:
        return "secondary"
      case UserRole.VIEWER:
        return "outline"
    }
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name || "—"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleColor(user.role)} className="flex items-center gap-1 w-fit">
                  {getRoleIcon(user.role)}
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateUserRole(user.id, UserRole.ADMIN)}>
                      Set as Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateUserRole(user.id, UserRole.MANAGER)}>
                      Set as Manager
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateUserRole(user.id, UserRole.CONTRIBUTOR)}>
                      Set as Contributor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateUserRole(user.id, UserRole.VIEWER)}>
                      Set as Viewer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => resetPassword(user.id)}>Reset Password</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
