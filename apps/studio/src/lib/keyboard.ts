import { useEffect } from "react";

/**
 * Bind a global keyboard shortcut. The handler is only invoked when the
 * active element is not an editable element (input, textarea, contenteditable).
 *
 * `combo` follows the cmdk / Monaco convention:
 *  - "mod" → Ctrl on win/linux, Meta on mac
 *  - "shift" → shift
 *  - "alt"  → alt/option
 *  - "k"    → the key
 *
 * Example: useShortcut("mod+k", () => openPalette())
 */
export function useShortcut(combo: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        return;
      }

      if (matchesCombo(event, combo)) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, handler]);
}

function matchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const wantMod = parts.includes("mod") || parts.includes("cmd") || parts.includes("ctrl");
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt");

  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
  const modPressed = isMac ? event.metaKey : event.ctrlKey;

  if (wantMod && !modPressed) return false;
  if (!wantMod && modPressed) return false;
  if (wantShift !== event.shiftKey) return false;
  if (wantAlt !== event.altKey) return false;

  return event.key.toLowerCase() === key;
}