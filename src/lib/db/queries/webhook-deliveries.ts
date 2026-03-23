import { db } from '@/lib/db'
import { webhookDeliveries } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export async function getDeliveriesForSubmission(submissionId: string) {
  return db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.submissionLogId, submissionId))
}

export async function getFailedDeliveries(maxRetries = 3) {
  return db
    .select()
    .from(webhookDeliveries)
    .where(and(eq(webhookDeliveries.success, false), lt(webhookDeliveries.retryCount, maxRetries)))
}

export async function updateDelivery(
  id: string,
  data: {
    responseStatusCode?: number | null
    success?: boolean
    retryCount?: number
    errorMessage?: string | null
    deliveredAt?: Date
  }
) {
  await db.update(webhookDeliveries).set(data).where(eq(webhookDeliveries.id, id))
}
