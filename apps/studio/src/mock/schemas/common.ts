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

const INTEGER: PrimitiveType = {
  kind: TypeKind.PRIMITIVE,
  name: PrimitiveTypeName.NUMBER,
};

const DATE: PrimitiveType = {
  kind: TypeKind.PRIMITIVE,
  name: PrimitiveTypeName.STRING,
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

const optReadonly = (id: string, name: string, valueType: PrimitiveType | ReferenceType | ArrayType): Property => ({
  id,
  name,
  valueType,
  modifiers: { required: false, readonly: true, nullable: false, deprecated: false },
});

/* ---------- Error ---------- */

export const ErrorSchema: Schema = {
  id: "Error",
  name: "Error",
  description: "Standard error envelope returned for all non-2xx responses.",
  properties: {
    code: req("code", "code", STRING),
    message: req("message", "message", STRING),
    details: opt("details", "details", STRING),
    requestId: opt("requestId", "requestId", STRING),
    timestamp: opt("timestamp", "timestamp", DATE),
  },
};

/* ---------- ValidationError ---------- */

export const ValidationErrorSchema: Schema = {
  id: "ValidationError",
  name: "ValidationError",
  description:
    "Returned with HTTP 422 when the request payload fails schema validation.",
  properties: {
    code: req("code", "code", STRING),
    message: req("message", "message", STRING),
    fieldErrors: req(
      "fieldErrors",
      "fieldErrors",
      arrayOf({
        kind: TypeKind.REFERENCE,
        reference: { id: "FieldError" },
      }),
    ),
  },
};

export const FieldErrorSchema: Schema = {
  id: "FieldError",
  name: "FieldError",
  description: "Single field-level validation failure.",
  properties: {
    field: req("field", "field", STRING),
    code: req("code", "code", STRING),
    message: req("message", "message", STRING),
  },
};

/* ---------- PaginationMeta ---------- */

export const PaginationMetaSchema: Schema = {
  id: "PaginationMeta",
  name: "PaginationMeta",
  description: "Pagination metadata returned alongside every paged collection.",
  properties: {
    page: req("page", "page", INTEGER),
    pageSize: req("pageSize", "pageSize", INTEGER),
    totalItems: req("totalItems", "totalItems", INTEGER),
    totalPages: req("totalPages", "totalPages", INTEGER),
    hasNext: req("hasNext", "hasNext", BOOLEAN),
    hasPrevious: req("hasPrevious", "hasPrevious", BOOLEAN),
  },
};

/* ---------- PageOfProducts (concrete paged collection) ---------- */

export const PageOfProductsSchema: Schema = {
  id: "PageOfProducts",
  name: "PageOfProducts",
  description: "Paged response of Product resources.",
  properties: {
    items: req(
      "items",
      "items",
      arrayOf(ref("Product")),
    ),
    pagination: req(
      "pagination",
      "pagination",
      ref("PaginationMeta"),
    ),
  },
};

export const PageOfOrdersSchema: Schema = {
  id: "PageOfOrders",
  name: "PageOfOrders",
  description: "Paged response of Order resources.",
  properties: {
    items: req("items", "items", arrayOf(ref("Order"))),
    pagination: req("pagination", "pagination", ref("PaginationMeta")),
  },
};

export const PageOfUsersSchema: Schema = {
  id: "PageOfUsers",
  name: "PageOfUsers",
  description: "Paged response of User resources.",
  properties: {
    items: req("items", "items", arrayOf(ref("User"))),
    pagination: req("pagination", "pagination", ref("PaginationMeta")),
  },
};

export const PageOfReviewsSchema: Schema = {
  id: "PageOfReviews",
  name: "PageOfReviews",
  description: "Paged response of Review resources.",
  properties: {
    items: req("items", "items", arrayOf(ref("Review"))),
    pagination: req("pagination", "pagination", ref("PaginationMeta")),
  },
};

/* ---------- CategoryListResponse ---------- */

export const CategoryListResponseSchema: Schema = {
  id: "CategoryListResponse",
  name: "CategoryListResponse",
  description: "Flat list of categories.",
  properties: {
    items: req("items", "items", arrayOf(ref("Category"))),
    total: req("total", "total", NUMBER),
  },
};

/* ---------- Money ---------- */

export const MoneySchema: Schema = {
  id: "Money",
  name: "Money",
  description:
    "Monetary amount in the smallest currency unit (e.g. cents) along with its ISO-4217 currency code.",
  properties: {
    amount: req("amount", "amount", INTEGER),
    currency: req("currency", "currency", STRING),
  },
};

/* ---------- Image ---------- */

export const ImageSchema: Schema = {
  id: "Image",
  name: "Image",
  description: "Reference to a binary asset stored in the media service.",
  properties: {
    id: req("id", "id", STRING),
    url: req("url", "url", STRING),
    altText: opt("altText", "altText", STRING),
    width: opt("width", "width", INTEGER),
    height: opt("height", "height", INTEGER),
    isPrimary: opt("isPrimary", "isPrimary", BOOLEAN),
  },
};

/* ---------- Address ---------- */

export const AddressSchema: Schema = {
  id: "Address",
  name: "Address",
  description: "Postal address used for shipping and billing.",
  properties: {
    id: optReadonly("id", "id", STRING),
    fullName: req("fullName", "fullName", STRING),
    line1: req("line1", "line1", STRING),
    line2: opt("line2", "line2", STRING),
    city: req("city", "city", STRING),
    region: req("region", "region", STRING),
    postalCode: req("postalCode", "postalCode", STRING),
    countryCode: req("countryCode", "countryCode", STRING),
    phoneNumber: opt("phoneNumber", "phoneNumber", STRING),
    isDefault: opt("isDefault", "isDefault", BOOLEAN),
  },
};

/* ---------- Timestamps ---------- */

export const TimestampsSchema: Schema = {
  id: "Timestamps",
  name: "Timestamps",
  description: "Audit timestamps automatically maintained by the platform.",
  properties: {
    createdAt: req("createdAt", "createdAt", DATE),
    updatedAt: req("updatedAt", "updatedAt", DATE),
  },
};

/* ---------- SortOrder enum-as-string ---------- */

export const SortOrderSchema: Schema = {
  id: "SortOrder",
  name: "SortOrder",
  description: "Sort direction accepted by list endpoints.",
  properties: {
    value: req("value", "value", STRING),
  },
};

/* ---------- Authenticated wrapper ---------- */

export const AuthenticatedUserSchema: Schema = {
  id: "AuthenticatedUser",
  name: "AuthenticatedUser",
  description: "Subset of User returned when authentication succeeds.",
  properties: {
    id: req("id", "id", STRING),
    email: req("email", "email", STRING),
    fullName: req("fullName", "fullName", STRING),
    role: req("role", "role", STRING),
  },
};

/* ---------- Used by response Examples / request Examples ---------- */

export const ExampleValues = {
  success: {
    requestId: "req_01HZX9C5F3N2K4D6P8QY7WXMVE",
    timestamp: "2026-07-13T09:14:22.118Z",
  },
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 134,
    totalPages: 7,
    hasNext: true,
    hasPrevious: false,
  },
  money: { amount: 4990, currency: "EUR" },
  image: {
    id: "img_01HZX8Q2JM0VKA6B9TRW4F2ZCE",
    url: "https://cdn.spectra.example.com/products/01HZX8Q2JM0VKA6B9TRW4F2ZCE.jpg",
    altText: "Front view of the Spectra Hoodie in charcoal",
    width: 1200,
    height: 1500,
    isPrimary: true,
  },
} as const;