/**
 * Combines a normalized controller path with a normalized method path
 * to produce a single composed route path.
 *
 * Rules:
 *   - both empty                                  -> "/"
 *   - empty controller + non-empty method        -> "/<method>"
 *   - non-empty controller + empty method        -> "/<controller>"
 *   - both non-empty                              -> "/<controller>/<method>"
 *
 * Each input segment is first stripped of leading/trailing slashes
 * and any internal empty segments are dropped, so leading-slash and
 * trailing-slash variations compose deterministically:
 *   - "/users/" + "/profile/" -> "/users/profile"
 *   - "users"  + ""           -> "/users"
 *   - ""       + "users/:id"   -> "/users/:id"
 *
 * Parameterized segments (e.g. ":id") are preserved verbatim.
 */
export function composeRoutePath(
    controllerNormalizedPath: string,
    methodNormalizedPath: string,
): string {
    const c = strip(controllerNormalizedPath);
    const m = strip(methodNormalizedPath);
    if (c === "" && m === "") return "/";
    if (c === "") return "/" + m;
    if (m === "") return "/" + c;
    return "/" + c + "/" + m;
}

function strip(s: string): string {
    return s.split("/").filter(p => p.length > 0).join("/");
}