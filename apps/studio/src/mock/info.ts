import type { Info } from "@spectra/core";

export const mockInfo: Info = {
  id: "info",
  title: "Spectra E-Commerce API",
  version: "1.4.2",
  summary:
    "Production-level REST API for an online retail platform with storefront, customer, and administration surfaces.",
  description:
    "The Spectra E-Commerce API exposes endpoints for authentication, account management, catalog browsing, cart operations, checkout and order tracking, customer reviews, and back-office administration. All requests must be sent over HTTPS. Authentication is performed using short-lived JWT bearer tokens.",
  termsOfService: "https://spectra.example.com/terms",
  contact: {
    name: "Spectra Platform Team",
    url: "https://spectra.example.com/support",
    email: "api@spectra.example.com",
  },
  license: {
    name: "Proprietary",
    identifier: "LicenseRef-spectra-commercial",
    url: "https://spectra.example.com/license",
  },
  metadata: {
    source: "studio.mock",
    parser: "manual",
    version: "1.4.2",
    createdAt: "2026-01-04T10:12:44.000Z",
    updatedAt: "2026-07-13T09:00:00.000Z",
  },
};