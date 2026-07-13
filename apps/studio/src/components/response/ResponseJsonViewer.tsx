"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Pretty-print JSON tree with search, expand/collapse, copy-value, and
 * dark/light theme. Designed for large payloads — each row is memoised
 * so unrelated re-renders don't tear the tree down.
 *
 * <p>
 *   The component is fully controlled by `value` and `expandedAll` —
 *   parent decides whether the tree starts open or collapsed, and
 *   flips the flag to toggle all nodes at once via the toolbar.
 * </p>
 */
export function ResponseJsonViewer({
  value,
  expandedAll = true,
  search = "",
  emptyMessage = "Response body is empty.",
}: {
  value: unknown;
  expandedAll?: boolean;
  search?: string;
  emptyMessage?: string;
}): React.ReactElement {
  if (value === undefined || value === null) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-xs italic text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  // Pre-stringify once so the tree can render without re-parsing on
  // every keystroke in the search box.
  const root: JsonNode = React.useMemo(() => wrap(value), [value]);

  if (root.kind === "primitive") {
    return (
      <div className="p-3 font-mono text-xs">
        <PrimitiveRow node={root} path="$" search={search} />
      </div>
    );
  }

  return (
    <div className="p-3 font-mono text-xs leading-relaxed">
      <NodeRow
        node={root}
        path="$"
        depth={0}
        expandedAll={expandedAll}
        search={search}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Node representation                                                  */
/* ------------------------------------------------------------------ */

type JsonNode =
  | { kind: "object"; value: Record<string, JsonNode> }
  | { kind: "array"; value: JsonNode[] }
  | { kind: "primitive"; value: string | number | boolean | null };

function wrap(value: unknown): JsonNode {
  if (value === null) return { kind: "primitive", value: null };
  if (typeof value === "string") return { kind: "primitive", value };
  if (typeof value === "number" || typeof value === "boolean") {
    return { kind: "primitive", value };
  }
  if (Array.isArray(value)) {
    return { kind: "array", value: value.map(wrap) };
  }
  if (typeof value === "object") {
    const out: Record<string, JsonNode> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = wrap(v);
    }
    return { kind: "object", value: out };
  }
  return { kind: "primitive", value: String(value) };
}

/* ------------------------------------------------------------------ */
/* Row rendering                                                        */
/* ------------------------------------------------------------------ */

function NodeRow({
  node,
  path,
  depth,
  expandedAll,
  search,
}: {
  node: JsonNode;
  path: string;
  depth: number;
  expandedAll: boolean;
  search: string;
}): React.ReactElement {
  if (node.kind === "primitive") {
    return (
      <div className="flex items-start gap-2 whitespace-pre-wrap" style={{ paddingLeft: depth * 14 }}>
        <PrimitiveRow node={node} path={path} search={search} />
      </div>
    );
  }

  return (
    <ContainerRow
      node={node}
      path={path}
      depth={depth}
      expandedAll={expandedAll}
      search={search}
    />
  );
}

function ContainerRow({
  node,
  path,
  depth,
  expandedAll,
  search,
}: {
  node: JsonNode;
  path: string;
  depth: number;
  expandedAll: boolean;
  search: string;
}): React.ReactElement {
  const isObject = node.kind === "object";
  const keys = isObject
    ? Object.keys((node as Extract<JsonNode, { kind: "object" }>).value)
    : (node as Extract<JsonNode, { kind: "array" }>).value.map((_, i) => String(i));
  const isEmpty = keys.length === 0;

  // Each container owns its own open state. It seeds from
  // `expandedAll` once and ignores subsequent flips for that specific
  // row (the "expand/collapse all" toolbar overwrites them).
  const [open, setOpen] = React.useState<boolean>(expandedAll && !isEmpty);
  const lastSeedRef = React.useRef(expandedAll);
  React.useEffect(() => {
    if (lastSeedRef.current !== expandedAll) {
      lastSeedRef.current = expandedAll;
      setOpen(expandedAll && !isEmpty);
    }
  }, [expandedAll, isEmpty]);

  const summary = isObject
    ? `{${keys.length} ${keys.length === 1 ? "key" : "keys"}}`
    : `[${keys.length} ${keys.length === 1 ? "item" : "items"}]`;

  const headerMatch = matchesSearch(`${path}`, search);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex items-start gap-1 whitespace-pre-wrap rounded-sm",
          headerMatch && "bg-accent-subtle/60",
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${path}`}
          className={cn(
            "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary",
            isEmpty && "invisible",
          )}
        >
          {open ? (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          )}
        </button>

        <span className="text-text-secondary">{isObject ? "{" : "["}</span>

        {!open && !isEmpty ? (
          <span className="ml-1 text-text-muted">{summary}</span>
        ) : null}

        {open ? null : (
          <span className="ml-1 text-text-secondary">{isObject ? "}" : "]"}</span>
        )}

        <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
          <CopyNodeButton value={stringifyNode(node)} />
        </span>
      </div>

      {open && !isEmpty ? (
        <div className="flex flex-col border-l border-border-subtle" style={{ marginLeft: depth * 14 + 7 }}>
          {keys.map((k, i) => {
            const child = isObject
              ? (node as Extract<JsonNode, { kind: "object" }>).value[k]!
              : (node as Extract<JsonNode, { kind: "array" }>).value[i]!;
            const childPath = isObject ? `${path}.${k}` : `${path}[${i}]`;
            const isLast = i === keys.length - 1;
            return (
              <ChildRow
                key={childPath}
                child={child}
                path={childPath}
                keyName={isObject ? k : i}
                isArrayIndex={!isObject}
                isLast={isLast}
                depth={depth + 1}
                expandedAll={expandedAll}
                search={search}
              />
            );
          })}
        </div>
      ) : null}

      {open && !isEmpty ? (
        <div
          className="text-text-secondary"
          style={{ paddingLeft: depth * 14 }}
        >
          {isObject ? "}" : "]"}
        </div>
      ) : null}
    </div>
  );
}

function ChildRow({
  child,
  path,
  keyName,
  isArrayIndex,
  isLast,
  depth,
  expandedAll,
  search,
}: {
  child: JsonNode;
  path: string;
  keyName: string | number;
  isArrayIndex: boolean;
  isLast: boolean;
  depth: number;
  expandedAll: boolean;
  search: string;
}): React.ReactElement {
  const isContainer = child.kind !== "primitive";
  const labelMatch = isArrayIndex
    ? false
    : matchesSearch(String(keyName), search);
  const separator = isLast ? "" : ",";

  return (
    <div className="flex items-start" style={{ paddingLeft: 0 }}>
      <div className="flex items-start gap-1 whitespace-pre-wrap" style={{ paddingLeft: depth * 14 - depth * 14 }}>
        {isContainer ? null : (
          <span className="inline-block w-4" aria-hidden="true" />
        )}

        {isArrayIndex ? (
          <span className="text-text-muted">{keyName}</span>
        ) : (
          <span className={cn("text-accent", labelMatch && "rounded bg-accent-subtle px-0.5")}>
            {JSON.stringify(String(keyName))}
          </span>
        )}
        <span className="text-text-secondary">: </span>

        {isContainer ? (
          <NodeRow
            node={child}
            path={path}
            depth={depth}
            expandedAll={expandedAll}
            search={search}
          />
        ) : (
          <PrimitiveRow
            node={child as Extract<JsonNode, { kind: "primitive" }>}
            path={path}
            search={search}
          />
        )}

        <span className="text-text-secondary">{separator}</span>
      </div>
    </div>
  );
}

function PrimitiveRow({
  node,
  path,
  search,
}: {
  node: Extract<JsonNode, { kind: "primitive" }>;
  path: string;
  search: string;
}): React.ReactElement {
  const { value } = node;
  const display =
    value === null ? "null" : typeof value === "string" ? JSON.stringify(value) : String(value);
  const match = matchesSearch(display, search) || matchesSearch(path, search);

  const tone =
    value === null
      ? "text-text-muted"
      : typeof value === "string"
        ? "text-status-2xx"
        : typeof value === "number"
          ? "text-status-3xx"
          : "text-status-4xx";

  return (
    <span
      className={cn(
        tone,
        match && "rounded bg-accent-subtle px-0.5",
        "break-all",
      )}
    >
      {display}
      <CopyNodeButton
        value={display}
        className="ml-2 inline-flex opacity-0 transition-opacity group-hover:opacity-100"
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Search highlighting                                                  */
/* ------------------------------------------------------------------ */

function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/* ------------------------------------------------------------------ */
/* Copy button                                                          */
/* ------------------------------------------------------------------ */

function CopyNodeButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}): React.ReactElement | null {
  const [copied, setCopied] = React.useState(false);
  if (value.length === 0) return null;
  return (
    <button
      type="button"
      aria-label="Copy value"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1000);
        } catch {
          // ignore
        }
      }}
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded text-text-muted hover:text-text-primary",
        className,
      )}
    >
      <Copy className="h-3 w-3" aria-hidden="true" />
      {copied ? <span className="sr-only">Copied</span> : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function stringifyNode(node: JsonNode): string {
  if (node.kind === "primitive") {
    if (node.value === null) return "null";
    if (typeof node.value === "string") return node.value;
    return String(node.value);
  }
  try {
    return JSON.stringify(
      node.kind === "array"
        ? node.value.map(stringifyNode)
        : Object.fromEntries(
            Object.entries(node.value).map(([k, v]) => [k, stringifyNode(v)]),
          ),
      null,
      2,
    );
  } catch {
    return "";
  }
}