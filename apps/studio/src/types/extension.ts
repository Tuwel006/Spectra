/**
 * The Extensions bag on Spectra nodes is open-ended, so the UI sometimes
 * needs to surface a couple of well-known keys in a strongly-typed way.
 *
 * Centralising the lookup means consumers don't have to know the
 * underlying key naming convention used by the mock data.
 */
import type { Extensions, ExtensionValue } from "@spectra/core";

export function readExtension(
  extensions: Extensions | undefined,
  key: string,
): ExtensionValue | undefined {
  return extensions?.[key];
}

export function readTags(extensions: Extensions | undefined): readonly string[] {
  const value = readExtension(extensions, "x-tags");
  return Array.isArray(value) ? (value as string[]) : [];
}

export function readSecurity(extensions: Extensions | undefined): string | null {
  const value = readExtension(extensions, "x-security");
  return typeof value === "string" ? value : null;
}

export function readExample(extensions: Extensions | undefined): unknown {
  return readExtension(extensions, "x-example");
}