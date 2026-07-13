"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Theme provider wrapper around `next-themes`.
 *
 * - Persists the user's preference in `localStorage`.
 * - Honours the system preference on first visit.
 * - Disables transition flashes by deferring the class change.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="spectra-theme"
    >
      {children}
    </NextThemesProvider>
  );
}