"use client";

import * as React from "react";
import { Cloud } from "lucide-react";

import { Select } from "@/components/ui/select";
import { useRequestDraftStore } from "./request.store";

const ENV_OPTIONS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "mock", label: "Mock" },
] as const;

type EnvValue = (typeof ENV_OPTIONS)[number]["value"];

/**
 * Environment selector — a static dropdown anchored to the request
 * header. Persists the choice to the request store so the future
 * runtime can swap base URLs accordingly.
 */
export function EnvironmentSelector(): React.ReactElement {
  const env = useRequestDraftStore((s) => s.environment);
  const setEnv = useRequestDraftStore((s) => s.setEnvironment);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-base px-2 text-xs text-text-primary">
      <Cloud className="h-3 w-3 text-text-muted" aria-hidden="true" />
      <Select
        size="sm"
        value={env}
        onChange={(e) => setEnv(e.currentTarget.value as EnvValue)}
        aria-label="Environment"
        className="border-0 bg-transparent pr-6"
        options={ENV_OPTIONS}
      />
    </div>
  );
}