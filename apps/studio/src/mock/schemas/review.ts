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

/* ---------- Review ---------- */

export const ReviewSchema: Schema = {
  id: "Review",
  name: "Review",
  description: "Customer authored review attached to a product.",
  properties: {
    id: req("id", "id", STRING),
    productId: req("productId", "productId", STRING),
    userId: req("userId", "userId", STRING),
    rating: req("rating", "rating", NUMBER),
    title: req("title", "title", STRING),
    body: optNullable("body", "body", STRING),
    isVerifiedPurchase: req("isVerifiedPurchase", "isVerifiedPurchase", BOOLEAN),
    helpfulVotes: req("helpfulVotes", "helpfulVotes", NUMBER),
    images: opt(
      "images",
      "images",
      arrayOf(ref("Image")),
    ),
    status: req("status", "status", STRING),
    createdAt: req("createdAt", "createdAt", STRING),
    updatedAt: req("updatedAt", "updatedAt", STRING),
  },
};

/* ---------- CreateReviewRequest ---------- */

export const CreateReviewRequestSchema: Schema = {
  id: "CreateReviewRequest",
  name: "CreateReviewRequest",
  description: "Payload required to submit a new product review.",
  properties: {
    rating: req("rating", "rating", NUMBER),
    title: req("title", "title", STRING),
    body: optNullable("body", "body", STRING),
  },
};

/* ---------- UpdateReviewRequest ---------- */

export const UpdateReviewRequestSchema: Schema = {
  id: "UpdateReviewRequest",
  name: "UpdateReviewRequest",
  description: "Partial update payload for an existing review (author only).",
  properties: {
    rating: opt("rating", "rating", NUMBER),
    title: opt("title", "title", STRING),
    body: optNullable("body", "body", STRING),
  },
};

/* ---------- ModerationDecisionRequest ---------- */

export const ModerationDecisionRequestSchema: Schema = {
  id: "ModerationDecisionRequest",
  name: "ModerationDecisionRequest",
  description: "Staff-only payload for approving or rejecting a review.",
  properties: {
    decision: req("decision", "decision", STRING),
    reason: optNullable("reason", "reason", STRING),
  },
};