export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
  ALL: "ALL",
  TRACE: "TRACE",
  CONNECT: "CONNECT",
} as const;

export type HttpMethod =
  (typeof HttpMethod)[keyof typeof HttpMethod];