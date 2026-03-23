'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/admin/top-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WebhookDelivery {
  id: string
  submissionLogId: string
  webhookUrl: string
  responseStatusCode: number | null
  success: boolean
  retryCount: number
  errorMessage: string | null
  deliveredAt: string | null
}

interface Submission {
  id: string
  formId: string
  submittedAt: string
  deliveries: WebhookDelivery[]
}

interface Form {
  id: string
  name: string
  clientId: string
}

interface Client {
  id: string
  name: string
}

export default function FormLogsPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Form | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const formData = await fetch(`/api/forms/${id}`).then(r => r.json())
      setForm(formData)

      const [clientData, subsData] = await Promise.all([
        fetch(`/api/clients/${formData.clientId}`).then(r => r.json()),
        fetch(`/api/submissions/${id}`).then(r => r.json()),
      ])
      setClient(clientData)
      setSubmissions(subsData)
    }
    load()
  }, [id])

  function toggleRow(submissionId: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(submissionId)) {
        next.delete(submissionId)
      } else {
        next.add(submissionId)
      }
      return next
    })
  }

  function getOverallStatus(deliveries: WebhookDelivery[]) {
    if (deliveries.length === 0) return 'none'
    return deliveries.every(d => d.success) ? 'success' : 'failure'
  }

  if (!form || !client) return null

  return (
    <>
      <TopBar title={`${form.name} - Logs`}>
        <Link href={`/admin/clients/${client.id}`}>
          <Button variant="outline" size="sm">Back to Client</Button>
        </Link>
      </TopBar>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/clients" className="hover:underline">Clients</Link>
          <span>/</span>
          <Link href={`/admin/clients/${client.id}`} className="hover:underline">{client.name}</Link>
          <span>/</span>
          <span>{form.name}</span>
          <span>/</span>
          <span>Logs</span>
        </div>

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium w-8"></th>
                <th className="text-left p-3 font-medium">Submission ID</th>
                <th className="text-left p-3 font-medium">Timestamp</th>
                <th className="text-left p-3 font-medium">Webhooks</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const status = getOverallStatus(s.deliveries)
                const isExpanded = expandedRows.has(s.id)
                return (
                  <tr key={s.id} className="border-b last:border-0 group">
                    <td colSpan={5} className="p-0">
                      <div
                        className="flex cursor-pointer hover:bg-muted/30"
                        onClick={() => toggleRow(s.id)}
                      >
                        <div className="p-3 w-8 text-muted-foreground">
                          {isExpanded ? '\u25BC' : '\u25B6'}
                        </div>
                        <div className="p-3 flex-1 font-mono text-xs">{s.id}</div>
                        <div className="p-3 flex-1">
                          {new Date(s.submittedAt).toLocaleString()}
                        </div>
                        <div className="p-3 flex-1">{s.deliveries.length}</div>
                        <div className="p-3 flex-1">
                          {status === 'success' && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">
                              Success
                            </Badge>
                          )}
                          {status === 'failure' && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                          {status === 'none' && (
                            <Badge variant="secondary">No webhooks</Badge>
                          )}
                        </div>
                      </div>

                      {isExpanded && s.deliveries.length > 0 && (
                        <div className="bg-muted/20 border-t px-6 py-4">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left pb-2 font-medium">Webhook URL</th>
                                <th className="text-left pb-2 font-medium">Status Code</th>
                                <th className="text-left pb-2 font-medium">Retries</th>
                                <th className="text-left pb-2 font-medium">Result</th>
                                <th className="text-left pb-2 font-medium">Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.deliveries.map((d) => (
                                <tr key={d.id} className="border-t border-border/50">
                                  <td className="py-2 pr-4 font-mono break-all max-w-xs">{d.webhookUrl}</td>
                                  <td className="py-2 pr-4">{d.responseStatusCode ?? '-'}</td>
                                  <td className="py-2 pr-4">{d.retryCount}</td>
                                  <td className="py-2 pr-4">
                                    {d.success ? (
                                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">
                                        OK
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">Failed</Badge>
                                    )}
                                  </td>
                                  <td className="py-2 text-destructive">{d.errorMessage ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
