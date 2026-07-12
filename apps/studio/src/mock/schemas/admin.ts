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

/* ---------- BulkImportRequest ---------- */

export const BulkImportRequestSchema: Schema = {
  id: "BulkImportRequest",
  name: "BulkImportRequest",
  description:
    "Multipart payload used to upload a product catalog CSV for asynchronous import.",
  properties: {
    file: req("file", "file", STRING),
    dryRun: opt("dryRun", "dryRun", BOOLEAN),
    notifyEmail: optNullable("notifyEmail", "notifyEmail", STRING),
  },
};

/* ---------- BulkImportJob ---------- */

export const BulkImportJobSchema: Schema = {
  id: "BulkImportJob",
  name: "BulkImportJob",
  description: "Background job descriptor returned after queuing a bulk import.",
  properties: {
    jobId: req("jobId", "jobId", STRING),
    status: req("status", "status", STRING),
    submittedAt: req("submittedAt", "submittedAt", STRING),
    estimatedCompletionAt: optNullable(
      "estimatedCompletionAt",
      "estimatedCompletionAt",
      STRING,
    ),
    totalRows: opt("totalRows", "totalRows", NUMBER),
  },
};

/* ---------- AdminDashboardSummary ---------- */

export const AdminDashboardSummarySchema: Schema = {
  id: "AdminDashboardSummary",
  name: "AdminDashboardSummary",
  description:
    "Headline KPIs displayed on the admin landing page for a given time window.",
  properties: {
    range: req("range", "range", STRING),
    revenue: req("revenue", "revenue", ref("Money")),
    orderCount: req("orderCount", "orderCount", NUMBER),
    conversionRate: req("conversionRate", "conversionRate", NUMBER),
    newCustomers: req("newCustomers", "newCustomers", NUMBER),
    pendingReviews: req("pendingReviews", "pendingReviews", NUMBER),
    lowStockProducts: req(
      "lowStockProducts",
      "lowStockProducts",
      arrayOf(ref("Product")),
    ),
    generatedAt: req("generatedAt", "generatedAt", STRING),
  },
};