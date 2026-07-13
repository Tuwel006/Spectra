"use client";

import { Lock } from "lucide-react";

import { Badge } from "@/components/ui";
import { useTabsStore } from "@/store/tabs-store";

interface AuthorizationPanelProps {
  readonly tabId: string;
}

/**
 * Authorization sub-tab — minimal Bearer-token editor.
 *
 * The actual token is stored on the tab so it can be re-used across
 * sessions and across panels for the same tab.
 */
export function AuthorizationPanel({ tabId }: AuthorizationPanelProps) {
  const tab = useTabsStore((state) =>
    state.tabs.find((current) => current.id === tabId),
  );
  const updateTab = useTabsStore((state) => state.updateTab);

  if (!tab) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-text-muted" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Authorization
        </h2>
        <Badge variant="subtle">Bearer JWT</Badge>
      </div>

      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        Token
        <input
          type="password"
          value={tab.authToken}
          onChange={(event) =>
            updateTab(tab.id, { authToken: event.target.value })
          }
          placeholder="paste JWT here…"
          className="h-9 rounded-md border border-border bg-bg-base px-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>

      <p className="text-xs text-text-muted">
        In production this token would be sent as
        <code className="mx-1 rounded bg-bg-muted px-1.5 py-0.5 font-mono text-[11px]">
          Authorization: Bearer &lt;token&gt;
        </code>
        on every request. The studio runs against a mocked backend, so no
        requests are actually sent.
      </p>
    </div>
  );
}