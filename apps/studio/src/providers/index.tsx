"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "./theme-provider";

/**
 * Root provider tree.
 *
 * Compose every cross-cutting provider here so that feature code never
 * has to think about wrapping. Add new providers above the children but
 * keep the order outer→inner predictable (theme is the outermost visual
 * concern, then store providers, then feature contexts).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}