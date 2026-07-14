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

/* ---------- CartItem ---------- */

export const CartItemSchema: Schema = {
  id: "CartItem",
  name: "CartItem",
  description: "Single line inside a shopping cart.",
  properties: {
    id: req("id", "id", STRING),
    productId: req("productId", "productId", STRING),
    variantId: req("variantId", "variantId", STRING),
    quantity: req("quantity", "quantity", NUMBER),
    unitPrice: req("unitPrice", "unitPrice", ref("Money")),
    lineTotal: req("lineTotal", "lineTotal", ref("Money")),
    addedAt: req("addedAt", "addedAt", STRING),
    productSnapshot: optNullable(
      "productSnapshot",
      "productSnapshot",
      ref("Product"),
    ),
  },
};

/* ---------- Cart ---------- */

export const CartSchema: Schema = {
  id: "Cart",
  name: "Cart",
  description:
    "Persistent shopping cart tied to either a logged-in customer or a guest session cookie.",
  properties: {
    id: req("id", "id", STRING),
    userId: optNullable("userId", "userId", STRING),
    sessionToken: optNullable("sessionToken", "sessionToken", STRING),
    currency: req("currency", "currency", STRING),
    items: req(
      "items",
      "items",
      arrayOf(ref("CartItem")),
    ),
    subtotal: req("subtotal", "subtotal", ref("Money")),
    discountTotal: opt("discountTotal", "discountTotal", ref("Money")),
    shippingTotal: opt("shippingTotal", "shippingTotal", ref("Money")),
    taxTotal: opt("taxTotal", "taxTotal", ref("Money")),
    grandTotal: req("grandTotal", "grandTotal", ref("Money")),
    appliedCouponCode: optNullable("appliedCouponCode", "appliedCouponCode", STRING),
    updatedAt: req("updatedAt", "updatedAt", STRING),
  },
};

/* ---------- AddCartItemRequest ---------- */

export const AddCartItemRequestSchema: Schema = {
  id: "AddCartItemRequest",
  name: "AddCartItemRequest",
  description: "Payload used to add an item to the active cart.",
  properties: {
    productId: req("productId", "productId", STRING),
    variantId: req("variantId", "variantId", STRING),
    quantity: req("quantity", "quantity", NUMBER),
  },
};

/* ---------- UpdateCartItemRequest ---------- */

export const UpdateCartItemRequestSchema: Schema = {
  id: "UpdateCartItemRequest",
  name: "UpdateCartItemRequest",
  description: "Payload used to update the quantity of an existing cart item.",
  properties: {
    quantity: req("quantity", "quantity", NUMBER),
  },
};

/* ---------- OrderItem ---------- */

export const OrderItemSchema: Schema = {
  id: "OrderItem",
  name: "OrderItem",
  description: "Frozen line item captured at order placement time.",
  properties: {
    id: req("id", "id", STRING),
    productId: req("productId", "productId", STRING),
    variantId: req("variantId", "variantId", STRING),
    productName: req("productName", "productName", STRING),
    sku: req("sku", "sku", STRING),
    quantity: req("quantity", "quantity", NUMBER),
    unitPrice: req("unitPrice", "unitPrice", ref("Money")),
    lineTotal: req("lineTotal", "lineTotal", ref("Money")),
  },
};

/* ---------- OrderStatus enum-as-string ---------- */

export const OrderStatusSchema: Schema = {
  id: "OrderStatus",
  name: "OrderStatus",
  description: "Lifecycle state of an order.",
  properties: {
    value: req("value", "value", STRING),
  },
};

/* ---------- Order ---------- */

export const OrderSchema: Schema = {
  id: "Order",
  name: "Order",
  description: "Confirmed purchase with fulfilment, payment and shipping metadata.",
  properties: {
    id: req("id", "id", STRING),
    number: req("number", "number", STRING),
    userId: req("userId", "userId", STRING),
    status: req("status", "status", ref("OrderStatus")),
    items: req(
      "items",
      "items",
      arrayOf(ref("OrderItem")),
    ),
    currency: req("currency", "currency", STRING),
    subtotal: req("subtotal", "subtotal", ref("Money")),
    discountTotal: req("discountTotal", "discountTotal", ref("Money")),
    shippingTotal: req("shippingTotal", "shippingTotal", ref("Money")),
    taxTotal: req("taxTotal", "taxTotal", ref("Money")),
    grandTotal: req("grandTotal", "grandTotal", ref("Money")),
    shippingAddress: req("shippingAddress", "shippingAddress", ref("Address")),
    billingAddress: req("billingAddress", "billingAddress", ref("Address")),
    paymentMethod: req("paymentMethod", "paymentMethod", STRING),
    placedAt: req("placedAt", "placedAt", STRING),
    shippedAt: optNullable("shippedAt", "shippedAt", STRING),
    deliveredAt: optNullable("deliveredAt", "deliveredAt", STRING),
    cancelledAt: optNullable("cancelledAt", "cancelledAt", STRING),
    tracking: opt(
      "tracking",
      "tracking",
      arrayOf(ref("ShipmentTracking")),
    ),
    notes: optNullable("notes", "notes", STRING),
  },
};

/* ---------- ShipmentTracking ---------- */

export const ShipmentTrackingSchema: Schema = {
  id: "ShipmentTracking",
  name: "ShipmentTracking",
  description: "Carrier scan event for a shipment.",
  properties: {
    carrier: req("carrier", "carrier", STRING),
    trackingNumber: req("trackingNumber", "trackingNumber", STRING),
    url: opt("url", "url", STRING),
    occurredAt: req("occurredAt", "occurredAt", STRING),
    description: req("description", "description", STRING),
    isDelivered: req("isDelivered", "isDelivered", BOOLEAN),
  },
};

/* ---------- CreateOrderRequest ---------- */

export const CreateOrderRequestSchema: Schema = {
  id: "CreateOrderRequest",
  name: "CreateOrderRequest",
  description: "Payload used to convert the active cart into a confirmed order.",
  properties: {
    shippingAddressId: req("shippingAddressId", "shippingAddressId", STRING),
    billingAddressId: req("billingAddressId", "billingAddressId", STRING),
    paymentMethodId: req("paymentMethodId", "paymentMethodId", STRING),
    customerNotes: optNullable("customerNotes", "customerNotes", STRING),
    acceptTerms: req("acceptTerms", "acceptTerms", BOOLEAN),
  },
};

/* ---------- UpdateOrderStatusRequest ---------- */

export const UpdateOrderStatusRequestSchema: Schema = {
  id: "UpdateOrderStatusRequest",
  name: "UpdateOrderStatusRequest",
  description: "Staff-only payload for advancing an order through its lifecycle.",
  properties: {
    status: req("status", "status", STRING),
    notifyCustomer: opt("notifyCustomer", "notifyCustomer", BOOLEAN),
    internalNote: optNullable("internalNote", "internalNote", STRING),
  },
};

/* ---------- ApplyCouponRequest ---------- */

export const ApplyCouponRequestSchema: Schema = {
  id: "ApplyCouponRequest",
  name: "ApplyCouponRequest",
  description: "Payload used to apply a promotional coupon to the cart.",
  properties: {
    code: req("code", "code", STRING),
  },
};