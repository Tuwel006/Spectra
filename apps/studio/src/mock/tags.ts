import type { Tag } from "@spectra/core";

export const mockTags: readonly Tag[] = [
  {
    id: "tag-authentication",
    name: "Authentication",
    description:
      "Account creation, login, refresh and password recovery flows.",
  },
  {
    id: "tag-users",
    name: "Users",
    description:
      "Customer profile management and account-scoped resources.",
  },
  {
    id: "tag-products",
    name: "Products",
    description:
      "Catalog browsing, product details and media uploads.",
  },
  {
    id: "tag-categories",
    name: "Categories",
    description:
      "Hierarchical taxonomy used to organise the catalog.",
  },
  {
    id: "tag-orders",
    name: "Orders",
    description:
      "Order placement, history and fulfilment tracking.",
  },
  {
    id: "tag-cart",
    name: "Cart",
    description: "Persistent shopping cart and line-item operations.",
  },
  {
    id: "tag-reviews",
    name: "Reviews",
    description: "Customer submitted ratings and reviews for products.",
  },
  {
    id: "tag-administration",
    name: "Administration",
    description:
      "Back-office endpoints reserved for staff with elevated permissions.",
  },
];