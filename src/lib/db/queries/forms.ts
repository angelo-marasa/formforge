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
