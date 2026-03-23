'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/admin/top-bar'
import { Button } from '@/components/ui/button'
import { ClientFormDialog } from '@/components/admin/client-form-dialog'

interface Client {
  id: string
  name: string
  slug: string
  webhookDefaults: string | null
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])

  async function load() {
    const res = await fetch('/api/clients')
    setClients(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this client and all their forms?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <TopBar title="Clients">
        <ClientFormDialog
          trigger={<Button size="sm">New Client</Button>}
          onSave={load}
        />
      </TopBar>
      <div className="flex-1 p-6">
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Slug</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.slug}</td>
                  <td className="p-3 text-right space-x-2">
                    <ClientFormDialog
                      client={c}
                      trigger={<Button variant="outline" size="sm">Edit</Button>}
                      onSave={load}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">
                    No clients yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
