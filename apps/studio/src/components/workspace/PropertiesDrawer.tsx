"use client";

import * as React from "react";
import {
  Activity,
  ChevronRight,
  ChevronLeft,
  Clock,
  Info,
  Layers,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { mockDocumentation } from "@/mock/documentation";
import type { Operation, Schema } from "@spectra/core";

import { readOperationTagsAndAuth } from "./EndpointOverview";

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

/**
 * Right-side drawer that hosts the endpoint metadata, schema properties,
 * and (future) timeline / performance panels.
 *
 * Collapsed: a slim rail with a chevron to expand.
 * Expanded: a fixed-width panel with three sections — Info, Properties,
 * Timeline. The Info and Properties sections are wired today; the
 * Timeline section is a placeholder so the layout language matches
 * once the runtime lands.
 */
export function PropertiesDrawer({
  operation,
  open,
  onToggle,
}: {
  operation: Operation;
  open: boolean;
  onToggle: () => void;
}): React.ReactElement {
  if (!open) {
    return (
      <aside
        className="flex h-full w-9 shrink-0 flex-col items-center justify-start gap-3 border-l border-border bg-bg-subtle py-3"
        aria-label="Properties drawer"
      >
        <Tooltip content="Show Properties" side="left">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show Properties"
            aria-expanded={false}
            onClick={onToggle}
            className="h-7 w-7 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          >
            <Layers className="h-4 w-4" aria-hidden />
          </Button>
        </Tooltip>
        <div
          aria-hidden
          className="w-px flex-1 bg-border"
        />
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full w-[300px] shrink-0 flex-col border-l border-border bg-bg-base"
      aria-label="Properties drawer"
    >
      {/* Drawer header */}
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg-subtle px-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <Layers className="h-3.5 w-3.5" aria-hidden />
          Properties
        </div>
        <Tooltip content="Hide Properties" side="left">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hide Properties"
            aria-expanded={true}
            onClick={onToggle}
            className="h-6 w-6 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          >
            {operation.method === "GET" ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            )}
          </Button>
        </Tooltip>
      </header>

      {/* Drawer body */}
      <div className="flex-1 overflow-y-auto">
        <InfoPanel operation={operation} />
        <PropertiesPanel operation={operation} />
        <TimelinePanel />
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

function PanelHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}): React.ReactElement {
  return (
    <header className="sticky top-0 z-10 flex h-8 items-center gap-1.5 border-b border-border bg-bg-subtle px-3 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
      <span className="text-text-muted">{icon}</span>
      <span>{title}</span>
    </header>
  );
}

function InfoPanel({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const meta = readOperationTagsAndAuth(operation);
  return (
    <section aria-labelledby="drawer-info-title">
      <PanelHeader
        icon={<Info className="h-3 w-3" aria-hidden />}
        title="Info"
      />
      <dl className="flex flex-col gap-3 p-3">
        {operation.summary ? (
          <Field label="Summary">
            <p className="text-[11px] leading-relaxed text-text-primary">
              {operation.summary}
            </p>
          </Field>
        ) : null}
        {operation.description ? (
          <Field label="Description">
            <p className="whitespace-pre-line text-[11px] leading-relaxed text-text-secondary">
              {operation.description}
            </p>
          </Field>
        ) : null}
        {operation.operationId ? (
          <Field label="Operation ID">
            <code className="font-mono text-[11px] text-text-primary">
              {operation.operationId}
            </code>
          </Field>
        ) : null}
        {meta.tags.length > 0 ? (
          <Field label="Tags">
            <div className="flex flex-wrap gap-1">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent-subtle px-1.5 py-0.5 text-[10px] font-medium text-accent"
                >
                  <TagIcon className="h-2.5 w-2.5" aria-hidden />
                  {tag}
                </span>
              ))}
            </div>
          </Field>
        ) : null}
        <Field label="Authentication">
          {meta.security === "BearerAuth" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-method-put">
              <KeyIcon className="h-2.5 w-2.5" aria-hidden />
              Bearer JWT
            </span>
          ) : meta.security === "None" ? (
            <span className="text-[10px] text-text-muted">None</span>
          ) : (
            <span className="text-[10px] text-text-muted">Not specified</span>
          )}
        </Field>
      </dl>
    </section>
  );
}

function PropertiesPanel({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const props = React.useMemo(
    () => collectProperties(operation),
    [operation],
  );
  return (
    <section
      aria-labelledby="drawer-props-title"
      className="mt-2 border-t border-border"
    >
      <PanelHeader
        icon={<Layers className="h-3 w-3" aria-hidden />}
        title="Properties"
      />
      <div className="flex flex-col">
        {props.length === 0 ? (
          <p className="px-3 py-3 text-[11px] italic text-text-muted">
            No properties declared.
          </p>
        ) : (
          props.map((prop) => (
            <PropertyRow key={prop.key} name={prop.key} value={prop.value} />
          ))
        )}
      </div>
    </section>
  );
}

function TimelinePanel(): React.ReactElement {
  return (
    <section
      aria-labelledby="drawer-timeline-title"
      className="mt-2 border-t border-border"
    >
      <PanelHeader
        icon={<Clock className="h-3 w-3" aria-hidden />}
        title="Timeline"
      />
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-bg-subtle">
          <Activity className="h-4 w-4 text-text-muted" aria-hidden />
        </div>
        <p className="text-[11px] leading-relaxed text-text-muted">
          Runtime timeline lands once the executor ships. Connection,
          DNS, TLS, request and response phases will show up here.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Property row                                                        */
/* ------------------------------------------------------------------ */

function PropertyRow({
  name,
  value,
}: {
  name: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-2 border-b border-border px-3 py-2 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {name}
      </span>
      <span className="break-words font-mono text-[11px] text-text-primary">
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Property collection                                                */
/* ------------------------------------------------------------------ */

interface PropRow {
  readonly key: string;
  readonly value: string;
}

/**
 * Walk the operation + the bundled `Info` block and surface a flat
 * list of (key, value) rows for the right-hand drawer. Values that
 * are nested objects are flattened to their string form.
 *
 * Keys are namespaced so the Info and Operation blocks never collide
 * (both have a `description` / `version` field).
 */
function collectProperties(operation: Operation): readonly PropRow[] {
  const rows: PropRow[] = [];
  const info = mockDocumentation.info;
  const push = (
    namespace: "api" | "operation",
    key: string,
    value: unknown,
  ): void => {
    if (value === undefined || value === null) return;
    const displayKey = namespace === "api" ? `api.${key}` : key;
    if (typeof value === "object") {
      try {
        rows.push({ key: displayKey, value: JSON.stringify(value) });
      } catch {
        /* ignore non-serialisable values */
      }
      return;
    }
    rows.push({ key: displayKey, value: String(value) });
  };

  push("api", "title", info.title);
  push("api", "version", info.version);
  push("api", "description", info.description);
  if (info.contact) push("api", "contact", info.contact);
  if (info.license) push("api", "license", info.license);
  if (info.termsOfService) push("api", "termsOfService", info.termsOfService);

  push("operation", "method", operation.method);
  if (operation.operationId)
    push("operation", "operationId", operation.operationId);
  if (operation.summary) push("operation", "summary", operation.summary);
  if (operation.description)
    push("operation", "description", operation.description);

  return rows;
}

/* ------------------------------------------------------------------ */
/* Inline icons                                                        */
/* ------------------------------------------------------------------ */

function TagIcon({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}

function KeyIcon({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3" />
    </svg>
  );
}