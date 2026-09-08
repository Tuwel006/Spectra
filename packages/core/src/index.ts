export * from "./constants/HttpMethod";
export * from "./constants/ContentType";
export * from "./constants/ParameterLocation";
export * from "./constants/PrimitiveTypeName";
export * from "./constants/TypeKind";

export * from "./common/BaseNode";
export * from "./common/Extension";
export * from "./common/Metadata";

export * from "./models/Documentation";
export * from "./models/Info";
export * from "./models/Server";
export * from "./models/Tag";
export * from "./models/Components";
export * from "./models/DecoratorUsage";

export * from "./models/media/MediaType";
export * from "./models/path/Operation";
export * from "./models/path/Path";
export * from "./models/request/Header";
export * from "./models/request/Parameter";
export * from "./models/request/Request";
export * from "./models/request/RequestBody";
export * from "./models/response/Response";
export * from "./models/response/ResponseBody";
export * from "./models/schema/Property";
export * from "./models/schema/PropertyModifier";
export * from "./models/schema/Schema";
export * from "./models/type/ArrayType";
export * from "./models/type/PrimitiveType";
export * from "./models/type/ReferenceType";
export * from "./models/type/Type";

export * from "./types/Identifier";
export * from "./types/NamedCollection";
export * from "./types/Reference";

// NOTE: The encoding module is intentionally NOT re-exported here.
// It depends on `node:fs/promises`, `node:zlib`, and `@msgpack/msgpack`,
// which cannot be bundled for the browser. Consumers that need
// encoding (build scripts, the studio server-side loader) should
// import directly from "@spectra/core/encoding". See
// `packages/core/src/encoding/index.ts` for the public surface.
