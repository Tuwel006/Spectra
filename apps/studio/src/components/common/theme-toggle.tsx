"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

const OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

type ThemeId = (typeof OPTIONS)[number]["id"];

/**
 * Tri-state theme switcher (light / dark / system).
 *
 * Uses `next-themes` so the preference is persisted across reloads.
 * The first render is suppressed to avoid SSR/CSR hydration mismatches.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center rounded-md border border-border bg-bg-muted p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = mounted && theme === option.id;
        const Icon = option.icon;
        return (
          <Tooltip key={option.id} content={option.label}>
            <button
              type="button"
              aria-label={option.label}
              aria-pressed={active}
              onClick={() => setTheme(option.id)}
              className={cn(
                "inline-flex h-6 w-7 items-center justify-center rounded transition-colors",
                active
                  ? "bg-bg-base text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}