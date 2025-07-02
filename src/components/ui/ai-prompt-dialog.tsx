"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Sparkles } from "lucide-react"

interface AiPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  placeholder: string
  onGenerate: (prompt: string) => Promise<void>
  isLoading: boolean
}

export function AiPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  onGenerate,
  isLoading,
}: AiPromptDialogProps) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    await onGenerate(prompt.trim())
    setPrompt("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono">{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="ai-prompt" className="text-xs font-mono">
              prompt
            </Label>
            <Input
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              className="text-xs font-mono"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-7 text-xs font-mono"
              disabled={isLoading}
            >
              cancel
            </Button>
            <Button type="submit" className="h-7 text-xs font-mono" disabled={!prompt.trim() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3 w-3" />
                  generate
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
