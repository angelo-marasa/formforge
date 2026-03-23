'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Code, Check, Copy } from 'lucide-react'

interface EmbedCodeDialogProps {
  embedKey: string
  formName: string
}

export function EmbedCodeDialog({ embedKey, formName }: EmbedCodeDialogProps) {
  const [copied, setCopied] = useState(false)

  const snippet = `<div id="ff-${embedKey}"></div>\n<script src="https://formforge.io/embed.js" data-form="${embedKey}"></script>`

  function handleCopy() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Code className="h-3 w-3 mr-1" />
        Embed
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Embed Code</DialogTitle>
          <DialogDescription>
            Embed code for {formName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all border select-all">
            {snippet}
          </pre>
          <Button onClick={handleCopy} className="w-full" size="sm">
            {copied ? (
              <><Check className="h-3 w-3 mr-1" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3 mr-1" /> Copy to Clipboard</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Paste this code into your website where you want the form to appear.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
