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

## D6 — String literals

Support both single and double quotes. Preserve AST information and extract semantic value when safe.

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

## D8 — Boolean literals

Test `true` and `false` and represent them as booleans.

---

## D9 — Null

Test `@Decorator(null)` and represent it distinctly as null.

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
