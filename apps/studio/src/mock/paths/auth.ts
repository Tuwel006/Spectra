import {
  ContentType,
  HttpMethod,
  ParameterLocation,
  type ExtensionValue,
  type Header,
  type MediaType,
  type Operation,
  type Parameter,
  type Path,
  type RequestBody,
  type Response,
  type ResponseBody,
} from "@spectra/core";

const NO_BODY: undefined = undefined;

const json = (schemaId: string): MediaType => ({
  contentType: ContentType.JSON,
  schema: { id: schemaId },
});

const form = (schemaId: string): MediaType => ({
  contentType: ContentType.FORM_DATA,
  schema: { id: schemaId },
});

const response = (description: string, schemaId: string): Response => ({
  description,
  headers: [],
  body: {
    content: { "application/json": json(schemaId) },
  },
});

const errorResponse = (description: string): Response => ({
  description,
  headers: [],
  body: {
    content: { "application/json": json("Error") },
  },
});

const validationErrorResponse = (): Response => ({
  description: "The supplied payload failed validation.",
  headers: [],
  body: {
    content: { "application/json": json("ValidationError") },
  },
});

const requestBody = (required: boolean, schemaId: string, ct: ContentType = ContentType.JSON): RequestBody => ({
  required,
  content: {
    [ct]: ct === ContentType.JSON ? json(schemaId) : form(schemaId),
  },
});

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });
const example = (value: ExtensionValue) => ({ "x-example": value });

/* ---------- POST /auth/register ---------- */

const registerOperation: Operation = {
  id: "op-auth-register",
  method: HttpMethod.POST,
  name: "Register customer",
  summary: "Register a new customer account",
  description:
    "Creates a customer account using an email and password and immediately returns a session so the caller can continue without an extra login step.",
  operationId: "registerCustomer",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [
      {
        id: "header-idempotency-key",
        name: "Idempotency-Key",
        description:
          "Optional UUID used to make the request idempotent. Repeating a request with the same key returns the original response.",
        required: false,
        schemaId: "string",
      },
    ],
    body: requestBody(true, "RegisterRequest"),
  },
  responses: {
    "201": {
      description: "Account created and the caller is now authenticated.",
      headers: [
        {
          id: "header-ratelimit-remaining",
          name: "X-RateLimit-Remaining",
          description: "Remaining requests in the current rate-limit window.",
          required: true,
          schemaId: "number",
        },
      ],
      body: {
        content: { "application/json": json("AuthSuccessResponse") },
      },
    },
    "400": errorResponse("The request payload was malformed."),
    "409": errorResponse("An account already exists for this email address."),
    "422": validationErrorResponse(),
    "429": errorResponse("Too many registration attempts. Please slow down."),
    "500": errorResponse("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Authentication"),
    ...security(null),
    ...example({
      request: {
        email: "ada.lovelace@spectra.example.com",
        password: "Correct-Horse-Battery-Staple-42!",
        fullName: "Ada Lovelace",
        acceptsMarketing: true,
      },
      response: {
        session: {
          user: {
            id: "usr_01HZX8K2JM0VKA6B9TRW4F2ZCE",
            email: "ada.lovelace@spectra.example.com",
            fullName: "Ada Lovelace",
            role: "customer",
          },
          tokens: {
            accessToken: "eyJhbGciOiJIUzI1NiIs...",
            refreshToken: "rt_8d1f7a2c9b6e4f10",
            tokenType: "Bearer",
            expiresIn: 3600,
            scope: ["catalog:read", "orders:write"],
          },
        },
        issuedAt: "2026-07-13T09:14:22.118Z",
      },
    }),
  },
};

/* ---------- POST /auth/login ---------- */

const loginOperation: Operation = {
  id: "op-auth-login",
  method: HttpMethod.POST,
  name: "Login",
  summary: "Exchange credentials for an access token",
  description:
    "Authenticates a customer or staff member using an email and password. When `rememberMe` is true the issued refresh token is valid for 30 days.",
  operationId: "login",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [],
    body: requestBody(true, "LoginRequest"),
  },
  responses: {
    "200": response("Authentication succeeded.", "AuthSuccessResponse"),
    "400": errorResponse("The request payload was malformed."),
    "401": errorResponse("Invalid credentials."),
    "422": validationErrorResponse(),
    "429": errorResponse("Too many login attempts. The account is temporarily locked."),
    "500": errorResponse("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Authentication"),
    ...security(null),
    ...example({
      request: {
        email: "ada.lovelace@spectra.example.com",
        password: "Correct-Horse-Battery-Staple-42!",
        rememberMe: true,
        deviceName: "Ada's MacBook Pro",
      },
    }),
  },
};

/* ---------- POST /auth/refresh ---------- */

const refreshOperation: Operation = {
  id: "op-auth-refresh",
  method: HttpMethod.POST,
  name: "Refresh access token",
  summary: "Rotate an expired access token using a refresh token",
  description:
    "Exchanges a valid refresh token for a freshly minted access/refresh token pair. The previous refresh token is invalidated.",
  operationId: "refreshAccessToken",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [],
    body: requestBody(true, "RefreshTokenRequest"),
  },
  responses: {
    "200": response("Tokens rotated successfully.", "TokenPair"),
    "400": errorResponse("The refresh token is missing or malformed."),
    "401": errorResponse("The refresh token is invalid or has been revoked."),
    "500": errorResponse("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Authentication"),
    ...security(null),
  },
};

/* ---------- POST /auth/logout ---------- */

const logoutOperation: Operation = {
  id: "op-auth-logout",
  method: HttpMethod.POST,
  name: "Logout",
  summary: "Revoke the active session",
  description:
    "Invalidates the access token used for the request and revokes all refresh tokens associated with the session.",
  operationId: "logout",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [
      {
        id: "header-authorization",
        name: "Authorization",
        description: "Bearer access token.",
        required: true,
        schemaId: "string",
      },
    ],
    body: NO_BODY,
  },
  responses: {
    "204": {
      description: "Session was revoked. No content is returned.",
      headers: [],
    },
    "401": errorResponse("Missing or invalid access token."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Authentication"),
    ...security("BearerAuth"),
  },
};

/* ---------- POST /auth/password/reset ---------- */

const passwordResetOperation: Operation = {
  id: "op-auth-password-reset",
  method: HttpMethod.POST,
  name: "Request password reset",
  summary: "Send a password reset email",
  description:
    "Triggers an email containing a single-use token that can be exchanged for a new password. Always returns 202 to avoid disclosing whether the email is registered.",
  operationId: "requestPasswordReset",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [],
    body: requestBody(true, "PasswordResetRequest"),
  },
  responses: {
    "202": {
      description: "Reset instructions dispatched if the account exists.",
      headers: [],
    },
    "422": validationErrorResponse(),
    "500": errorResponse("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Authentication"),
    ...security(null),
  },
};

/* ---------- POST /auth/password/reset/confirm ---------- */

const passwordResetConfirmOperation: Operation = {
  id: "op-auth-password-reset-confirm",
  method: HttpMethod.POST,
  name: "Confirm password reset",
  summary: "Finalise a password reset",
  description:
    "Consumes the token delivered by email and replaces the account password. All existing sessions are invalidated.",
  operationId: "confirmPasswordReset",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [],
    body: requestBody(true, "PasswordResetConfirm"),
  },
  responses: {
    "204": {
      description: "Password updated. The caller must log in again.",
      headers: [],
    },
    "400": errorResponse("The token is invalid or has expired."),
    "422": validationErrorResponse(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Authentication"),
    ...security(null),
  },
};

/* ---------- Combined Path entries ---------- */

export const authPaths: readonly Path[] = [
  {
    id: "path-auth-register",
    url: "/auth/register",
    operations: { [HttpMethod.POST]: registerOperation },
  },
  {
    id: "path-auth-login",
    url: "/auth/login",
    operations: { [HttpMethod.POST]: loginOperation },
  },
  {
    id: "path-auth-refresh",
    url: "/auth/refresh",
    operations: { [HttpMethod.POST]: refreshOperation },
  },
  {
    id: "path-auth-logout",
    url: "/auth/logout",
    operations: { [HttpMethod.POST]: logoutOperation },
  },
  {
    id: "path-auth-password-reset",
    url: "/auth/password/reset",
    operations: { [HttpMethod.POST]: passwordResetOperation },
  },
  {
    id: "path-auth-password-reset-confirm",
    url: "/auth/password/reset/confirm",
    operations: { [HttpMethod.POST]: passwordResetConfirmOperation },
  },
];