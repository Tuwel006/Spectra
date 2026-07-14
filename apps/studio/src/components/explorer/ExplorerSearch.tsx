import * as React from "react";

import { Input } from "@/components/ui/input";

/**
 * Live search box. Filtering happens in the parent so this component is
 * presentational — the controlled value pattern lets the parent decide
 * what to do with empty strings. Escape clears the query.
 */
export function ExplorerSearch({
  value,
  onChange,
  placeholder = "Search APIs…",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}): React.ReactElement {
  return (
    <div className="border-b border-border bg-bg-subtle px-3 py-2">
      <Input
        type="search"
        variant="search"
        size="sm"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        aria-label="Search APIs"
        onKeyDown={(e) => {
          if (e.key === "Escape" && value.length > 0) {
            e.preventDefault();
            onChange("");
          }
        }}
      />
    </div>
  );
}
