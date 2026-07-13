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

const itemIdPathParam: Parameter = {
  id: "param-cart-item-id",
  name: "id",
  description: "Identifier of the cart item.",
  location: ParameterLocation.PATH,
  required: true,
  schemaId: "string",
};

const authorizationHeader = {
  id: "header-authorization",
  name: "Authorization",
  description:
    "Bearer access token. When omitted the cart is bound to the X-Cart-Session cookie.",
  required: false,
  schemaId: "string",
};

const cartSessionHeader = {
  id: "header-cart-session",
  name: "X-Cart-Session",
  description:
    "Anonymous cart session token. Issued automatically on the first GET /cart.",
  required: false,
  schemaId: "string",
};

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });
const example = (value: ExtensionValue) => ({ "x-example": value });

/* ---------- GET /cart ---------- */

const getCartOperation: Operation = {
  id: "op-cart-get",
  method: HttpMethod.GET,
  name: "Get cart",
  summary: "Retrieve the active cart",
  description:
    "Returns the cart bound to either the authenticated user or the X-Cart-Session cookie. The cookie is set on the response when missing.",
  operationId: "getCart",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader, cartSessionHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Cart retrieved.", "Cart"),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Cart"),
    ...security(null),
  },
};

/* ---------- POST /cart/items ---------- */

const addCartItemOperation: Operation = {
  id: "op-cart-items-add",
  method: HttpMethod.POST,
  name: "Add item to cart",
  summary: "Add a product variant to the cart",
  description:
    "Adds the requested variant to the active cart or increments the quantity if it is already present.",
  operationId: "addCartItem",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader, cartSessionHeader],
    body: requestBody(true, "AddCartItemRequest"),
  },
  responses: {
    "201": created("Cart"),
    "400": err("Malformed payload."),
    "404": err("The product or variant does not exist."),
    "409": err("The requested quantity exceeds available stock."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Cart"),
    ...security(null),
    ...example({
      request: {
        productId: "prd_01HZX8Q2JM0VKA6B9TRW4F2ZCE",
        variantId: "var_01HZX8Q4K2R5E7G9Q0",
        quantity: 2,
      },
    }),
  },
};

/* ---------- PATCH /cart/items/{id} ---------- */

const updateCartItemOperation: Operation = {
  id: "op-cart-items-update",
  method: HttpMethod.PATCH,
  name: "Update cart item",
  summary: "Update the quantity of a cart item",
  description:
    "Sets the quantity of the requested cart line. A quantity of zero removes the line.",
  operationId: "updateCartItem",
  request: {
    pathParameters: [itemIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader, cartSessionHeader],
    body: requestBody(true, "UpdateCartItemRequest"),
  },
  responses: {
    "200": ok("Cart updated.", "Cart"),
    "400": err("Malformed payload."),
    "404": err("No cart item exists with the supplied identifier."),
    "409": err("The requested quantity exceeds available stock."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Cart"),
    ...security(null),
  },
};

/* ---------- DELETE /cart/items/{id} ---------- */

const removeCartItemOperation: Operation = {
  id: "op-cart-items-delete",
  method: HttpMethod.DELETE,
  name: "Remove cart item",
  summary: "Remove a line from the cart",
  description: "Removes the requested line item from the active cart.",
  operationId: "removeCartItem",
  request: {
    pathParameters: [itemIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader, cartSessionHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Item removed."),
    "404": err("No cart item exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Cart"),
    ...security(null),
  },
};

/* ---------- DELETE /cart ---------- */

const clearCartOperation: Operation = {
  id: "op-cart-clear",
  method: HttpMethod.DELETE,
  name: "Clear cart",
  summary: "Empty the cart",
  description: "Removes every item from the active cart.",
  operationId: "clearCart",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader, cartSessionHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Cart cleared."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Cart"),
    ...security(null),
  },
};

/* ---------- POST /cart/coupons ---------- */

const applyCouponOperation: Operation = {
  id: "op-cart-coupons-apply",
  method: HttpMethod.POST,
  name: "Apply coupon",
  summary: "Apply a coupon code to the cart",
  description:
    "Validates and applies a promotional coupon. The discount is reflected in the next GET /cart response.",
  operationId: "applyCoupon",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader, cartSessionHeader],
    body: {
      required: true,
      content: {
        [ContentType.JSON]: json("ApplyCouponRequest"),
      },
    },
  },
  responses: {
    "200": ok("Coupon applied.", "Cart"),
    "404": err("The coupon code is invalid or has expired."),
    "409": err("The coupon cannot be combined with the current cart contents."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Cart"),
    ...security(null),
  },
};

export const cartPaths: readonly Path[] = [
  {
    id: "path-cart",
    url: "/cart",
    operations: {
      [HttpMethod.GET]: getCartOperation,
      [HttpMethod.DELETE]: clearCartOperation,
    },
  },
  {
    id: "path-cart-items",
    url: "/cart/items",
    operations: { [HttpMethod.POST]: addCartItemOperation },
  },
  {
    id: "path-cart-items-id",
    url: "/cart/items/{id}",
    operations: {
      [HttpMethod.PATCH]: updateCartItemOperation,
      [HttpMethod.DELETE]: removeCartItemOperation,
    },
  },
  {
    id: "path-cart-coupons",
    url: "/cart/coupons",
    operations: { [HttpMethod.POST]: applyCouponOperation },
  },
];