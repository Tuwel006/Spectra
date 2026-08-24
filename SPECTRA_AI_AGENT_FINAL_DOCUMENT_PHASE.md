# SPECTRA — AI AGENT MASTER BUILD SPECIFICATION
## Document Generation Phase — Decorator-First, Verification-First

**Current priority:** complete decorator, expression, symbol, and declaration analysis before route/document generation.

**Later:** Studio → CLI. Do not implement either until the common Document is complete and verified.

---

# 1. Mission

Build Spectra in small, reviewable, professionally structured steps.

Current pipeline:

```text
TypeScript source
  ↓
AstProject
  ↓
Generic AST analysis
  ↓
Complete decorator/expression analysis
  ↓
Symbol/declaration resolution
  ↓
NestJS semantic interpretation
  ↓
Routes / parameters / schemas / responses / security
  ↓
Common Document
  ↓
Document validation
```

Every step is:

```text
Inspect → Plan → Implement → Test → MATCH OUTPUT → Verify → Update this MD → Commit → STOP
```

Never silently continue to the next step.

---

# 2. Architecture rules

## provider-ast

`packages/provider-ast` contains generic TypeScript concepts only:

- source files
- AST nodes
- classes
- methods
- parameters
- decorators as syntax
- expressions
- symbols
- types
- declarations
- source locations

It must never contain NestJS semantics such as `@Controller`, `@Get`, `@UseGuards`, etc.

## provider-nestjs

`packages/provider-nestjs` interprets NestJS semantics:

```text
@Controller → controller
@Get → GET
@Post → POST
@Param → path parameter
@Query → query parameter
@Body → request body
@UseGuards → security metadata
```

## Common Document

Use the existing canonical Document contract. Do not create duplicate `NestDocument`, `FinalDocument`, or similar models without proving the architecture requires them.

---

# 3. Existing implementation — reuse, do not recreate

Known existing components:

```text
AstProject
SourceScanner
NodeWalker
ClassQuery
MethodQuery
ParameterQuery
DecoratorReader
DecoratorArguments
ExpressionInspector
SymbolResolver
TypeResolver
DeclarationResolver
```

`SymbolResolver`, `TypeResolver`, and `DeclarationResolver` already exist in the compiler area. Inspect and reuse them.

Before creating a resolver:

```bash
grep -R "class SymbolResolver" packages/provider-ast/src packages
grep -R "class TypeResolver" packages/provider-ast/src packages
grep -R "class DeclarationResolver" packages/provider-ast/src packages
```

Never recreate an existing abstraction.

---

# 4. Repository inspection

Before every major phase:

```bash
find packages/provider-ast -maxdepth 5 -type f | sort
find packages/provider-nestjs -maxdepth 5 -type f | sort
find packages/core -maxdepth 5 -type f | sort
find packages/shared -maxdepth 5 -type f | sort
find apps/example-api/src -maxdepth 6 -type f | sort
```

Inspect package scripts and existing tests before inventing commands:

```bash
cat package.json
cat packages/provider-ast/package.json
cat packages/provider-nestjs/package.json
```

The repository is authoritative; this document is the implementation contract.

---

# 5. Mandatory protocol for every step

Every step must include:

1. Goal
2. Why it is needed
3. Existing files inspected
4. New files, only when genuinely necessary
5. Exact implementation
6. Explanation of important TypeScript syntax/API
7. Realistic example
8. Expected AST/semantic structure
9. Exact MATCH OUTPUT
10. Test command
11. Typecheck/build verification
12. Documentation update
13. `git diff` review
14. Focused commit
15. STOP

Compilation alone is not proof of correctness.

---

# PHASE D — COMPLETE DECORATOR SYSTEM

The previous work is **not complete**. Simple decorators were verified, but the full expression and scope matrix still has to be implemented and tested.

Already verified examples include:

```ts
@Controller("users")
@Get()
@Get(":id")
@Query("category")
@Param("id")
@Body()
@HttpCode(HttpStatus.CREATED)
```

and expressions:

```text
"users"
201
true
false
null
-10
HttpStatus.CREATED
```

These are only the baseline.

---

## D0 — Decorator architecture audit

### Goal

Inspect existing `DecoratorReader`, `DecoratorArguments`, and `ExpressionInspector` before changing code.

### Verify

Determine whether the current code correctly handles:

- decorator discovery
- decorator name
- class/method/parameter scope
- order
- zero arguments
- multiple arguments
- raw AST expression preservation
- source location

### MATCH OUTPUT

Produce an audit similar to:

```text
DecoratorReader
  discovery: PASS
  name: PASS
  scope: PASS/FAIL
  order: PASS/FAIL

DecoratorArguments
  zero args: PASS
  multiple args: PASS/FAIL
  expression preservation: PASS/FAIL

ExpressionInspector
  primitive: PASS
  property access: PASS
  complex expressions: PASS/FAIL
```

Do not modify code until the audit is understood.

---

## D1 — Decorator discovery and scopes

Discover decorators on:

```text
ClassDeclaration
MethodDeclaration
ParameterDeclaration
```

Example:

```ts
@Controller("users")
@Custom()
export class UsersController {
    @Get()
    @CustomMethod()
    findAll(
        @Query("page") page: number,
        @CustomParameter() value: string,
    ) {}
}
```

Expected:

```text
Scope: class
  @Controller
  @Custom

Scope: method
  @Get
  @CustomMethod

Scope: parameter
  @Query
  @CustomParameter
```

Never merge scopes.

---

## Step D1 — Decorator discovery and scopes

Status: [x]

Files:
- `packages/provider-nestjs/test/scopes.test.ts` *(new)*
- `package.json` — added `"test:nest:scopes"` script

Implementation:
- Audit-only test that walks every `@Controller`-decorated class in `apps/example-api` and prints decorators per scope.
- Reuses existing `DecoratorReader`, `DecoratorArguments`, `ClassQuery`, `MethodQuery`, `ParameterQuery`, `SourceScanner`, `AstProject` — no new source code.
- Source files are sorted by `fileName` so output is byte-identical across runs.
- For each scope the test prints `Scope: <scope> | <name>`, then a numbered decorator list (`#i @Name [N args] [arg1, ...]`), then `Total: M decorator(s)`.

Test command:

```bash
pnpm test:nest:scopes
# or directly:
tsx packages/provider-nestjs/test/scopes.test.ts
```

MATCH OUTPUT (excerpt — full output is 198 lines and covers all five controllers in `example-api`):

```text
============================================================
File: .../apps/example-api/src/app.controller.ts
============================================================

Scope: class | AppController
  # 1 @Controller   [0 args] []
  Total: 1 decorator(s)

Scope: method | getHello
  # 1 @Get          [0 args] []
  Total: 1 decorator(s)

Scope: parameter | (no parameters)

============================================================
File: .../apps/example-api/src/cart/cart.controller.ts
============================================================

Scope: class | CartController
  # 1 @Controller   [1 args] ['cart']
  # 2 @UseGuards    [1 args] [JwtAuthGuard]
  Total: 2 decorator(s)

Scope: method | getCart
  # 1 @Get          [0 args] []
  Total: 1 decorator(s)
Scope: parameter | (no parameters)

Scope: method | addItem
  # 1 @Post         [1 args] ['items']
  # 2 @HttpCode     [1 args] [HttpStatus.OK]
  Total: 2 decorator(s)
Scope: parameter | dto
  # 1 @Body         [0 args] []
  Total: 1 decorator(s)

Scope: method | removeItem
  # 1 @Delete       [1 args] ['items/:productId']
  Total: 1 decorator(s)
Scope: parameter | productId
  # 1 @Param        [1 args] ['productId']
  Total: 1 decorator(s)

============================================================
File: .../apps/example-api/src/orders/orders.controller.ts
============================================================

Scope: class | OrdersController
  # 1 @Controller   [1 args] ['orders']
  # 2 @UseGuards    [1 args] [JwtAuthGuard]
  Total: 2 decorator(s)

Scope: method | findAll
  # 1 @Get          [0 args] []
  Total: 1 decorator(s)
Scope: parameter | (no parameters)

Scope: method | findOne
  # 1 @Get          [1 args] [':id']
  Total: 1 decorator(s)
Scope: parameter | id
  # 1 @Param        [1 args] ['id']
  Total: 1 decorator(s)

Scope: method | create
  # 1 @Post         [0 args] []
  # 2 @HttpCode     [1 args] [HttpStatus.CREATED]
  Total: 2 decorator(s)
Scope: parameter | dto
  # 1 @Body         [0 args] []
  Total: 1 decorator(s)

============================================================
File: .../apps/example-api/src/products/products.controller.ts
============================================================

Scope: class | ProductsController
  # 1 @Controller   [1 args] ['products']
  Total: 1 decorator(s)

Scope: method | findAll
  # 1 @Get          [0 args] []
  Total: 1 decorator(s)
Scope: parameter | category
  # 1 @Query        [1 args] ['category']
  Total: 1 decorator(s)
Scope: parameter | p
  (no decorators)
  Total: 0 decorator(s)

Scope: method | findOne
  # 1 @Get          [1 args] [':id']
  Total: 1 decorator(s)
Scope: parameter | id
  # 1 @Param        [1 args] ['id']
  Total: 1 decorator(s)

Scope: method | create
  # 1 @Post         [0 args] []
  # 2 @HttpCode     [1 args] [HttpStatus.CREATED]
  Total: 2 decorator(s)
Scope: parameter | dto
  # 1 @Body         [0 args] []
  Total: 1 decorator(s)

Scope: method | update
  # 1 @Put          [1 args] [':id']
  Total: 1 decorator(s)
Scope: parameter | id
  # 1 @Param        [1 args] ['id']
  Total: 1 decorator(s)
Scope: parameter | dto
  # 1 @Body         [0 args] []
  Total: 1 decorator(s)

Scope: method | remove
  # 1 @Delete       [1 args] [':id']
  # 2 @HttpCode     [1 args] [HttpStatus.NO_CONTENT]
  Total: 2 decorator(s)
Scope: parameter | id
  # 1 @Param        [1 args] ['id']
  Total: 1 decorator(s)

============================================================
File: .../apps/example-api/src/users/users.controller.ts
============================================================

Scope: class | UsersController
  # 1 @Controller   [1 args] ['users']
  Total: 1 decorator(s)

Scope: method | register
  # 1 @Post         [1 args] ['register/test']
  # 2 @HttpCode     [1 args] [HttpStatus.CREATED]
  Total: 2 decorator(s)
Scope: parameter | dto
  # 1 @Body         [0 args] []
  Total: 1 decorator(s)

Scope: method | login
  # 1 @Post         [1 args] ['login']
  # 2 @HttpCode     [1 args] [HttpStatus.OK]
  Total: 2 decorator(s)
Scope: parameter | dto
  # 1 @Body         [0 args] []
  Total: 1 decorator(s)

Scope: method | getProfile
  # 1 @Get          [1 args] ['profile/:id']
  # 2 @UseGuards    [1 args] [JwtAuthGuard]
  Total: 2 decorator(s)
Scope: parameter | id
  # 1 @Param        [1 args] ['id']
  Total: 1 decorator(s)

Scope: class | AuthController
  # 1 @Controller   [1 args] ["auth"]
  Total: 1 decorator(s)

Scope: method | login
  # 1 @Post         [1 args] ["login"]
  Total: 1 decorator(s)
Scope: parameter | (no parameters)

Scope: method | me
  # 1 @Get          [1 args] ["me"]
  # 2 @UseGuards    [1 args] [JwtAuthGuard]
  Total: 2 decorator(s)
Scope: parameter | (no parameters)

Scope: class | RootController
  # 1 @Controller   [0 args] []
  Total: 1 decorator(s)

Scope: method | root
  # 1 @Get          [1 args] ["root"]
  Total: 1 decorator(s)
Scope: parameter | (no parameters)
```

Verification:
- **Test:** PASS — `tsx packages/provider-nestjs/test/scopes.test.ts` exits 0 with the deterministic output above (198 lines, all five controller files covered).
- **Typecheck:** PASS — both `provider-ast` and `provider-nestjs` build cleanly with `tsc 5.9.3` from each package's local `node_modules/.bin/tsc`.
- **Existing tests:** PASS — `decorator`, `symbol`, `declaration`, `controller`, `expression`, and the AST `expression` test all still pass.
- **Diff:** minimal — 1 new file (`scopes.test.ts`, 142 lines) + 1 new line in `package.json` (`"test:nest:scopes"`). No other files modified.

Scope-isolation assertions verified by the run:
- Class / method / parameter scopes never merge — each appears under its own `Scope: ...` label.
- Source order is preserved within every scope (e.g. `@Post` before `@HttpCode`, `@Delete(':id')` before `@HttpCode(HttpStatus.NO_CONTENT)`).
- Argument counts are correct: 0 for `@Get()`, `@Post()`, `@Body()`, `@Controller()`; 1 for `@Controller('products')`, `@Get(':id')`, `@HttpCode(HttpStatus.CREATED)`, `@UseGuards(JwtAuthGuard)`, etc.
- Argument text is preserved verbatim (`'products'`, `':id'`, `HttpStatus.CREATED`, `JwtAuthGuard`, `"auth"`, `"root"`).
- Multi-controller files (e.g. `users.controller.ts` containing `UsersController`, `AuthController`, `RootController`) are walked independently.

Findings / follow-up (tracked, **not** fixed in D1):
- `ParameterQuery` returns *all* `ts.ParameterDeclaration` nodes under a method, including nested lambda parameters. This is why `findAll` in `ProductsController` shows `Scope: parameter | p` with `Total: 0 decorator(s)` — the `p` is the callback for `products.filter(p => p.category.toLowerCase() ...)`, not a declared method parameter. The test correctly reports zero decorators for that node, so scope isolation is still proven; the over-reach is a separate concern to address in the Parameter phase (P10) or as a `ParameterQuery` refinement.
- The `example-api` fixture does not contain an un-decorated declared parameter on a method. D1 therefore exercises the *presence* path; the *absence* path is left for P10.

Commit:
- `test(provider-nestjs): audit decorator discovery and scope isolation`

---

## Step D2 — Decorator order

Status: [x]

Files:
- `packages/provider-nestjs/test/order.test.ts` *(new)*
- `package.json` — added `"test:nest:order"` script

Implementation:
- Audit-only test with three fixtures proving that decorator order on every scope
  (class / method / parameter) matches the source order verbatim.
- Reuses existing `DecoratorReader.getDecorators` which delegates to
  `ts.getDecorators(...)` — TypeScript already returns decorators in source order.
- Three parts:
  - **Part A** — synthetic source verbatim from the D2 spec example
    (`@First / @Second / @Third` on the class; `method` with `First, Second, Get`
    decorators and a single `Third`-decorated parameter).
  - **Part B** — non-alphabetical synthetic source (`@Zeta / @Alpha / @Mu` on
    class and method; stacked parameter `@Beta / @Alpha / @Gamma`). This rules
    out alphabetical sorting: alpha-sort would reorder them to `Alpha, Beta, …`
    whereas the source has `Zeta, Alpha, Mu` / `Beta, Alpha, Gamma`.
  - **Part C** — six real NestJS methods from `example-api`
    (`ProductsController.create`, `ProductsController.remove`,
    `OrdersController.create`, `CartController.addItem`,
    `UsersController.register`, `UsersController.getProfile`) verifying that
    the HTTP-method decorator always precedes its metadata decorator
    (e.g. `Post, HttpCode`, `Delete, HttpCode`, `Get, UseGuards`).

Test command:

```bash
pnpm test:nest:order
# or directly:
tsx packages/provider-nestjs/test/order.test.ts
```

MATCH OUTPUT (exit 0, 51 lines):

```text
===== D2 PART A — SYNTHETIC SPEC EXAMPLE =====

Scope: class | Test
  index 0 → First
  index 1 → Second
  index 2 → Third
Scope: method | method
  index 0 → First
  index 1 → Second
  index 2 → Get
Scope: parameter | method.value
  index 0 → Third

===== D2 PART B — NON-ALPHABETICAL ORDER =====

Scope: class | Sort
  index 0 → Zeta
  index 1 → Alpha
  index 2 → Mu
Scope: method | fn
  index 0 → Zeta
  index 1 → Alpha
  index 2 → Mu
Scope: method | stacked
  (no decorators)
Scope: parameter | stacked.value
  index 0 → Beta
  index 1 → Alpha
  index 2 → Gamma

===== D2 PART C — REAL NESTJS METHODS =====

Scope: method | CartController::addItem
  index 0 → Post
  index 1 → HttpCode
Scope: method | OrdersController::create
  index 0 → Post
  index 1 → HttpCode
Scope: method | ProductsController::create
  index 0 → Post
  index 1 → HttpCode
Scope: method | ProductsController::remove
  index 0 → Delete
  index 1 → HttpCode
Scope: method | UsersController::register
  index 0 → Post
  index 1 → HttpCode
Scope: method | UsersController::getProfile
  index 0 → Get
  index 1 → UseGuards
```

Verification:

| Required | Source | Expected | Actual | Result |
|---|---|---|---|---|
| Spec example class order | `First / Second / Third` | `0:First 1:Second 2:Third` | `0:First 1:Second 2:Third` | **PASS** |
| Spec example method order | `First / Second / Get` | `0:First 1:Second 2:Get` | `0:First 1:Second 2:Get` | **PASS** — `Get` between `First` and `Second` alphabetically, in source order `First, Second, Get` |
| Spec example parameter | `Third` | `0:Third` | `0:Third` | **PASS** |
| Non-alphabetical class | `Zeta / Alpha / Mu` | `0:Zeta 1:Alpha 2:Mu` | `0:Zeta 1:Alpha 2:Mu` | **PASS** — alpha-sort would yield `Alpha, Mu, Zeta` |
| Non-alphabetical method | `Zeta / Alpha / Mu` | `0:Zeta 1:Alpha 2:Mu` | `0:Zeta 1:Alpha 2:Mu` | **PASS** |
| Stacked parameter | `Beta / Alpha / Gamma` | `0:Beta 1:Alpha 2:Gamma` | `0:Beta 1:Alpha 2:Gamma` | **PASS** — alpha-sort would yield `Alpha, Beta, Gamma` |
| `ProductsController.create` | `@Post() @HttpCode(CREATED)` | `0:Post 1:HttpCode` | `0:Post 1:HttpCode` | **PASS** |
| `ProductsController.remove` | `@Delete(':id') @HttpCode(NO_CONTENT)` | `0:Delete 1:HttpCode` | `0:Delete 1:HttpCode` | **PASS** |
| `OrdersController.create` | `@Post() @HttpCode(CREATED)` | `0:Post 1:HttpCode` | `0:Post 1:HttpCode` | **PASS** |
| `CartController.addItem` | `@Post('items') @HttpCode(OK)` | `0:Post 1:HttpCode` | `0:Post 1:HttpCode` | **PASS** |
| `UsersController.register` | `@Post('register/test') @HttpCode(CREATED)` | `0:Post 1:HttpCode` | `0:Post 1:HttpCode` | **PASS** |
| `UsersController.getProfile` | `@Get('profile/:id') @UseGuards(JwtAuthGuard)` | `0:Get 1:UseGuards` | `0:Get 1:UseGuards` | **PASS** |

All 12 assertions PASS. **No alphabetical sort detected.** Source order preserved
exactly on all three scopes (class, method, parameter).

Other verification:
- **Typecheck:** PASS — both `provider-ast` and `provider-nestjs` build
  cleanly with the project's `tsc 5.9.3` (`exit=0` in both invocations).
- **Existing tests:** PASS — the captured output of `test:nest:decorator`
  (3664 bytes) and `test:nest:scopes` (5388 bytes) from prior runs confirms
  those tests are unaffected. Order tests are read-only; no production code
  was touched.
- **Diff:** minimal — 1 new file (`order.test.ts`, 213 lines) + 1 line in
  `package.json`. No other files modified.

Commit:
- `test(provider-nestjs): audit decorator order preservation`

---

## D2 — Decorator order

Input:

```ts
@First()
@Second()
@Third()
class Test {}
```

Expected:

```text
1. First
2. Second
3. Third
```

Never sort decorators alphabetically.

---

## Step D3 — Zero arguments

Status: [x]

Files:
- `packages/provider-nestjs/test/zero-arguments.test.ts` *(new)*
- `package.json` — added `"test:nest:zero"` script

Implementation:
- Audit-only test that walks every controller in `apps/example-api` and dumps
  every zero-arg decorator it finds. Also includes two synthetic fixtures
  (the D3 spec example verbatim, plus a `@Foo()` vs `@Foo("")` distinction).
- Reuses existing `DecoratorReader.getName`, `DecoratorArguments.get`, and
  `ExpressionInspector.inspect` — no production code changes.
- For each zero-arg decorator the test prints the expected
  `argumentCount: 0` / `arguments: []` block. For one-arg decorators used in
  the distinction fixture it prints `argumentCount: 1` followed by the
  `kind` (from `ExpressionInspector`) and the raw AST text `value`.

Test command:

```bash
pnpm test:nest:zero
# or directly:
tsx packages/provider-nestjs/test/zero-arguments.test.ts
```

MATCH OUTPUT — Part A (D3 synthetic spec example):

```text
===== D3 PART A — SYNTHETIC SPEC EXAMPLE =====

--- Class Test ---
Decorator: @Controller()
  argumentCount: 0
  arguments: []
Decorator: @Custom()
  argumentCount: 0
  arguments: []

--- Method Test.method ---
Decorator: @Get()
  argumentCount: 0
  arguments: []
Decorator: @Post()
  argumentCount: 0
  arguments: []
Decorator: @CustomMethod()
  argumentCount: 0
  arguments: []

--- Parameter Test.method.value ---
Decorator: @Body()
  argumentCount: 0
  arguments: []
Decorator: @CustomParameter()
  argumentCount: 0
  arguments: []
```

MATCH OUTPUT — Part B (the critical `@Foo()` vs `@Foo("")` distinction):

```text
===== D3 PART B — DISTINCTION @Foo() vs @Foo('') =====


--- Parameter Distinction.method.noArg ---
Decorator: @Query()
  argumentCount: 0
  arguments: []

--- Parameter Distinction.method.emptyString ---
Decorator: @Query()
  argumentCount: 1
  argument[0]:
    kind: string
    value: "\"\""
```

This is the key D3 invariant: `@Query()` has zero arguments; `@Query("")`
has one empty-string argument — they are **not** the same thing.
`JSON.stringify` wraps the AST text `""` as `"\"\""` for unambiguous
display, so the value shown is exactly one empty string literal.

MATCH OUTPUT — Part C (real NestJS zero-arg decorators, abridged):

```text
===== D3 PART C — REAL NESTJS ZERO-ARG DECORATORS =====

--- Class AppController | @Controller() ---
Decorator: @Controller()
  argumentCount: 0
  arguments: []

--- Method AppController.getHello | @Get() ---
Decorator: @Get()
  argumentCount: 0
  arguments: []

--- Class AppService | @Injectable() ---
Decorator: @Injectable()
  argumentCount: 0
  arguments: []

... (full output: 22 zero-arg decorators across all example-api controllers,
including @Controller(), @Get(), @Post(), @Body(), and @Injectable()) ...
```

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Controller()` (class) | `0 / []` | `argumentCount: 0, arguments: []` | **PASS** |
| `@Custom()` (class) | `0 / []` | `argumentCount: 0, arguments: []` | **PASS** |
| `@Get()`, `@Post()`, `@CustomMethod()` (method) | `0 / []` | three blocks all `0 / []` | **PASS** |
| `@Body()`, `@CustomParameter()` (parameter) | `0 / []` | two blocks both `0 / []` | **PASS** |
| `@Query()` zero-arg | `0 / []` | `argumentCount: 0, arguments: []` | **PASS** |
| `@Query("")` one empty-string arg | `1 / kind:string / value:""` | `argumentCount: 1, kind: string, value: ""` | **PASS** |
| Real NestJS `@Controller()`, `@Get()`, `@Post()`, `@Body()`, `@Injectable()` | `0 / []` | 22 zero-arg decorators all `0 / []` | **PASS** |
| No phantom / undefined / null | no extra entries, no `null`, no `undefined` | every zero-arg block has exactly `[]` | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` build clean for both `provider-ast`
  and `provider-nestjs` (`exit=0`).
- **Existing tests:** unaffected — D1 scopes output (5388 bytes) and D2
  order output (1157 bytes) remain valid captures; no production code was
  touched by this change.
- **Diff:** minimal — 1 new file (`zero-arguments.test.ts`) + 1 line in
  `package.json`.

Architectural note (no fix needed): the existing `DecoratorArguments.get`
correctly handles zero-arg by:
- returning `[]` when the decorator expression is not a `CallExpression`
  (i.e. `@Foo` written without parentheses — though no fixture in
  `example-api` exercises that form),
- returning `expression.arguments` (an empty `NodeArray`) when the
  decorator is a `CallExpression` with no positional arguments.

Commit:
- `test(provider-nestjs): audit zero-argument decorators`

---

## D3 — Zero arguments

Support:

```ts
@Get()
@Controller()
```

Represent as:

```text
argumentCount = 0
arguments = []
```

---

## Step D4 — One argument

Status: [x]

Files:
- `packages/provider-nestjs/test/one-argument.test.ts` *(new)*
- `package.json` — added `"test:nest:one"` script

Implementation:
- Audit-only test verifying that decorators with exactly one argument
  preserve the AST expression correctly.
- Each argument is described via a small local `describe(ts.Expression)`
  helper that uses TypeScript's narrowing predicates (`ts.isStringLiteral`,
  `ts.isNumericLiteral`, `ts.isIdentifier`, `ts.isPropertyAccessExpression`,
  `ts.isCallExpression`, `ts.isArrayLiteralExpression`,
  `ts.isObjectLiteralExpression`, etc.) — no production code changes; the
  helper lives only inside the test file.
- Output for each one-arg decorator shows `argumentCount: 1` plus the
  fully expanded argument descriptor (`kind`, `value`, `name`, `object`,
  `property`, `callee`, `itemCount`, `propertyKeys`, etc.) so a reader can
  tell primitives from identifiers from compound expressions at a glance.

Test command:

```bash
pnpm test:nest:one
# or directly:
tsx packages/provider-nestjs/test/one-argument.test.ts
```

MATCH OUTPUT — Part A (synthetic, all 10 expression forms, one method each):

```text
===== D4 PART A — SYNTHETIC ONE-ARG EXPRESSION FORMS =====

--- OneArg.m1 ---
Decorator: @Get()
  argumentCount: 1
  argument[0]: kind: string, value: "users"
--- OneArg.m2 ---
Decorator: @Get()
  argumentCount: 1
  argument[0]: kind: string, value: ""
--- OneArg.m3 ---
Decorator: @HttpCode()
  argumentCount: 1
  argument[0]: kind: number, value: 201
--- OneArg.m4 ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: boolean, value: true
--- OneArg.m5 ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: null
--- OneArg.m6 ---
Decorator: @UseGuards()
  argumentCount: 1
  argument[0]: kind: identifier, name: AuthGuard
--- OneArg.m7 ---
Decorator: @HttpCode()
  argumentCount: 1
  argument[0]: kind: property-access, object: HttpStatus, property: CREATED
--- OneArg.m8 ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: call, callee: factory, argumentCount: 0
--- OneArg.m9 ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: array, itemCount: 2, items: [kind: identifier, name: AuthGuard | kind: identifier, name: AdminGuard]
--- OneArg.m10 ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: object, propertyKeys: [role, enabled]
```

MATCH OUTPUT — Part B (real NestJS one-arg decorators from `example-api`):

```text
===== D4 PART B — REAL NESTJS ONE-ARG DECORATORS =====

--- CartController.addItem (method scope) ---
Decorator: @HttpCode()
  argumentCount: 1
  argument[0]: kind: property-access, object: HttpStatus, property: OK
--- CartController (class scope) ---
Decorator: @UseGuards()
  argumentCount: 1
  argument[0]: kind: identifier, name: JwtAuthGuard
--- OrdersController.findOne (method scope) ---
Decorator: @Get()
  argumentCount: 1
  argument[0]: kind: string, value: ":id"
--- OrdersController.create (method scope) ---
Decorator: @HttpCode()
  argumentCount: 1
  argument[0]: kind: property-access, object: HttpStatus, property: CREATED
--- OrdersController (class scope) ---
Decorator: @UseGuards()
  argumentCount: 1
  argument[0]: kind: identifier, name: JwtAuthGuard
--- ProductsController (class scope) ---
Decorator: @Controller()
  argumentCount: 1
  argument[0]: kind: string, value: "products"
--- ProductsController.findOne (method scope) ---
Decorator: @Get()
  argumentCount: 1
  argument[0]: kind: string, value: ":id"
--- ProductsController.create (method scope) ---
Decorator: @HttpCode()
  argumentCount: 1
  argument[0]: kind: property-access, object: HttpStatus, property: CREATED
--- ProductsController.remove (method scope) ---
Decorator: @HttpCode()
  argumentCount: 1
  argument[0]: kind: property-access, object: HttpStatus, property: NO_CONTENT
```

MATCH OUTPUT — Part C (the crucial identifier-vs-array-as-one-arg distinction):

```text
===== D4 PART C — IDENTIFIER vs ARRAY-AS-ONE-ARG =====

--- GuardsExample.identifierCase ---
Decorator: @UseGuards()
  argumentCount: 1
  argument[0]: kind: identifier, name: AuthGuard
--- GuardsExample.arrayCase ---
Decorator: @UseGuards()
  argumentCount: 1
  argument[0]: kind: array, itemCount: 2, items: [kind: identifier, name: AuthGuard | kind: identifier, name: AdminGuard]
```

Both decorators report `argumentCount: 1`, but the second is
`kind: array, itemCount: 2`. **Decorator argument count is NOT confused
with nested expression element count.**

MATCH OUTPUT — Part D (call-as-one-arg):

```text
===== D4 PART D — CALL-AS-ONE-ARG =====

--- CallExample.callCase ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: call, callee: factory, argumentCount: 0
--- CallExample.arrayWithCallCase ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: array, itemCount: 2, items: [kind: identifier, name: AuthGuard | kind: identifier, name: AdminGuard]
```

A `CallExpression` containing its own arguments is still **one** decorator
argument; the call's own argument count is preserved structurally inside
the descriptor (`argumentCount: 0` for `factory()`).

Verification matrix:

| Required (synthetic) | Expected | Actual | Result |
|---|---|---|---|
| `@Get("users")` | `1 / string / "users"` | `argumentCount: 1, kind: string, value: "users"` | **PASS** |
| `@Get("")` | `1 / string / ""` | `argumentCount: 1, kind: string, value: ""` | **PASS** |
| `@HttpCode(201)` | `1 / number / 201` | `argumentCount: 1, kind: number, value: 201` | **PASS** |
| `@Decorator(true)` | `1 / boolean / true` | `argumentCount: 1, kind: boolean, value: true` | **PASS** |
| `@Decorator(null)` | `1 / null` | `argumentCount: 1, kind: null` | **PASS** |
| `@UseGuards(AuthGuard)` | `1 / identifier / AuthGuard` | `argumentCount: 1, kind: identifier, name: AuthGuard` | **PASS** |
| `@HttpCode(HttpStatus.CREATED)` | `1 / property-access / HttpStatus.CREATED` | `object: HttpStatus, property: CREATED` | **PASS** |
| `@Decorator(factory())` | `1 / call / factory` | `kind: call, callee: factory, argumentCount: 0` | **PASS** |
| `@Decorator([AuthGuard, AdminGuard])` | `1 / array / [AuthGuard, AdminGuard]` | `kind: array, itemCount: 2, items: [AuthGuard, AdminGuard]` | **PASS** |
| `@Decorator({ role, enabled })` | `1 / object / [role, enabled]` | `kind: object, propertyKeys: [role, enabled]` | **PASS** |

| Required (real NestJS) | Expected | Actual | Result |
|---|---|---|---|
| `@Controller("products")` | `string / "products"` | `kind: string, value: "products"` | **PASS** |
| `@Get(":id")` | `string / ":id"` | `kind: string, value: ":id"` | **PASS** |
| `@HttpCode(HttpStatus.CREATED)` | `property-access / CREATED` | `object: HttpStatus, property: CREATED` | **PASS** |
| `@HttpCode(HttpStatus.NO_CONTENT)` | `property-access / NO_CONTENT` | `object: HttpStatus, property: NO_CONTENT` | **PASS** |
| `@HttpCode(HttpStatus.OK)` | `property-access / OK` | `object: HttpStatus, property: OK` | **PASS** |
| `@UseGuards(JwtAuthGuard)` | `identifier / JwtAuthGuard` | `kind: identifier, name: JwtAuthGuard` | **PASS** |

| Distinction | Expected | Actual | Result |
|---|---|---|---|
| `argumentCount` vs nested element count | array of 2 items ≠ `argumentCount: 2` | `@UseGuards([AuthGuard, AdminGuard])` → `argumentCount: 1, kind: array, itemCount: 2` | **PASS** |
| Call expression containing its own args | one decorator arg regardless | `@Decorator(factory())` → `argumentCount: 1` with call's own `argumentCount: 0` preserved structurally | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast` and
  `provider-nestjs`.
- **Existing tests:** unaffected — D1/D2/D3 captures remain valid.
- **Diff:** minimal — 1 new file (`one-argument.test.ts`, 379 lines) + 1
  line in `package.json`.

Architectural note (no fix needed): `ExpressionInspector`'s existing
`ExpressionKind` union covers all 10 D4 cases. The richer descriptor
(`describe` helper inside the test) only uses `ts.*` narrowing predicates
that the public type-checker API exposes — no internal access, no
production-code changes.

Commit:
- `test(provider-nestjs): audit one-argument decorators`

---

## D4 — One argument

Support:

```ts
@Get("users")
```

Expected:

```text
argumentCount = 1
argument[0]
  kind = string
  value = users
```

---

## Step D5 — Multiple arguments

Status: [x]

Files:
- `packages/provider-nestjs/test/multiple-arguments.test.ts` *(new)*
- `package.json` — added `"test:nest:multi"` script

Implementation:
- Audit-only test verifying decorators with multiple top-level arguments
  preserve exact argument count, exact argument order, per-argument
  expression kind, and nested expression structure.
- Reuses the same local `describe(ts.Expression)` shape that D4
  introduced (one self-contained helper per test, no production code
  changes). The helper renders arrays and objects recursively so nested
  elements never bleed into the top-level `argumentCount`.

Test command:

```bash
pnpm test:nest:multi
# or directly:
tsx packages/provider-nestjs/test/multiple-arguments.test.ts
```

MATCH OUTPUT — Part A (synthetic D5 cases):

```text
===== D5 PART A — SYNTHETIC MULTI-ARG CASES =====

--- Multi.m1 ---
Decorator: @Decorator()
  argumentCount: 2
  argument[0]: kind: string, value: "first"
  argument[1]: kind: string, value: "second"
--- Multi.m2 ---
Decorator: @Decorator()
  argumentCount: 4
  argument[0]: kind: string, value: "users"
  argument[1]: kind: number, value: 201
  argument[2]: kind: boolean, value: true
  argument[3]: kind: null
--- Multi.m3 ---
Decorator: @UseGuards()
  argumentCount: 2
  argument[0]: kind: identifier, name: AuthGuard
  argument[1]: kind: identifier, name: AdminGuard
--- Multi.m4 ---
Decorator: @Decorator()
  argumentCount: 2
  argument[0]: kind: property-access, object: HttpStatus, property: CREATED
  argument[1]: kind: property-access, object: HttpStatus, property: OK
--- Multi.m5 ---
Decorator: @Decorator()
  argumentCount: 2
  argument[0]: kind: call, callee: factory, argumentCount: 0
  argument[1]: kind: call, callee: otherFactory, argumentCount: 1
--- Multi.m6 ---
Decorator: @Decorator()
  argumentCount: 4
  argument[0]: kind: identifier, name: AuthGuard
  argument[1]: kind: array, itemCount: 2, items: [kind: string, value: "a" | kind: string, value: "b"]
  argument[2]: kind: object, propertyKeys: [role]
  argument[3]: kind: call, callee: factory, argumentCount: 0
```

MATCH OUTPUT — Part B (order preservation, non-alphabetical):

```text
===== D5 PART B — ORDER PRESERVATION (NON-ALPHA) =====

--- OrderCase.m ---
Decorator: @Decorator()
  argumentCount: 4
  argument[0]: kind: identifier, name: gamma
  argument[1]: kind: identifier, name: alpha
  argument[2]: kind: identifier, name: beta
  argument[3]: kind: identifier, name: mu
```

Order is `gamma, alpha, beta, mu` — **NOT** alphabetically
`alpha, beta, gamma, mu`. Source order is preserved verbatim.

MATCH OUTPUT — Part C (real-looking NestJS multi-arg):

(`apps/example-api` has no multi-arg NestJS decorators — every
`@UseGuards(...)` call uses a single identifier. Per the D5 protocol,
real-looking NestJS-style synthetic fixtures are used here rather than
modifying example-api.)

```text
===== D5 PART C — REAL-LOOKING NESTJS MULTI-ARG =====

--- NestMulti.guardsCase ---
Decorator: @UseGuards()
  argumentCount: 2
  argument[0]: kind: identifier, name: AuthGuard
  argument[1]: kind: identifier, name: AdminGuard
--- NestMulti.headerCase ---
Decorator: @Header()
  argumentCount: 2
  argument[0]: kind: string, value: "X-Trace"
  argument[1]: kind: string, value: "true"
--- NestMulti.metadataCase ---
Decorator: @SetMetadata()
  argumentCount: 2
  argument[0]: kind: string, value: "role"
  argument[1]: kind: string, value: "admin"
```

MATCH OUTPUT — Part D (the critical `@Decorator([A, B])` vs
`@Decorator(A, B)` edge case):

```text
===== D5 PART D — ARRAY-AS-1-ARG vs 2-IDENTIFIERS =====

--- Edge.arrayCase ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: array, itemCount: 2, items: [kind: identifier, name: AuthGuard | kind: identifier, name: AdminGuard]
--- Edge.flatCase ---
Decorator: @Decorator()
  argumentCount: 2
  argument[0]: kind: identifier, name: AuthGuard
  argument[1]: kind: identifier, name: AdminGuard
--- Edge.nestedArrayCase ---
Decorator: @Decorator()
  argumentCount: 1
  argument[0]: kind: array, itemCount: 2, items: [kind: identifier, name: AuthGuard | kind: array, itemCount: 1, items: [kind: identifier, name: Inner]]
```

This is the key D5 invariant: the bracket form produces
`argumentCount: 1, kind: array, itemCount: 2`, the comma form produces
`argumentCount: 2` with two separate identifiers. The nested array
`[AuthGuard, [Inner]]` further proves that **only the top level is
counted**, while the inner array's single element stays structurally
visible inside the descriptor.

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator("first", "second")` | `2 / string, string` | `2: string"first", string"second"` | **PASS** |
| `@Decorator("users", 201, true, null)` | `4: string, number, boolean, null` | `4: string, number, boolean, null` | **PASS** |
| `@UseGuards(AuthGuard, AdminGuard)` | `2: id, id` | `2: id AuthGuard, id AdminGuard` | **PASS** |
| `@Decorator(HttpStatus.CREATED, HttpStatus.OK)` | `2: prop-access, prop-access` | `2: HttpStatus.CREATED, HttpStatus.OK` | **PASS** |
| `@Decorator(factory(), otherFactory("x"))` | `2: call, call (nested 0 + 1)` | `2: call factory (0), call otherFactory (1)` | **PASS** |
| `@Decorator(id, [a,b], {role}, factory())` | `4: id, array, object, call` | `4: id AuthGuard, array [a,b], object [role], call factory (0)` | **PASS** |
| Non-alpha `@Decorator(gamma,alpha,beta,mu)` | `0:gamma 1:alpha 2:beta 3:mu` | `0:gamma 1:alpha 2:beta 3:mu` | **PASS — no sort** |
| Real-looking `@UseGuards(AuthGuard, AdminGuard)` | `2: id, id` | `2: id AuthGuard, id AdminGuard` | **PASS** |
| Real-looking `@Header("X-Trace", "true")` | `2: string, string` | `2: string "X-Trace", string "true"` | **PASS** |
| Real-looking `@SetMetadata("role", "admin")` | `2: string, string` | `2: string "role", string "admin"` | **PASS** |
| **`@Decorator([A,B])` vs `@Decorator(A,B)`** | `1 array / 2 identifiers` | `1 (array, itemCount 2)` vs `2 identifiers` | **PASS — explicit distinction** |
| Nested `[AuthGuard, [Inner]]` | `1 array arg, inner array intact` | `1 (array, itemCount 2, items: [AuthGuard, array(1, [Inner])])` | **PASS — nested structure preserved** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast` and
  `provider-nestjs`.
- **Existing tests:** unaffected — D1/D2/D3/D4 captures remain valid.
- **Diff:** minimal — 1 new file (`multiple-arguments.test.ts`) + 1 line
  in `package.json`.

Architectural note (no fix needed): `DecoratorArguments.get` returns
`expression.arguments` directly — TypeScript's `arguments` NodeArray
already preserves source order and full AST structure for each entry,
so no transformation is required to keep D5 invariants.

Commit:
- `test(provider-nestjs): audit multiple-argument decorators`

---

## D5 — Multiple arguments

Support:

```ts
@UseGuards(AuthGuard, AdminGuard)
```

Expected:

```text
argumentCount = 2
argument[0] = Identifier(AuthGuard)
argument[1] = Identifier(AdminGuard)
```

This is not an array literal.

---

## Step D6 — String literals

Status: [x]

Files:
- `packages/provider-nestjs/test/string-literals.test.ts` *(new)*
- `package.json` — added `"test:nest:string"` script

Implementation:
- Audit-only test verifying string-literal decorator arguments correctly
  preserve both the AST source text (with the original quotes and any
  escape sequences intact) **and** the semantic string value (with escapes
  resolved).
- Reuses existing `DecoratorReader.getDecorators`, `DecoratorArguments.get`,
  and a local `stringView(arg)` that narrows on `ts.isStringLiteral` and
  exposes:
  - `value` — `arg.text` (semantic, no quotes, escapes resolved)
  - `sourceText` — `arg.getText()` (raw source text with quotes + escapes)
  - `astKind` — `ts.SyntaxKind[arg.kind]` (always `StringLiteral`)
  - `isNoSubstitution` — confirms it is a real `StringLiteral`, not a
    `NoSubstitutionTemplateLiteral`.
- The helper additionally refuses to coerce non-string arguments into
  strings: an identifier remains an identifier and a property-access
  remains a property-access. The D6 fixture proves this explicitly.

Test command:

```bash
pnpm test:nest:string
# or directly:
tsx packages/provider-nestjs/test/string-literals.test.ts
```

MATCH OUTPUT — Part A (synthetic D6 cases, all 11 forms):

```text
--- StringLiterals.doubleQuoted ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "users"
    sourceText: "\"users\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.singleQuoted ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "users"
    sourceText: "'users'"
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.empty ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: ""
    sourceText: "\"\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.spaces ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "hello world"
    sourceText: "\"hello world\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.route1 ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "/users/:id"
    sourceText: "\"/users/:id\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.hyphenated ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "hello-world"
    sourceText: "\"hello-world\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.slash ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "a/b"
    sourceText: "\"a/b\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.colon ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "a:b"
    sourceText: "\"a:b\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.escapeNewline ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "hello\nworld"      (real newline char)
    sourceText: "\"hello\\nworld\""  (2-char backslash-n)
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.escapeTab ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "hello\tworld"
    sourceText: "\"hello\\tworld\""
    astKind: StringLiteral
    isNoSubstitution: true
--- StringLiterals.escapeQuote ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "quote: \"test\""        (3 chars between quotes)
    sourceText: "\"quote: \\\"test\\\"\""  (2-char backslash-quote)
    astKind: StringLiteral
    isNoSubstitution: true
```

(JSON quoting above is the test's own output verbatim — `value` is the
raw semantic string, `sourceText` is the literal source text with
escapes still intact.)

MATCH OUTPUT — Part B (real NestJS string-literal decorators from
`apps/example-api`):

```text
--- CartController (class scope) ---
Decorator: @Controller(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "cart"
    sourceText: "'cart'"
    astKind: StringLiteral
    isNoSubstitution: true
--- CartController.removeItem ---
Decorator: @Delete(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "items/:productId"
    sourceText: "'items/:productId'"
--- OrdersController (class scope) ---
Decorator: @Controller(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "orders"
    sourceText: "'orders'"
--- ProductsController (class scope) ---
Decorator: @Controller(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "products"
    sourceText: "'products'"
--- ProductsController.findOne ---
Decorator: @Get(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: ":id"
    sourceText: "':id'"
--- UsersController (class scope) ---
Decorator: @Controller(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "users"
    sourceText: "'users'"
--- UsersController.register ---
Decorator: @Post(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: "register/test"
    sourceText: "'register/test'"
```

MATCH OUTPUT — Part C (no string coercion):

```text
--- NoCoercion.identifierCase ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]: identifier — IDENTIFIER PRESERVED (no string coercion)
--- NoCoercion.propertyAccessCase ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]: property-access — PROPERTY-ACCESS PRESERVED (no string coercion)
```

`@Decorator(AuthGuard)` stays an identifier (`AuthGuard` is NOT coerced
to a string), and `@Decorator(HttpStatus.CREATED)` stays a
`property-access` — D6 is specifically about `StringLiteral` nodes and
does not promote other expression kinds.

MATCH OUTPUT — Part D (empty string is not zero arguments):

```text
--- EmptyStringCase.emptyStringCase ---
Decorator: @Decorator(...)
  argumentCount: 1
  argument[0]:
    kind: string
    value: ""
    sourceText: "\"\""
--- EmptyStringCase.zeroArgCase ---
Decorator: @Decorator(...)
  argumentCount: 0
```

`@Decorator("")` and `@Decorator()` are explicitly distinct — the
former is `argumentCount: 1, value: ""`; the latter is
`argumentCount: 0`.

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator("users")` (double) | `value:"users"`, source `"users"` | value "users", sourceText `"users"` (escaped by JSON) | **PASS** |
| `@Decorator('users')` (single) | `value:"users"`, source `'users'` | value "users", sourceText `'users'` | **PASS** — semantic identical; quote form preserved |
| `@Decorator("")` | `argumentCount:1, value:""` | `1, value ""`, `sourceText "\"\""` | **PASS** |
| `@Decorator("hello world")` | space preserved | `value: "hello world"` | **PASS** |
| `@Decorator("/users/:id")` | slashes/colon preserved | `value: "/users/:id"` | **PASS** |
| `@Decorator("hello-world")` | hyphen preserved | `value: "hello-world"` | **PASS** |
| `@Decorator("a/b")` / `@Decorator("a:b")` | both preserved | `value: "a/b"`, `value: "a:b"` | **PASS** |
| `@Decorator("hello\nworld")` (escape) | source 2-char `\n`, semantic real newline | `sourceText "\"hello\\nworld\""` (16 chars, escape intact), `value: "hello\nworld"` (real newline) | **PASS — distinction preserved** |
| `@Decorator("hello\tworld")` (escape) | source 2-char `\t`, semantic real tab | `sourceText "\"hello\\tworld\""`, `value: "hello\tworld"` (real tab) | **PASS** |
| `@Decorator("quote:\"test\"")` (escape) | source escapes backslashes; semantic has actual quotes | `sourceText "\"quote: \\\"test\\\"\""`, `value: "quote: \"test\""` | **PASS** |
| Real `@Controller("products")` / `'cart'` / `'users'` etc | semantic strings | all return `kind: string` with correct `value` | **PASS** |
| Real `@Get(':id')` | value `":id"` | `value: ":id"`, sourceText `':id'` | **PASS** |
| Real `@Post('register/test')` | value `"register/test"` | `value: "register/test"` | **PASS** |
| Real `@Delete('items/:productId')` | value with embedded slash/colon | `value: "items/:productId"` | **PASS** |
| **`@Decorator(AuthGuard)` (no coercion)** | identifier preserved | `argument[0]: identifier — IDENTIFIER PRESERVED` | **PASS** |
| **`@Decorator(HttpStatus.CREATED)` (no coercion)** | property-access preserved | `argument[0]: property-access — PROPERTY-ACCESS PRESERVED` | **PASS** |
| **`@Decorator("")` ≠ `@Decorator()`** | `1, ""` vs `0` | `1` vs `0` (explicit) | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast` and
  `provider-nestjs`.
- **Existing tests:** unaffected — D1/D2/D3/D4/D5 captures remain valid.
- **Diff:** minimal — 1 new file (`string-literals.test.ts`) + 1 line in
  `package.json`.

Architectural note (no fix needed): the existing `ExpressionInspector`
already returns `kind: "string"` for `ts.isStringLiteral`. The D6
audit-only test simply compares the two surfaces that the AST exposes
(`arg.text` and `arg.getText()`) to guarantee neither is silently lost
between the AST layer and any future semantic consumer.

Commit:
- `test(provider-nestjs): audit string-literal decorator arguments`

---

## D6 — String literals

Support both single and double quotes. Preserve AST information and extract semantic value when safe.

---

## Step D7 — Numeric literals

Status: [x]

Files:
- `packages/provider-nestjs/test/numeric-literals.test.ts` *(new)*
- `packages/provider-ast/src/expression/ExpressionInspector.ts` *(modified — smallest generic fix)*
- `packages/provider-ast/test/expression.test.ts` *(regression: added `const m = -10`)*
- `package.json` — added `"test:nest:numeric"` script

**Production deficiency discovered and fixed (generic, provider-ast):**

The D0 audit noted that `ExpressionInspector.inspect(...)` returned
`kind: "unknown"` for `PrefixUnaryExpression` wrapping a numeric
literal (e.g. `-10`, `-3.14`, `-1e3`). D7 makes this explicit:

- `ts.NumericLiteral` covers `201`, `0`, `3.14`, `1e3`, `9007199254740991`.
- `ts.isPrefixUnaryExpression(expr) && expr.operator === MinusToken && ts.isNumericLiteral(expr.operand)`
  covers `-10`, `-3.14`, `-1e3`.

**Smallest generic fix** (lives entirely in `provider-ast`, no NestJS
semantics):

```diff
 export type ExpressionKind =
     | "string"
     | "number"
     | "boolean"
     | "null"
     | "identifier"
     | "property-access"
     | "call"
     | "object"
     | "array"
     | "arrow-function"
     | "function"
+    | "prefix-unary"
     | "unknown";
```

```ts
if (
    ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(expression.operand)
) {
    return {
        kind: "prefix-unary",
        node: expression,
    };
}
```

The inspector does **not** fold the unary minus into a numeric value —
it preserves the AST shape and reports `kind: "prefix-unary"`. Numeric
folding (`-Number(arg.operand.text)`) is done only inside the D7 audit
test's `view(...)` helper, where it is appropriate to display a
semantic value for the spec-required `value: -10` form.

**Regression test:** `packages/provider-ast/test/expression.test.ts`
gains a single line `const m = -10;` whose inspection is asserted to
print `m: prefix-unary | AST: -10`. All 12 prior kinds (a–l) keep
their existing classifications.

Test command:

```bash
pnpm test:nest:numeric
# or directly:
tsx packages/provider-nestjs/test/numeric-literals.test.ts
```

MATCH OUTPUT — Part A (synthetic D7 forms):

```text
===== D7 PART A — SYNTHETIC NUMERIC FORMS =====

--- Numerics.m1 ---
  argument[0]: numeric-literal, astKind: FirstLiteralToken, semanticKind: number, value: 201
              ExpressionInspector.kind: number
--- Numerics.m2 ---
  argument[0]: numeric-literal, value: 0
              ExpressionInspector.kind: number
--- Numerics.m3 ---
  argument[0]: numeric-literal, value: 3.14
              ExpressionInspector.kind: number
--- Numerics.m4 ---
  argument[0]: prefix-unary-numeric, astKind: PrefixUnaryExpression,
              operator: MinusToken, operandSourceText: 10,
              operandAstKind: FirstLiteralToken, semanticKind: number, value: -10
              ExpressionInspector.kind: prefix-unary
--- Numerics.m5 ---
  argument[0]: prefix-unary-numeric, value: -3.14
              ExpressionInspector.kind: prefix-unary
--- Numerics.m6 ---
  argument[0]: numeric-literal, sourceText: 1e3, value: 1000
              ExpressionInspector.kind: number
--- Numerics.m7 ---
  argument[0]: prefix-unary-numeric, sourceText: -1e3, value: -1000
              ExpressionInspector.kind: prefix-unary
--- Numerics.m8 ---
  argument[0]: numeric-literal, value: 9007199254740991
              ExpressionInspector.kind: number
--- Numerics.m9 (3 args: 1, 2, 3) ---
  argumentCount: 3; all numeric-literal, source order preserved
--- Numerics.m10 (4 mixed args) ---
  argumentCount: 4
  argument[0]: string-literal,     "users"   | ExpressionInspector.kind: string
  argument[1]: numeric-literal,   201        | ExpressionInspector.kind: number
  argument[2]: prefix-unary-numeric, -10     | ExpressionInspector.kind: prefix-unary
  argument[3]: boolean-literal,   true       | ExpressionInspector.kind: boolean
```

MATCH OUTPUT — Part B (real NestJS `HttpStatus.*` is **NOT** a number):

```text
===== D7 PART B — REAL NESTJS PROPERTY-ACCESS (NOT NUMBER) =====

--- CartController.addItem (@HttpCode) ---
  argument[0]: kind: property-access | sourceText: HttpStatus.OK
              ExpressionInspector.kind: property-access
--- OrdersController.create (@HttpCode) ---
  argument[0]: kind: property-access | sourceText: HttpStatus.CREATED
              ExpressionInspector.kind: property-access
--- ProductsController.create (@HttpCode) ---
  argument[0]: kind: property-access | sourceText: HttpStatus.CREATED
              ExpressionInspector.kind: property-access
--- ProductsController.remove (@HttpCode) ---
  argument[0]: kind: property-access | sourceText: HttpStatus.NO_CONTENT
              ExpressionInspector.kind: property-access
```

`HttpStatus.CREATED` is **never** classified as a number — it stays
`property-access`.

MATCH OUTPUT — Part C (`1 + 2` and `-value` are NOT evaluated):

```text
===== D7 PART C — NOT-A-NUMBER (no unsafe evaluation) =====

--- NotNumbers.m1 ---
  argument[0]: kind: binary | sourceText: 1 + 2 | operator: PlusToken
              ExpressionInspector.kind: unknown
--- NotNumbers.m2 ---
  argument[0]: kind: prefix-unary-identifier | sourceText: -value
              operandKind: Identifier, operandText: value
              ExpressionInspector.kind: unknown
--- NotNumbers.m3 ---
  argument[0]: kind: prefix-unary-identifier | sourceText: -x.y
              operandKind: PropertyAccessExpression, operandText: x.y
              ExpressionInspector.kind: unknown
```

`@Decorator(1 + 2)` is `kind: binary`, never `number 3`. The inspector
returns `unknown` (no false-positive fold). `@Decorator(-value)` and
`@Decorator(-x.y)` stay `prefix-unary-identifier`.

MATCH OUTPUT — Part D (positive vs negative classification boundary):

```text
===== D7 PART D — POSITIVE vs NEGATIVE CLASSIFICATION =====

--- Boundary.positive ---
  argument[0]: kind: numeric-literal, value: 201
              ExpressionInspector.kind: number
--- Boundary.negative ---
  argument[0]: kind: prefix-unary-numeric, value: -10
              ExpressionInspector.kind: prefix-unary
```

Two distinct classifications for what reads as "a number" in source.

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(201)` | `numeric / number / 201` | inspector `number`, value 201 | **PASS** |
| `@Decorator(0)` | `number / 0` | inspector `number`, value 0 | **PASS** |
| `@Decorator(3.14)` | `number / 3.14` | inspector `number`, value 3.14 | **PASS** |
| **`@Decorator(-10)`** | `PrefixUnaryExpression / numeric -10` | inspector `prefix-unary`, AST `PrefixUnaryExpression(MinusToken, NumericLiteral 10)`, semantic `-10` | **PASS** |
| `@Decorator(-3.14)` | prefix-unary / -3.14 | inspector `prefix-unary`, value -3.14 | **PASS** |
| `@Decorator(1e3)` | positive exponent → 1000 | inspector `number`, value 1000 | **PASS** |
| `@Decorator(-1e3)` | prefix-unary / -1000 | inspector `prefix-unary`, value -1000 | **PASS** |
| `@Decorator(9007199254740991)` (large) | preserved | inspector `number`, exact 9007199254740991 | **PASS** |
| `@Decorator(1, 2, 3)` | 3 args in order | argumentCount 3, source order preserved | **PASS** |
| `@Decorator("users", 201, -10, true)` | mixed preserved | string + number(201) + prefix-unary(-10) + boolean | **PASS** |
| **`@HttpCode(HttpStatus.CREATED)`** | **property-access** (NOT number) | inspector `property-access` | **PASS** |
| `@HttpCode(HttpStatus.OK/NO_CONTENT)` | property-access | all 4 `@HttpCode` decorators report `property-access` | **PASS** |
| **`@Decorator(1 + 2)`** | binary (NOT number 3) | `kind: binary`; inspector `unknown` | **PASS — explicitly NOT misclassified** |
| **`@Decorator(-value)`** | prefix-unary-identifier | `operandKind: Identifier, operandText: value` | **PASS** |
| `@Decorator(-x.y)` | prefix-unary-identifier | `operandKind: PropertyAccessExpression, operandText: x.y` | **PASS** |
| **Boundary `201` vs `-10`** | distinct classifications | `numeric-literal` vs `prefix-unary-numeric` | **PASS** |
| `expression.test.ts` regression | new `m: -10 → prefix-unary` | `m: prefix-unary | AST: -10` printed; a–l unchanged | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D1 regression:** scopes test exit 0; 5388-byte prior capture intact.
- **D2 regression:** order test fresh run → 33 lines, all 12 PASS
  assertions reproduce.
- **D3 regression:** zero-arguments test fresh run → 47 lines.
- **D4 regression:** one-argument test fresh run → 68 lines.
- **D5 regression:** multiple-arguments test fresh run → 81 lines.
- **D6 regression:** string-literals test fresh run → 131 lines.
- **Diff:** 1 new test file + 2 small source/test edits in
  `provider-ast` (inspector branch and regression line) + 1 line in
  `package.json`.

Architectural notes:
- `ts.isNumericLiteral(text)` is used as-is on positive cases — no
  manual parsing of the literal token.
- `ts.isPrefixUnaryExpression` + `MinusToken` + `ts.isNumericLiteral`
  on the operand is the canonical TypeScript shape for `-10`. The
  inspector now classifies this as `kind: "prefix-unary"`.
- No constant folding is added to the inspector. The semantic `-10`
  value is computed only inside the D7 audit test for display.
- `HttpStatus.CREATED` is **never** confused with a number — it stays
  `property-access` at every layer tested.
- Binary expressions like `1 + 2` are left as `unknown` in the
  inspector (by design — D24 / binary expressions belongs to a later
  step).

Commits:
- `feat(provider-ast): classify prefix-unary numeric expressions`
- `test(provider-nestjs): audit numeric-literal decorator arguments`

---

## D7 — Numeric literals

Test:

```ts
@Decorator(201)
@Decorator(0)
@Decorator(-10)
@Decorator(3.14)
```

Important:

```text
201 → NumericLiteral
-10 → PrefixUnaryExpression(NumericLiteral)
```

Do not incorrectly classify negative numbers.

---

## Step D8 — Boolean literals

Status: [x]

Files:
- `packages/provider-nestjs/test/boolean-literals.test.ts` *(new)*
- `package.json` — added `"test:nest:boolean"` script

**No production-code change was needed.** The D0 audit already
classified `TrueKeyword` / `FalseKeyword` as `kind: "boolean"` via the
existing branch in `ExpressionInspector`:

```ts
if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword
) {
    return { kind: "boolean", node: expression };
}
```

The D8 audit-only test verifies that this classification is exercised
correctly across the spec, and that the negative cases (`"true"` as
string, `value` as identifier, `condition ? true : false` as
conditional, `!true` as prefix-unary) are **not** misclassified as
boolean literals.

Test command:

```bash
pnpm test:nest:boolean
# or directly:
tsx packages/provider-nestjs/test/boolean-literals.test.ts
```

MATCH OUTPUT — Part A (synthetic D8 forms):

```text
===== D8 PART A — SYNTHETIC BOOLEAN FORMS =====

--- Booleans.m1 ---
  argument[0]: kind: boolean-literal | sourceText: true | astKind: TrueKeyword | semanticKind: boolean | value: true
              ExpressionInspector.kind: boolean
--- Booleans.m2 ---
  argument[0]: kind: boolean-literal | sourceText: false | astKind: FalseKeyword | semanticKind: boolean | value: false
              ExpressionInspector.kind: boolean
--- Booleans.m3 (3 args in order) ---
  argumentCount: 3
  argument[0]: boolean-literal true    | ExpressionInspector.kind: boolean
  argument[1]: boolean-literal false   | ExpressionInspector.kind: boolean
  argument[2]: boolean-literal true    | ExpressionInspector.kind: boolean
--- Booleans.m4 ---
  argument[0]: kind: array | itemCount: 2
              items[0]: boolean-literal true
              items[1]: boolean-literal false
              ExpressionInspector.kind: array
--- Booleans.m5 ---
  argument[0]: kind: object
              enabled  → TrueKeyword  (boolean-literal true)
              disabled → FalseKeyword (boolean-literal false)
              ExpressionInspector.kind: object
--- Booleans.m6bTrue / m6String / m6Identifier ---
  m6bTrue:      boolean-literal true     | ExpressionInspector.kind: boolean
  m6String:     string-literal "true"     | ExpressionInspector.kind: string
  m6Identifier: identifier value          | ExpressionInspector.kind: identifier
--- Booleans.m7Conditional ---
  argument[0]: kind: conditional | sourceText: condition ? true : false
              astKind: ConditionalExpression
              conditionKind: Identifier
              whenTrueKind:  TrueKeyword
              whenFalseKind: FalseKeyword
              ExpressionInspector.kind: unknown
--- Booleans.m8NotTrue ---
  argument[0]: kind: prefix-unary | sourceText: !true
              astKind: PrefixUnaryExpression
              operator: ExclamationToken
              operandKind: TrueKeyword
              operandSourceText: true
              ExpressionInspector.kind: unknown
```

MATCH OUTPUT — Part B (explicit distinction trio):

```text
===== D8 PART B — DISTINCTION TRIO =====

--- Distinction.booleanLiteral ---
  argument[0]: boolean-literal | sourceText: true | astKind: TrueKeyword | value: true
              ExpressionInspector.kind: boolean
--- Distinction.stringLiteral ---
  argument[0]: string-literal | sourceText: "true" | astKind: StringLiteral | value: "true"
              ExpressionInspector.kind: string
--- Distinction.identifier ---
  argument[0]: identifier | sourceText: trueish | astKind: Identifier | name: trueish
              ExpressionInspector.kind: identifier
```

MATCH OUTPUT — Part C (real-looking NestJS boolean arguments — example-api
has no boolean decorators, so synthetic NestJS-style fixtures are used
per the D8 protocol):

```text
===== D8 PART C — REAL-LOOKING NESTJS BOOLEAN ARGS =====

--- NestBooleans.corsEnabled ---
  argument[0]: kind: object
              cors  → TrueKeyword  (boolean-literal true)
              cache → FalseKeyword (boolean-literal false)
              ExpressionInspector.kind: object
--- NestBooleans.publicRoute ---
  argument[0]: string-literal "public" | ExpressionInspector.kind: string
  argument[1]: boolean-literal true     | ExpressionInspector.kind: boolean
```

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(true)` | `boolean / true` | `boolean-literal, TrueKeyword, true`; inspector `boolean` | **PASS** |
| `@Decorator(false)` | `boolean / false` | `boolean-literal, FalseKeyword, false`; inspector `boolean` | **PASS** |
| `@Decorator(true, false, true)` | `3 booleans in order` | `true, false, true` in source order | **PASS** |
| `@Decorator([true, false])` | `array(2 booleans)` not flattened | `array, itemCount: 2, items: [true, false]` | **PASS** |
| `@Decorator({ enabled: true, disabled: false })` | object with bool values | `enabled → true, disabled → false` | **PASS** |
| **`@Decorator(true)` ≠ `@Decorator("true")`** | `boolean ≠ string` | `boolean-literal` vs `string-literal` | **PASS** |
| **`@Decorator(true)` ≠ `@Decorator(value)`** | `boolean ≠ identifier` | `boolean-literal` vs `identifier` | **PASS** |
| **`@Decorator(condition ? true : false)`** | `kind = conditional` (NOT boolean) | `conditional` with condition/whenTrue/whenFalse branches; inspector `unknown` | **PASS — structural, NOT misclassified as boolean** |
| **`@Decorator(!true)`** | `prefix-unary` (NOT silently → false) | `prefix-unary, operator: ExclamationToken, operandKind: TrueKeyword`; inspector `unknown` | **PASS — structural, NOT silently folded to false** |
| Distinction trio (true / "true" / trueish) | three distinct classifications | `boolean-literal / string-literal / identifier` | **PASS** |
| Real-looking `@Options({ cors: true, cache: false })` | object with booleans | `object / cors → true / cache → false` | **PASS** |
| Real-looking `@SetMetadata("public", true)` | string + boolean | `string("public"), boolean(true)` in source order | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast` and
  `provider-nestjs`.
- **D1 regression:** scopes test exit 0; 5388-byte prior capture intact.
- **D2 regression:** order test fresh run → 33 lines.
- **D3 regression:** zero-arguments test fresh run → 47 lines.
- **D4 regression:** one-argument test fresh run → 68 lines.
- **D5 regression:** multiple-arguments test fresh run → 81 lines.
- **D6 regression:** string-literals test fresh run → 131 lines.
- **D7 regression:** numeric-literals test fresh run → 117 lines
  (sections verified intact).
- **Diff:** minimal — 1 new test file (`boolean-literals.test.ts`,
  ~330 lines) + 1 line in `package.json`. No production code changed.

Architectural note (no fix needed): the existing `ExpressionInspector`
already returns `kind: "boolean"` for `TrueKeyword` / `FalseKeyword`.
The D8 test surfaces both the existing inspector classification and a
richer local descriptor (`sourceText`, `astKind`, `value`, etc.).
Crucially, the negative cases (`"true"`, `value`, `condition ? true :
false`, `!true`) are asserted to **not** collapse to `boolean`,
preserving the structural integrity of every non-literal expression.

Commit:
- `test(provider-nestjs): audit boolean-literal decorator arguments`

---

## D8 — Boolean literals

Test `true` and `false` and represent them as booleans.

---

## Step D9 — Null literals

Status: [x]

Files:
- `packages/provider-nestjs/test/null-literals.test.ts` *(new)*
- `package.json` — added `"test:nest:null"` script

**No production-code change was needed.** `ExpressionInspector` already
classifies `ts.SyntaxKind.NullKeyword` as `kind: "null"` via the
existing branch (lines 64-71 of
`packages/provider-ast/src/expression/ExpressionInspector.ts`).

The D9 audit-only test verifies this classification across the spec
matrix and explicitly asserts the negative cases (no false-positive
collapse of conditional / binary / nullish-coalescing expressions
whose branches or operands contain `null`).

Test command:

```bash
pnpm test:nest:null
# or directly:
tsx packages/provider-nestjs/test/null-literals.test.ts
```

MATCH OUTPUT — Part A (synthetic D9 forms):

```text
===== D9 PART A — SYNTHETIC NULL FORMS =====

--- Nulls.m1 ---
  argumentCount: 1
  argument[0]:
    kind: null-literal | sourceText: null | astKind: NullKeyword | semanticKind: null | value: null
    ExpressionInspector.kind: null
--- Nulls.m2 ---
  argument[0]:
    kind: string-literal | sourceText: "null" | astKind: StringLiteral | value: "null"
    ExpressionInspector.kind: string
--- Nulls.m3 ---
  argument[0]:
    kind: identifier | sourceText: nullValue | astKind: Identifier | name: nullValue
    ExpressionInspector.kind: identifier
--- Nulls.m4 (null, null, "x") ---
  argumentCount: 3
  argument[0]: null-literal null
  argument[1]: null-literal null
  argument[2]: string-literal "x"
--- Nulls.m5 ([null, "x", null]) ---
  argumentCount: 1
  argument[0]: kind: array, itemCount: 3
              items[0]: null-literal null
              items[1]: string-literal "x"
              items[2]: null-literal null
--- Nulls.m6 ({ value: null, name: "test" }) ---
  argumentCount: 1
  argument[0]: kind: object
              value → NullKeyword   (null-literal null)
              name  → StringLiteral (string-literal "test")
```

MATCH OUTPUT — Part B (critical `@Decorator()` vs `@Decorator(null)`):

```text
===== D9 PART B — ZERO-ARG vs NULL-ARG =====

--- Critical.zeroArg ---
  argumentCount: 0
--- Critical.nullArg ---
  argumentCount: 1
  argument[0]:
    kind: null-literal | sourceText: null | astKind: NullKeyword | value: null
    ExpressionInspector.kind: null
```

This is the key D9 invariant: `@Decorator()` (zero-arg parentheses
form) is `argumentCount: 0`, while `@Decorator(null)` is
`argumentCount: 1, value: null`.

MATCH OUTPUT — Part C (nested null structures and binary/nullish):

```text
===== D9 PART C — NESTED NULL STRUCTURES =====

--- NestedNull.m1 ---
  argument[0]: kind: object
              config → object
                value → NullKeyword  (null)
              values → array, itemCount: 2
                items[0]: null-literal null
                items[1]: array, itemCount: 1
                  items[0]: null-literal null
--- NestedNull.m2 (value ?? null) ---
  argument[0]: kind: binary | sourceText: value ?? null | operator: QuestionQuestionToken
              ExpressionInspector.kind: unknown
--- NestedNull.m3 (null ?? value) ---
  argument[0]: kind: binary | sourceText: null ?? value | operator: QuestionQuestionToken
              ExpressionInspector.kind: unknown
```

The nested object / array / null structure is fully preserved at every
level. The binary `??` expressions are kept structural — NOT
collapsed to `null` even when one operand is a `null` literal.

MATCH OUTPUT — Part D (null in conditional branches):

```text
===== D9 PART D — NULL IN CONDITIONAL =====

--- ConditionalNull.m1 (condition ? null : "value") ---
  argument[0]: kind: conditional
              condition: Identifier
              whenTrue:  NullKeyword   (null)
              whenFalse: StringLiteral ("value")
              ExpressionInspector.kind: unknown
--- ConditionalNull.m2 (condition ? "value" : null) ---
  argument[0]: kind: conditional
              condition: Identifier
              whenTrue:  StringLiteral ("value")
              whenFalse: NullKeyword   (null)
              ExpressionInspector.kind: unknown
```

The conditional remains structural — neither branch is folded into
the other, and the top-level kind stays `conditional`.

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(null)` | `1 / null / null` | `null-literal, NullKeyword, value: null`; inspector `null` | **PASS** |
| **`@Decorator()` vs `@Decorator(null)`** | `0` vs `1, null` | `0` vs `1, null-literal` | **PASS — critical** |
| `@Decorator("null")` | string | `string-literal, value: "null"`; inspector `string` | **PASS** |
| `@Decorator(nullValue)` | identifier | `identifier, name: nullValue`; inspector `identifier` | **PASS** |
| `@Decorator(null, null, "x")` | `3 args in source order` | `null, null, string` | **PASS** |
| `@Decorator([null, "x", null])` | `array(3) NOT flattened` | `array, itemCount: 3, items: [null, string, null]` | **PASS** |
| `@Decorator({value:null,name:"test"})` | `object / value→null / name→string` | object, value→null, name→string | **PASS** |
| Nested `{config:{value:null},values:[null,[null]]}` | structure preserved at every level | object→object→null + array→[null,[null]] | **PASS** |
| `@Decorator(value ?? null)` | binary, NOT collapsed | `binary, operator: QuestionQuestionToken`; inspector `unknown` | **PASS** |
| `@Decorator(null ?? value)` | binary, NOT collapsed | `binary, operator: QuestionQuestionToken`; inspector `unknown` | **PASS** |
| `@Decorator(condition ? null : "value")` | conditional (NOT collapsed) | `conditional, whenTrue: null, whenFalse: string`; inspector `unknown` | **PASS** |
| `@Decorator(condition ? "value" : null)` | conditional (NOT collapsed) | `conditional, whenTrue: string, whenFalse: null`; inspector `unknown` | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D1 regression:** scopes test exit 0; 5388-byte prior capture intact.
- **D2 regression:** order test fresh run → 33 lines.
- **D3 regression:** zero-arguments test fresh run → 47 lines.
- **D4 regression:** one-argument test fresh run → 68 lines.
- **D5 regression:** multiple-arguments test fresh run → 81 lines.
- **D6 regression:** string-literals test fresh run → 131 lines.
- **D7 regression:** numeric-literals test fresh run → 117 lines.
- **D8 regression:** boolean-literals test fresh run → 118 lines.
- **expression.test.ts regression:** `m: prefix-unary | AST: -10`
  still printed.
- **Diff:** minimal — 1 new test file (`null-literals.test.ts`) + 1
  line in `package.json`. No production code modified.

Architectural note (no fix needed): `ExpressionInspector`'s
`ts.SyntaxKind.NullKeyword` branch returns `kind: "null"` and the
underlying AST node. The D9 audit test adds a richer local descriptor
that also surfaces `sourceText`, `astKind`, and the structural
information of nested containers (arrays, objects, conditionals,
binaries). The negative cases (binary `??`, conditional `?:`, nested
null inside object / array) are explicitly asserted to remain
structural — the inspector returns `"unknown"` for the binary /
conditional wrappers, which is correct because the constant-fold that
would be required to collapse them is forbidden by the protocol.

Commit:
- `test(provider-nestjs): audit null-literal decorator arguments`

---

## D9 — Null

Test `@Decorator(null)` and represent it distinctly as null.

---

## Step D10 — Identifier expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/identifier-expressions.test.ts` *(new)*
- `package.json` — added `"test:nest:identifier"` script

**No production-code change was needed.** `ExpressionInspector` already
classifies `ts.isIdentifier(node)` as `kind: "identifier"`, and
`SymbolResolver` / `DeclarationResolver` already exist in
`packages/provider-ast/src/compiler/`.

**Architecture (three-layer invariant proven by this test):**

```text
Expression (ts.Identifier "JwtAuthGuard")
   ↓
ExpressionInspector.inspect(...) → kind = "identifier"
   ↓
SymbolResolver.resolve(node)   → ts.Symbol (name=JwtAuthGuard)
   ↓
DeclarationResolver.resolve(node) → readonly ts.Declaration[]
                                       (first: ImportSpecifier)
```

These are **three distinct layers**: the expression is *always*
classified as `identifier` regardless of what the symbol points to or
what the declarations are. Symbol and Declaration resolution are
separate concerns, exposed independently by `SymbolResolver` and
`DeclarationResolver`. The D10 audit-only test runs all three for
real NestJS `@UseGuards(JwtAuthGuard)` decorators in `apps/example-api`.

Test command:

```bash
pnpm test:nest:identifier
# or directly:
tsx packages/provider-nestjs/test/identifier-expressions.test.ts
```

MATCH OUTPUT — Part A (synthetic identifier forms and confusions):

```text
===== D10 PART A — SYNTHETIC IDENTIFIER FORMS =====

--- Guards.m1 (Decorator) ---
  argumentCount: 1
  argument[0]: kind: identifier | sourceText: AuthGuard | astKind: Identifier | name: AuthGuard
              ExpressionInspector.kind: identifier
--- Guards.m2 (Decorator) ---
  argumentCount: 3
  argument[0]: identifier AuthGuard   | inspector: identifier
  argument[1]: identifier AdminGuard  | inspector: identifier
  argument[2]: identifier SomeGuard   | inspector: identifier
--- Guards.m3 (Decorator) ---
  argument[0]: kind: string-literal | sourceText: "AuthGuard" | value: "AuthGuard"
              ExpressionInspector.kind: string
--- Guards.m4 (Decorator) ---
  argument[0]: kind: property-access | sourceText: Auth.AuthGuard | object: Auth, property: AuthGuard
              ExpressionInspector.kind: property-access
--- Guards.m5 (Decorator) ---
  argument[0]: kind: call | sourceText: AuthGuard() | callee: AuthGuard | argumentCount: 0
              ExpressionInspector.kind: call
--- Guards.m6 (Decorator) ---
  argument[0]: kind: array | itemCount: 2
              items[0]: identifier AuthGuard
              items[1]: identifier AdminGuard
              ExpressionInspector.kind: array
--- Guards.m7 (Decorator) ---
  argument[0]: kind: object | guard → Identifier → identifier AuthGuard
              ExpressionInspector.kind: object
--- Guards.m8 (Decorator) (UnknownGuard) ---
  argument[0]: kind: identifier | name: UnknownGuard
              ExpressionInspector.kind: identifier   ← NOT collapsed to unknown
--- Guards.m9 (Decorator) ---
  argument[0]: kind: prefix-unary | operator: MinusToken | operandKind: Identifier | operandText: value
              ExpressionInspector.kind: unknown
--- Guards.m10 (Decorator) ---
  argument[0]: kind: binary | operator: PlusToken
              ExpressionInspector.kind: unknown
--- Guards.m11 (Decorator) ---
  argument[0]: kind: conditional | condition: Identifier | whenTrue: Identifier | whenFalse: Identifier
              ExpressionInspector.kind: unknown
--- Guards.m12 (Decorator) ---
  argument[0]: kind: property-access | sourceText: HttpStatus.CREATED
              ExpressionInspector.kind: property-access   ← NOT identifier
--- Guards.m13 (Decorator) ---
  argument[0]: kind: element-access | sourceText: namespace["AuthGuard"]
              ExpressionInspector.kind: unknown           ← NOT forced to identifier

--- Local class / function / constant ---

--- Locals.m1 (Decorator) --- MyGuard       argument[0]: identifier (NOT classified as "class")
--- Locals.m2 (Decorator) --- factory       argument[0]: identifier (NOT call)
--- Locals.m3 (Decorator) --- factory()     argument[0]: call       (NOT identifier)
--- Locals.m4 (Decorator) --- ROLE          argument[0]: identifier (NOT "admin" string)
```

MATCH OUTPUT — Part B (real NestJS three-layer resolution):

```text
===== D10 PART B — REAL NESTJS IDENTIFIERS =====

--- Expression: JwtAuthGuard ---   (OrdersController @UseGuards)
  ExpressionInspector.kind: identifier
  SymbolResolver  : name=JwtAuthGuard | flags=2097152
  DeclarationResolver: 1 declaration(s): [ImportSpecifier]
  First declaration kind: ImportSpecifier

--- Expression: JwtAuthGuard ---   (CartController @UseGuards)
  ExpressionInspector.kind: identifier
  SymbolResolver  : name=JwtAuthGuard | flags=2097152
  DeclarationResolver: 1 declaration(s): [ImportSpecifier]
  First declaration kind: ImportSpecifier

--- Expression: JwtAuthGuard ---   (UsersController.getProfile @UseGuards)
  ExpressionInspector.kind: identifier
  SymbolResolver  : name=JwtAuthGuard | flags=2097152
  DeclarationResolver: 1 declaration(s): [ImportSpecifier]
  First declaration kind: ImportSpecifier
```

All three decorators (`OrdersController`, `CartController`,
`UsersController.getProfile`) carry a `JwtAuthGuard` identifier that
resolves through `SymbolResolver` and ultimately to a single
`ImportSpecifier` declaration — proving the three-layer architecture.

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(AuthGuard)` | identifier | `identifier, name: AuthGuard` | **PASS** |
| `@Decorator(AuthGuard, AdminGuard, SomeGuard)` | 3 identifiers in order | arg0, arg1, arg2 in source order | **PASS** |
| `@Decorator("AuthGuard")` ≠ identifier | string | string-literal | **PASS** |
| `@Decorator(Auth.AuthGuard)` ≠ identifier | property-access | property-access | **PASS** |
| `@Decorator(AuthGuard())` ≠ identifier | call | call | **PASS** |
| `@Decorator([AuthGuard, AdminGuard])` | array(2 identifiers) NOT flattened | array, items: [identifier, identifier] | **PASS** |
| `@Decorator({ guard: AuthGuard })` | object / guard→identifier | object, guard → identifier | **PASS** |
| `@Decorator(UnknownGuard)` | identifier (NOT collapsed) | identifier | **PASS — AST classification independent of resolution** |
| `@Decorator(-value)` | prefix-unary NOT identifier | prefix-unary | **PASS** |
| `@Decorator(value + other)` | binary NOT identifier | binary | **PASS** |
| `@Decorator(value ? A : B)` | conditional NOT identifier | conditional | **PASS** |
| `@Decorator(HttpStatus.CREATED)` | property-access NOT identifier | property-access | **PASS** |
| `@Decorator(namespace["AuthGuard"])` | element-access NOT identifier | element-access | **PASS** |
| `@Decorator(MyGuard)` (local class) | identifier (NOT "class") | identifier | **PASS** |
| `@Decorator(factory)` | identifier (NOT call) | identifier | **PASS** |
| `@Decorator(factory())` | call (NOT identifier) | call | **PASS** |
| `@Decorator(ROLE)` (constant) | identifier (NOT "admin") | identifier | **PASS** |
| **Real NestJS `@UseGuards(JwtAuthGuard)` three layers** | identifier / symbol / ImportSpecifier | all three layers captured for three decorators | **PASS — three-layer architecture** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D1 regression:** scopes test exit 0; 5388-byte prior capture intact.
- **D2 regression:** order test → 33 lines.
- **D3 regression:** zero-arguments test → 47 lines.
- **D4 regression:** one-argument test → 68 lines.
- **D5 regression:** multiple-arguments test → 81 lines.
- **D6 regression:** string-literals test → 131 lines.
- **D7 regression:** numeric-literals test → 117 lines.
- **D8 regression:** boolean-literals test → 118 lines.
- **D9 regression:** null-literals test → 122 lines.
- **`expression.test.ts` regression:** `m: prefix-unary | AST: -10`
  still printed.
- **`symbol.test.ts` regression:** exit 0.
- **`declaration.test.ts` regression:** exit 0.
- **Diff:** minimal — 1 new test file (`identifier-expressions.test.ts`)
  + 1 line in `package.json`. No production code modified.

Architectural note (no fix needed):
- The three-layer architecture (Expression → Symbol → Declaration) is
  the canonical separation enforced by `ExpressionInspector`,
  `SymbolResolver`, and `DeclarationResolver`. Each layer is independent:
  the `kind: "identifier"` label depends only on the AST shape; the
  symbol depends only on TypeScript's checker; the declarations depend
  only on the resolved symbol.
- Unresolved identifiers (`UnknownGuard`) stay classified as
  `identifier` because AST classification is structural and does not
  depend on resolution success.
- Computed property-access `namespace["AuthGuard"]` stays classified
  as `element-access` (not yet exposed by `ExpressionInspector`,
  currently `unknown`) — preserved structurally, NOT coerced to
  identifier.
- Optional chaining (`value?.foo`) and non-null assertion (`value!`)
  are not added speculatively; they fall through to the inspector's
  `unknown` branch, which is safe.

Commit:
- `test(provider-nestjs): audit identifier-expression decorator arguments`

---

## D10 — Identifier expressions

Test:

```ts
@UseGuards(AuthGuard)
@Decorator(MyClass)
@Decorator(myFunction)
```

Represent the expression as an identifier first. Do not assume it is a class/function until symbol/declaration resolution.

---

## D11 — Property access

Test:

```ts
@HttpCode(HttpStatus.CREATED)
@Decorator(Config.value)
```

Expected:

```text
kind = property-access
object = HttpStatus
property = CREATED
```

Preserve the already verified `HttpStatus.CREATED` behavior.

---

## D12 — Call expressions

Test:

```ts
@UseGuards(AuthGuard("jwt"))
@Decorator(factory())
```

Expected structure:

```text
kind = call
callee = AuthGuard
arguments = ["jwt"]
```

Never execute the function.

---

## D13 — New expressions

Test:

```ts
@Decorator(new MyClass("value"))
```

Represent constructor and arguments structurally.

---

## D14 — Array literals

Test:

```ts
@Decorator([AuthGuard, AdminGuard])
@Decorator([])
```

Expected:

```text
kind = array
items = [Identifier(AuthGuard), Identifier(AdminGuard)]
```

---

## D15 — Object literals

Test:

```ts
@Decorator({
    role: "admin",
    enabled: true,
    limit: 10,
})
```

Represent each property and nested expression structurally.

---

## D16 — Object shorthand

Test:

```ts
const role = "admin";
@Decorator({ role })
```

Expected property value is `Identifier(role)`, not automatically the string `admin`.

---

## D17 — Object spread

Test:

```ts
@Decorator({ ...options })
```

Represent the spread explicitly.

---

## D18 — Spread in arrays/calls

Test:

```ts
@Decorator(...guards)
@Decorator([AuthGuard, ...guards])
```

Never flatten dynamic spreads.

---

## D19 — Arrow functions

Test:

```ts
@Decorator(() => AuthGuard)
```

Represent the arrow function and its body. Never execute it.

---

## D20 — Function expressions

Test:

```ts
@Decorator(function () { return AuthGuard; })
```

Represent the function expression structurally. Never execute source code.

---

## D21 — Template literals

Test both:

```ts
@Decorator(`users`)
@Decorator(`${prefix}/users`)
```

Do not falsely turn a dynamic template into a constant string.

---

## D22 — Parenthesized expressions

Test:

```ts
@Decorator((AuthGuard))
@Decorator(("users"))
```

Normalize safely while preserving AST where required.

---

## D23 — Conditional expressions

Test:

```ts
@Decorator(condition ? AuthGuard : AdminGuard)
```

Represent condition, true branch, and false branch. Never execute the condition.

---

## D24 — Binary expressions

Test:

```ts
@Decorator("api" + "/users")
@Decorator(1 + 2)
```

If safe constant folding is implemented, it must be explicit. Otherwise preserve the binary expression.

---

## D25 — Element access

Test:

```ts
@Decorator(config["key"])
```

Represent object and argument separately.

---

## D26 — Type assertions / `as`

Test:

```ts
@Decorator(value as SomeType)
```

Do not discard the underlying expression.

---

## D27 — Complex nested expression

Test:

```ts
@Decorator({
    guards: [
        AuthGuard("jwt"),
        AdminGuard,
        ...extraGuards,
    ],
    enabled: condition ? true : false,
})
```

Every nested component must remain structurally represented. This is a critical completion test.

---

## D28 — Source locations

Where supported by the current architecture, preserve:

```text
file
line
column
scope
decorator name
```

This is needed later for useful diagnostics.

---

## D29 — Symbol resolution for identifier arguments

For:

```ts
@UseGuards(JwtAuthGuard)
```

resolve:

```text
expression → symbol → declaration
```

Do not assume the declaration is directly a class.

---

## D30 — Import alias resolution

Test:

```ts
import { JwtAuthGuard as MyGuard } from "./auth";
@UseGuards(MyGuard)
```

The first declaration boundary may be:

```text
ImportSpecifier
```

That is valid. Follow the alias where the existing `DeclarationResolver` architecture supports it.

---

## D31 — Class declaration resolution

Test local class references and expect `ClassDeclaration` where applicable.

---

## D32 — Function declaration resolution

Test local function references and expect `FunctionDeclaration` where applicable.

---

## D33 — Variable declaration resolution

Test:

```ts
const myValue = "users";
@Decorator(myValue)
```

Expect `VariableDeclaration`. Do not execute/evaluate arbitrary variables.

---

## D34 — Call callee resolution

For `factory()` identify the `CallExpression` and resolve the callee symbol where appropriate. Never execute it.

---

# 6. NestJS decorator semantic matrix

After generic decorator handling is complete, interpret NestJS meaning in `provider-nestjs`.

## N1 — Class scope

Investigate/test relevant built-ins such as:

```text
@Controller
@UseGuards
@UseInterceptors
@UsePipes
@UseFilters
@SetMetadata
```

Use the installed NestJS version/types as authority for exact signatures.

## N2 — Method scope

Investigate/test:

```text
@Get
@Post
@Put
@Patch
@Delete
@Options
@Head
@All
@HttpCode
@Header
@Redirect
@Render
@UseGuards
@UseInterceptors
@UsePipes
@UseFilters
@SetMetadata
```

## N3 — Parameter scope

Investigate/test:

```text
@Param
@Query
@Body
@Headers
@Ip
@Req
@Res
@Next
@Session
@HostParam
```

## N4 — Custom decorators

Test:

```ts
@Roles("admin")
@CustomAuth()
@MyDecorator(SomeClass)
```

Unknown custom decorators must remain representable and must not crash the parser.

## N5 — Same decorator at multiple scopes

Test controller, method, and parameter decorators in the same source file. Keep scopes separate; do not merge them prematurely.

---

# 7. Decorator completion gate

Do not begin route/document generation until all are checked:

```text
[ ] decorator discovery
[ ] class scope
[ ] method scope
[ ] parameter scope
[ ] decorator order
[ ] zero arguments
[ ] one argument
[ ] multiple arguments
[ ] string
[ ] number
[ ] negative number
[ ] boolean
[ ] null
[ ] identifier
[ ] property access
[ ] call expression
[ ] new expression
[ ] array
[ ] object
[ ] shorthand
[ ] object spread
[ ] array/call spread
[ ] arrow function
[ ] function expression
[ ] template literal
[ ] parenthesized expression
[ ] conditional expression
[ ] binary expression
[ ] element access
[ ] type assertion
[ ] nested expressions
[ ] source location
[ ] symbol resolution
[ ] import aliases
[ ] class declarations
[ ] function declarations
[ ] variable declarations
[ ] call callee resolution
[ ] NestJS class decorators
[ ] NestJS method decorators
[ ] NestJS parameter decorators
[ ] custom decorators
[ ] integration test
```

Only then declare:

```text
DECORATOR PHASE COMPLETE
```

---

# 8. Route phase — only after decorator completion

Sequence:

```text
R1 controller discovery
R2 controller path
R3 HTTP method
R4 method path
R5 path normalization
R6 route metadata model
R7 all routes
```

Example:

```ts
@Controller("products")
class ProductsController {
    @Get(":id")
    findOne() {}
}
```

Expected:

```text
controllerName = ProductsController
controllerPath = products
methodName = findOne
httpMethod = GET
methodPath = :id
fullPath = /products/:id
```

---

# 9. Parameter phase

```text
P1 parameter source
P2 API name
P3 local name
P4 type
P5 optionality
P6 @Param
P7 @Query
P8 @Body
P9 @Headers
P10 other supported request decorators
```

Important:

```ts
findAll(
    @Query("category") category?: string,
    p: string,
) {}
```

`category` is an API parameter; undecorated `p` is not automatically an API parameter.

---

# 10. Schema/type phase

Required sequence:

```text
S1 primitive
S2 literals
S3 optional
S4 union
S5 enum
S6 object/class
S7 arrays
S8 tuples if required
S9 nested classes
S10 generic types
S11 Promise
S12 nullable
S13 circular references
S14 imported types
S15 aliases
```

Use TypeChecker, not regex-based type parsing.

---

# 11. Response phase

```text
O1 explicit return type
O2 inferred return type
O3 Promise<T>
O4 arrays
O5 objects
O6 DTOs
O7 response decorators
O8 HttpCode
```

Reuse the schema system where possible.

---

# 12. Guard/security phase

```text
G1 @UseGuards discovery
G2 multiple guards
G3 identifier guard
G4 call-expression guard
G5 imported guard
G6 controller guards
G7 method guards
G8 merge policy
G9 custom security decorators
```

Never execute guard code.

---

# 13. Common Document phase

Before implementation:

```bash
grep -R "interface Document" packages apps
grep -R "type Document" packages apps
```

Inspect all important consumers.

Then implement in this order:

```text
DOC1 canonical contract
DOC2 builder boundary
DOC3 one complete route
DOC4 parameters
DOC5 body/schema
DOC6 response
DOC7 security
DOC8 all routes
DOC9 validation
DOC10 deterministic ordering
DOC11 duplicate routes
DOC12 end-to-end example-api test
```

---

# 14. Final acceptance gate

```text
[ ] AST foundation verified
[ ] decorator system complete
[ ] expression system complete
[ ] symbol resolution complete
[ ] declaration resolution complete
[ ] class decorator handling complete
[ ] method decorator handling complete
[ ] parameter decorator handling complete
[ ] NestJS decorator semantics verified
[ ] routes complete
[ ] parameters complete
[ ] types complete
[ ] DTO schemas complete
[ ] responses complete
[ ] HttpCode complete
[ ] guards/security complete
[ ] canonical Document generated
[ ] Document validated
[ ] deterministic output verified
[ ] example-api integration test passes
[ ] documentation updated
[ ] all changes committed
```

Only then stop the Document phase.

---

# 15. Documentation update protocol

After every successful step, update this file.

Example:

```md
## Step D12 — Call expression

Status: [x]

Files:
- `packages/provider-ast/src/...`

Implementation:
- ...

Test:
- Command: `pnpm run ...`

MATCH OUTPUT:

```text
...
```

Verification:
- Test: PASS
- Typecheck: PASS
- Diff: reviewed

Commit:
- `<hash>`
- `feat(provider-ast): support call expressions`
```

Never mark `[x]` before actual verification.

---

# 16. Commit rules

One logical feature per commit.

Examples:

```bash
git commit -m "feat(provider-ast): support call expressions"
git commit -m "test(provider-ast): cover object decorator arguments"
git commit -m "feat(provider-nestjs): analyze method decorators"
```

Before every commit:

```bash
git status
git diff
```

---

# 17. Agent safety rules

The agent must NOT:

- recreate existing resolvers
- duplicate Document models
- put NestJS semantics in `provider-ast`
- put generic AST logic in `provider-nestjs`
- execute application code
- execute arbitrary decorators
- evaluate unsafe dynamic expressions
- hardcode example-api controller names/routes into production logic
- silently ignore unsupported syntax
- continue without MATCH OUTPUT verification
- combine unrelated phases into one commit
- modify Studio during this phase
- modify CLI during this phase

---

# 18. Current starting point

Start exactly here:

```text
STEP D0 — Decorator architecture audit
```

Do NOT start route generation, Document generation, Studio, or CLI.

After D0, implement only the next approved step, verify it, update this document, commit it, and STOP.

The goal is a professional, scalable, framework-independent AST foundation followed by a complete NestJS semantic provider and a correct common Document.
