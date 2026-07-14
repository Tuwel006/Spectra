/**
 * A read-only collection where each item is accessed by a unique name.
 *
 * Example:
 * {
 *   User: UserSchema,
 *   Product: ProductSchema
 * }
 */
export type NamedCollection<T> = Readonly<Record<string, T>>;