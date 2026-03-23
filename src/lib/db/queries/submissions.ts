import { db } from '@/lib/db'
import { submissionLog } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ulid } from 'ulid'

export async function createSubmission(formId: string) {
  const id = ulid()
  await db.insert(submissionLog).values({
    id,
    formId,
    submittedAt: new Date(),
  })
  return id
}

export async function getSubmissions(formId?: string) {
  if (formId) {
    return db.select().from(submissionLog).where(eq(submissionLog.formId, formId)).orderBy(desc(submissionLog.submittedAt))
  }
  return db.select().from(submissionLog).orderBy(desc(submissionLog.submittedAt))
}
