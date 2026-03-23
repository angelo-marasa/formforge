import { NextResponse } from 'next/server'
import { getClient, updateClient, deleteClient } from '@/lib/db/queries/clients'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const client = await updateClient(id, body)
  return NextResponse.json(client)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteClient(id)
  return NextResponse.json({ ok: true })
}
