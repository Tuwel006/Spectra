"use client";

import * as React from "react";
import {
  Code2,
  Cookie,
  FileSearch,
  Gauge,
  Info,
  Sparkles,
} from "lucide-react";

import { Tabs } from "@/components/ui/tabs";
import {
  RESPONSE_INFO_LABEL,
  RESPONSE_INFO_TABS,
  RESPONSE_VIEW_LABEL,
  RESPONSE_VIEW_MODES,
  type ResponseInfoTab,
  type ResponseViewMode,
} from "./response.types";

const VIEW_ICONS: Record<ResponseViewMode, React.ReactNode> = {
  pretty: <Sparkles className="h-3.5 w-3.5" />,
  raw: <Code2 className="h-3.5 w-3.5" />,
  preview: <FileSearch className="h-3.5 w-3.5" />,
  schema: <Info className="h-3.5 w-3.5" />,
  examples: <Sparkles className="h-3.5 w-3.5" />,
};

const INFO_ICONS: Record<ResponseInfoTab, React.ReactNode> = {
  headers: <Code2 className="h-3.5 w-3.5" />,
  cookies: <Cookie className="h-3.5 w-3.5" />,
  metadata: <Info className="h-3.5 w-3.5" />,
  timeline: <Gauge className="h-3.5 w-3.5" />,
};

/**
 * Two strips of tabs:
 *
 *   • The primary strip selects the body view mode (Pretty / Raw /
 *     Preview / Schema / Examples).
 *   • The secondary strip selects the inspector pane (Headers / Cookies
 *     / Metadata / Timeline).
 *
 * Both strips use the design-system `<Tabs>` primitive. They live
 * above the response body and are kept in sync via the
 * {@link useResponseViewerStore}.
 */
export function ResponseTabs({
  viewMode,
  onViewModeChange,
  infoTab,
  onInfoTabChange,
}: {
  viewMode: ResponseViewMode;
  onViewModeChange: (next: ResponseViewMode) => void;
  infoTab: ResponseInfoTab;
  onInfoTabChange: (next: ResponseInfoTab) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-b border-border bg-bg-base">
      <Tabs
        items={RESPONSE_VIEW_MODES.map((m) => ({
          id: m,
          label: (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-text-muted">{VIEW_ICONS[m]}</span>
              {RESPONSE_VIEW_LABEL[m]}
            </span>
          ),
        }))}
        value={viewMode}
        onChange={(id) => onViewModeChange(id as ResponseViewMode)}
      />
      <Tabs
        items={RESPONSE_INFO_TABS.map((t) => ({
          id: t,
          label: (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-text-muted">{INFO_ICONS[t]}</span>
              {RESPONSE_INFO_LABEL[t]}
            </span>
          ),
        }))}
        value={infoTab}
        onChange={(id) => onInfoTabChange(id as ResponseInfoTab)}
      />
    </div>
  );
}