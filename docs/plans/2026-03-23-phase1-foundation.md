# Phase 1: Foundation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the FormForge Next.js app with SQLite database, Drizzle ORM, full data model, admin CRUD for clients and forms, and the three-panel layout shell.

**Architecture:** Next.js App Router with server actions for mutations. SQLite via Drizzle ORM for persistence. Tailwind CSS + shadcn/ui for the admin interface. All admin routes under `/admin` with no authentication.

**Tech Stack:** Next.js 15, Drizzle ORM, better-sqlite3, Tailwind CSS, shadcn/ui, ulid

---

### Task 1: Scaffold Next.js App

**Files:**
- Create: `/Users/angelom/apps/formforge/package.json`
- Create: `/Users/angelom/apps/formforge/tsconfig.json`
- Create: `/Users/angelom/apps/formforge/next.config.ts`
- Create: `/Users/angelom/apps/formforge/tailwind.config.ts`
- Create: `/Users/angelom/apps/formforge/src/app/layout.tsx`
- Create: `/Users/angelom/apps/formforge/src/app/page.tsx`

**Step 1: Create the Next.js app**

```bash
cd /Users/angelom/apps/formforge
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Accept defaults. This creates the full scaffold.

**Step 2: Verify it runs**

```bash
cd /Users/angelom/apps/formforge
npm run dev
```

Visit http://localhost:3001 (use port 3001 to avoid conflict with HQ on 3000). Verify the Next.js welcome page loads.

**Step 3: Install shadcn/ui**

```bash
cd /Users/angelom/apps/formforge
npx shadcn@latest init -d
```

**Step 4: Install core dependencies**

```bash
cd /Users/angelom/apps/formforge
npm install drizzle-orm better-sqlite3 ulid
npm install -D drizzle-kit @types/better-sqlite3
```

**Step 5: Set port to 3001 in package.json**

Edit `package.json` scripts:
```json
{
  "dev": "next dev -p 3001",
  "start": "next start -p 3001"
}
```

**Step 6: Initialize git and commit**

```bash
cd /Users/angelom/apps/formforge
git init
echo "node_modules/\n.next/\ndata/" > .gitignore
git add -A
git commit -m "Scaffold Next.js app with Tailwind, shadcn/ui, Drizzle deps"
```

---

### Task 2: Database Schema with Drizzle

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Create: `drizzle.config.ts`

**Step 1: Create the schema file**

Create `src/lib/db/schema.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  webhookDefaults: text('webhook_defaults'), // JSON array of URLs
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const forms = sqliteTable('forms', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  definition: text('definition'), // JSON: pages, fields, conditions
  confirmationRedirectUrl: text('confirmation_redirect_url'),
  webhooks: text('webhooks'), // JSON array of URLs
  embedKey: text('embed_key').notNull().unique(),
  styleConfig: text('style_config'), // JSON: colors, fonts
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const submissionLog = sqliteTable('submission_log', {
  id: text('id').primaryKey(),
  formId: text('form_id').notNull().references(() => forms.id),
  submittedAt: integer('submitted_at', { mode: 'timestamp_ms' }).notNull(),
})

export const webhookDeliveries = sqliteTable('webhook_deliveries', {
  id: text('id').primaryKey(),
  submissionLogId: text('submission_log_id').notNull().references(() => submissionLog.id),
  webhookUrl: text('webhook_url').notNull(),
  responseStatusCode: integer('response_status_code'),
  success: integer('success', { mode: 'boolean' }).notNull().default(false),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
  deliveredAt: integer('delivered_at', { mode: 'timestamp_ms' }),
})
```

**Step 2: Create the database connection**

Create `src/lib/db/index.ts`:

```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'formforge.db')

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
```

**Step 3: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/formforge.db',
  },
})
```

**Step 4: Create data directory and generate migration**

```bash
cd /Users/angelom/apps/formforge
mkdir -p data
npx drizzle-kit generate
npx drizzle-kit push
```

**Step 5: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add Drizzle ORM schema with all four tables"
```

---

### Task 3: Client CRUD - API Routes

**Files:**
- Create: `src/lib/db/queries/clients.ts`
- Create: `src/app/api/clients/route.ts`
- Create: `src/app/api/clients/[id]/route.ts`

**Step 1: Create client query functions**

Create `src/lib/db/queries/clients.ts`:

```typescript
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function getClients() {
  return db.select().from(clients).orderBy(clients.name)
}

export async function getClient(id: string) {
  const result = await db.select().from(clients).where(eq(clients.id, id))
  return result[0] || null
}

export async function createClient(data: {
  name: string
  slug: string
  webhookDefaults?: string[]
}) {
  const now = new Date()
  const id = ulid()
  await db.insert(clients).values({
    id,
    name: data.name,
    slug: data.slug,
    webhookDefaults: data.webhookDefaults ? JSON.stringify(data.webhookDefaults) : null,
    createdAt: now,
    updatedAt: now,
  })
  return getClient(id)
}

export async function updateClient(id: string, data: {
  name?: string
  slug?: string
  webhookDefaults?: string[]
}) {
  await db.update(clients).set({
    ...data,
    webhookDefaults: data.webhookDefaults ? JSON.stringify(data.webhookDefaults) : undefined,
    updatedAt: new Date(),
  }).where(eq(clients.id, id))
  return getClient(id)
}

export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id))
}
```

**Step 2: Create client list/create API route**

Create `src/app/api/clients/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getClients, createClient } from '@/lib/db/queries/clients'

export async function GET() {
  const data = await getClients()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  }
  const client = await createClient(body)
  return NextResponse.json(client, { status: 201 })
}
```

**Step 3: Create client detail API route**

Create `src/app/api/clients/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getClient, updateClient, deleteClient } from '@/lib/db/queries/clients'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const client = await updateClient(id, body)
  return NextResponse.json(client)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteClient(id)
  return NextResponse.json({ ok: true })
}
```

**Step 4: Test with curl**

```bash
# Create a client
curl -s -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"GO Mortgage","slug":"go-mortgage"}' | python3 -m json.tool

# List clients
curl -s http://localhost:3001/api/clients | python3 -m json.tool
```

**Step 5: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add client CRUD API routes and query layer"
```

---

### Task 4: Form CRUD - API Routes

**Files:**
- Create: `src/lib/db/queries/forms.ts`
- Create: `src/app/api/forms/route.ts`
- Create: `src/app/api/forms/[id]/route.ts`

**Step 1: Create form query functions**

Create `src/lib/db/queries/forms.ts`:

```typescript
import { db } from '@/lib/db'
import { forms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

function generateEmbedKey(): string {
  return ulid().toLowerCase().slice(-12)
}

export async function getForms(clientId?: string) {
  if (clientId) {
    return db.select().from(forms).where(eq(forms.clientId, clientId)).orderBy(forms.name)
  }
  return db.select().from(forms).orderBy(forms.name)
}

export async function getForm(id: string) {
  const result = await db.select().from(forms).where(eq(forms.id, id))
  return result[0] || null
}

export async function getFormByEmbedKey(embedKey: string) {
  const result = await db.select().from(forms).where(eq(forms.embedKey, embedKey))
  return result[0] || null
}

export async function createForm(data: {
  clientId: string
  name: string
  slug: string
  confirmationRedirectUrl?: string
  webhooks?: string[]
}) {
  const now = new Date()
  const id = ulid()
  const defaultDefinition = {
    pages: [{ id: 'page_1', title: 'Page 1', rows: [] }],
    fields: {},
    conditions: [],
  }
  await db.insert(forms).values({
    id,
    clientId: data.clientId,
    name: data.name,
    slug: data.slug,
    status: 'draft',
    definition: JSON.stringify(defaultDefinition),
    confirmationRedirectUrl: data.confirmationRedirectUrl || null,
    webhooks: data.webhooks ? JSON.stringify(data.webhooks) : null,
    embedKey: generateEmbedKey(),
    styleConfig: null,
    createdAt: now,
    updatedAt: now,
  })
  return getForm(id)
}

export async function updateForm(id: string, data: {
  name?: string
  slug?: string
  status?: 'draft' | 'published'
  definition?: string
  confirmationRedirectUrl?: string
  webhooks?: string[]
  styleConfig?: string
}) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.status !== undefined) updateData.status = data.status
  if (data.definition !== undefined) updateData.definition = data.definition
  if (data.confirmationRedirectUrl !== undefined) updateData.confirmationRedirectUrl = data.confirmationRedirectUrl
  if (data.webhooks !== undefined) updateData.webhooks = JSON.stringify(data.webhooks)
  if (data.styleConfig !== undefined) updateData.styleConfig = data.styleConfig

  await db.update(forms).set(updateData).where(eq(forms.id, id))
  return getForm(id)
}

export async function deleteForm(id: string) {
  await db.delete(forms).where(eq(forms.id, id))
}
```

**Step 2: Create form list/create API route**

Create `src/app/api/forms/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getForms, createForm } from '@/lib/db/queries/forms'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') || undefined
  const data = await getForms(clientId)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.clientId || !body.name || !body.slug) {
    return NextResponse.json({ error: 'clientId, name, and slug required' }, { status: 400 })
  }
  const form = await createForm(body)
  return NextResponse.json(form, { status: 201 })
}
```

**Step 3: Create form detail API route**

Create `src/app/api/forms/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getForm, updateForm, deleteForm } from '@/lib/db/queries/forms'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getForm(id)
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(form)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const form = await updateForm(id, body)
  return NextResponse.json(form)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteForm(id)
  return NextResponse.json({ ok: true })
}
```

**Step 4: Test with curl**

```bash
# First get a client ID from previous task
CLIENT_ID=$(curl -s http://localhost:3001/api/clients | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")

# Create a form
curl -s -X POST http://localhost:3001/api/forms \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$CLIENT_ID\",\"name\":\"Contact Form\",\"slug\":\"contact-form\"}" | python3 -m json.tool

# List forms
curl -s http://localhost:3001/api/forms | python3 -m json.tool
```

**Step 5: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add form CRUD API routes and query layer"
```

---

### Task 5: Admin Layout - Three Panel Shell

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/top-bar.tsx`

**Step 1: Install shadcn components we need**

```bash
cd /Users/angelom/apps/formforge
npx shadcn@latest add button card input label dialog table badge separator scroll-area
```

**Step 2: Create admin sidebar**

Create `src/components/admin/sidebar.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '~' },
  { href: '/admin/clients', label: 'Clients', icon: '~' },
  { href: '/admin/forms', label: 'Forms', icon: '~' },
  { href: '/admin/logs', label: 'Submission Logs', icon: '~' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold tracking-tight">FormForge</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

**Step 3: Create admin top bar**

Create `src/components/admin/top-bar.tsx`:

```typescript
export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  )
}
```

**Step 4: Create admin layout**

Create `src/app/admin/layout.tsx`:

```typescript
import { Sidebar } from '@/components/admin/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
```

**Step 5: Create admin dashboard page**

Create `src/app/admin/page.tsx`:

```typescript
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
```

**Step 6: Update root page to redirect to admin**

Edit `src/app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/admin')
}
```

**Step 7: Verify in browser**

Visit http://localhost:3001. Should redirect to `/admin` with sidebar, top bar, and stat cards.

**Step 8: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add admin layout with sidebar, top bar, and dashboard page"
```

---

### Task 6: Admin Clients Page - List, Create, Edit, Delete

**Files:**
- Create: `src/app/admin/clients/page.tsx`
- Create: `src/components/admin/client-form-dialog.tsx`

**Step 1: Create client form dialog component**

Create `src/components/admin/client-form-dialog.tsx`:

```typescript
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
```

**Step 2: Create clients page**

Create `src/app/admin/clients/page.tsx`:

```typescript
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
```

**Step 3: Verify in browser**

Visit http://localhost:3001/admin/clients. Create a client, edit it, delete it.

**Step 4: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add clients admin page with list, create, edit, delete"
```

---

### Task 7: Admin Forms Page - List, Create, Edit, Delete

**Files:**
- Create: `src/app/admin/forms/page.tsx`
- Create: `src/components/admin/form-form-dialog.tsx`

**Step 1: Create form dialog component**

Create `src/components/admin/form-form-dialog.tsx`:

```typescript
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
```

**Step 2: Create forms list page**

Create `src/app/admin/forms/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
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
```

**Step 3: Verify in browser**

Visit http://localhost:3001/admin/forms. Create a form for an existing client. Edit it. Delete it.

**Step 4: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add forms admin page with list, create, edit, delete"
```

---

### Task 8: Form Builder Shell Page (Three-Panel)

**Files:**
- Create: `src/app/admin/forms/[id]/builder/page.tsx`

This is the placeholder for Phase 2. Just the three-panel layout with empty panels.

**Step 1: Create the builder page**

Create `src/app/admin/forms/[id]/builder/page.tsx`:

```typescript
import { getForm } from '@/lib/db/queries/forms'
import { getClient } from '@/lib/db/queries/clients'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getForm(id)
  if (!form) notFound()
  const client = await getClient(form.clientId)

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/forms">
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <div>
            <span className="font-semibold">{form.name}</span>
            <span className="text-xs text-muted-foreground ml-2">{client?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Preview</Button>
          <Button variant="outline" size="sm">Save Draft</Button>
          <Button size="sm">Publish</Button>
        </div>
      </header>

      {/* Three panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Field palette */}
        <aside className="w-56 border-r bg-muted/20 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Fields</h3>
          <p className="text-sm text-muted-foreground">Field palette goes here (Phase 2)</p>
        </aside>

        {/* Center: Canvas */}
        <section className="flex-1 bg-muted/5 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center">
              <p className="text-muted-foreground">Form canvas goes here (Phase 2)</p>
              <p className="text-xs text-muted-foreground mt-2">Drag fields from the left panel</p>
            </div>
          </div>
        </section>

        {/* Right: Field settings */}
        <aside className="w-72 border-l bg-muted/20 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Settings</h3>
          <p className="text-sm text-muted-foreground">Field settings go here (Phase 2)</p>
        </aside>
      </div>
    </div>
  )
}
```

**Step 2: Add "Build" button to forms list**

Edit `src/app/admin/forms/page.tsx` actions column. Add before the Edit button:

```typescript
<Link href={`/admin/forms/${f.id}/builder`}>
  <Button variant="outline" size="sm">Build</Button>
</Link>
```

Add `import Link from 'next/link'` at top.

**Step 3: Verify in browser**

Go to forms list, click "Build" on a form. Should see three-panel layout with placeholders.

**Step 4: Commit**

```bash
cd /Users/angelom/apps/formforge
git add -A
git commit -m "Add form builder shell with three-panel layout placeholder"
```

---

## Summary

8 tasks total. After completion you will have:
- Next.js app running on port 3001
- SQLite database with 4 tables via Drizzle ORM
- Full CRUD API for clients and forms
- Admin UI with sidebar navigation, dashboard, clients page, forms page
- Form builder three-panel shell ready for Phase 2 drag-and-drop work
- All committed to git
