"use client";

import * as React from "react";
import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

/**
 * Empty state for endpoints that declare no responses at all.
 * Used when an operation's `responses` map is empty.
 */
export function ResponseEmpty(): React.ReactElement {
  return (
    <EmptyState
      icon={<Inbox className="h-5 w-5" aria-hidden="true" />}
      title="No responses documented"
      description="This operation does not declare any documented responses in the mock documentation. Once a parser produces one, it will appear here."
      className="h-full"
    />
  );
}