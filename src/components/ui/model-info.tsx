"use client";

import { Badge } from "@/components/ui/badge";
import type { ModelInfo } from "@/lib/cost-utils";
import { formatCost } from "@/lib/cost-utils";

interface ModelInfoDisplayProps {
  model: ModelInfo;
  className?: string;
}

export function ModelInfoDisplay({ model, className = "" }: ModelInfoDisplayProps) {
  return (
    <div className={`space-y-2 text-xs ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {model.id}
        </Badge>
        {model.supports?.reasoning && (
          <Badge variant="default" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Reasoning
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
        <div>
          <span className="font-medium">Input:</span> {formatCost(model.inputCost)}/1M tokens
        </div>
        <div>
          <span className="font-medium">Output:</span> {formatCost(model.outputCost)}/1M tokens
        </div>
        <div>
          <span className="font-medium">Max tokens:</span> {model.maxTokens.toLocaleString()}
        </div>
        <div>
          <span className="font-medium">Max output:</span> {model.maxOutputTokens.toLocaleString()}
        </div>
      </div>

      <div className="text-gray-500 dark:text-gray-400">
        <span className="font-medium">Knowledge cutoff:</span> {model.knowledgeCutoffDate}
      </div>
    </div>
  );
} 