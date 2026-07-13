"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  Code2,
  Cookie,
  FileText,
  KeyRound,
  LayoutGrid,
  ListTree,
  Send,
  Settings2,
} from "lucide-react";

import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type RequestTabId =
  | "overview"
  | "auth"
  | "path"
  | "query"
  | "headers"
  | "cookies"
  | "body"
  | "examples"
  | "response";

/**
 * Strip of tabs that switches between the request-editor sub-panels
 * (Overview, Authorization, Path Params, Query, Headers, Cookies, Body,
 * Examples). The panel below the strip is rendered by the caller — see
 * {@link RequestEditor}.
 */
export function RequestTabs({
  value,
  onChange,
  counts,
  disabled,
}: {
  value: RequestTabId;
  onChange: (next: RequestTabId) => void;
  counts?: Partial<Record<RequestTabId, number>>;
  disabled?: Partial<Record<RequestTabId, boolean>>;
}): React.ReactElement {
  return (
    <Tabs
      items={[
        {
          id: "overview",
          label: (
            <TabLabel icon={<LayoutGrid className="h-3.5 w-3.5" />}>
              Overview
            </TabLabel>
          ),
          disabled: disabled?.overview,
        },
        {
          id: "auth",
          label: (
            <TabLabel icon={<KeyRound className="h-3.5 w-3.5" />}>
              Authorization
            </TabLabel>
          ),
          disabled: disabled?.auth,
        },
        {
          id: "path",
          label: (
            <TabLabel icon={<Code2 className="h-3.5 w-3.5" />}>
              Path Params
            </TabLabel>
          ),
          badge: counts?.path !== undefined ? <CountChip count={counts.path} /> : undefined,
          disabled: disabled?.path,
        },
        {
          id: "query",
          label: (
            <TabLabel icon={<ListTree className="h-3.5 w-3.5" />}>
              Query
            </TabLabel>
          ),
          badge: counts?.query !== undefined ? <CountChip count={counts.query} /> : undefined,
          disabled: disabled?.query,
        },
        {
          id: "headers",
          label: (
            <TabLabel icon={<Settings2 className="h-3.5 w-3.5" />}>
              Headers
            </TabLabel>
          ),
          badge: counts?.headers !== undefined ? <CountChip count={counts.headers} /> : undefined,
          disabled: disabled?.headers,
        },
        {
          id: "cookies",
          label: (
            <TabLabel icon={<Cookie className="h-3.5 w-3.5" />}>
              Cookies
            </TabLabel>
          ),
          badge: counts?.cookies !== undefined ? <CountChip count={counts.cookies} /> : undefined,
          disabled: disabled?.cookies,
        },
        {
          id: "body",
          label: (
            <TabLabel icon={<FileText className="h-3.5 w-3.5" />}>
              Body
            </TabLabel>
          ),
          disabled: disabled?.body,
        },
        {
          id: "examples",
          label: (
            <TabLabel icon={<Send className="h-3.5 w-3.5" />}>
              Examples
            </TabLabel>
          ),
          disabled: disabled?.examples,
        },
        {
          id: "response",
          label: (
            <TabLabel icon={<ArrowDownToLine className="h-3.5 w-3.5" />}>
              Response
            </TabLabel>
          ),
          disabled: disabled?.response,
        },
      ]}
      value={value}
      onChange={(id) => onChange(id as RequestTabId)}
    />
  );
}

function TabLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-text-muted">{icon}</span>
      {children}
    </span>
  );
}

function CountChip({ count }: { count: number }): React.ReactElement {
  return (
    <Badge
      tone={count > 0 ? "accent" : "subtle"}
      size="xs"
      className={cn("font-mono", count === 0 && "opacity-60")}
    >
      {count}
    </Badge>
  );
}