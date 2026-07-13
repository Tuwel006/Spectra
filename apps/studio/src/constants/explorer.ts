/**
 * Explorer section identifiers.
 *
 * Each identifier corresponds to a top-level panel inside the left sidebar.
 * The constants are kept here (instead of inlined as strings) so the type
 * stays narrow and renames are cheap.
 */
export const ExplorerSection = {
  Endpoints: "endpoints",
  Schemas: "schemas",
  Components: "components",
  Tags: "tags",
  Servers: "servers",
  Favorites: "favorites",
  Recent: "recent",
  Settings: "settings",
} as const;

export type ExplorerSectionId =
  (typeof ExplorerSection)[keyof typeof ExplorerSection];

/**
 * UI-level endpoint sub-tabs (within the workspace centre).
 */
export const EndpointTab = {
  Overview: "overview",
  Parameters: "parameters",
  Headers: "headers",
  Authorization: "authorization",
  Query: "query",
  Body: "body",
  Examples: "examples",
  Responses: "responses",
  Schema: "schema",
  Tests: "tests",
} as const;

export type EndpointTabId = (typeof EndpointTab)[keyof typeof EndpointTab];

/**
 * Right-sidebar (AI) panel identifiers.
 */
export const AiPanel = {
  Analysis: "analysis",
  Suggestions: "suggestions",
  GenerateClient: "generate-client",
  GenerateDocs: "generate-docs",
  GenerateTests: "generate-tests",
  ExplainEndpoint: "explain-endpoint",
  Security: "security",
  Performance: "performance",
  Deprecation: "deprecation",
} as const;

export type AiPanelId = (typeof AiPanel)[keyof typeof AiPanel];