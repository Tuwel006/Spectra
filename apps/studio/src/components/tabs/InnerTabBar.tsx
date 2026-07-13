"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
  badge?: string | number;
}

interface InnerTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

/**
 * Inner horizontal tab strip used within the endpoint workspace.
 * Different from the outer workspace TabBar — this one shows
 * Overview / Params / Headers / Body / Auth / etc.
 */
export function InnerTabBar({ tabs, activeTab, onTabChange, className }: InnerTabBarProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex h-9 items-end gap-0 border-b border-[--color-border] px-4 overflow-x-auto",
        "bg-[--color-bg-base]",
        className
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex h-9 items-center gap-1.5 px-3 text-xs font-medium",
            "transition-colors select-none cursor-pointer",
            "border-b-2 -mb-px",
            tab.id === activeTab
              ? "border-[--color-accent] text-[--color-text-primary]"
              : "border-transparent text-[--color-text-muted] hover:text-[--color-text-secondary] hover:border-[--color-border-strong]"
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tabular-nums",
                tab.id === activeTab
                  ? "bg-[--color-accent-subtle] text-[--color-accent]"
                  : "bg-[--color-bg-muted] text-[--color-text-muted]"
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
