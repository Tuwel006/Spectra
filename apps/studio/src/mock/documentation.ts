import type { Components, Documentation, NamedCollection, Path, Schema } from "@spectra/core";

import { mockInfo } from "./info";
import { mockServers } from "./servers";
import { mockTags } from "./tags";

import {
  AddressSchema,
  AuthenticatedUserSchema,
  CategoryListResponseSchema,
  ErrorSchema,
  FieldErrorSchema,
  ImageSchema,
  MoneySchema,
  PageOfOrdersSchema,
  PageOfProductsSchema,
  PageOfReviewsSchema,
  PageOfUsersSchema,
  PaginationMetaSchema,
  SortOrderSchema,
  TimestampsSchema,
  ValidationErrorSchema,
  ExampleValues,
} from "./schemas/common";

import {
  AuthSuccessResponseSchema,
  LoginRequestSchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RefreshTokenRequestSchema,
  RegisterRequestSchema,
  TokenPairSchema,
  AuthSessionSchema,
} from "./schemas/auth";

import {
  ChangePasswordRequestSchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserRoleSchema,
  UserSchema,
  UserStatsSchema,
} from "./schemas/user";

import {
  CategorySchema,
  CategoryTreeSchema,
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
} from "./schemas/category";

import {
  ProductAttributeSchema,
  ProductFacetSchema,
  ProductFacetValueSchema,
  ProductImageUploadRequestSchema,
  ProductImageUploadResponseSchema,
  ProductOptionValueSchema,
  ProductSchema,
  ProductSearchResultSchema,
  ProductVariantSchema,
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
} from "./schemas/product";

import {
  AddCartItemRequestSchema,
  ApplyCouponRequestSchema,
  CartItemSchema,
  CartSchema,
  CreateOrderRequestSchema,
  OrderItemSchema,
  OrderSchema,
  OrderStatusSchema,
  ShipmentTrackingSchema,
  UpdateCartItemRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "./schemas/order";

import {
  CreateReviewRequestSchema,
  ModerationDecisionRequestSchema,
  ReviewSchema,
  UpdateReviewRequestSchema,
} from "./schemas/review";

import {
  AdminDashboardSummarySchema,
  BulkImportJobSchema,
  BulkImportRequestSchema,
} from "./schemas/admin";

import { adminPaths } from "./paths/admin";
import { authPaths } from "./paths/auth";
import { cartPaths } from "./paths/cart";
import { categoryPaths } from "./paths/categories";
import { orderPaths } from "./paths/orders";
import { productPaths } from "./paths/products";
import { reviewCreatePath, reviewPaths } from "./paths/reviews";
import { userPaths } from "./paths/users";

/* ---------- Schema registry ---------- */

export const mockSchemas: NamedCollection<Schema> = {
  /* common */
  Address: AddressSchema,
  AuthenticatedUser: AuthenticatedUserSchema,
  CategoryListResponse: CategoryListResponseSchema,
  Error: ErrorSchema,
  FieldError: FieldErrorSchema,
  Image: ImageSchema,
  Money: MoneySchema,
  PageOfOrders: PageOfOrdersSchema,
  PageOfProducts: PageOfProductsSchema,
  PageOfReviews: PageOfReviewsSchema,
  PageOfUsers: PageOfUsersSchema,
  PaginationMeta: PaginationMetaSchema,
  SortOrder: SortOrderSchema,
  Timestamps: TimestampsSchema,
  ValidationError: ValidationErrorSchema,

  /* auth */
  AuthSession: AuthSessionSchema,
  AuthSuccessResponse: AuthSuccessResponseSchema,
  LoginRequest: LoginRequestSchema,
  PasswordResetConfirm: PasswordResetConfirmSchema,
  PasswordResetRequest: PasswordResetRequestSchema,
  RefreshTokenRequest: RefreshTokenRequestSchema,
  RegisterRequest: RegisterRequestSchema,
  TokenPair: TokenPairSchema,

  /* user */
  ChangePasswordRequest: ChangePasswordRequestSchema,
  CreateUserRequest: CreateUserRequestSchema,
  UpdateUserRequest: UpdateUserRequestSchema,
  User: UserSchema,
  UserRole: UserRoleSchema,
  UserStats: UserStatsSchema,

  /* category */
  Category: CategorySchema,
  CategoryTree: CategoryTreeSchema,
  CreateCategoryRequest: CreateCategoryRequestSchema,
  UpdateCategoryRequest: UpdateCategoryRequestSchema,

  /* product */
  CreateProductRequest: CreateProductRequestSchema,
  Product: ProductSchema,
  ProductAttribute: ProductAttributeSchema,
  ProductFacet: ProductFacetSchema,
  ProductFacetValue: ProductFacetValueSchema,
  ProductImageUploadRequest: ProductImageUploadRequestSchema,
  ProductImageUploadResponse: ProductImageUploadResponseSchema,
  ProductOptionValue: ProductOptionValueSchema,
  ProductSearchResult: ProductSearchResultSchema,
  ProductVariant: ProductVariantSchema,
  UpdateProductRequest: UpdateProductRequestSchema,

  /* cart + order */
  AddCartItemRequest: AddCartItemRequestSchema,
  ApplyCouponRequest: ApplyCouponRequestSchema,
  Cart: CartSchema,
  CartItem: CartItemSchema,
  CreateOrderRequest: CreateOrderRequestSchema,
  Order: OrderSchema,
  OrderItem: OrderItemSchema,
  OrderStatus: OrderStatusSchema,
  ShipmentTracking: ShipmentTrackingSchema,
  UpdateCartItemRequest: UpdateCartItemRequestSchema,
  UpdateOrderStatusRequest: UpdateOrderStatusRequestSchema,

  /* review */
  CreateReviewRequest: CreateReviewRequestSchema,
  ModerationDecisionRequest: ModerationDecisionRequestSchema,
  Review: ReviewSchema,
  UpdateReviewRequest: UpdateReviewRequestSchema,

  /* admin */
  AdminDashboardSummary: AdminDashboardSummarySchema,
  BulkImportJob: BulkImportJobSchema,
  BulkImportRequest: BulkImportRequestSchema,
};

/* ---------- Path registry ---------- */

const allPaths: readonly Path[] = [
  ...authPaths,
  ...userPaths,
  ...productPaths,
  reviewCreatePath,
  ...reviewPaths,
  ...categoryPaths,
  ...orderPaths,
  ...cartPaths,
  ...adminPaths,
];

export const mockPaths: NamedCollection<Path> = allPaths.reduce<
  Record<string, Path>
>((accumulator, current) => {
  accumulator[current.id] = current;
  return accumulator;
}, {});

/* ---------- Components ---------- */

const mockComponents: Components = {
  schemas: mockSchemas,
  responses: {},
  parameters: {},
  requestBodies: {},
  headers: {},
  examples: {},
  securitySchemes: {
    BearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description:
        "JWT bearer tokens issued by /auth/login or /auth/register.",
    },
  },
};

/* ---------- Documentation ---------- */

export const mockDocumentation: Documentation = {
  id: "spectra-ecommerce-api",
  name: "Spectra E-Commerce API",
  description:
    "Production-level e-commerce backend covering authentication, account management, catalog browsing, cart and order management, customer reviews and back-office administration.",
  info: mockInfo,
  servers: mockServers,
  tags: mockTags,
  components: mockComponents,
  paths: mockPaths,
  metadata: {
    source: "studio.mock",
    parser: "manual",
    version: "1.4.2",
    createdAt: "2026-01-04T10:12:44.000Z",
    updatedAt: "2026-07-13T09:00:00.000Z",
  },
};

export { ExampleValues };
export * from "./info";
export * from "./servers";
export * from "./tags";
export * from "./paths/auth";
export * from "./paths/users";
export * from "./paths/products";
export * from "./paths/categories";
export * from "./paths/orders";
export * from "./paths/cart";
export * from "./paths/reviews";
export * from "./paths/admin";
export * from "./schemas/common";
export * from "./schemas/auth";
export * from "./schemas/user";
export * from "./schemas/category";
export * from "./schemas/product";
export * from "./schemas/order";
export * from "./schemas/review";
export * from "./schemas/admin";