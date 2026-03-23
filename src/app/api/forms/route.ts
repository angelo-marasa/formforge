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
