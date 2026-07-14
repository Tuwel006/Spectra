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

/* ---------- UserRole enum-as-string ---------- */

export const UserRoleSchema: Schema = {
  id: "UserRole",
  name: "UserRole",
  description: "Role assigned to a user account.",
  properties: {
    value: req("value", "value", STRING),
  },
};

/* ---------- User ---------- */

export const UserSchema: Schema = {
  id: "User",
  name: "User",
  description:
    "Registered customer. Contains profile fields, default addresses and account status.",
  properties: {
    id: req("id", "id", STRING),
    email: req("email", "email", STRING),
    fullName: req("fullName", "fullName", STRING),
    role: req("role", "role", ref("UserRole")),
    avatarUrl: optNullable("avatarUrl", "avatarUrl", STRING),
    phoneNumber: optNullable("phoneNumber", "phoneNumber", STRING),
    preferredLanguage: opt("preferredLanguage", "preferredLanguage", STRING),
    acceptsMarketing: opt("acceptsMarketing", "acceptsMarketing", BOOLEAN),
    addresses: opt(
      "addresses",
      "addresses",
      arrayOf(ref("Address")),
    ),
    defaultShippingAddressId: optNullable(
      "defaultShippingAddressId",
      "defaultShippingAddressId",
      STRING,
    ),
    defaultBillingAddressId: optNullable(
      "defaultBillingAddressId",
      "defaultBillingAddressId",
      STRING,
    ),
    status: req("status", "status", STRING),
    lastLoginAt: optNullable("lastLoginAt", "lastLoginAt", STRING),
    createdAt: req("createdAt", "createdAt", STRING),
    updatedAt: req("updatedAt", "updatedAt", STRING),
  },
};

/* ---------- CreateUserRequest (admin) ---------- */

export const CreateUserRequestSchema: Schema = {
  id: "CreateUserRequest",
  name: "CreateUserRequest",
  description: "Payload accepted by POST /users when an administrator provisions an account.",
  properties: {
    email: req("email", "email", STRING),
    password: req("password", "password", STRING),
    fullName: req("fullName", "fullName", STRING),
    role: req("role", "role", STRING),
    sendInvite: opt("sendInvite", "sendInvite", BOOLEAN),
  },
};

/* ---------- UpdateUserRequest ---------- */

export const UpdateUserRequestSchema: Schema = {
  id: "UpdateUserRequest",
  name: "UpdateUserRequest",
  description: "Partial update payload for an existing user profile.",
  properties: {
    fullName: opt("fullName", "fullName", STRING),
    phoneNumber: optNullable("phoneNumber", "phoneNumber", STRING),
    preferredLanguage: opt("preferredLanguage", "preferredLanguage", STRING),
    acceptsMarketing: opt("acceptsMarketing", "acceptsMarketing", BOOLEAN),
    avatarUrl: optNullable("avatarUrl", "avatarUrl", STRING),
  },
};

/* ---------- ChangePasswordRequest ---------- */

export const ChangePasswordRequestSchema: Schema = {
  id: "ChangePasswordRequest",
  name: "ChangePasswordRequest",
  description: "Authenticated password rotation payload.",
  properties: {
    currentPassword: req("currentPassword", "currentPassword", STRING),
    newPassword: req("newPassword", "newPassword", STRING),
  },
};

/* ---------- UserStats ---------- */

export const UserStatsSchema: Schema = {
  id: "UserStats",
  name: "UserStats",
  description: "Aggregated activity counters for a single user.",
  properties: {
    userId: req("userId", "userId", STRING),
    orderCount: req("orderCount", "orderCount", NUMBER),
    lifetimeValue: req("lifetimeValue", "lifetimeValue", ref("Money")),
    reviewCount: req("reviewCount", "reviewCount", NUMBER),
    wishlistCount: req("wishlistCount", "wishlistCount", NUMBER),
  },
};