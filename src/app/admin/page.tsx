import { TopBar } from '@/components/admin/top-bar'
import { getClients } from '@/lib/db/queries/clients'
import { getForms } from '@/lib/db/queries/forms'

export default async function AdminDashboard() {
  const clientList = await getClients()
  const formList = await getForms()

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Clients</p>
            <p className="text-3xl font-bold">{clientList.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Forms</p>
            <p className="text-3xl font-bold">{formList.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-3xl font-bold">{formList.filter(f => f.status === 'published').length}</p>
          </div>
        </div>
      </div>
    </>
  )
}
