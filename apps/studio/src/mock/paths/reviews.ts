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
  content: { [ContentType.JSON]: json(schemaId) },
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

const reviewIdPathParam: Parameter = {
  id: "param-review-id",
  name: "id",
  description: "Identifier of the review.",
  location: ParameterLocation.PATH,
  required: true,
  schemaId: "string",
};

const productIdPathParam: Parameter = {
  id: "param-product-id",
  name: "productId",
  description: "Identifier of the product being reviewed.",
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

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });
const example = (value: ExtensionValue) => ({ "x-example": value });

/* ---------- POST /products/{productId}/reviews ---------- */

const createReviewOperation: Operation = {
  id: "op-reviews-create",
  method: HttpMethod.POST,
  name: "Create review",
  summary: "Submit a review for a product",
  description:
    "Authenticated customers can submit a single review per product. Reviews enter the moderation queue before becoming publicly visible.",
  operationId: "createReview",
  request: {
    pathParameters: [productIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "CreateReviewRequest"),
  },
  responses: {
    "201": created("Review"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("Only verified purchasers may review this product."),
    "404": err("No product exists with the supplied identifier."),
    "409": err("A review from this user for this product already exists."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Reviews"),
    ...security("BearerAuth"),
    ...example({
      request: {
        rating: 5,
        title: "Fits perfectly",
        body: "Great hoodie, true to size and the fabric feels premium.",
      },
    }),
  },
};

/* ---------- GET /reviews/{id} ---------- */

const getReviewOperation: Operation = {
  id: "op-reviews-get",
  method: HttpMethod.GET,
  name: "Get review",
  summary: "Retrieve a single review",
  description: "Returns the review with the author and product references embedded.",
  operationId: "getReview",
  request: {
    pathParameters: [reviewIdPathParam],
    queryParameters: [],
    headers: [],
    body: undefined,
  },
  responses: {
    "200": ok("Review retrieved.", "Review"),
    "404": err("No review exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Reviews"),
    ...security(null),
  },
};

/* ---------- PATCH /reviews/{id} ---------- */

const updateReviewOperation: Operation = {
  id: "op-reviews-update",
  method: HttpMethod.PATCH,
  name: "Update review",
  summary: "Update an existing review",
  description:
    "Authors can edit their own reviews until 24 hours after submission. Subsequent edits require staff moderation.",
  operationId: "updateReview",
  request: {
    pathParameters: [reviewIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "UpdateReviewRequest"),
  },
  responses: {
    "200": ok("Updated review.", "Review"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not edit this review."),
    "404": err("No review exists with the supplied identifier."),
    "409": err("The review edit window has closed."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Reviews"),
    ...security("BearerAuth"),
  },
};

/* ---------- DELETE /reviews/{id} ---------- */

const deleteReviewOperation: Operation = {
  id: "op-reviews-delete",
  method: HttpMethod.DELETE,
  name: "Delete review",
  summary: "Delete a review",
  description:
    "Authors may delete their own reviews. Staff may delete any review as part of moderation.",
  operationId: "deleteReview",
  request: {
    pathParameters: [reviewIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Review deleted."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not delete this review."),
    "404": err("No review exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Reviews"),
    ...security("BearerAuth"),
  },
};

export const reviewPaths: readonly Path[] = [
  {
    id: "path-reviews-id",
    url: "/reviews/{id}",
    operations: {
      [HttpMethod.GET]: getReviewOperation,
      [HttpMethod.PATCH]: updateReviewOperation,
      [HttpMethod.DELETE]: deleteReviewOperation,
    },
  },
];

export const reviewCreatePath: Path = {
  id: "path-products-id-reviews-create",
  url: "/products/{productId}/reviews",
  operations: { [HttpMethod.POST]: createReviewOperation },
};