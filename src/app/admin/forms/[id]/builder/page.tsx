import { getForm } from '@/lib/db/queries/forms'
import { getClient } from '@/lib/db/queries/clients'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getForm(id)
  if (!form) notFound()
  const client = await getClient(form.clientId)

  return (
    <div className="flex flex-col h-screen">
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/forms">
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <div>
            <span className="font-semibold">{form.name}</span>
            <span className="text-xs text-muted-foreground ml-2">{client?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Preview</Button>
          <Button variant="outline" size="sm">Save Draft</Button>
          <Button size="sm">Publish</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r bg-muted/20 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Fields</h3>
          <p className="text-sm text-muted-foreground">Field palette goes here (Phase 2)</p>
        </aside>

        <section className="flex-1 bg-muted/5 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center">
              <p className="text-muted-foreground">Form canvas goes here (Phase 2)</p>
              <p className="text-xs text-muted-foreground mt-2">Drag fields from the left panel</p>
            </div>
          </div>
        </section>

        <aside className="w-72 border-l bg-muted/20 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Settings</h3>
          <p className="text-sm text-muted-foreground">Field settings go here (Phase 2)</p>
        </aside>
      </div>
    </div>
  )
}
