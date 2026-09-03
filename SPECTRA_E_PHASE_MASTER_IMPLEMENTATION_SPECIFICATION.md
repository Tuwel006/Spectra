# SPECTRA — E PHASE MASTER IMPLEMENTATION SPECIFICATION
## NestJS Semantic Extraction — E0 through E10

**Document type:** Implementation contract for the coding agent  
**Phase:** E — NestJS Semantic Extraction  
**Primary consumer after E:** Phase F — Documentation Model Generation  
**Application used for integration verification:** `apps/example-api`

---

# 0. Purpose

This document is the authoritative implementation plan for the complete E phase of Spectra.

The purpose of E is to transform a NestJS application's source code into a complete, immutable, framework-semantic representation:

```text
NestJS source code
        ↓
provider-ast
        ↓
provider-nestjs semantic extraction
        ↓
SpectraSemanticModel
```

E must answer:

> What controllers, routes, parameters, types, guards, pipes, interceptors, filters, HTTP metadata, modules, and relationships exist in this NestJS application?

E must **not** answer:

> How should those things be rendered as API documentation?

That second question belongs to Phase F.

---

# 1. Critical Architecture Boundary

The architecture must remain layered:

```text
┌─────────────────────────────────────────────┐
│                 NestJS source               │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│                provider-ast                 │
│                                             │
│ Scanner                                     │
│ Walker                                      │
│ ClassQuery                                  │
│ DecoratorReader                             │
│ DecoratorArguments                           │
│ ExpressionInspector                         │
│ TypeResolver                                │
│ SymbolResolver                              │
│ DeclarationResolver                         │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│              provider-nestjs                 │
│                                             │
│ ControllerAnalyzer                          │
│ RouteAnalyzer                               │
│ ParameterSourceExtractor                    │
│ ParameterTypeExtractor                      │
│ GuardSourceExtractor                        │
│ DecoratorArgExtractor                       │
│ HttpMetadataExtractor                       │
│ ModuleSourceExtractor                       │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│          SpectraSemanticModel               │
└──────────────────────┬──────────────────────┘
                       ↓
                 PHASE F
                       ↓
┌─────────────────────────────────────────────┐
│             Documentation                   │
│                                             │
│ Documentation                               │
│ Info                                        │
│ Server                                      │
│ Tag                                         │
│ Components                                  │
│ Path                                        │
│ Operation                                   │
│ Request                                     │
│ Response                                    │
│ Schema                                      │
└─────────────────────────────────────────────┘
```

The most important boundary is:

```text
provider-nestjs semantic model
                    ↓
         SpectraSemanticModel
                    ↓
             Phase F generator
```

Do not bypass this boundary.

---

# 2. Non-Negotiable Rules

## 2.1 provider-ast remains framework independent

NestJS-specific logic must not be placed in:

```text
packages/provider-ast
```

unless the change is genuinely framework-independent.

Examples of framework-independent infrastructure:

```text
DecoratorReader
DecoratorArguments
ExpressionInspector
TypeResolver
SymbolResolver
DeclarationResolver
ParameterQuery
```

Examples that belong in provider-nestjs:

```text
@Controller
@Get
@Post
@Param
@Query
@Body
@UseGuards
@UsePipes
@UseInterceptors
@UseFilters
@HttpCode
@Header
@Redirect
@Module
```

---

# 3. No Runtime Execution

The analyzer must never execute application code.

Forbidden:

```ts
require(...)
import(...)
eval(...)
new CreateUserDto()
new JwtAuthGuard()
guardFactory()
factory()
forwardRef(...)
```

The system must inspect:

```ts
ts.Node
ts.Type
ts.Symbol
ts.Declaration
```

only.

---

# 4. Source Preservation Rule

Whenever a value cannot be safely determined statically, preserve the source expression.

For:

```ts
@Param(factory())
```

store:

```text
sourceText = "factory()"
kind = "call"
isStatic = false
```

Do not produce:

```text
"id"
```

or any guessed value.

Likewise:

```ts
@HttpCode(HttpStatus.CREATED)
```

must preserve:

```text
sourceText = "HttpStatus.CREATED"
```

and structural/symbol information.

---

# 5. Resolver Reuse Rule

Do not create new implementations of:

```text
TypeChecker
TypeResolver
SymbolResolver
DeclarationResolver
```

Use existing provider-ast infrastructure.

---

# 6. Test Rule

Every E step must contain:

```text
synthetic tests
+
example-api integration tests
+
typecheck
+
regression tests
```

Synthetic tests are for edge cases.

`apps/example-api` is the real integration test.

---

# 7. E0 — Existing Infrastructure Baseline

E0 is the inspection and baseline phase.

Before implementing semantic features, inspect:

```text
packages/provider-ast
packages/provider-nestjs
apps/example-api
packages/core
```

Determine:

```text
how AstProject is created
how SourceScanner scans files
how NodeWalker works
how ClassQuery works
how decorators are read
how expressions are inspected
how types are resolved
how symbols are resolved
how declarations are resolved
```

Do not duplicate those systems.

## E0 output

The agent must document:

```text
existing AST infrastructure
existing NestJS infrastructure
existing metadata structures
existing tests
known deficiencies
```

---

# 8. E1 — Controller Semantic Extraction

## 8.1 Objective

Extract NestJS controller information.

Input:

```ts
@Controller("products")
export class ProductsController {}
```

Output:

```text
ControllerMetadata
```

---

## 8.2 Files

Production:

```text
packages/provider-nestjs/src/metadata/ControllerMetadata.ts
packages/provider-nestjs/src/analyzer/ControllerAnalyzer.ts
```

Test:

```text
packages/provider-nestjs/test/controller-semantic.test.ts
```

Barrel:

```text
packages/provider-nestjs/src/index.ts
```

only if necessary.

---

## 8.3 ControllerMetadata responsibility

It represents one NestJS controller.

It must contain controller identity and path information.

The established E1 structure must remain compatible with later:

```text
E2 RouteAnalyzer
E6 class guards/pipes/interceptors/filters
E10 UnifiedSemanticExtractor
```

The model must remain immutable:

```ts
readonly
```

---

## 8.4 ControllerAnalyzer responsibility

`ControllerAnalyzer` must:

1. receive a `SourceFile`;
2. find class declarations using existing `ClassQuery`;
3. identify `@Controller`;
4. extract controller name;
5. extract controller path;
6. normalize the path;
7. preserve source path;
8. return controller metadata.

It must not create its own AST scanner.

---

## 8.5 Example

Source:

```ts
@Controller("products")
export class ProductsController {}
```

Semantic result must contain approximately:

```text
name = ProductsController
path = products
normalizedPath = /products
```

The exact established repository contract takes precedence.

---

## 8.6 Example-api verification

Inspect:

```text
apps/example-api/src
```

and verify real controllers such as:

```text
ProductsController
OrdersController
CartController
UsersController
AppController
```

---

## 8.7 Test command

```bash
pnpm test:nest:controller
```

Then:

```bash
pnpm exec tsc --noEmit -p packages/provider-nestjs/tsconfig.json
```

Then run previous regression tests.

---

## 8.8 Definition of done

```text
[x] synthetic controller extraction
[x] real example-api controllers
[x] controller path normalization
[x] source path
[x] immutable metadata
[x] typecheck
[x] regression
[x] commit
```

STOP.

---

# 9. E2 — Route Semantic Extraction

## 9.1 Objective

Extract controller method routes.

Examples:

```ts
@Get()
findAll() {}

@Get(":id")
findOne() {}

@Post()
create() {}

@Delete(":id")
remove() {}
```

---

## 9.2 Files

Production:

```text
packages/provider-nestjs/src/metadata/RouteMetadata.ts
packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts
```

Test:

```text
packages/provider-nestjs/test/route-semantic.test.ts
```

---

## 9.3 RouteMetadata responsibility

One `RouteMetadata` represents one route decorator attached to one controller method.

It must retain:

```text
method name
decorator name
decorator index
HTTP method
source path
route path value
expression kind
normalized path
static state
composed path
```

Do not introduce documentation-specific concepts here.

---

## 9.4 RouteAnalyzer responsibility

It must:

1. receive controller metadata;
2. inspect controller methods;
3. identify HTTP route decorators;
4. determine HTTP method;
5. extract route path;
6. normalize route path;
7. compose controller + method path;
8. preserve source information.

---

## 9.5 Path composition

Given:

```ts
@Controller("products")
@Get(":id")
```

produce:

```text
/products/:id
```

Do not yet transform:

```text
:id
```

into OpenAPI syntax:

```text
{id}
```

That transformation belongs later.

---

## 9.6 Example-api test

Verify:

```text
ProductsController.findOne
```

has:

```text
GET
/products/:id
```

---

## 9.7 Test

```bash
pnpm test:nest:route
```

Typecheck:

```bash
pnpm exec tsc --noEmit -p packages/provider-nestjs/tsconfig.json
```

STOP.

---

# 10. E3 — Route Composition Verification

## 10.1 Objective

Prove route composition independently.

Cases:

```text
@Controller("users")
@Get()
```

→

```text
/users
```

```text
@Controller("users")
@Get(":id")
```

→

```text
/users/:id
```

```text
@Controller()
@Get()
```

→

```text
/
```

---

## 10.2 Test

```text
packages/provider-nestjs/test/route-composition-semantic.test.ts
```

Test:

```text
empty controller path
empty method path
leading slash
trailing slash
parameter route
root route
```

---

## 10.3 Architecture rule

Do not create another path-composition engine.

Reuse the E2 route composition behavior.

---

## 10.4 Example-api

Verify all real composed paths are well formed.

The integration test should iterate actual routes rather than checking only one route.

---

## 10.5 Verification

```bash
pnpm test:nest:route-composition
```

STOP.

---

# 11. E4 — Parameter Semantic Extraction

## 11.1 Objective

Extract parameters from controller methods.

Examples:

```ts
@Param("id") id: string
@Query("q") q: string
@Body() body: CreateUserDto
@Body("payload") payload: string
@Headers("authorization") auth: string
@Req() request: Request
@Res() response: Response
@Ip() ip: string
@Session() session: Session
@HostParam("tenant") tenant: string
```

---

# 11.2 Files

Production:

```text
packages/provider-nestjs/src/semantic/parameter-source.ts
packages/provider-nestjs/src/metadata/RouteMetadata.ts
packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts
packages/provider-nestjs/src/semantic/index.ts
```

Test:

```text
packages/provider-nestjs/test/parameter-semantic.test.ts
```

---

# 11.3 ParameterSourceExtractor

Create:

```ts
export class ParameterSourceExtractor
```

It composes:

```text
DecoratorReader
DecoratorArguments
ExpressionInspector
```

It must not create another decorator parser.

---

# 11.4 Parameter source semantics

For:

```ts
@Param("id")
```

capture the literal key.

For:

```ts
@Param(key)
```

capture:

```text
sourceText = key
kind = identifier
isStatic = true
```

For:

```ts
@Param(factory())
```

capture:

```text
sourceText = factory()
kind = call
isStatic = false
```

For:

```ts
@Param(HttpStatus.OK)
```

capture:

```text
sourceText = HttpStatus.OK
kind = property-access
```

Do not coerce it into a string.

---

# 11.5 D1 ParameterQuery rule

The previous provider-ast correction must remain.

Method-like parameter extraction must be direct-only.

Example:

```ts
items((value) => {
    // value must not become a method parameter
})
```

Nested lambda parameters must not leak.

---

# 11.6 Example-api

Verify actual parameter decorators and parameter names for:

```text
ProductsController
OrdersController
CartController
UsersController
```

---

# 11.7 Verification

```bash
pnpm test:nest:parameter
```

Typecheck and all previous regressions.

STOP.

---

# 12. E5 — Parameter Type Extraction

## 12.1 Objective

Add semantic type information to parameters.

Examples:

```ts
id: string
count: number
active: boolean
items: number[]
body: CreateProductDto
```

---

# 12.2 Files

Production:

```text
packages/provider-nestjs/src/semantic/parameter-type.ts
packages/provider-nestjs/src/semantic/parameter-source.ts
packages/provider-nestjs/src/metadata/RouteMetadata.ts
packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts
packages/provider-nestjs/src/semantic/index.ts
```

Test:

```text
packages/provider-nestjs/test/type-semantic.test.ts
```

---

# 12.3 ParameterTypeView

Create:

```ts
export interface ParameterTypeView {
    // established repository fields
}
```

and:

```ts
export class ParameterTypeExtractor
```

The implementation must preserve the established E5 22-field contract already accepted by the project.

Do not remove fields simply because they are not currently used.

---

# 12.4 No TypeResolver

Without resolver:

```text
sourceText = exact type annotation
isResolved = false
```

AST shape can still classify:

```text
string
array
union
```

---

# 12.5 With TypeResolver

Resolve:

```text
string
number
boolean
void
number[]
CreateUserDto
CreateProductDto
CreateOrderDto
AddToCartDto
```

---

# 12.6 DTO rule

Never execute:

```ts
new CreateProductDto()
```

The analyzer reads the TypeScript type system.

---

# 12.7 Example-api verification

Real DTOs:

```text
CreateUserDto
LoginDto
CreateProductDto
UpdateProductDto
CreateOrderDto
AddToCartDto
```

must resolve as classes.

Primitive route parameters must resolve appropriately.

---

# 12.8 Verification

```bash
pnpm test:nest:type
```

Then typecheck and E1–E4 regression.

STOP.

---

# 13. E6 — Guards

## 13.1 Objective

Extract controller-level and method-level:

```ts
@UseGuards(...)
```

---

# 13.2 Files

Production:

```text
packages/provider-nestjs/src/semantic/guard-source.ts
packages/provider-nestjs/src/metadata/ControllerMetadata.ts
packages/provider-nestjs/src/metadata/RouteMetadata.ts
packages/provider-nestjs/src/analyzer/ControllerAnalyzer.ts
packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts
packages/provider-nestjs/src/semantic/index.ts
```

Test:

```text
packages/provider-nestjs/test/guard-semantic.test.ts
```

---

# 13.3 GuardSourceView

It must expose the established E6 fields:

```text
sourceText
expression kind
static state
resolved symbol
declaration
class information
children
```

---

# 13.4 Required cases

Identifier:

```ts
JwtAuthGuard
```

Call:

```ts
guardFactory()
```

Array:

```ts
[JwtAuthGuard, RolesGuard]
```

Object:

```ts
{
    provide: JwtAuthGuard,
    useClass: RolesGuard
}
```

---

# 13.5 Static rule

Only bare identifiers are static:

```text
JwtAuthGuard → isStatic=true
```

Calls/arrays/objects:

```text
isStatic=false
```

---

# 13.6 Example-api

Verify:

```text
CartController → JwtAuthGuard
OrdersController → JwtAuthGuard
UsersController.getProfile → JwtAuthGuard
```

---

# 13.7 Verification

```bash
pnpm test:nest:guard
```

Then:

```text
E1–E5 regression
D-step regression
typecheck
```

STOP.

---

# 14. E7 — Pipes / Interceptors / Filters

## 14.1 Objective

Extract:

```ts
@UsePipes(...)
@UseInterceptors(...)
@UseFilters(...)
```

using one generic extraction mechanism.

---

# 14.2 Files

Production:

```text
packages/provider-nestjs/src/semantic/decorator-arg.ts
packages/provider-nestjs/src/semantic/guard-source.ts
packages/provider-nestjs/src/semantic/index.ts
packages/provider-nestjs/src/metadata/ControllerMetadata.ts
packages/provider-nestjs/src/metadata/RouteMetadata.ts
packages/provider-nestjs/src/analyzer/ControllerAnalyzer.ts
packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts
```

Test:

```text
packages/provider-nestjs/test/pipe-interceptor-filter-semantic.test.ts
```

---

# 14.3 Generic extractor

Create:

```ts
export class DecoratorArgExtractor
```

and:

```ts
export interface DecoratorArgView
```

Semantic wrappers may be:

```text
PipeSourceExtractor
InterceptorSourceExtractor
FilterSourceExtractor
```

These wrappers must remain very small.

They should configure the generic extractor rather than duplicate it.

---

# 14.4 Metadata

Controller:

```text
classPipes
classInterceptors
classFilters
```

Route:

```text
pipes
interceptors
filters
```

---

# 14.5 Backward compatibility

Existing E6 guard API must continue to work.

`guard-source.ts` may adapt/re-export generic implementation.

Do not break E6 tests.

---

# 14.6 Test

Test:

```text
ValidationPipe
ValidationPipe({ transform: true })
[ValidationPipe, ValidationPipe]
{ provide: ValidationPipe, useClass: ValidationPipe }
LoggingInterceptor
ExceptionFilter
```

Also verify real example-api has no unexpected values.

---

# 14.7 Verification

```bash
pnpm test:nest:pif
```

Run E1–E6 regression.

STOP.

---

# 15. E8 — HTTP Metadata

## 15.1 Objective

Extract:

```ts
@HttpCode(...)
@Header(...)
@Redirect(...)
```

---

# 15.2 Files

Production:

```text
packages/provider-nestjs/src/semantic/http-metadata.ts
packages/provider-nestjs/src/semantic/decorator-arg.ts
packages/provider-nestjs/src/semantic/index.ts
packages/provider-nestjs/src/metadata/RouteMetadata.ts
packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts
```

Test:

```text
packages/provider-nestjs/test/http-metadata-semantic.test.ts
```

---

# 15.3 HttpCode

Support:

```ts
@HttpCode(201)
@HttpCode(HttpStatus.CREATED)
@HttpCode(getCode())
```

For:

```ts
201
```

preserve:

```text
kind = number
isStatic = true
sourceText = "201"
```

For:

```ts
HttpStatus.CREATED
```

preserve property-access information and symbol resolution.

Do not execute the enum.

---

# 15.4 Header

Support:

```ts
@Header("X-Test", "value")
@Header(name, value)
@Header("X-Only")
```

Preserve source values.

---

# 15.5 Redirect

Support:

```ts
@Redirect("https://example.com")
@Redirect("https://example.com", 301)
@Redirect(url, status)
@Redirect(getUrl())
```

Dynamic values remain dynamic.

---

# 15.6 Route metadata

Add:

```text
httpCode
headers
redirect
```

---

# 15.7 Example-api

Verify real:

```text
CartController.addItem
OrdersController.create
ProductsController.create
ProductsController.remove
UsersController.register
UsersController.login
```

Expected status expressions include:

```text
HttpStatus.OK
HttpStatus.CREATED
HttpStatus.NO_CONTENT
```

---

# 15.8 Verification

```bash
pnpm test:nest:http
```

Run all E1–E8 regressions.

STOP.

---

# 16. E9 — Module Relationship Extraction

## 16.1 Objective

Extract:

```ts
@Module({
    imports: [],
    controllers: [],
    providers: [],
    exports: []
})
```

without executing the decorator.

---

# 16.2 File

Production:

```text
packages/provider-nestjs/src/semantic/module-source.ts
packages/provider-nestjs/src/semantic/index.ts
```

Test:

```text
packages/provider-nestjs/test/module-semantic.test.ts
```

---

# 16.3 Types

Create:

```ts
ModuleSourceExtractor
ModuleMetadata
ModuleItemView
ModuleImportEdge
```

---

# 16.4 ModuleMetadata

Represent:

```text
module name
imports
controllers
providers
exports
```

---

# 16.5 ModuleItemView

Preserve:

```text
sourceText
expression kind
static state
resolved symbol
declaration
class name
provider form where relevant
children
```

---

# 16.6 Example-api

Expected modules:

```text
AppModule
AuthModule
ProductsModule
CartModule
OrdersModule
UsersModule
```

Expected relationships:

```text
AppModule
 ├── AuthModule
 ├── CartModule
 ├── OrdersModule
 ├── ProductsModule
 └── UsersModule

CartModule
 └── AuthModule

OrdersModule
 └── AuthModule

UsersModule
 └── AuthModule
```

Eight total edges.

---

# 16.7 forwardRef

For:

```ts
forwardRef(() => SomeModule)
```

never execute the callback.

If the imported module cannot be safely resolved, preserve:

```text
sourceText
kind = call
isStatic = false
```

Future normalization may resolve it.

---

# 16.8 Verification

```bash
pnpm test:nest:module
```

Then E1–E9 regressions and typecheck.

STOP.

---

# 17. E10 — Unified Semantic Model

## 17.1 Objective

Combine E1–E9 into one immutable application-level model.

File:

```text
packages/provider-nestjs/src/semantic/unified-model.ts
```

Test:

```text
packages/provider-nestjs/test/unified-semantic-model.test.ts
```

---

# 17.2 RouteOperation

Required established contract:

```ts
export interface RouteOperation {
    readonly identityKey: string;

    readonly controllerName: string;
    readonly methodName: string;

    readonly controllerNormalizedPath: string;
    readonly controllerSourcePath: string | undefined;

    readonly decoratorName: string;
    readonly decoratorIndex: number;

    readonly httpMethod: HttpMethod;

    readonly routeSourcePath: string | undefined;
    readonly routePathValue: string | undefined;
    readonly routeExpressionKind: string;
    readonly routeNormalizedPath: string;

    readonly isStatic: boolean;
    readonly composedPath: string;

    readonly parameters: RouteMetadata["parameters"];

    readonly guards: RouteMetadata["guards"];
    readonly pipes: RouteMetadata["pipes"];
    readonly interceptors: RouteMetadata["interceptors"];
    readonly filters: RouteMetadata["filters"];

    readonly httpCode: RouteMetadata["httpCode"];
    readonly headers: RouteMetadata["headers"];
    readonly redirect: RouteMetadata["redirect"];

    readonly moduleName: string | undefined;

    readonly classGuards: ControllerMetadata["classGuards"];
    readonly classPipes: ControllerMetadata["classPipes"];
    readonly classInterceptors: ControllerMetadata["classInterceptors"];
    readonly classFilters: ControllerMetadata["classFilters"];
}
```

---

# 17.3 ControllerModel

Use:

```ts
export type ControllerModel =
    Omit<ControllerMetadata, "routes"> & {
        readonly routes: readonly RouteOperation[];
    };
```

This preserves controller metadata while replacing raw routes with unified route operations.

---

# 17.4 ModuleModel

Use the established model:

```ts
export type ModuleModel =
    Omit<ModuleMetadata, "controllers" | "providers"> & {
        readonly controllers: readonly string[];
        readonly providers: readonly string[];

        readonly controllerClassNames: readonly string[];
        readonly providerClassNames: readonly string[];
    };
```

---

# 17.5 SpectraSemanticModel

The top-level contract:

```ts
export interface SpectraSemanticModel {
    readonly version: string;
    readonly builtAt: string;

    readonly modules: readonly ModuleModel[];
    readonly controllers: readonly ControllerModel[];
    readonly operations: readonly RouteOperation[];

    readonly moduleEdges: readonly ModuleImportEdge[];
}
```

---

# 17.6 UnifiedSemanticExtractor

Constructor:

```ts
constructor(
    controllerAnalyzer: ControllerAnalyzer,
    routeAnalyzer: RouteAnalyzer,
    moduleExtractor: ModuleSourceExtractor,
)
```

Do not instantiate duplicate infrastructure internally if dependency injection is already established.

---

# 17.7 extract()

Algorithm:

```text
1. scan/extract modules
2. analyze controllers
3. compose controller routes
4. convert routes to RouteOperation
5. map controllers to modules
6. flatten operations
7. return SpectraSemanticModel
```

No document generation.

---

# 17.8 Identity

Every route operation receives:

```text
${controllerName}.${methodName}#${httpMethod}
```

Example:

```text
ProductsController.findOne#GET
```

This is the operation identity.

Do not use only composed path because two operations can potentially share a path.

---

# 17.9 Example-api acceptance test

The real integration test must verify:

```text
modules = 6
controllers = 7
operations = 18
moduleEdges = 8
```

Verify:

```text
ProductsController.findOne
```

has:

```text
composedPath = /products/:id
httpMethod = GET
parameters.length = 1
```

Verify:

```text
UsersController.getProfile
```

has:

```text
moduleName = UsersModule
guards.length = 1
```

Verify:

```text
AppModule
```

imports:

```text
AuthModule
CartModule
OrdersModule
ProductsModule
UsersModule
```

---

# 17.10 E10 must NOT contain

Do not create:

```text
Documentation
Path
Operation
Request
Response
Schema
Components
OpenAPI
JSON output
CLI
```

Those belong to Phase F/G.

---

# 18. Final E Directory Structure

After E10, provider-nestjs should approximately have:

```text
packages/provider-nestjs/
│
├── src/
│   │
│   ├── analyzer/
│   │   ├── ControllerAnalyzer.ts
│   │   └── RouteAnalyzer.ts
│   │
│   ├── config/
│   │   └── SpectraConfig.ts
│   │
│   ├── metadata/
│   │   ├── ControllerMetadata.ts
│   │   └── RouteMetadata.ts
│   │
│   ├── semantic/
│   │   ├── decorator-arg.ts
│   │   ├── guard-source.ts
│   │   ├── http-metadata.ts
│   │   ├── module-source.ts
│   │   ├── parameter-source.ts
│   │   ├── parameter-type.ts
│   │   ├── unified-model.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
└── test/
    ├── controller-semantic.test.ts
    ├── route-semantic.test.ts
    ├── route-composition-semantic.test.ts
    ├── parameter-semantic.test.ts
    ├── type-semantic.test.ts
    ├── guard-semantic.test.ts
    ├── pipe-interceptor-filter-semantic.test.ts
    ├── http-metadata-semantic.test.ts
    ├── module-semantic.test.ts
    └── unified-semantic-model.test.ts
```

---

# 19. E Test Matrix

| Step | Feature | Synthetic | example-api | Typecheck | Regression |
|---|---|---:|---:|---:|---:|
| E1 | Controllers | required | required | required | required |
| E2 | Routes | required | required | required | required |
| E3 | Composition | required | required | required | required |
| E4 | Parameters | required | required | required | required |
| E5 | Types | required | required | required | required |
| E6 | Guards | required | required | required | required |
| E7 | P/I/F | required | required | required | required |
| E8 | HTTP metadata | required | required | required | required |
| E9 | Modules | required | required | required | required |
| E10 | Unified model | required | required | required | required |

---

# 20. E10 Expected Example-api Semantic Shape

The actual object will contain considerably more fields, but conceptually:

```ts
{
    version: "1.0.0",

    builtAt: "...",

    modules: [
        {
            name: "AppModule",
            imports: [...],
            controllers: [...],
            providers: [...]
        },

        {
            name: "ProductsModule",
            controllers: ["ProductsController"],
            providers: ["ProductsService"]
        },

        ...
    ],

    controllers: [
        {
            name: "ProductsController",
            normalizedPath: "/products",

            routes: [
                {
                    identityKey:
                        "ProductsController.findOne#GET",

                    controllerName:
                        "ProductsController",

                    methodName:
                        "findOne",

                    httpMethod:
                        "GET",

                    composedPath:
                        "/products/:id",

                    parameters: [...],

                    guards: [...],

                    pipes: [...],

                    interceptors: [...],

                    filters: [...],

                    httpCode: ...,

                    headers: [...],

                    redirect: ...,

                    moduleName:
                        "ProductsModule"
                }
            ]
        }
    ],

    operations: [
        // flattened RouteOperation objects
    ],

    moduleEdges: [
        {
            fromModuleName: "AppModule",
            toModuleName: "ProductsModule"
        }
    ]
}
```

This is **semantic data**, not yet documentation data.

---

# 21. E-to-F Boundary

At the end of E10:

```text
SOURCE
  ↓
AST
  ↓
NestJS semantics
  ↓
SpectraSemanticModel
```

Phase F starts here:

```text
SpectraSemanticModel
  ↓
Documentation model
```

---

# 22. Important Difference: Semantic Model vs Documentation Model

## Semantic model

Answers:

```text
What did the developer write?
What NestJS structures exist?
What decorators are present?
What types are declared?
What modules contain what?
```

Example:

```text
@Body() body: CreateProductDto
```

Semantic representation:

```text
parameter:
    decorator = Body
    type = CreateProductDto
    type.class = true
```

---

## Documentation model

Answers:

```text
How should this become API documentation?
```

The same parameter might become:

```text
request.body
    content
        application/json
            schema
                $ref -> CreateProductDto
```

The conversion belongs to F.

---

# 23. Agent Protocol

The coding agent must work one step at a time.

For each step, it must report:

## 23.1 Status

```text
E<n> — Complete
```

## 23.2 Production files

List every changed file.

## 23.3 Test files

List every changed file.

## 23.4 Code explanation

Explain:

```text
what was implemented
why
which existing code was reused
```

## 23.5 Exact commands

Show commands that were actually executed.

## 23.6 Actual output

Do not fabricate output.

## 23.7 Example-api verification

Show real values extracted from:

```text
apps/example-api
```

## 23.8 Typecheck

Run:

```bash
pnpm exec tsc --noEmit -p packages/provider-nestjs/tsconfig.json
```

## 23.9 Regression

Run every completed E test.

## 23.10 Commit

Commit only after tests pass.

## 23.11 STOP

After completing E<n>:

```text
STOP — awaiting approval for E<n+1>
```

Never automatically continue.

---

# 24. Agent Prohibitions

The coding agent must NOT:

1. redesign the architecture;
2. move files without explicit reason;
3. create duplicate AST infrastructure;
4. create duplicate scanners;
5. create duplicate TypeResolvers;
6. create duplicate SymbolResolvers;
7. create duplicate DeclarationResolvers;
8. execute application code;
9. instantiate DTOs;
10. instantiate guards;
11. instantiate pipes;
12. instantiate interceptors;
13. execute factories;
14. invent descriptions;
15. invent response types;
16. invent parameter names;
17. guess dynamic expressions;
18. start Phase F;
19. start CLI work;
20. generate OpenAPI;
21. generate documentation;
22. modify unrelated packages;
23. silently fix unrelated defects;
24. skip example-api tests;
25. continue to the next step without approval.

---

# 25. Known E Findings

These findings must not be silently reinterpreted as architectural failures.

## E9/E10 synthetic-source issue

The previous implementation had a synthetic test-source placement issue:

```text
@Get()
@Post()
```

were placed at module scope rather than inside a class.

This caused the known E10 Part A partial failure.

The real:

```text
apps/example-api
```

integration passed.

The agent may polish the synthetic test later if explicitly instructed, but must not redesign the architecture because of it.

---

# 26. Existing Completed E Commit Baseline

Known commits:

```text
E4  7851b3c
E5  f477279
E7  37a092d
E8  c5bcb3a
E9  6d164c6
E10 42523be
```

Do not rewrite completed commits.

If the repository contains later corrected hashes, use the repository history as authoritative.

---

# 27. E Definition of Done

E is complete only when:

```text
[x] Controller extraction
[x] Route extraction
[x] Route composition
[x] Parameter extraction
[x] Parameter type extraction
[x] Guard extraction
[x] Pipe extraction
[x] Interceptor extraction
[x] Filter extraction
[x] HTTP metadata extraction
[x] Module extraction
[x] Module relationship extraction
[x] Unified semantic model
[x] example-api integration
[x] Typecheck
[x] Regression suite
[x] Documentation of every step
[x] Commit for every step
```

---

# 28. Final Architectural Principle

The entire system must preserve this separation:

```text
                 ANALYSIS LAYER
                       │
                       ▼
              ┌──────────────────┐
              │   provider-ast   │
              └────────┬─────────┘
                       │
                       ▼
             ┌────────────────────┐
             │  provider-nestjs   │
             │                    │
             │ NestJS semantics   │
             └────────┬───────────┘
                      │
                      ▼
             ┌────────────────────┐
             │ SpectraSemantic    │
             │ Model              │
             └────────┬───────────┘
                      │
                 PHASE F
                      │
                      ▼
             ┌────────────────────┐
             │ Documentation      │
             │ Model              │
             └────────┬───────────┘
                      │
                 PHASE G
                      │
                      ▼
             ┌────────────────────┐
             │ CLI / Output       │
             └────────────────────┘
```

The rule is:

> **E discovers and understands the application. F converts that understanding into documentation. G exposes and outputs it.**

Do not collapse these responsibilities.

---

# 29. Agent Instruction

When this document is supplied to the coding agent:

```text
Read this document first.

Do not redesign the architecture.

Do not skip ahead.

Determine the current completed E step from the repository and git history.

If E<n> is the next incomplete step, implement ONLY E<n>.

Use the exact directory boundaries and responsibilities described here.

Inspect existing implementations before writing code.

Reuse provider-ast primitives.

Add synthetic and apps/example-api integration tests.

Run typecheck.

Run all previous regression tests.

Commit the completed step.

Report:
- files changed
- code implemented
- tests
- example-api results
- typecheck
- regressions
- commit hash

Then STOP.

Do not start the next step without explicit approval.
```

---

# 30. End of E Master Specification

After E10 is verified, do not immediately start implementation of F.

First inspect the complete real object produced from:

```text
apps/example-api
```

and compare it against the target Spectra core models:

```text
Documentation
Info
Server
Tag
Components
Path
Operation
Request
Response
Parameter
Header
RequestBody
ResponseBody
MediaType
Schema
```

Then design Phase F as a separate controlled sequence.

**E ends at `SpectraSemanticModel`.**
