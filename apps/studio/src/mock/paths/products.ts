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

const multipart = (schemaId: string): MediaType => ({
  contentType: ContentType.FORM_DATA,
  schema: { id: schemaId },
});

const requestBody = (
  required: boolean,
  schemaId: string,
  ct: ContentType = ContentType.JSON,
): RequestBody => ({
  required,
  content: {
    [ct]: ct === ContentType.JSON ? json(schemaId) : multipart(schemaId),
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

const productIdPathParam: Parameter = {
  id: "param-product-id",
  name: "id",
  description: "Unique identifier (or slug) of the product.",
  location: ParameterLocation.PATH,
  required: true,
  schemaId: "string",
};

const imageIdPathParam: Parameter = {
  id: "param-image-id",
  name: "imageId",
  description: "Identifier of the product image to delete.",
  location: ParameterLocation.PATH,
  required: true,
  schemaId: "string",
};

const authorizationHeader = {
  id: "header-authorization",
  name: "Authorization",
  description: "Bearer access token.",
  required: true,
  schemaId: "string",
};

const ifMatchHeader = {
  id: "header-if-match",
  name: "If-Match",
  description:
    "Optional ETag of the product. If supplied, the request fails with 412 when the resource has been modified.",
  required: false,
  schemaId: "string",
};

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });
const example = (value: ExtensionValue) => ({ "x-example": value });

/* ---------- GET /products ---------- */

const listProductsOperation: Operation = {
  id: "op-products-list",
  method: HttpMethod.GET,
  name: "List products",
  summary: "List and search products",
  description:
    "Returns a paginated collection of products with optional full-text search, category and brand filtering, price range filtering and sort expressions.",
  operationId: "listProducts",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-products-search",
        name: "search",
        description:
          "Free-text search across product name, description, brand and tags.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-products-category",
        name: "categoryId",
        description: "Restrict results to a single category (and its descendants).",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-products-brand",
        name: "brand",
        description: "Filter by brand.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-products-min-price",
        name: "minPrice",
        description: "Inclusive lower price bound in the requested currency.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-products-max-price",
        name: "maxPrice",
        description: "Exclusive upper price bound in the requested currency.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-products-in-stock",
        name: "inStock",
        description: "When true only returns products with available stock.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "boolean",
      },
      {
        id: "param-products-sort",
        name: "sort",
        description:
          "One of `relevance`, `price:asc`, `price:desc`, `createdAt:desc`, `rating:desc`.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-products-page",
        name: "page",
        description: "1-based page index.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-products-page-size",
        name: "pageSize",
        description: "Number of items per page. Maximum 100.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
    ],
    headers: [
      {
        id: "header-accept-currency",
        name: "Accept-Currency",
        description:
          "ISO-4217 currency code used for the returned prices. Defaults to EUR.",
        required: false,
        schemaId: "string",
      },
    ],
    body: undefined,
  },
  responses: {
    "200": ok("Paged collection of products with facets.", "ProductSearchResult"),
    "400": err("One of the query parameters is invalid."),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products"),
    ...security(null),
    ...example({
      query: {
        search: "hoodie",
        categoryId: "cat_apparel_hoodies",
        brand: "Spectra",
        minPrice: 2000,
        maxPrice: 9000,
        inStock: true,
        sort: "price:asc",
        page: 1,
        pageSize: 24,
      },
    }),
  },
};

/* ---------- POST /products ---------- */

const createProductOperation: Operation = {
  id: "op-products-create",
  method: HttpMethod.POST,
  name: "Create product",
  summary: "Create a product",
  description:
    "Administrator-only endpoint that creates a new product and its initial variant. Media must be uploaded separately using the image upload endpoint.",
  operationId: "createProduct",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "CreateProductRequest"),
  },
  responses: {
    "201": created("Product"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not create products."),
    "409": err("A product with the same slug or SKU already exists."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /products/{id} ---------- */

const getProductOperation: Operation = {
  id: "op-products-get",
  method: HttpMethod.GET,
  name: "Get product",
  summary: "Retrieve a single product",
  description:
    "Returns the product along with all of its variants, attributes and images. The id can be either the internal identifier or the slug.",
  operationId: "getProduct",
  request: {
    pathParameters: [productIdPathParam],
    queryParameters: [],
    headers: [ifMatchHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Product retrieved.", "Product"),
    "304": noContent("The supplied If-Match header matched the current ETag."),
    "404": err("No product exists with the supplied identifier."),
    "412": err("The If-Match header did not match the current ETag."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products"),
    ...security(null),
  },
};

/* ---------- PATCH /products/{id} ---------- */

const updateProductOperation: Operation = {
  id: "op-products-update",
  method: HttpMethod.PATCH,
  name: "Update product",
  summary: "Partially update a product",
  description:
    "Applies a partial update to a product. Only the supplied fields are modified. The `If-Match` header is recommended for optimistic concurrency.",
  operationId: "updateProduct",
  request: {
    pathParameters: [productIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader, ifMatchHeader],
    body: requestBody(true, "UpdateProductRequest"),
  },
  responses: {
    "200": ok("Updated product.", "Product"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not modify this product."),
    "404": err("No product exists with the supplied identifier."),
    "412": err("The If-Match header did not match the current ETag."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- DELETE /products/{id} ---------- */

const deleteProductOperation: Operation = {
  id: "op-products-delete",
  method: HttpMethod.DELETE,
  name: "Delete product",
  summary: "Delete a product",
  description:
    "Permanently removes the product. Products included in completed orders are kept under a tombstone identifier so historical references remain intact.",
  operationId: "deleteProduct",
  request: {
    pathParameters: [productIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Product deleted."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not delete this product."),
    "404": err("No product exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- POST /products/{id}/images ---------- */

const uploadProductImageOperation: Operation = {
  id: "op-products-images-upload",
  method: HttpMethod.POST,
  name: "Upload product image",
  summary: "Upload a product image",
  description:
    "Accepts a multipart/form-data payload containing the binary file plus metadata such as alt text and ordering. The image is processed asynchronously.",
  operationId: "uploadProductImage",
  request: {
    pathParameters: [productIdPathParam],
    queryParameters: [],
    headers: [
      authorizationHeader,
      {
        id: "header-content-type-multipart",
        name: "Content-Type",
        description: "Must be multipart/form-data.",
        required: true,
        schemaId: "string",
      },
    ],
    body: {
      required: true,
      content: {
        [ContentType.FORM_DATA]: {
          contentType: ContentType.FORM_DATA,
          schema: { id: "ProductImageUploadRequest" },
        },
      },
    },
  },
  responses: {
    "201": ok("Image uploaded.", "ProductImageUploadResponse"),
    "400": err("Malformed multipart payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not modify this product."),
    "404": err("No product exists with the supplied identifier."),
    "413": err("The uploaded file exceeds the maximum size of 10MB."),
    "415": err("Unsupported media type. JPEG, PNG and WebP are accepted."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Administration"),
    ...security("BearerAuth"),
    ...example({
      request: {
        file: "<binary JPEG payload>",
        altText: "Rear view of the Spectra Hoodie in charcoal",
        isPrimary: false,
        position: 2,
      },
    }),
  },
};

/* ---------- DELETE /products/{id}/images/{imageId} ---------- */

const deleteProductImageOperation: Operation = {
  id: "op-products-images-delete",
  method: HttpMethod.DELETE,
  name: "Delete product image",
  summary: "Delete a product image",
  description: "Removes a previously uploaded image from a product.",
  operationId: "deleteProductImage",
  request: {
    pathParameters: [productIdPathParam, imageIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Image deleted."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not modify this product."),
    "404": err("Product or image not found."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /products/{id}/reviews ---------- */

const listProductReviewsOperation: Operation = {
  id: "op-products-reviews",
  method: HttpMethod.GET,
  name: "List product reviews",
  summary: "List reviews for a product",
  description:
    "Returns a paginated list of approved reviews for the requested product. Supports rating-based filtering and sorting.",
  operationId: "listProductReviews",
  request: {
    pathParameters: [productIdPathParam],
    queryParameters: [
      {
        id: "param-products-reviews-min-rating",
        name: "minRating",
        description: "Inclusive lower bound for the rating (1-5).",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-products-reviews-sort",
        name: "sort",
        description:
          "One of `helpful:desc`, `createdAt:desc`, `rating:desc`.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-products-reviews-page",
        name: "page",
        description: "1-based page index.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-products-reviews-page-size",
        name: "pageSize",
        description: "Number of items per page.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
    ],
    headers: [],
    body: undefined,
  },
  responses: {
    "200": ok("Paged collection of reviews.", "PageOfReviews"),
    "404": err("No product exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Reviews"),
    ...security(null),
  },
};

export const productPaths: readonly Path[] = [
  {
    id: "path-products",
    url: "/products",
    operations: {
      [HttpMethod.GET]: listProductsOperation,
      [HttpMethod.POST]: createProductOperation,
    },
  },
  {
    id: "path-products-id",
    url: "/products/{id}",
    operations: {
      [HttpMethod.GET]: getProductOperation,
      [HttpMethod.PATCH]: updateProductOperation,
      [HttpMethod.DELETE]: deleteProductOperation,
    },
  },
  {
    id: "path-products-id-images",
    url: "/products/{id}/images",
    operations: { [HttpMethod.POST]: uploadProductImageOperation },
  },
  {
    id: "path-products-id-images-imageId",
    url: "/products/{id}/images/{imageId}",
    operations: { [HttpMethod.DELETE]: deleteProductImageOperation },
  },
  {
    id: "path-products-id-reviews",
    url: "/products/{id}/reviews",
    operations: { [HttpMethod.GET]: listProductReviewsOperation },
  },
];