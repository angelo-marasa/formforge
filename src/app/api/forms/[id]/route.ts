import { NextResponse } from 'next/server'
import { getForm, updateForm, deleteForm } from '@/lib/db/queries/forms'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getForm(id)
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(form)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const form = await updateForm(id, body)
  return NextResponse.json(form)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteForm(id)
  return NextResponse.json({ ok: true })
}
