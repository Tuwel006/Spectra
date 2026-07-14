export const ParameterLocation = {
  PATH: "path",
  QUERY: "query",
  HEADER: "header",
  COOKIE: "cookie",
} as const;

export type ParameterLocation =
  (typeof ParameterLocation)[keyof typeof ParameterLocation];