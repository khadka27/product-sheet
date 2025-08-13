import { requireRole } from "@/lib/auth-utils"
import { UserRole } from "@db/client"
import { BrandsTable } from "@/components/brands/brands-table"
import { CreateBrandDialog } from "@/components/brands/create-brand-dialog"
import { Button } from "@ui/components"
import { Plus } from "lucide-react"

export default async function BrandsPage() {
  await requireRole([UserRole.ADMIN, UserRole.MANAGER])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Brands</h2>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <CreateBrandDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </CreateBrandDialog>
      </div>
      <BrandsTable />
    </div>
  )
}
