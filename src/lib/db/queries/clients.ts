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
