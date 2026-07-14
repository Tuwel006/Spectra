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

/* ---------- Category ---------- */

export const CategorySchema: Schema = {
  id: "Category",
  name: "Category",
  description:
    "Node in the catalog taxonomy. Categories may have a parent category and any number of children.",
  properties: {
    id: req("id", "id", STRING),
    slug: req("slug", "slug", STRING),
    name: req("name", "name", STRING),
    description: optNullable("description", "description", STRING),
    parentId: optNullable("parentId", "parentId", STRING),
    position: req("position", "position", NUMBER),
    isActive: req("isActive", "isActive", BOOLEAN),
    imageUrl: optNullable("imageUrl", "imageUrl", STRING),
    productCount: opt("productCount", "productCount", NUMBER),
    children: opt(
      "children",
      "children",
      arrayOf(ref("Category")),
    ),
    createdAt: req("createdAt", "createdAt", STRING),
    updatedAt: req("updatedAt", "updatedAt", STRING),
  },
};

/* ---------- CreateCategoryRequest ---------- */

export const CreateCategoryRequestSchema: Schema = {
  id: "CreateCategoryRequest",
  name: "CreateCategoryRequest",
  description: "Payload used to create a new top-level or nested category.",
  properties: {
    name: req("name", "name", STRING),
    slug: req("slug", "slug", STRING),
    description: optNullable("description", "description", STRING),
    parentId: optNullable("parentId", "parentId", STRING),
    imageUrl: optNullable("imageUrl", "imageUrl", STRING),
    isActive: opt("isActive", "isActive", BOOLEAN),
  },
};

/* ---------- UpdateCategoryRequest ---------- */

export const UpdateCategoryRequestSchema: Schema = {
  id: "UpdateCategoryRequest",
  name: "UpdateCategoryRequest",
  description: "Partial update payload for an existing category.",
  properties: {
    name: opt("name", "name", STRING),
    slug: opt("slug", "slug", STRING),
    description: optNullable("description", "description", STRING),
    parentId: optNullable("parentId", "parentId", STRING),
    imageUrl: optNullable("imageUrl", "imageUrl", STRING),
    position: opt("position", "position", NUMBER),
    isActive: opt("isActive", "isActive", BOOLEAN),
  },
};

/* ---------- CategoryTree ---------- */

export const CategoryTreeSchema: Schema = {
  id: "CategoryTree",
  name: "CategoryTree",
  description: "Recursive tree representation of the catalog taxonomy.",
  properties: {
    roots: req("roots", "roots", arrayOf(ref("Category"))),
    totalNodes: req("totalNodes", "totalNodes", NUMBER),
  },
};