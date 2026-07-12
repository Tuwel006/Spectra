export const ContentType = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
  URL_ENCODED: "application/x-www-form-urlencoded",
  TEXT: "text/plain",
  XML: "application/xml",
} as const;

export type ContentType =
  (typeof ContentType)[keyof typeof ContentType];