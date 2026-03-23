import { NextResponse } from 'next/server'
import { getFormByEmbedKey } from '@/lib/db/queries/forms'
import { getClient } from '@/lib/db/queries/clients'
import { createSubmission } from '@/lib/db/queries/submissions'
import { dispatchWebhooks } from '@/lib/webhooks/dispatcher'

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

  // Resolve webhook URLs: form-level first, then client defaults
  let webhookUrls: string[] = []
  if (form.webhooks) {
    try {
      webhookUrls = JSON.parse(form.webhooks)
    } catch { /* invalid JSON, skip */ }
  }

  if (webhookUrls.length === 0) {
    const client = await getClient(form.clientId)
    if (client?.webhookDefaults) {
      try {
        webhookUrls = JSON.parse(client.webhookDefaults)
      } catch { /* invalid JSON, skip */ }
    }
  }

  // Dispatch webhooks with inline retry (fire-and-forget, don't block response)
  if (webhookUrls.length > 0) {
    const client = await getClient(form.clientId)
    const payload = {
      form_id: form.id,
      form_name: form.name,
      client: client?.slug ?? form.clientId,
      submitted_at: new Date().toISOString(),
      fields,
    }

    // Don't await - dispatch in background so the submitter gets a fast response
    dispatchWebhooks(submissionId, webhookUrls, payload).catch((err) => {
      console.error('Webhook dispatch error:', err)
    })
  }

  // Return redirect URL
  return NextResponse.json({
    ok: true,
    submissionId,
    redirectUrl: form.confirmationRedirectUrl || null,
  }, { headers: corsHeaders })
}
