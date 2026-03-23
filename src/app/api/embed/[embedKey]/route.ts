import { NextResponse } from 'next/server'
import { getFormByEmbedKey } from '@/lib/db/queries/forms'
import { getClient } from '@/lib/db/queries/clients'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(_req: Request, { params }: { params: Promise<{ embedKey: string }> }) {
  const { embedKey } = await params

  const form = await getFormByEmbedKey(embedKey)
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404, headers: corsHeaders })
  }
  if (form.status !== 'published') {
    return NextResponse.json({ error: 'Form not published' }, { status: 403, headers: corsHeaders })
  }

  const client = await getClient(form.clientId)

  // Return only what the embed needs
  const response = {
    embedKey: form.embedKey,
    name: form.name,
    client: client?.slug || '',
    definition: form.definition ? JSON.parse(form.definition) : null,
    confirmationRedirectUrl: form.confirmationRedirectUrl,
    styleConfig: form.styleConfig ? JSON.parse(form.styleConfig) : null,
  }

  return NextResponse.json(response, { headers: corsHeaders })
}
