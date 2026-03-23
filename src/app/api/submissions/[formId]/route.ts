import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { submissionLog, webhookDeliveries } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(_req: Request, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params

  const submissions = await db.select().from(submissionLog)
    .where(eq(submissionLog.formId, formId))
    .orderBy(desc(submissionLog.submittedAt))
    .limit(100)

  // Get deliveries for each submission
  const results = await Promise.all(
    submissions.map(async (s) => {
      const deliveries = await db.select().from(webhookDeliveries)
        .where(eq(webhookDeliveries.submissionLogId, s.id))
      return { ...s, deliveries }
    })
  )

  return NextResponse.json(results)
}
