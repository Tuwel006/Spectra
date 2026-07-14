import {
  ContentType,
  HttpMethod,
  ParameterLocation,
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

const authorizationHeader = {
  id: "header-authorization",
  name: "Authorization",
  description: "Bearer access token. Requires the staff or admin role.",
  required: true,
  schemaId: "string",
};

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });

/* ---------- GET /admin/reviews ---------- */

const listPendingReviewsOperation: Operation = {
  id: "op-admin-reviews-list",
  method: HttpMethod.GET,
  name: "List pending reviews",
  summary: "List reviews awaiting moderation",
  description:
    "Returns the moderation queue with reviews in the `pending` status. Supports filtering by rating and date range.",
  operationId: "listPendingReviews",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-admin-reviews-status",
        name: "status",
        description: "Filter by review status.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-admin-reviews-min-rating",
        name: "minRating",
        description: "Inclusive lower bound for the rating.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-admin-reviews-from",
        name: "createdFrom",
        description: "ISO-8601 lower bound on createdAt.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-admin-reviews-page",
        name: "page",
        description: "1-based page index.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-admin-reviews-page-size",
        name: "pageSize",
        description: "Number of items per page.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
    ],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Moderation queue.", "PageOfReviews"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller is not a staff member."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Reviews", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- PATCH /admin/reviews/{id}/moderation ---------- */

const moderateReviewOperation: Operation = {
  id: "op-admin-reviews-moderate",
  method: HttpMethod.PATCH,
  name: "Moderate review",
  summary: "Approve or reject a review",
  description:
    "Applies a moderation decision. Approved reviews become publicly visible; rejected ones are removed.",
  operationId: "moderateReview",
  request: {
    pathParameters: [reviewIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "ModerationDecisionRequest"),
  },
  responses: {
    "200": ok("Review moderated.", "Review"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller is not a staff member."),
    "404": err("No review exists with the supplied identifier."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Reviews", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- POST /admin/products/bulk-import ---------- */

const bulkImportProductsOperation: Operation = {
  id: "op-admin-products-bulk-import",
  method: HttpMethod.POST,
  name: "Bulk import products",
  summary: "Queue a bulk product import",
  description:
    "Accepts a CSV upload containing product definitions and queues a background job. The response contains the identifier of the job that can be polled.",
  operationId: "bulkImportProducts",
  request: {
    pathParameters: [],
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
          schema: { id: "BulkImportRequest" },
        },
      },
    },
  },
  responses: {
    "202": {
      description: "Import queued.",
      headers: [],
      body: {
        content: {
          "application/json": json("BulkImportJob"),
        },
      },
    },
    "400": err("Malformed multipart payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller is not a staff member."),
    "413": err("The CSV file exceeds the 50MB limit."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Products", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /admin/dashboard ---------- */

const getDashboardOperation: Operation = {
  id: "op-admin-dashboard",
  method: HttpMethod.GET,
  name: "Get dashboard summary",
  summary: "Retrieve KPI summary",
  description:
    "Returns the headline KPIs shown on the admin landing page: revenue, order count, conversion rate and active staff.",
  operationId: "getDashboardSummary",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-admin-dashboard-range",
        name: "range",
        description: "Window for the aggregated metrics.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
    ],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Dashboard summary.", "AdminDashboardSummary"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller is not a staff member."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Administration"),
    ...security("BearerAuth"),
  },
};

export const adminPaths: readonly Path[] = [
  {
    id: "path-admin-reviews",
    url: "/admin/reviews",
    operations: { [HttpMethod.GET]: listPendingReviewsOperation },
  },
  {
    id: "path-admin-reviews-id-moderation",
    url: "/admin/reviews/{id}/moderation",
    operations: { [HttpMethod.PATCH]: moderateReviewOperation },
  },
  {
    id: "path-admin-products-bulk-import",
    url: "/admin/products/bulk-import",
    operations: { [HttpMethod.POST]: bulkImportProductsOperation },
  },
  {
    id: "path-admin-dashboard",
    url: "/admin/dashboard",
    operations: { [HttpMethod.GET]: getDashboardOperation },
  },
];