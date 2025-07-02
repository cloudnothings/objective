"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GitBranch, RotateCcw } from "lucide-react"

interface Version {
  version: number
  createdAt: Date
}

interface VersionSelectorProps {
  versions: Version[]
  currentVersion: number | null
  hasUnsavedChanges: boolean
  onVersionSelect: (version: number | null) => void
  onRevertToLatest: () => void
}

export function VersionSelector({
  versions,
  currentVersion,
  hasUnsavedChanges,
  onVersionSelect,
  onRevertToLatest,
}: VersionSelectorProps) {
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
  const isWorkingVersion = currentVersion === null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        <GitBranch className="h-3 w-3 text-gray-400" />
        <Select
          value={isWorkingVersion ? "working" : currentVersion?.toString() ?? "1"}
          onValueChange={(value) => {
            if (value === "working") {
              onVersionSelect(null);
            } else {
              const versionNumber = parseInt(value, 10);
              if (!isNaN(versionNumber)) {
                onVersionSelect(versionNumber);
              }
            }
          }}
        >
          <SelectTrigger className="h-6 text-xs font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hasUnsavedChanges && (
              <SelectItem value="working" className="text-xs font-mono">
                <div className="flex items-center gap-1">
                  <span>working</span>
                  <Badge variant="secondary" className="h-3 text-[10px] px-1">
                    *
                  </Badge>
                </div>
              </SelectItem>
            )}
            {sortedVersions.map((version) => (
              <SelectItem key={version.version} className="text-xs font-mono" value={version.version.toString()}>
                v{version.version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasUnsavedChanges && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onRevertToLatest}
          title="Discard changes and revert to selected version"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
} 