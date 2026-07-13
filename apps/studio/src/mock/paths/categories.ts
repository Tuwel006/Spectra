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

const categoryIdPathParam: Parameter = {
  id: "param-category-id",
  name: "id",
  description: "Unique identifier or slug of the category.",
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

/* ---------- GET /categories ---------- */

const listCategoriesOperation: Operation = {
  id: "op-categories-list",
  method: HttpMethod.GET,
  name: "List categories",
  summary: "List categories",
  description:
    "Returns the flat list of categories. Supports filtering by parent and active state.",
  operationId: "listCategories",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-categories-parent",
        name: "parentId",
        description:
          "Restrict results to children of the given parent category. Omit to return top-level categories.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-categories-active",
        name: "isActive",
        description: "Filter by active state.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "boolean",
      },
      {
        id: "param-categories-sort",
        name: "sort",
        description: "Sort expression such as `position:asc` or `name:asc`.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
    ],
    headers: [],
    body: undefined,
  },
  responses: {
    "200": {
      description: "Array of categories.",
      headers: [],
      body: {
        content: {
          "application/json": {
            contentType: ContentType.JSON,
            schema: { id: "CategoryListResponse" },
          },
        },
      },
    },
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Categories"),
    ...security(null),
  },
};

/* ---------- GET /categories/tree ---------- */

const getCategoryTreeOperation: Operation = {
  id: "op-categories-tree",
  method: HttpMethod.GET,
  name: "Get category tree",
  summary: "Retrieve the full category tree",
  description:
    "Returns the entire taxonomy as a recursive tree. Cached aggressively and intended for storefront navigation.",
  operationId: "getCategoryTree",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-categories-tree-max-depth",
        name: "maxDepth",
        description: "Maximum tree depth to include.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
    ],
    headers: [
      {
        id: "header-accept-language",
        name: "Accept-Language",
        description: "Preferred natural language for category names.",
        required: false,
        schemaId: "string",
      },
    ],
    body: undefined,
  },
  responses: {
    "200": ok("Category tree.", "CategoryTree"),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Categories"),
    ...security(null),
  },
};

/* ---------- POST /categories ---------- */

const createCategoryOperation: Operation = {
  id: "op-categories-create",
  method: HttpMethod.POST,
  name: "Create category",
  summary: "Create a category",
  description: "Administrator-only endpoint to create a new category.",
  operationId: "createCategory",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "CreateCategoryRequest"),
  },
  responses: {
    "201": created("Category"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not create categories."),
    "409": err("A category with the same slug already exists."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Categories", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- GET /categories/{id} ---------- */

const getCategoryOperation: Operation = {
  id: "op-categories-get",
  method: HttpMethod.GET,
  name: "Get category",
  summary: "Retrieve a category",
  description: "Returns a single category with its direct children eagerly loaded.",
  operationId: "getCategory",
  request: {
    pathParameters: [categoryIdPathParam],
    queryParameters: [],
    headers: [],
    body: undefined,
  },
  responses: {
    "200": ok("Category retrieved.", "Category"),
    "404": err("No category exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Categories"),
    ...security(null),
  },
};

/* ---------- PATCH /categories/{id} ---------- */

const updateCategoryOperation: Operation = {
  id: "op-categories-update",
  method: HttpMethod.PATCH,
  name: "Update category",
  summary: "Partially update a category",
  description: "Applies a partial update to the category.",
  operationId: "updateCategory",
  request: {
    pathParameters: [categoryIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "UpdateCategoryRequest"),
  },
  responses: {
    "200": ok("Updated category.", "Category"),
    "400": err("Malformed payload."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not modify this category."),
    "404": err("No category exists with the supplied identifier."),
    "409": err("Slug collision with another category."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Categories", "Administration"),
    ...security("BearerAuth"),
  },
};

/* ---------- DELETE /categories/{id} ---------- */

const deleteCategoryOperation: Operation = {
  id: "op-categories-delete",
  method: HttpMethod.DELETE,
  name: "Delete category",
  summary: "Delete a category",
  description:
    "Deletes the category. Fails when products are still associated with it unless `force=true` is supplied.",
  operationId: "deleteCategory",
  request: {
    pathParameters: [categoryIdPathParam],
    queryParameters: [
      {
        id: "param-categories-delete-force",
        name: "force",
        description:
          "When true, detach products and child categories before deletion.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "boolean",
      },
    ],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Category deleted."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not delete this category."),
    "404": err("No category exists with the supplied identifier."),
    "409": err("Category still has associated products and `force` was not set."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Categories", "Administration"),
    ...security("BearerAuth"),
  },
};

export const categoryPaths: readonly Path[] = [
  {
    id: "path-categories",
    url: "/categories",
    operations: {
      [HttpMethod.GET]: listCategoriesOperation,
      [HttpMethod.POST]: createCategoryOperation,
    },
  },
  {
    id: "path-categories-tree",
    url: "/categories/tree",
    operations: { [HttpMethod.GET]: getCategoryTreeOperation },
  },
  {
    id: "path-categories-id",
    url: "/categories/{id}",
    operations: {
      [HttpMethod.GET]: getCategoryOperation,
      [HttpMethod.PATCH]: updateCategoryOperation,
      [HttpMethod.DELETE]: deleteCategoryOperation,
    },
  },
];