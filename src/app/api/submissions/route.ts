import { NextResponse } from 'next/server'
import { getFormByEmbedKey } from '@/lib/db/queries/forms'
import { createSubmission } from '@/lib/db/queries/submissions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { embedKey, fields } = body

  if (!embedKey || !fields) {
    return NextResponse.json({ error: 'embedKey and fields required' }, { status: 400, headers: corsHeaders })
  }

  const form = await getFormByEmbedKey(embedKey)
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: corsHeaders })
  }
  if (form.status !== 'published') {
    return NextResponse.json({ error: 'Form not published' }, { status: 403, headers: corsHeaders })
  }

  // Create submission log entry (no field data stored)
  const submissionId = await createSubmission(form.id)

  // TODO: Phase 5 - dispatch webhooks here with the field data

  // Return redirect URL
  return NextResponse.json({
    ok: true,
    submissionId,
    redirectUrl: form.confirmationRedirectUrl || null,
  }, { headers: corsHeaders })
}
