import { useRequestDraftStore } from "@/components/request";

/**
 * URL → request-draft sync.
 *
 * <p>Two surfaces in the workspace can hold the URL:</p>
 *   1. The big header URL bar (EndpointHeader.UrlBar).
 *   2. The inner editor URL bar (RequestEditor.RequestHeader).
 *
 * <p>Both must write back into the request draft so the path-param
 * inputs (PathParamsTable) and the live URL (`useEndpointUrl`)
 * stay in sync with whatever URL the user just typed or pasted.</p>
 *
 * <p>The function is best-effort by design — it never throws and
 * silently ignores paths that don't match the template. The
 * invariant is "do no harm": a user typing in the URL bar should
 * not wipe out a row whose value can't be reconstructed.</p>
 */

export function syncUrlToDraft(
  next: string,
  serverUrl: string,
  path: string,
  endpointId: string,
): void {
  const store = useRequestDraftStore.getState();
  const draft = store.drafts[endpointId];
  if (!draft) return;

  const base = stripTrailingSlash(serverUrl);
  let tail = next.startsWith(base) ? next.slice(base.length) : next;

  const qIndex = tail.indexOf("?");
  let typedPath = tail;
  let typedQuery = "";
  if (qIndex >= 0) {
    typedPath = tail.slice(0, qIndex);
    typedQuery = tail.slice(qIndex + 1);
  }

  // Normalise both template and typed paths: collapse repeated
  // slashes so a trailing slash doesn't shift every segment by 1.
  const normalisedTemplate = path
    .split("?")[0]!
    .replace(/\/{2,}/g, "/");
  const normalisedTyped = typedPath.replace(/\/{2,}/g, "/");

  const templateSegs = normalisedTemplate.split("/").filter(Boolean);
  const typedSegs = normalisedTyped.split("/").filter(Boolean);

  // 1. Path params — only update values that match a known token.
  const nextPathParams = [...draft.pathParams];
  for (let i = 0; i < templateSegs.length; i++) {
    const tpl = templateSegs[i]!;
    const m = /^\{([^}]+)\}$/.exec(tpl);
    if (!m) continue;
    const key = m[1]!;
    const value = decode(typedSegs[i] ?? "");
    const idx = nextPathParams.findIndex((r) => r.name === key);
    if (idx >= 0) {
      nextPathParams[idx] = { ...nextPathParams[idx]!, value };
    } else {
      nextPathParams.push({
        id: `pp-${key}`,
        name: key,
        value,
        type: "string",
        required: false,
        enabled: true,
      });
    }
  }
  store.patchDraft(endpointId, "pathParams", nextPathParams);

  // 2. Query params — upsert into the existing list.
  const nextQueryParams = [...draft.queryParams];
  if (typedQuery.length > 0) {
    const pairs = typedQuery.split("&");
    for (const pair of pairs) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const name = eq >= 0 ? decode(pair.slice(0, eq)) : decode(pair);
      const value = eq >= 0 ? decode(pair.slice(eq + 1)) : "";
      const idx = nextQueryParams.findIndex(
        (r) => r.name === name && r.enabled,
      );
      if (idx >= 0) {
        nextQueryParams[idx] = {
          ...nextQueryParams[idx]!,
          value,
          enabled: true,
        };
      } else {
        nextQueryParams.push({
          id: `qp-${name}`,
          name,
          value,
          type: "string",
          required: false,
          enabled: true,
        });
      }
    }
  }
  store.patchDraft(endpointId, "queryParams", nextQueryParams);
}

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}