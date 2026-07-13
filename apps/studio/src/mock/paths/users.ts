import {
  ContentType,
  HttpMethod,
  ParameterLocation,
  type ExtensionValue,
  type MediaType,
  type Operation,
  type Parameter,
  type Path,
  type RequestBody,
  type Response,
} from "@spectra/core";

const json = (schemaId: string): MediaType => ({
  contentType: ContentType.JSON,
  schema: { id: schemaId },
});

const requestBody = (required: boolean, schemaId: string): RequestBody => ({
  required,
  content: {
    [ContentType.JSON]: json(schemaId),
  },
});

const ok = (description: string, schemaId: string): Response => ({
  description,
  headers: [],
  body: { content: { "application/json": json(schemaId) } },
});

const created = (schemaId: string): Response => ({
  description: "Resource created.",
  headers: [],
  body: { content: { "application/json": json(schemaId) } },
});

const noContent = (description: string): Response => ({
  description,
  headers: [],
});

const err = (description: string): Response => ({
  description,
  headers: [],
  body: { content: { "application/json": json("Error") } },
});

const validation = (): Response => ({
  description: "The supplied payload failed validation.",
  headers: [],
  body: { content: { "application/json": json("ValidationError") } },
});

const userIdPathParam: Parameter = {
  id: "param-user-id",
  name: "id",
  description: "Unique identifier of the user.",
  location: ParameterLocation.PATH,
  required: true,
  schemaId: "string",
};

const acceptLanguageHeader = {
  id: "header-accept-language",
  name: "Accept-Language",
  description: "Preferred natural language for the response.",
  required: false,
  schemaId: "string",
};

const authorizationHeader = {
  id: "header-authorization",
  name: "Authorization",
  description: "Bearer access token.",
  required: true,
  schemaId: "string",
};

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });
const example = (value: ExtensionValue) => ({ "x-example": value });

/* ---------- GET /users ---------- */

const listUsersOperation: Operation = {
  id: "op-users-list",
  method: HttpMethod.GET,
  name: "List users",
  summary: "List users",
  description:
    "Returns a paginated list of users. Supports filtering by role and status, searching by email or name, and sorting by created date.",
  operationId: "listUsers",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-users-page",
        name: "page",
        description: "1-based page index.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-users-page-size",
        name: "pageSize",
        description: "Number of items per page. Maximum 100.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-users-search",
        name: "search",
        description: "Free-text search across email and fullName.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-users-role",
        name: "role",
        description: "Filter by user role.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "UserRole",
      },
      {
        id: "param-users-status",
        name: "status",
        description: "Filter by account status.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-users-sort",
        name: "sort",
        description: "Sort expression in the form `field:direction`.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
    ],
    headers: [authorizationHeader, acceptLanguageHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Paged collection of users.", "PageOfUsers"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller is not allowed to list users."),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users", "Administration"),
    ...security("BearerAuth"),
    ...example({
      query: {
        page: 1,
        pageSize: 20,
        search: "ada",
        role: "customer",
        status: "active",
        sort: "createdAt:desc",
      },
    }),
  },
};

/* ---------- POST /users ---------- */

const createUserOperation: Operation = {
  id: "op-users-create",
  method: HttpMethod.POST,
  name: "Create user",
  summary: "Provision a user account",
  description:
    "Administrator-only endpoint that provisions a user account directly without going through the public registration flow.",
  operationId: "createUser",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "CreateUserRequest"),
  },
  responses: {
    "201": created("User"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller is not allowed to create users."),
    "409": err("An account already exists for this email."),
    "422": validation(),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /users/{id} ---------- */

const getUserOperation: Operation = {
  id: "op-users-get",
  method: HttpMethod.GET,
  name: "Get user",
  summary: "Retrieve a single user",
  description: "Returns the full profile for the requested user.",
  operationId: "getUser",
  request: {
    pathParameters: [userIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("User profile retrieved.", "User"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not view this profile."),
    "404": err("No user exists with the supplied identifier."),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users"),
    ...security("BearerAuth"),
  },
};

/* ---------- PATCH /users/{id} ---------- */

const updateUserOperation: Operation = {
  id: "op-users-update",
  method: HttpMethod.PATCH,
  name: "Update user",
  summary: "Partially update a user profile",
  description:
    "Applies a JSON Merge Patch style partial update to the profile. Only the supplied fields are modified.",
  operationId: "updateUser",
  request: {
    pathParameters: [userIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "UpdateUserRequest"),
  },
  responses: {
    "200": ok("Updated user profile.", "User"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not modify this profile."),
    "404": err("No user exists with the supplied identifier."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users"),
    ...security("BearerAuth"),
  },
};

/* ---------- DELETE /users/{id} ---------- */

const deleteUserOperation: Operation = {
  id: "op-users-delete",
  method: HttpMethod.DELETE,
  name: "Delete user",
  summary: "Permanently delete a user account",
  description:
    "Anonymises personal data and revokes all active sessions. Orders and reviews are retained under a tombstone identifier.",
  operationId: "deleteUser",
  request: {
    pathParameters: [userIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("User deleted."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not delete this account."),
    "404": err("No user exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /users/{id}/orders ---------- */

const getUserOrdersOperation: Operation = {
  id: "op-users-orders",
  method: HttpMethod.GET,
  name: "List user orders",
  summary: "List orders placed by a user",
  description:
    "Returns a paginated list of orders owned by the requested user. The caller must either be the user themselves or hold an administrative role.",
  operationId: "listUserOrders",
  request: {
    pathParameters: [userIdPathParam],
    queryParameters: [
      {
        id: "param-users-orders-status",
        name: "status",
        description: "Restrict results to a specific order status.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "OrderStatus",
      },
      {
        id: "param-users-orders-page",
        name: "page",
        description: "1-based page index.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-users-orders-page-size",
        name: "pageSize",
        description: "Number of items per page.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-users-orders-sort",
        name: "sort",
        description: "Sort expression such as `placedAt:desc`.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
    ],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Paged collection of orders.", "PageOfOrders"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not view this user's orders."),
    "404": err("No user exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users", "Orders"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /users/{id}/stats ---------- */

const getUserStatsOperation: Operation = {
  id: "op-users-stats",
  method: HttpMethod.GET,
  name: "Get user statistics",
  summary: "Retrieve aggregated counters for a user",
  description:
    "Returns order counts, lifetime value and engagement metrics for the requested user. Requires administrative privileges.",
  operationId: "getUserStats",
  request: {
    pathParameters: [userIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Aggregated statistics.", "UserStats"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not view statistics for this user."),
    "404": err("No user exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Users", "Administration"),
    ...security("BearerAuth"),
  },
};

export const userPaths: readonly Path[] = [
  {
    id: "path-users",
    url: "/users",
    operations: {
      [HttpMethod.GET]: listUsersOperation,
      [HttpMethod.POST]: createUserOperation,
    },
  },
  {
    id: "path-users-id",
    url: "/users/{id}",
    operations: {
      [HttpMethod.GET]: getUserOperation,
      [HttpMethod.PATCH]: updateUserOperation,
      [HttpMethod.DELETE]: deleteUserOperation,
    },
  },
  {
    id: "path-users-id-orders",
    url: "/users/{id}/orders",
    operations: { [HttpMethod.GET]: getUserOrdersOperation },
  },
  {
    id: "path-users-id-stats",
    url: "/users/{id}/stats",
    operations: { [HttpMethod.GET]: getUserStatsOperation },
  },
];