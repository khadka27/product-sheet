import { requireRole } from "@/lib/auth-utils"
import { UserRole } from "@db/client"
import { UsersTable } from "@/components/admin/users-table"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"
import { Button } from "@ui/components"
import { Plus } from "lucide-react"

export default async function UsersPage() {
  await requireRole([UserRole.ADMIN])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <CreateUserDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CreateUserDialog>
      </div>
      <UsersTable />
    </div>
  )
}
