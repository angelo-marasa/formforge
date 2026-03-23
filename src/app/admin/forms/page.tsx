'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/admin/top-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormFormDialog } from '@/components/admin/form-form-dialog'

interface Form {
  id: string
  name: string
  slug: string
  clientId: string
  status: string
  embedKey: string
  confirmationRedirectUrl: string | null
  webhooks: string | null
}

interface Client { id: string; name: string }

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [clients, setClients] = useState<Client[]>([])

  async function load() {
    const [f, c] = await Promise.all([
      fetch('/api/forms').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ])
    setForms(f)
    setClients(c)
  }

  useEffect(() => { load() }, [])

  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name || 'Unknown'
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this form?')) return
    await fetch(`/api/forms/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <TopBar title="Forms">
        <FormFormDialog
          trigger={<Button size="sm">New Form</Button>}
          onSave={load}
        />
      </TopBar>
      <div className="flex-1 p-6">
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Embed Key</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{f.name}</td>
                  <td className="p-3 text-muted-foreground">{clientName(f.clientId)}</td>
                  <td className="p-3">
                    <Badge variant={f.status === 'published' ? 'default' : 'secondary'}>
                      {f.status}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{f.embedKey}</td>
                  <td className="p-3 text-right space-x-2">
                    <Link href={`/admin/forms/${f.id}/builder`}>
                      <Button variant="outline" size="sm">Build</Button>
                    </Link>
                    <FormFormDialog
                      form={f}
                      trigger={<Button variant="outline" size="sm">Edit</Button>}
                      onSave={load}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(f.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No forms yet. Create your first one.
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
