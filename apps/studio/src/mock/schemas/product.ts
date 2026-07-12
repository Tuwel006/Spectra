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

const optDeprecated = (id: string, name: string, valueType: PrimitiveType | ReferenceType | ArrayType): Property => ({
  id,
  name,
  valueType,
  modifiers: { required: false, readonly: false, nullable: false, deprecated: true },
});

/* ---------- ProductVariant ---------- */

export const ProductVariantSchema: Schema = {
  id: "ProductVariant",
  name: "ProductVariant",
  description:
    "Sellable variant of a product, identified by SKU and a set of option values.",
  properties: {
    id: req("id", "id", STRING),
    sku: req("sku", "sku", STRING),
    title: req("title", "title", STRING),
    price: req("price", "price", ref("Money")),
    compareAtPrice: optNullable("compareAtPrice", "compareAtPrice", ref("Money")),
    stockQuantity: req("stockQuantity", "stockQuantity", NUMBER),
    weightGrams: opt("weightGrams", "weightGrams", NUMBER),
    options: req(
      "options",
      "options",
      arrayOf(ref("ProductOptionValue")),
    ),
    isAvailable: req("isAvailable", "isAvailable", BOOLEAN),
  },
};

/* ---------- ProductOptionValue ---------- */

export const ProductOptionValueSchema: Schema = {
  id: "ProductOptionValue",
  name: "ProductOptionValue",
  description: "Single value within a product option (e.g. size = M, colour = navy).",
  properties: {
    name: req("name", "name", STRING),
    value: req("value", "value", STRING),
  },
};

/* ---------- Product ---------- */

export const ProductSchema: Schema = {
  id: "Product",
  name: "Product",
  description:
    "A purchasable product with variants, images, attributes and inventory state.",
  properties: {
    id: req("id", "id", STRING),
    slug: req("slug", "slug", STRING),
    sku: req("sku", "sku", STRING),
    name: req("name", "name", STRING),
    description: optNullable("description", "description", STRING),
    brand: opt("brand", "brand", STRING),
    categories: req(
      "categories",
      "categories",
      arrayOf(ref("Category")),
    ),
    tags: opt(
      "tags",
      "tags",
      arrayOf(STRING),
    ),
    price: req("price", "price", ref("Money")),
    compareAtPrice: optNullable("compareAtPrice", "compareAtPrice", ref("Money")),
    variants: req(
      "variants",
      "variants",
      arrayOf(ref("ProductVariant")),
    ),
    images: req(
      "images",
      "images",
      arrayOf(ref("Image")),
    ),
    attributes: opt(
      "attributes",
      "attributes",
      arrayOf(ref("ProductAttribute")),
    ),
    ratingAverage: opt("ratingAverage", "ratingAverage", NUMBER),
    ratingCount: opt("ratingCount", "ratingCount", NUMBER),
    stockStatus: req("stockStatus", "stockStatus", STRING),
    isPublished: req("isPublished", "isPublished", BOOLEAN),
    createdAt: req("createdAt", "createdAt", STRING),
    updatedAt: req("updatedAt", "updatedAt", STRING),
    legacyId: optDeprecated("legacyId", "legacyId", STRING),
  },
};

/* ---------- ProductAttribute ---------- */

export const ProductAttributeSchema: Schema = {
  id: "ProductAttribute",
  name: "ProductAttribute",
  description: "Arbitrary key/value pair describing a product characteristic.",
  properties: {
    key: req("key", "key", STRING),
    value: req("value", "value", STRING),
    unit: optNullable("unit", "unit", STRING),
  },
};

/* ---------- CreateProductRequest ---------- */

export const CreateProductRequestSchema: Schema = {
  id: "CreateProductRequest",
  name: "CreateProductRequest",
  description: "Payload for creating a new product.",
  properties: {
    name: req("name", "name", STRING),
    slug: req("slug", "slug", STRING),
    sku: req("sku", "sku", STRING),
    description: optNullable("description", "description", STRING),
    brand: opt("brand", "brand", STRING),
    categoryIds: req(
      "categoryIds",
      "categoryIds",
      arrayOf(STRING),
    ),
    tags: opt(
      "tags",
      "tags",
      arrayOf(STRING),
    ),
    price: req("price", "price", ref("Money")),
    compareAtPrice: optNullable("compareAtPrice", "compareAtPrice", ref("Money")),
    stockQuantity: req("stockQuantity", "stockQuantity", NUMBER),
    isPublished: opt("isPublished", "isPublished", BOOLEAN),
  },
};

/* ---------- UpdateProductRequest ---------- */

export const UpdateProductRequestSchema: Schema = {
  id: "UpdateProductRequest",
  name: "UpdateProductRequest",
  description: "Partial update payload for an existing product.",
  properties: {
    name: opt("name", "name", STRING),
    slug: opt("slug", "slug", STRING),
    description: optNullable("description", "description", STRING),
    brand: opt("brand", "brand", STRING),
    categoryIds: opt(
      "categoryIds",
      "categoryIds",
      arrayOf(STRING),
    ),
    tags: opt(
      "tags",
      "tags",
      arrayOf(STRING),
    ),
    price: opt("price", "price", ref("Money")),
    compareAtPrice: optNullable("compareAtPrice", "compareAtPrice", ref("Money")),
    stockQuantity: opt("stockQuantity", "stockQuantity", NUMBER),
    isPublished: opt("isPublished", "isPublished", BOOLEAN),
  },
};

/* ---------- ProductImageUploadResponse ---------- */

export const ProductImageUploadResponseSchema: Schema = {
  id: "ProductImageUploadResponse",
  name: "ProductImageUploadResponse",
  description: "Response returned after a successful product image upload.",
  properties: {
    productId: req("productId", "productId", STRING),
    image: req("image", "image", ref("Image")),
  },
};

/* ---------- ProductImageUploadRequest ---------- */

export const ProductImageUploadRequestSchema: Schema = {
  id: "ProductImageUploadRequest",
  name: "ProductImageUploadRequest",
  description:
    "Multipart payload accepted by POST /products/{id}/images. The `file` part must contain the binary image; all other parts are metadata.",
  properties: {
    file: req("file", "file", STRING),
    altText: optNullable("altText", "altText", STRING),
    isPrimary: opt("isPrimary", "isPrimary", BOOLEAN),
    position: opt("position", "position", NUMBER),
  },
};

/* ---------- ProductSearchResult ---------- */

export const ProductSearchResultSchema: Schema = {
  id: "ProductSearchResult",
  name: "ProductSearchResult",
  description: "Lightweight product summary returned by search and listing endpoints.",
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
    facets: opt(
      "facets",
      "facets",
      arrayOf(ref("ProductFacet")),
    ),
  },
};

/* ---------- ProductFacet ---------- */

export const ProductFacetSchema: Schema = {
  id: "ProductFacet",
  name: "ProductFacet",
  description: "Aggregate facet used by filtered product lists.",
  properties: {
    key: req("key", "key", STRING),
    label: req("label", "label", STRING),
    values: req(
      "values",
      "values",
      arrayOf(ref("ProductFacetValue")),
    ),
  },
};

export const ProductFacetValueSchema: Schema = {
  id: "ProductFacetValue",
  name: "ProductFacetValue",
  description: "Single value within a facet and its document count.",
  properties: {
    value: req("value", "value", STRING),
    count: req("count", "count", NUMBER),
  },
};