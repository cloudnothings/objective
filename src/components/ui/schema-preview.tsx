"use client"

import { useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface SchemaPreviewProps {
  schema: string
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(schema)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <div className="bg-[#1e1e1e] rounded border overflow-hidden">
        <div className="flex justify-between items-center bg-[#2d2d30] px-2 py-1 border-b border-gray-600">
          <span className="text-xs font-mono text-gray-300"></span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-6 w-6 text-gray-300 hover:text-white"
            disabled={copied}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span className="sr-only">Copy schema</span>
          </Button>
        </div>
        <div className="max-h-32 overflow-y-auto custom-scrollbar">
          <SyntaxHighlighter
            language="javascript"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "8px",
              background: "transparent",
              fontSize: "11px",
              lineHeight: "16px",
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              },
            }}
          >
            {schema}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}
