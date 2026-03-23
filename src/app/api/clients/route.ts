import { NextResponse } from 'next/server'
import { getClients, createClient } from '@/lib/db/queries/clients'

export async function GET() {
  const data = await getClients()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  }
  const client = await createClient(body)
  return NextResponse.json(client, { status: 201 })
}
