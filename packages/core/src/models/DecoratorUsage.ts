import type { BaseNode } from "../common/BaseNode";

/**
 * A single decorator usage entry (guard, pipe, interceptor, filter,
 * etc.) attached to an operation or class.
 *
 * `kind` distinguishes:
 *   - `"custom"`     → a bare class identifier the developer wrote
 *     (e.g. `JwtAuthGuard`).
 *   - `"built-in"`   → a factory call or built-in symbol the developer
 *     used (e.g. `AuthGuard('jwt')` from `@nestjs/passport`).
 *   - `"unknown"`    → anything that does not match the two shapes
 *     above (provider object, complex expression, etc.).
 *
 * `sourceText` preserves the original decorator argument text so the
 * documentation can show exactly what the developer wrote.
 *
 * `parameters` captures the textual arguments of a factory call, in
 * order. For `@UseGuards(AuthGuard('jwt'))` the parameters would be
 * `["'jwt'"]`.
 */
export interface DecoratorUsage extends BaseNode {
    readonly kind: "custom" | "built-in" | "unknown";
    readonly sourceText: string;
    readonly parameters: readonly string[];
}