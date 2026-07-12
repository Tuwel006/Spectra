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

const orderIdPathParam: Parameter = {
  id: "param-order-id",
  name: "id",
  description: "Unique identifier (or human-readable number) of the order.",
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

const idempotencyHeader = {
  id: "header-idempotency-key",
  name: "Idempotency-Key",
  description:
    "UUID used to make POST /orders idempotent. Required when retrying a checkout.",
  required: false,
  schemaId: "string",
};

const tags = (...values: string[]) => ({ "x-tags": values });
const security = (scheme: string | null) => ({ "x-security": scheme });
const example = (value: ExtensionValue) => ({ "x-example": value });

/* ---------- GET /orders ---------- */

const listOrdersOperation: Operation = {
  id: "op-orders-list",
  method: HttpMethod.GET,
  name: "List orders",
  summary: "List orders",
  description:
    "Returns the orders visible to the caller. Customers see only their own orders; staff see all orders.",
  operationId: "listOrders",
  request: {
    pathParameters: [],
    queryParameters: [
      {
        id: "param-orders-page",
        name: "page",
        description: "1-based page index.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-orders-page-size",
        name: "pageSize",
        description: "Number of items per page.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "number",
      },
      {
        id: "param-orders-status",
        name: "status",
        description: "Restrict results to one or more order statuses.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "OrderStatus",
      },
      {
        id: "param-orders-placed-from",
        name: "placedFrom",
        description: "ISO-8601 lower bound on placedAt.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-orders-placed-to",
        name: "placedTo",
        description: "ISO-8601 upper bound on placedAt.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
      {
        id: "param-orders-sort",
        name: "sort",
        description: "Sort expression such as `placedAt:desc`.",
        location: ParameterLocation.QUERY,
        required: false,
        schemaId: "string",
      },
    ],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Paged collection of orders.", "PageOfOrders"),
    "401": err("Missing or invalid access token."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Orders"),
    ...security("BearerAuth"),
  },
};

/* ---------- POST /orders ---------- */

const createOrderOperation: Operation = {
  id: "op-orders-create",
  method: HttpMethod.POST,
  name: "Place order",
  summary: "Place an order from the active cart",
  description:
    "Converts the active cart into a confirmed order. Stock is reserved and the supplied payment method is charged asynchronously.",
  operationId: "createOrder",
  request: {
    pathParameters: [],
    queryParameters: [],
    headers: [authorizationHeader, idempotencyHeader],
    body: requestBody(true, "CreateOrderRequest"),
  },
  responses: {
    "201": created("Order"),
    "400": err("The cart is empty or the supplied addresses are invalid."),
    "401": err("Missing or invalid access token."),
    "402": err("Payment was declined."),
    "409": err("Idempotency-Key was reused with a different payload."),
    "422": validation(),
    "500": err("Unexpected server error."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Orders"),
    ...security("BearerAuth"),
    ...example({
      request: {
        shippingAddressId: "addr_01HZX8M4K2Q3D6F8P9",
        billingAddressId: "addr_01HZX8M4K2Q3D6F8P9",
        paymentMethodId: "pm_01HZX8N5K2R4E7G9Q0",
        customerNotes: "Please leave the parcel at the front porch.",
        acceptTerms: true,
      },
    }),
  },
};

/* ---------- GET /orders/{id} ---------- */

const getOrderOperation: Operation = {
  id: "op-orders-get",
  method: HttpMethod.GET,
  name: "Get order",
  summary: "Retrieve a single order",
  description:
    "Returns the order with all items, addresses and shipment tracking events. Customers can only view their own orders.",
  operationId: "getOrder",
  request: {
    pathParameters: [orderIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "200": ok("Order retrieved.", "Order"),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not view this order."),
    "404": err("No order exists with the supplied identifier."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Orders"),
    ...security("BearerAuth"),
  },
};

/* ---------- DELETE /orders/{id} ---------- */

const cancelOrderOperation: Operation = {
  id: "op-orders-cancel",
  method: HttpMethod.DELETE,
  name: "Cancel order",
  summary: "Cancel an order",
  description:
    "Cancels an order that has not yet been fulfilled. A refund is issued automatically when payment was already captured.",
  operationId: "cancelOrder",
  request: {
    pathParameters: [orderIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: undefined,
  },
  responses: {
    "204": noContent("Order cancelled."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not cancel this order."),
    "404": err("No order exists with the supplied identifier."),
    "409": err("The order can no longer be cancelled in its current state."),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Orders"),
    ...security("BearerAuth"),
  },
};

/* ---------- PATCH /orders/{id}/status ---------- */

const updateOrderStatusOperation: Operation = {
  id: "op-orders-status-update",
  method: HttpMethod.PATCH,
  name: "Update order status",
  summary: "Advance an order through its lifecycle",
  description: "Staff-only endpoint to update an order's status.",
  operationId: "updateOrderStatus",
  request: {
    pathParameters: [orderIdPathParam],
    queryParameters: [],
    headers: [authorizationHeader],
    body: requestBody(true, "UpdateOrderStatusRequest"),
  },
  responses: {
    "200": ok("Updated order.", "Order"),
    "400": err("Status transition is not allowed."),
    "401": err("Missing or invalid access token."),
    "403": err("The caller may not modify this order."),
    "404": err("No order exists with the supplied identifier."),
    "422": validation(),
  },
  metadata: { source: "studio.mock" },
  extensions: {
    ...tags("Orders", "Administration"),
    ...security("BearerAuth"),
  },
};

export const orderPaths: readonly Path[] = [
  {
    id: "path-orders",
    url: "/orders",
    operations: {
      [HttpMethod.GET]: listOrdersOperation,
      [HttpMethod.POST]: createOrderOperation,
    },
  },
  {
    id: "path-orders-id",
    url: "/orders/{id}",
    operations: {
      [HttpMethod.GET]: getOrderOperation,
      [HttpMethod.DELETE]: cancelOrderOperation,
    },
  },
  {
    id: "path-orders-id-status",
    url: "/orders/{id}/status",
    operations: { [HttpMethod.PATCH]: updateOrderStatusOperation },
  },
];