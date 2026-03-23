'use client'

import { useState } from 'react'
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

interface ClientFormDialogProps {
  client?: { id: string; name: string; slug: string; webhookDefaults: string | null }
  trigger: React.ReactNode
  onSave: () => void
}

export function ClientFormDialog({ client, trigger, onSave }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(client?.name || '')
  const [slug, setSlug] = useState(client?.slug || '')
  const [saving, setSaving] = useState(false)

  const isEdit = !!client

  function autoSlug(value: string) {
    setName(value)
    if (!isEdit) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = isEdit ? `/api/clients/${client.id}` : '/api/clients'
    const method = isEdit ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
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
          <DialogTitle>{isEdit ? 'Edit Client' : 'New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => autoSlug(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
