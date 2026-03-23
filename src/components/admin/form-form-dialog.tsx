'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Client { id: string; name: string }

interface FormFormDialogProps {
  form?: { id: string; name: string; slug: string; clientId: string; confirmationRedirectUrl: string | null; webhooks: string | null }
  trigger: React.ReactNode
  onSave: () => void
}

export function FormFormDialog({ form, trigger, onSave }: FormFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState(form?.clientId || '')
  const [name, setName] = useState(form?.name || '')
  const [slug, setSlug] = useState(form?.slug || '')
  const [redirectUrl, setRedirectUrl] = useState(form?.confirmationRedirectUrl || '')
  const [webhooks, setWebhooks] = useState(form?.webhooks ? JSON.parse(form.webhooks).join('\n') : '')
  const [saving, setSaving] = useState(false)

  const isEdit = !!form

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients)
  }, [])

  function autoSlug(value: string) {
    setName(value)
    if (!isEdit) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const webhookArray = webhooks.split('\n').map((w: string) => w.trim()).filter(Boolean)
    const url = isEdit ? `/api/forms/${form.id}` : '/api/forms'
    const method = isEdit ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        name,
        slug,
        confirmationRedirectUrl: redirectUrl || null,
        webhooks: webhookArray.length ? webhookArray : undefined,
      }),
    })
    setSaving(false)
    setOpen(false)
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.JSX.Element} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Form' : 'New Form'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <Label htmlFor="clientId">Client</Label>
              <select
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="formName">Name</Label>
            <Input id="formName" value={name} onChange={(e) => autoSlug(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="formSlug">Slug</Label>
            <Input id="formSlug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="redirectUrl">Confirmation Redirect URL</Label>
            <Input id="redirectUrl" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://example.com/thank-you" />
          </div>
          <div>
            <Label htmlFor="webhooks">Webhook URLs (one per line)</Label>
            <textarea
              id="webhooks"
              value={webhooks}
              onChange={(e) => setWebhooks(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://hooks.zapier.com/..."
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
