"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

const THEMES = [
  { value: "light",  Icon: Sun,     label: "Light mode" },
  { value: "dark",   Icon: Moon,    label: "Dark mode" },
  { value: "system", Icon: Monitor, label: "System preference" },
] as const;

/**
 * Cycles through light → dark → system on click.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[1];
  const nextTheme = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const { Icon } = current;

  return (
    <Tooltip content={`Switch to ${nextTheme.label}`} side="bottom">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(nextTheme.value)}
        aria-label={current.label}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
}
