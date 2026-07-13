"use client";

import * as React from "react";

import { Workspace } from "@/components/workspace";

/**
 * Centre workspace host. Delegates to {@link Workspace} so the inner
 * layout (header / tabs / content / empty) can evolve without touching
 * the panel coordinate system in `AppLayout`.
 */
export function MainWorkspace(): React.ReactElement {
  return <Workspace />;
}
