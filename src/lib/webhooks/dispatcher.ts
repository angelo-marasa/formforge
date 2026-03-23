import { db } from '@/lib/db'
import { webhookDeliveries } from '@/lib/db/schema'
import { ulid } from 'ulid'

interface WebhookPayload {
  form_id: string
  form_name: string
  client: string
  submitted_at: string
  fields: Record<string, unknown>
}

async function fetchWithRetry(
  url: string,
  payload: string,
  maxRetries = 3
): Promise<{ status: number; ok: boolean; retryCount: number; error?: string }> {
  const delays = [0, 1000, 3000]
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, delays[attempt]))
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) return { status: response.status, ok: true, retryCount: attempt }
      if (attempt === maxRetries - 1)
        return { status: response.status, ok: false, retryCount: attempt, error: `HTTP ${response.status}` }
    } catch (error: unknown) {
      if (attempt === maxRetries - 1) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { status: 0, ok: false, retryCount: attempt, error: message }
      }
    }
  }
  return { status: 0, ok: false, retryCount: maxRetries - 1, error: 'Max retries exceeded' }
}

export async function dispatchWebhooks(
  submissionId: string,
  webhookUrls: string[],
  payload: WebhookPayload
) {
  const body = JSON.stringify(payload)

  const results = await Promise.allSettled(
    webhookUrls.map(async (url) => {
      const deliveryId = ulid()
      const result = await fetchWithRetry(url, body)

      await db.insert(webhookDeliveries).values({
        id: deliveryId,
        submissionLogId: submissionId,
        webhookUrl: url,
        responseStatusCode: result.status || null,
        success: result.ok,
        retryCount: result.retryCount,
        errorMessage: result.ok ? null : (result.error ?? null),
        deliveredAt: new Date(),
      })

      return { url, success: result.ok, status: result.status, retryCount: result.retryCount }
    })
  )

  return results
}
