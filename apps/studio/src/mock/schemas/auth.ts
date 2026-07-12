import {
  PrimitiveTypeName,
  TypeKind,
  type ArrayType,
  type PrimitiveType,
  type Property,
  type ReferenceType,
  type Schema,
} from "@spectra/core";

const STRING: PrimitiveType = {
  kind: TypeKind.PRIMITIVE,
  name: PrimitiveTypeName.STRING,
};

const NUMBER: PrimitiveType = {
  kind: TypeKind.PRIMITIVE,
  name: PrimitiveTypeName.NUMBER,
};

const BOOLEAN: PrimitiveType = {
  kind: TypeKind.PRIMITIVE,
  name: PrimitiveTypeName.BOOLEAN,
};

const ref = (id: string): ReferenceType => ({
  kind: TypeKind.REFERENCE,
  reference: { id },
});

const arrayOf = (elementType: PrimitiveType | ReferenceType): ArrayType => ({
  kind: TypeKind.ARRAY,
  elementType,
});

const req = (id: string, name: string, valueType: PrimitiveType | ReferenceType | ArrayType): Property => ({
  id,
  name,
  valueType,
  modifiers: { required: true, readonly: false, nullable: false, deprecated: false },
});

const opt = (id: string, name: string, valueType: PrimitiveType | ReferenceType | ArrayType): Property => ({
  id,
  name,
  valueType,
  modifiers: { required: false, readonly: false, nullable: false, deprecated: false },
});

const optNullable = (id: string, name: string, valueType: PrimitiveType | ReferenceType | ArrayType): Property => ({
  id,
  name,
  valueType,
  modifiers: { required: false, readonly: false, nullable: true, deprecated: false },
});

/* ---------- LoginRequest ---------- */

export const LoginRequestSchema: Schema = {
  id: "LoginRequest",
  name: "LoginRequest",
  description: "Credentials supplied to the login endpoint.",
  properties: {
    email: req("email", "email", STRING),
    password: req("password", "password", STRING),
    rememberMe: opt("rememberMe", "rememberMe", BOOLEAN),
    deviceName: opt("deviceName", "deviceName", STRING),
  },
};

/* ---------- RegisterRequest ---------- */

export const RegisterRequestSchema: Schema = {
  id: "RegisterRequest",
  name: "RegisterRequest",
  description: "Payload required to create a new customer account.",
  properties: {
    email: req("email", "email", STRING),
    password: req("password", "password", STRING),
    fullName: req("fullName", "fullName", STRING),
    acceptsMarketing: opt("acceptsMarketing", "acceptsMarketing", BOOLEAN),
    referralCode: optNullable("referralCode", "referralCode", STRING),
  },
};

/* ---------- PasswordResetRequest ---------- */

export const PasswordResetRequestSchema: Schema = {
  id: "PasswordResetRequest",
  name: "PasswordResetRequest",
  description: "Triggers an email containing a one-time password reset link.",
  properties: {
    email: req("email", "email", STRING),
    redirectUrl: opt("redirectUrl", "redirectUrl", STRING),
  },
};

/* ---------- PasswordResetConfirm ---------- */

export const PasswordResetConfirmSchema: Schema = {
  id: "PasswordResetConfirm",
  name: "PasswordResetConfirm",
  description: "Finalises a password reset using a token delivered by email.",
  properties: {
    token: req("token", "token", STRING),
    newPassword: req("newPassword", "newPassword", STRING),
  },
};

/* ---------- TokenPair ---------- */

export const TokenPairSchema: Schema = {
  id: "TokenPair",
  name: "TokenPair",
  description:
    "Access and refresh tokens issued after a successful authentication.",
  properties: {
    accessToken: req("accessToken", "accessToken", STRING),
    refreshToken: req("refreshToken", "refreshToken", STRING),
    tokenType: req("tokenType", "tokenType", STRING),
    expiresIn: req("expiresIn", "expiresIn", NUMBER),
    scope: opt("scope", "scope", arrayOf(STRING)),
  },
};

/* ---------- AuthSession ---------- */

export const AuthSessionSchema: Schema = {
  id: "AuthSession",
  name: "AuthSession",
  description: "Authentication response containing the user and token pair.",
  properties: {
    user: req("user", "user", ref("User")),
    tokens: req("tokens", "tokens", ref("TokenPair")),
  },
};

/* ---------- RefreshTokenRequest ---------- */

export const RefreshTokenRequestSchema: Schema = {
  id: "RefreshTokenRequest",
  name: "RefreshTokenRequest",
  description: "Payload used to rotate an expired access token.",
  properties: {
    refreshToken: req("refreshToken", "refreshToken", STRING),
  },
};

/* ---------- AuthSuccessResponse ---------- */

export const AuthSuccessResponseSchema: Schema = {
  id: "AuthSuccessResponse",
  name: "AuthSuccessResponse",
  description: "Successful authentication wrapper used by login and register.",
  properties: {
    session: req("session", "session", ref("AuthSession")),
    issuedAt: req("issuedAt", "issuedAt", STRING),
  },
};