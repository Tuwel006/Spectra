"use client";

import { mockDocumentation } from "@/mock/documentation";

import type { WorkspaceResourceType, WorkspaceTab } from "./types/Workspace";

/**
 * Open a non-endpoint resource in the workspace.
 *
 * The Explorer's `onEndpointSelect` already knows how to open endpoint
 * tabs (it has method + URL). For everything else (schema / response /
 * parameter / requestBody / example) we have to derive a tab from just
 * the resource id. This helper keeps the call site concise.
 */
export function openResource(
  openTab: (tab: WorkspaceTab) => void,
  input: {
    readonly resourceType: WorkspaceResourceType;
    readonly resourceId: string;
    readonly title: string;
  },
): void {
  openTab({
    id: `tab:${input.resourceType}:${input.resourceId}`,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    title: input.title,
    pinned: false,
    dirty: false,
  });
}

/**
 * Resolve a friendly title for a resource based on the documentation.
 * Falls back to the raw id when nothing better exists.
 */
export function resolveResourceTitle(
  resourceType: WorkspaceResourceType,
  resourceId: string,
): string {
  if (resourceType === "schema") {
    return (
      mockDocumentation.components.schemas[resourceId]?.name ?? resourceId
    );
  }
  return resourceId;
}