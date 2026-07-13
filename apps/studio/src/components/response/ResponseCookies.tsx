"use client";

import * as React from "react";
import { Cookie } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Placeholder cookies panel. The mock documentation does not currently
 * model `Set-Cookie` headers as first-class cookies, so this view
 * shows an honest empty state instead of fabricated rows.
 *
 * <p>
 *   Once the parser emits cookies, this view gains the same table
 *   shape as {@link ResponseHeaders} (Name / Value / Description /
 *   Flags).
 * </p>
 */
export function ResponseCookies({
  hasHeaders,
}: {
  hasHeaders: boolean;
}): React.ReactElement {
  if (!hasHeaders) {
    return (
      <EmptyState
        icon={<Cookie className="h-5 w-5" aria-hidden="true" />}
        title="No cookies"
        description="Pick a response first to inspect its cookies."
        className="h-full"
      />
    );
  }

  return (
    <ScrollArea className="h-full" orientation="vertical">
      <EmptyState
        icon={<Cookie className="h-5 w-5" aria-hidden="true" />}
        title="No cookies documented"
        description="The selected response has no documented cookies. The Set-Cookie header, if present, lives in the Headers tab."
        className="h-full"
      />
    </ScrollArea>
  );
}