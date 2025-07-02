"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface SchemaPreviewProps {
  schema: string
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
  return (
    <div className="relative">
      <div className="bg-[#1e1e1e] rounded border overflow-hidden">
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
