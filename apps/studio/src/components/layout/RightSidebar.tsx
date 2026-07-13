"use client";

import * as React from "react";
import { X, Sparkles, BarChart3, ScrollText, Zap, Shield, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useLayoutStore } from "@/store/layout.store";
import type { EndpointEntry } from "@/types";

const AI_ACTIONS = [
  { icon: Sparkles,     label: "Explain this endpoint" },
  { icon: Zap,          label: "Generate SDK" },
  { icon: ScrollText,   label: "Generate tests" },
  { icon: Shield,       label: "Find potential issues" },
  { icon: TrendingUp,   label: "Suggest improvements" },
  { icon: AlertTriangle, label: "Security analysis" },
  { icon: BarChart3,    label: "Performance analysis" },
];

interface RightSidebarProps {
  activeEndpoint?: EndpointEntry;
}

/**
 * Right sidebar containing the AI Assistant and analytics placeholders.
 * No AI is actually implemented — this is a UI shell for future integration.
 */
export function RightSidebar({ activeEndpoint }: RightSidebarProps) {
  const { toggleRightSidebar } = useLayoutStore();

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-[--color-border] bg-[--color-bg-subtle]">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between px-4 border-b border-[--color-border]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[--color-accent]" />
          <span className="text-xs font-semibold text-[--color-text-secondary]">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleRightSidebar}
          aria-label="Close AI sidebar"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Greeting */}
        <div className="rounded-lg bg-[--color-accent-subtle] border border-[--color-border] p-3">
          <p className="text-xs text-[--color-text-secondary]">
            <span className="font-semibold text-[--color-accent]">AI features</span> are coming soon.
            {activeEndpoint && (
              <> Currently viewing: <span className="font-mono">{activeEndpoint.method} {activeEndpoint.url}</span></>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-wider text-[--color-text-disabled] mb-1 font-semibold">
            Quick Actions
          </p>
          {AI_ACTIONS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-xs text-left",
                "text-[--color-text-secondary] hover:bg-[--color-bg-muted]",
                "hover:text-[--color-text-primary] transition-colors",
                "border border-transparent hover:border-[--color-border]"
              )}
              disabled
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-[--color-accent]" />
              {label}
            </button>
          ))}
        </div>

        {/* Analytics placeholder */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[--color-text-disabled] mb-2 font-semibold">
            Analytics (Last 7 Days)
          </p>
          <div className="rounded-lg border border-[--color-border] p-3 bg-[--color-bg-muted] flex flex-col gap-2.5">
            <AnalyticRow label="Requests" value="12,458" trend="+1.5%" up />
            <AnalyticRow label="Avg. Latency" value="48ms" trend="+0.1%" />
            <AnalyticRow label="Error Rate" value="0.32%" trend="+1.2%" />
            <AnalyticRow label="Success Rate" value="99.68%" trend="+0.0%" up />
          </div>
        </div>

        {/* Recent logs placeholder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-[--color-text-disabled] font-semibold">
              Recent Logs
            </p>
            <button className="text-[10px] text-[--color-accent] hover:underline">
              View all
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { code: "200", method: "GET",  path: "/users/123",  time: "2m ago" },
              { code: "201", method: "POST", path: "/users",      time: "10m ago" },
              { code: "404", method: "GET",  path: "/products/99", time: "15m ago" },
            ].map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded border border-[--color-border] px-2.5 py-1.5 text-[10px] font-mono bg-[--color-bg-base]"
              >
                <span
                  className={cn(
                    "font-bold",
                    log.code.startsWith("2") && "text-green-500",
                    log.code.startsWith("4") && "text-orange-500",
                    log.code.startsWith("5") && "text-red-500"
                  )}
                >
                  {log.code}
                </span>
                <span className="text-[--color-text-muted]">{log.method}</span>
                <span className="flex-1 truncate text-[--color-text-secondary]">{log.path}</span>
                <span className="text-[--color-text-disabled] shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticRow({
  label,
  value,
  trend,
  up,
}: {
  label: string;
  value: string;
  trend: string;
  up?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[--color-text-muted]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[--color-text-primary] tabular-nums">
          {value}
        </span>
        <span className={cn("text-[10px] tabular-nums", up ? "text-green-500" : "text-red-400")}>
          {trend}
        </span>
      </div>
    </div>
  );
}
