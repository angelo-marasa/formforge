'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/admin/top-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormFormDialog } from '@/components/admin/form-form-dialog'

interface Client {
  id: string
  name: string
  slug: string
  webhookDefaults: string | null
}

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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [forms, setForms] = useState<Form[]>([])

  async function load() {
    const [c, f] = await Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()),
      fetch(`/api/forms?clientId=${id}`).then(r => r.json()),
    ])
    setClient(c)
    setForms(f)
  }

  useEffect(() => { load() }, [id])

  async function handleDeleteForm(formId: string) {
    if (!confirm('Delete this form?')) return
    await fetch(`/api/forms/${formId}`, { method: 'DELETE' })
    load()
  }

  if (!client) return null

  return (
    <>
      <TopBar title={client.name}>
        <FormFormDialog
          defaultClientId={id}
          trigger={<Button size="sm">New Form</Button>}
          onSave={load}
        />
      </TopBar>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/clients" className="hover:underline">Clients</Link>
          <span>/</span>
          <span>{client.name}</span>
        </div>

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Form Name</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Embed Key</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{f.name}</td>
                  <td className="p-3">
                    <Badge variant={f.status === 'published' ? 'default' : 'secondary'}>
                      {f.status}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{f.embedKey}</td>
                  <td className="p-3 text-right space-x-2">
                    <Link href={`/admin/forms/${f.id}/logs`}>
                      <Button variant="outline" size="sm">Logs</Button>
                    </Link>
                    <Link href={`/admin/forms/${f.id}/builder`}>
                      <Button variant="outline" size="sm">Build</Button>
                    </Link>
                    <FormFormDialog
                      form={f}
                      trigger={<Button variant="outline" size="sm">Edit</Button>}
                      onSave={load}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteForm(f.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
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
