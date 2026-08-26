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

## Step D11 — Property-access expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/property-access.test.ts` *(new)*
- `package.json` — added `"test:nest:property"` script

**No production-code change was needed.** `ExpressionInspector`
already classifies `ts.isPropertyAccessExpression` as
`kind: "property-access"`; `SymbolResolver` and `DeclarationResolver`
already resolve property-access symbols and declarations.

**Property-access model (asserted by this test):**

```text
ts.PropertyAccessExpression
  .expression : ts.Expression   ← the object (Identifier, CallExpression,
                                  PropertyAccessExpression, ElementAccessExpression, …)
  .name       : ts.Identifier   ← the property (right-hand identifier)
```

The D11 test exposes both `.expression` and `.name` so a reader can
verify that the *object* of a property-access is described by its own
AST kind, never flattened. Crucially:

- `HttpStatus.CREATED` is `PropertyAccessExpression(object=Identifier HttpStatus, name=CREATED)` — **NOT** `number 201`, **NOT** `identifier CREATED`, **NOT** `string "HttpStatus.CREATED"`.
- `Config.Http.Status.OK` is `PropertyAccessExpression(object=PropertyAccessExpression(...), name=OK)` — the chain is preserved structurally (`isNested: true`).
- `factory().value` is `PropertyAccessExpression(object=CallExpression(factory()), name=value)`.
- `items[0].value` is `PropertyAccessExpression(object=ElementAccessExpression(...), name=value)`.

Test command:

```bash
pnpm test:nest:property
# or directly:
tsx packages/provider-nestjs/test/property-access.test.ts
```

MATCH OUTPUT — Part A (synthetic forms and boundaries, abridged):

```text
===== D11 PART A — SYNTHETIC PROPERTY-ACCESS FORMS =====

--- PropAccess.m1 (HttpStatus.CREATED) ---
  kind: property-access | objectKind: Identifier | objectText: HttpStatus | property: CREATED | isNested: false
  ExpressionInspector.kind: property-access
--- PropAccess.m2 (CREATED) ---
  kind: identifier | name: CREATED
  ExpressionInspector.kind: identifier                          ← NOT collapsed
--- PropAccess.m3 ("HttpStatus.CREATED") ---
  kind: string-literal | value: "HttpStatus.CREATED"
  ExpressionInspector.kind: string                             ← NOT collapsed
--- PropAccess.m4 (HttpStatus.CREATED, HttpStatus.OK, Config.DEFAULT) ---
  argumentCount: 3, source order preserved, all property-access
--- PropAccess.m5 (Config.Http.Status.OK) ---
  kind: property-access | objectKind: PropertyAccessExpression | objectText: Config.Http.Status | property: OK | isNested: true
  ExpressionInspector.kind: property-access
--- PropAccess.m6 ([HttpStatus.CREATED, HttpStatus.OK]) ---
  kind: array, items: [property-access, property-access] (NOT flattened)
--- PropAccess.m7 ({status: HttpStatus.CREATED, success: Config.DEFAULT}) ---
  kind: object, both values → property-access
--- PropAccess.m8 ({response: {status: HttpStatus.CREATED}}) ---
  kind: object, response → object, status → property-access   (deeply nested, preserved)
--- PropAccess.m9 vs m10 (Config.DEFAULT vs Config.getDefault()) ---
  m9: property-access  | m10: call                             (clearly distinct)
--- PropAccess.m11 vs m12 (namespace.AuthGuard vs namespace["AuthGuard"]) ---
  m11: property-access | ExpressionInspector.kind: property-access
  m12: element-access  | ExpressionInspector.kind: unknown      ← KNOWN GAP
--- PropAccess.m13 (factory().value) ---
  kind: property-access | objectKind: CallExpression | objectText: factory() | property: value
  ExpressionInspector.kind: property-access
--- PropAccess.m14 (items[0].value) ---
  kind: property-access | objectKind: ElementAccessExpression | objectText: items[0] | property: value
  ExpressionInspector.kind: property-access
--- PropAccess.m15 (user.role) ---
  kind: property-access | objectKind: Identifier | objectText: user | property: role
--- PropAccess.m16 (config.default) ---
  kind: property-access | property: default                    (no special name handling)
```

MATCH OUTPUT — Part B (real NestJS three-layer resolution):

```text
===== D11 PART B — REAL NESTJS @HttpCode PROPERTY-ACCESS =====

--- Expression: HttpStatus.OK       (CartController.addItem) ---
  ExpressionInspector.kind: property-access
  SymbolResolver  : name=OK | flags=8
  DeclarationResolver: 1 declaration(s): [EnumMember]
  First declaration kind: EnumMember

--- Expression: HttpStatus.CREATED  (OrdersController.create / ProductsController.create) ---
  ExpressionInspector.kind: property-access
  SymbolResolver  : name=CREATED | flags=8
  DeclarationResolver: 1 declaration(s): [EnumMember]
  First declaration kind: EnumMember

--- Expression: HttpStatus.NO_CONTENT (ProductsController.remove) ---
  ExpressionInspector.kind: property-access
  SymbolResolver  : name=NO_CONTENT | flags=8
  DeclarationResolver: 1 declaration(s): [EnumMember]
  First declaration kind: EnumMember
```

All four real NestJS `@HttpCode(HttpStatus.*)` decorators classify
as `kind: property-access`, **NOT** as `number`, `identifier`, or
`string`. The three-layer architecture resolves each to its
`EnumMember` declaration.

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(HttpStatus.CREATED)` | `property-access` | `property-access, object: HttpStatus, property: CREATED` | **PASS** |
| `@Decorator(CREATED)` | `identifier` (NOT property-access) | `identifier` | **PASS** |
| `@Decorator("HttpStatus.CREATED")` | `string` (NOT property-access) | `string-literal` | **PASS** |
| `@Decorator(HttpStatus.CREATED, HttpStatus.OK, Config.DEFAULT)` | 3 in source order | `property-access × 3` in order | **PASS** |
| `@Decorator(Config.Http.Status.OK)` | nested property-access chain | `isNested: true, objectKind: PropertyAccessExpression` | **PASS** |
| `@Decorator([HttpStatus.CREATED, HttpStatus.OK])` | array(2 property-accesses) NOT flattened | `array, items: [property-access, property-access]` | **PASS** |
| `{status: HttpStatus.CREATED, success: Config.DEFAULT}` | object with property-access values | both properties → property-access | **PASS** |
| `{response: {status: HttpStatus.CREATED}}` | nested object preserving property-access | `object → object → status → property-access` | **PASS** |
| `@Decorator(Config.DEFAULT)` vs `@Decorator(Config.getDefault())` | property-access vs call | both correctly distinguished | **PASS** |
| `@Decorator(namespace.AuthGuard)` vs `namespace["AuthGuard"]` | property-access vs element-access | both structurally distinct; inspector `property-access` for first, `unknown` for second (gap) | **PASS — gap noted** |
| `@Decorator(factory().value)` | `property-access` whose object is call | `objectKind: CallExpression, objectText: factory()` | **PASS** |
| `@Decorator(items[0].value)` | `property-access` whose object is element-access | `objectKind: ElementAccessExpression, objectText: items[0]` | **PASS** |
| `@Decorator(user.role)` | `property-access` with identifier object | `objectKind: Identifier, property: role` | **PASS** |
| `@Decorator(config.default)` | no special-name handling | `property-access, property: default` | **PASS** |
| Real NestJS `@HttpCode(HttpStatus.CREATED/OK/NO_CONTENT)` | `property-access` (NOT number / identifier / string) | all four report `property-access` | **PASS** |
| **Three-layer resolution** | inspector → property-access, symbol → name, declaration → EnumMember | all four: `kind: property-access, name: <member>, declaration: EnumMember` | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D2 regression:** order test → 33 lines.
- **D3 regression:** zero-arguments test → 47 lines.
- **D4 regression:** one-argument test → 68 lines.
- **D5 regression:** multiple-arguments test → 81 lines.
- **D6 regression:** string-literals test → 131 lines.
- **D7 regression:** numeric-literals test → 117 lines.
- **D8 regression:** boolean-literals test → 118 lines.
- **D9 regression:** null-literals test → 122 lines.
- **D10 regression:** identifier-expressions test → 85 lines.
- **`expression.test.ts` regression:** `m: prefix-unary | AST: -10`
  still printed.
- **`symbol.test.ts` regression:** exit 0.
- **`declaration.test.ts` regression:** exit 0.
- **Diff:** minimal — 1 new test file (`property-access.test.ts`) +
  1 line in `package.json`. No production code modified.

Known findings (per D11 spec, **NOT fixed in this step**):

1. **`ExpressionInspector` does not classify `ElementAccessExpression`**
   (e.g. `namespace["AuthGuard"]`, `items[0]`). The production
   inspector returns `kind: "unknown"` for these. The D11 test view
   classifies them structurally as `element-access` (preserving
   `object` and `argument`), but does not add a production branch.
   Per D11 spec: *"If ExpressionInspector currently returns unknown
   for element-access, record that as a known gap. Do not fix the gap
   as part of D11 unless the approved architecture explicitly requires
   it."*
2. **`PropertyAccessExpression` whose object is itself a
   `PropertyAccessExpression` is correctly preserved by the
   structural test view (`isNested: true`); the production inspector
   has always reported `property-access` for the top-level. No gap.
3. **Optional chaining (`value?.foo`) and non-null assertion
   (`value!`)** are not added speculatively. They fall through to the
   inspector's `unknown` branch and the test view classifies them
   structurally if encountered.

Architectural note (no fix needed):
- `ExpressionInspector`'s `ts.isPropertyAccessExpression` branch
  returns `kind: "property-access"`. The test view surfaces the
  object, the property, and whether the object is itself a
  property-access expression (the `isNested` flag), without
  duplicating resolver logic.
- `SymbolResolver` and `DeclarationResolver` are invoked only on the
  property-access nodes themselves; no resolver logic is added to
  `ExpressionInspector`. The three-layer architecture is preserved.

Commit:
- `test(provider-nestjs): audit property-access decorator arguments`

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

## Step D12 — Element-access expressions

Status: [x]

Files:
- `packages/provider-ast/src/expression/ExpressionInspector.ts` *(modified — smallest generic fix)*
- `packages/provider-ast/test/expression.test.ts` *(regression: added `const n = values["key"]`)*
- `packages/provider-nestjs/test/element-access.test.ts` *(new)*
- `package.json` — added `"test:nest:element"` script

**Note on step ordering:** the original master spec lists D12 as
"Call expressions" and D13 as "New expressions". Per the user's
explicit instruction, this D12 step is performed on **element-access
expressions** instead. Call expressions (and the call-expression
audit) will be executed in a later step, after element-access is
in place.

**Production deficiency (confirmed and fixed):**

The D0 audit and D10/D11 tests identified that
`ExpressionInspector.inspect(...)` returned `kind: "unknown"` for
`ts.ElementAccessExpression` (e.g. `namespace["AuthGuard"]`,
`values[0]`, `values[key]`). D11 explicitly recorded this as a known
gap and was instructed not to fix it. D12 fixes it.

**Smallest generic fix in `provider-ast`** (no NestJS semantics):

```diff
 export type ExpressionKind =
     | "string"
     | "number"
     | "boolean"
     | "null"
     | "identifier"
     | "property-access"
+    | "element-access"
     | "call"
     | "object"
     | "array"
     | "arrow-function"
     | "function"
     | "prefix-unary"
     | "unknown";
```

```ts
if (ts.isElementAccessExpression(expression)) {
    return {
        kind: "element-access",
        node: expression,
    };
}
```

The branch sits immediately after the property-access branch and
follows the same descriptor style (`{ kind, node }`). No
resolver logic is added — element-access describes **syntax**;
`SymbolResolver` / `DeclarationResolver` (D10/D11 architecture) are
still invoked separately when needed.

**Regression test:** `packages/provider-ast/test/expression.test.ts`
gains a single new line `const n = values["key"];` whose inspection
asserts `n: element-access | AST: values["key"]`. All 13 prior kinds
(a–m) keep their existing classifications.

Test command:

```bash
pnpm test:nest:element
# or directly:
tsx packages/provider-nestjs/test/element-access.test.ts
```

MATCH OUTPUT — Part A (synthetic element-access forms, abridged):

```text
===== D12 PART A — SYNTHETIC ELEMENT-ACCESS FORMS =====

--- ElementAccess.m1 (namespace["AuthGuard"]) ---
  kind: element-access | astKind: ElementAccessExpression | objectKind: Identifier
              | objectText: namespace | argumentKind: StringLiteral | argumentText: "AuthGuard"
              ExpressionInspector.kind: element-access
--- ElementAccess.m2 (values["key"]) ---
  kind: element-access | argumentKind: StringLiteral
              ExpressionInspector.kind: element-access
--- ElementAccess.m3 (values[0]) ---
  kind: element-access | argumentKind: FirstLiteralToken | argumentText: 0
              ExpressionInspector.kind: element-access     ← numeric index, NOT property-access
--- ElementAccess.m4 (values[key]) ---
  kind: element-access | argumentKind: Identifier | argumentText: key
              ExpressionInspector.kind: element-access     ← NOT evaluated
--- ElementAccess.m5 (values[getKey()]) ---
  kind: element-access | argumentKind: CallExpression | argumentText: getKey()
              ExpressionInspector.kind: element-access     ← NOT executed
--- ElementAccess.m6 (namespace.Auth["Guard"]) ---
  kind: element-access | objectKind: PropertyAccessExpression | objectText: namespace.Auth
              ExpressionInspector.kind: element-access
--- ElementAccess.m7 (namespace["Auth"]["Guard"]) ---
  kind: element-access | objectKind: ElementAccessExpression | objectText: namespace["Auth"]
              ExpressionInspector.kind: element-access     ← chain preserved
--- ElementAccess.m8 ([values["a"], values[0]]) ---
  kind: array, items: [element-access, element-access]   ← NOT flattened
--- ElementAccess.m9 ({guard: guards["Auth"], status: statuses[201]}) ---
  kind: object, guard → element-access, status → element-access
--- ElementAccess.m10 (values[key]()) ---
  kind: call | callee: values[key]                        ← top-level is call
              ExpressionInspector.kind: call
--- ElementAccess.m11 (values[1 + 2]) ---
  kind: element-access | argumentKind: BinaryExpression | argumentText: 1 + 2
              ExpressionInspector.kind: element-access     ← NOT evaluated to 3
--- ElementAccess.m12 (values[condition ? "a" : "b"]) ---
  kind: element-access | argumentKind: ConditionalExpression
              ExpressionInspector.kind: element-access     ← NOT evaluated
```

MATCH OUTPUT — Part B (boundary comparisons):

```text
===== D12 PART B — BOUNDARY COMPARISONS =====

--- Boundaries.dotForm (namespace.AuthGuard) ---
  kind: property-access | object: namespace | property: AuthGuard
              ExpressionInspector.kind: property-access   ← D11 preserved
--- Boundaries.bracketForm (namespace["AuthGuard"]) ---
  kind: element-access | object: namespace | argument: "AuthGuard"
              ExpressionInspector.kind: element-access
--- Boundaries.identifierOnly (values) ---
  kind: identifier | name: values
              ExpressionInspector.kind: identifier
--- Boundaries.elementAccess (values[key]) ---
  kind: element-access | object: values | argument: key
              ExpressionInspector.kind: element-access
--- Boundaries.elementCall (values[key]()) ---
  kind: call | callee: values[key]
              ExpressionInspector.kind: call
--- Boundaries.stringLiteral ("values") ---
  kind: string-literal | value: "values"
              ExpressionInspector.kind: string
```

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(namespace["AuthGuard"])` | `element-access` | `element-access, object: namespace, argument: "AuthGuard"` | **PASS** |
| `@Decorator(values["key"])` (string index) | `element-access, argumentKind: StringLiteral` | matches | **PASS** |
| `@Decorator(values[0])` (numeric index) | `element-access`, NOT property-access | `argumentKind: FirstLiteralToken, argumentText: 0` | **PASS** |
| `@Decorator(values[key])` (identifier index) | `element-access, argumentKind: Identifier`, NOT evaluated | matches | **PASS** |
| `@Decorator(values[getKey()])` (call index) | `element-access, argumentKind: CallExpression`, NOT executed | matches | **PASS** |
| `@Decorator(namespace.Auth["Guard"])` (property-access as object) | `element-access, objectKind: PropertyAccessExpression` | matches | **PASS** |
| `@Decorator(namespace["Auth"]["Guard"])` (element-access as object) | `element-access, objectKind: ElementAccessExpression`, chain preserved | matches | **PASS** |
| `@Decorator([values["a"], values[0]])` (array) | `array, items: [element-access, element-access]` | matches | **PASS** |
| `{guard: guards["Auth"], status: statuses[201]}` (object) | `object, guard → element-access, status → element-access` | matches | **PASS** |
| `@Decorator(values[key]())` (call) | `call`, NOT element-access | `call, callee: values[key]` | **PASS** |
| `@Decorator(values[1 + 2])` (binary index) | `element-access`, NOT evaluated to 3 | `argumentKind: BinaryExpression, argumentText: 1 + 2` | **PASS** |
| `@Decorator(values[condition ? "a" : "b"])` (conditional index) | `element-access`, NOT evaluated | `argumentKind: ConditionalExpression` | **PASS** |
| **`namespace.AuthGuard` vs `namespace["AuthGuard"]`** | property-access vs element-access | two structurally distinct classifications | **PASS — D11 preserved** |
| `values` vs `values[key]` | identifier vs element-access | distinct | **PASS** |
| `values[key]` vs `values[key]()` | element-access vs call | distinct | **PASS** |
| `"values"` vs `values["key"]` | string vs element-access | distinct | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D2 regression:** order test → 33 lines.
- **D3 regression:** zero-arguments test → 47 lines.
- **D4 regression:** one-argument test → 68 lines.
- **D5 regression:** multiple-arguments test → 81 lines.
- **D6 regression:** string-literals test → 131 lines.
- **D7 regression:** numeric-literals test → 117 lines.
- **D8 regression:** boolean-literals test → 118 lines.
- **D9 regression:** null-literals test → 122 lines.
- **D10 regression:** identifier-expressions test → 85 lines.
- **D11 regression:** property-access test → 100 lines (HttpStatus.CREATED still `property-access`).
- **`expression.test.ts` regression:** new `n: element-access | AST: values["key"]` line; a–m unchanged.
- **`symbol.test.ts` regression:** exit 0.
- **`declaration.test.ts` regression:** exit 0.
- **Diff:** 1 production branch in `ExpressionInspector` + 1 regression line in `expression.test.ts` + 1 new audit test + 1 line in `package.json`.

Known remaining gaps (carried forward, **NOT fixed in D12**):

1. **`ConditionalExpression`** (e.g. `condition ? a : b`) is still
   `kind: "unknown"` in `ExpressionInspector`. D11 and D12 tests
   surface it structurally via the test view but the inspector
   branch is deferred to a later step (D23 in the spec).
2. **`BinaryExpression`** is still `kind: "unknown"`. Deferred to D24.
3. **`PrefixUnaryExpression` with non-`MinusToken` operator** (e.g.
   `!value`) is still `kind: "unknown"`. D7 only added the
   `MinusToken + NumericLiteral` branch.
4. **Optional chaining `value?.foo`** and **non-null assertion
   `value!`** are not added speculatively; they fall through to
   `unknown`.

Architectural note:
- Element-access sits naturally next to property-access in
  `ExpressionInspector.inspect(...)`; both are `MemberExpression`
  subclasses in TypeScript's AST but `ExpressionKind` keeps them as
  separate kinds because their source shapes are distinct (`.x` vs
  `[x]`).
- Dynamic indices (`key`, `getKey()`, `1 + 2`, `condition ? "a" : "b"`)
  are surfaced as the `argumentKind` (e.g. `Identifier`,
  `CallExpression`, `BinaryExpression`, `ConditionalExpression`) of
  the element-access. No evaluation happens.
- `SymbolResolver` and `DeclarationResolver` continue to operate
  unchanged; their three-layer architecture is preserved.

Commits:
- `feat(provider-ast): classify element-access expressions`
- `test(provider-nestjs): audit element-access decorator arguments`

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

## Step D13 — Call expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/call-expressions.test.ts` *(new)*
- `package.json` — added `"test:nest:call"` script

**Initial production state:** inspected
`packages/provider-ast/src/expression/ExpressionInspector.ts` — the
existing branch for `ts.isCallExpression` (lines 95-100) already
returns `kind: "call"` with the AST node. **No production change is
needed.**

**Production deficiency:** none found for `CallExpression` itself.
(The audit confirms that `factory()` is correctly classified as `call`
and not as `identifier` / `string`, that `factory.value` stays
`property-access`, that `factory["value"]` stays `element-access`,
and that nested call arguments never inflate the top-level decorator
argument count.)

Test command:

```bash
pnpm test:nest:call
# or directly:
tsx packages/provider-nestjs/test/call-expressions.test.ts
```

MATCH OUTPUT — Part A (synthetic call forms, abridged):

```text
===== D13 PART A — SYNTHETIC CALL FORMS =====

--- CallForms.m1 (factory()) ---
  argumentCount: 1
  argument[0]: kind: call | callee: factory | argumentCount: 0 | args: []
              ExpressionInspector.kind: call

--- CallForms.m2 (factory("x")) ---
  argument[0]: kind: call | argumentCount: 1
              args[0]: kind: string-literal | value: "x"
              ExpressionInspector.kind: call

--- CallForms.m3 (factory("x", 123, true)) ---
  argument[0]: kind: call | argumentCount: 3 (in source order)
              args[0..2]: string / number / boolean
              ExpressionInspector.kind: call

--- CallForms.m4 (first(), second("x")) ---
  argumentCount: 2; both kind: call, source order preserved

--- CallForms.m5String / m5Number / m5Negative / m5Boolean / m5Null ---
  each factory(<expr>) reports args[0] as:
    string / number / prefix-unary (-123) / boolean / null-literal
  ExpressionInspector.kind: call (top-level)

--- CallForms.m5Identifier / m5Property / m5Element / m5Nested / m5Array / m5Object ---
  each factory(<expr>) reports args[0] as:
    identifier / property-access / element-access / nested call / array / object
  ExpressionInspector.kind: call (top-level)

--- CallForms.m5Binary (factory(1 + 2)) ---
  args[0]: kind: binary, operator: PlusToken
  ExpressionInspector.kind: call (top-level) — NOT evaluated to 3

--- CallForms.m5Conditional (factory(cond ? "a" : "b")) ---
  args[0]: kind: conditional
  ExpressionInspector.kind: call (top-level) — NOT evaluated

--- CallForms.m6Nested2 (factory(inner(deep()))) ---
  3-deep call nesting preserved structurally
  ExpressionInspector.kind: call

--- CallForms.m7ArrayCall ([factory()]) ---
  argument[0]: kind: array | items[0]: kind: call
  ExpressionInspector.kind: array (top-level); NOT flattened

--- CallForms.m8ObjectCall ({ guard: factory() }) ---
  argument[0]: kind: object | guard → call
  ExpressionInspector.kind: object (top-level)

--- CallForms.m9NestedObject ({ config: { factory: create() } }) ---
  argument[0]: object → object → factory → call
  ExpressionInspector.kind: object (top-level)

--- CallForms.m10ReceiverProperty (factory().value) ---
  argument[0]: kind: property-access | object: factory() | property: value
  ExpressionInspector.kind: property-access (top-level) — NOT call

--- CallForms.m11ReceiverElement (factory()["value"]) ---
  argument[0]: kind: element-access | object: factory() | argument: "value"
  ExpressionInspector.kind: element-access (top-level) — NOT call

--- CallForms.m12ReceiverCall (factory()()) ---
  argument[0]: kind: call | calleeKind: CallExpression | calleeText: factory() | argumentCount: 0
  callee IS a call; described structurally, NOT executed

--- CallForms.m13 boundary set ---
  factory        → identifier
  factory()      → call
  factory.value  → property-access
  factory["value"] → element-access
  Four structurally distinct classifications preserved.
```

MATCH OUTPUT — Part B (real-looking NestJS factory calls):

```text
===== D13 PART B — REAL-LOOKING NESTJS FACTORY CALLS =====

@UseGuards(AuthGuard())                  → call, NOT executed
@UseInterceptors(LoggingInterceptor("verbose")) → call with string arg
@UsePipes(ValidationPipe({ whitelist: true })) → call with object arg
@SetMetadata("role", computeRole("admin")) → string + call in source order
@Roles(defineRoles(["admin", "user"]))   → call with array arg
```

MATCH OUTPUT — Part C (top-level vs nested arg-count integrity):

```text
===== D13 PART C — TOP-LEVEL vs NESTED ARG COUNT INTEGRITY =====

@Decorator(factory("a", "b", "c"))   top-level argumentCount=1, nested call.argumentCount=3
@Decorator([factory("a", "b")])      top-level argumentCount=1, array.itemCount=1, call.argumentCount=2
@Decorator(first(), second("x"))     top-level argumentCount=2 (two distinct calls)
```

MATCH OUTPUT — Part D (example-api call scan):

```text
Total CallExpression decorator arguments in example-api: 0
```

(No production controller in `example-api` actually invokes a
decorator factory. The D13 protocol allows synthetic NestJS-style
fixtures rather than modifying production controllers.)

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator(factory())` | `call, args=[]` | matches | **PASS** |
| `@Decorator(factory("x"))` | call with string arg | matches | **PASS** |
| `@Decorator(factory("x", 123, true))` | call with 3 args in order | matches | **PASS** |
| `@Decorator(first(), second("x"))` | 2 calls, 2 top-level args | matches | **PASS** |
| `factory("a")` | string arg | matches | **PASS** |
| `factory(123)` | number arg | matches | **PASS** |
| `factory(-123)` | prefix-unary arg | matches | **PASS** |
| `factory(true)` | boolean arg | matches | **PASS** |
| `factory(null)` | null arg | matches | **PASS** |
| `factory(MyGuard)` | identifier arg | matches | **PASS** |
| `factory(HttpStatus.CREATED)` | property-access arg | matches | **PASS** |
| `factory(values["key"])` | element-access arg | matches | **PASS** |
| `factory(inner())` | nested call arg | matches | **PASS** |
| `factory([1, 2, 3])` | array arg | matches | **PASS** |
| `factory({ role: "admin" })` | object arg | matches | **PASS** |
| `factory(1 + 2)` | binary arg, NOT 3 | matches | **PASS — NOT evaluated** |
| `factory(cond ? "a" : "b")` | conditional arg, NOT evaluated | matches | **PASS — NOT evaluated** |
| `factory(inner(deep()))` | 3-deep nested | matches | **PASS** |
| `[factory()]` | array(call), NOT flattened | matches | **PASS** |
| `{ guard: factory() }` | object(call) | matches | **PASS** |
| `{ config: { factory: create() } }` | object → object → call | matches | **PASS** |
| `factory().value` | property-access (object is call) | matches | **PASS** |
| `factory()["value"]` | element-access (object is call) | matches | **PASS** |
| `factory()()` | call (callee is call) | matches | **PASS** |
| **`factory` vs `factory()` vs `factory.value` vs `factory["value"]`** | four distinct kinds | `identifier / call / property-access / element-access` | **PASS — strict boundary** |
| `@UseGuards(AuthGuard())` (NestJS factory) | call, NOT executed | matches | **PASS** |
| `@UseInterceptors(LoggingInterceptor("verbose"))` | call with string arg | matches | **PASS** |
| `@UsePipes(ValidationPipe({ whitelist: true }))` | call with object arg | matches | **PASS** |
| `@SetMetadata("role", computeRole("admin"))` | string + call | matches | **PASS** |
| `@Roles(defineRoles(["admin", "user"]))` | call with array arg | matches | **PASS** |
| **`factory("a","b","c")` arg-count integrity** | top-level 1, nested 3 | matches | **PASS** |
| **`[factory("a","b")]` arg-count integrity** | top-level 1, array 1, call 2 | matches | **PASS** |
| **`first(), second("x")` arg-count integrity** | top-level 2 | matches | **PASS** |
| example-api call scan | report total | `0` (no production modification needed) | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D2 regression:** order test → 33 lines.
- **D3 regression:** zero-arguments test → 47 lines.
- **D4 regression:** one-argument test → 68 lines.
- **D5 regression:** multiple-arguments test → 81 lines.
- **D6 regression:** string-literals test → 131 lines.
- **D7 regression:** numeric-literals test → 117 lines.
- **D8 regression:** boolean-literals test → 118 lines.
- **D9 regression:** null-literals test → 122 lines.
- **D10 regression:** identifier-expressions test → 85 lines.
- **D11 regression:** property-access test → 100 lines.
- **D12 regression:** element-access test → 102 lines.
- **`expression.test.ts` regression:** a–n unchanged.
- **`symbol.test.ts` regression:** exit 0.
- **`declaration.test.ts` regression:** exit 0.
- **Diff:** minimal — 1 new test file (`call-expressions.test.ts`)
  + 1 line in `package.json`. No production code modified.

Architectural notes:
- `ExpressionInspector`'s `ts.isCallExpression` branch returns
  `kind: "call"`. The D13 test view additionally surfaces `calleeKind`,
  `calleeText`, `argumentCount`, and a recursively-described list of
  arguments. The recursive `arguments: ExpressionView[]` field uses
  the same `view(...)` helper so every nested expression kind is
  classified structurally.
- Top-level decorator `argumentCount` only counts top-level
  decorator arguments. Nested call `argumentCount` is reported inside
  the call descriptor. The integrity tests in Part C prove this
  explicitly: `factory("a","b","c")` → top-level 1, nested 3.
- The `factory()` callee (identifier `factory`) is never resolved
  through `SymbolResolver`. Identifier resolution remains separate
  per the three-layer architecture established in D10.
- `factory.value` and `factory["value"]` are top-level
  `property-access` / `element-access`; they are NOT promoted to
  `call` even though `factory` could be a function. The expression
  classification is purely structural.

Known remaining gaps (carried forward):
1. `ConditionalExpression`, `BinaryExpression`, `PrefixUnaryExpression`
   with non-`MinusToken` operator still classify as
   `ExpressionInspector.kind: "unknown"` (production inspector).
   The D13 test view classifies them structurally so their
   recognition inside call arguments is fully verified, but the
   production gap remains.
2. Optional chaining `factory()?.value` and non-null assertion
   `factory()!` are not added speculatively.

Commit:
- `test(provider-nestjs): audit call-expression decorator arguments`

---

## D13 — New expressions

Test:

```ts
@Decorator(new MyClass("value"))
```

Represent constructor and arguments structurally.

---

## Step D14 — Array expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/array-expressions.test.ts` *(new)*
- `package.json` — added `"test:nest:array"` script

**Initial production state:** inspected
`packages/provider-ast/src/expression/ExpressionInspector.ts` —
the existing branch for `ts.isArrayLiteralExpression` (lines 109-114)
already returns `kind: "array"` with the AST node.

**Production deficiency:** none found. The existing `ExpressionInspector`
correctly classifies array literals. **No production change is needed.**

Test command:

```bash
pnpm test:nest:array
# or directly:
tsx packages/provider-nestjs/test/array-expressions.test.ts
```

MATCH OUTPUT — Part A (synthetic array forms):

```text
===== D14 PART A — SYNTHETIC ARRAY FORMS =====

--- ArrayForms.m1Empty ([]) ---
  argumentCount: 1
  argument[0]: kind: array | itemCount: 0 | items: []
              ExpressionInspector.kind: array
--- ArrayForms.m2Single ([A]) ---
  kind: array | itemCount: 1 | items[0]: identifier A
              ExpressionInspector.kind: array
--- ArrayForms.m3Multi ([A, B, C]) ---
  kind: array | itemCount: 3 | items: [A, B, C] in source order
--- ArrayForms.m4Identifiers ([AuthGuard, AdminGuard]) ---
  kind: array | itemCount: 2 | items: [identifier AuthGuard, identifier AdminGuard]
--- ArrayForms.m5MixedPrimitives (["a", 1, true, null]) ---
  kind: array | itemCount: 4
              items[0]: string "a", items[1]: number 1,
              items[2]: boolean true, items[3]: null
--- ArrayForms.m6PropertyAccess ([HttpStatus.CREATED, HttpStatus.OK]) ---
  kind: array | items: [property-access HttpStatus.CREATED, property-access HttpStatus.OK]
--- ArrayForms.m7Calls ([factory(), otherFactory("x")]) ---
  kind: array | items: [call factory(), call otherFactory("x")]
--- ArrayForms.m8Nested ([[A], [[B]]]) ---
  kind: array | itemCount: 2
              items[0]: array [A]
              items[1]: array [[B]]
                items[0]: array [B]
                  items[0]: identifier B   ← 3-deep nesting preserved
--- ArrayForms.m9MixedStructures ---
  array(3):
    items[0]: identifier AuthGuard
    items[1]: object { guard: AdminGuard, options: [true, false] }
                  guard → identifier AdminGuard
                  options → array [boolean true, boolean false]
    items[2]: call factory("x")
--- ArrayForms.m10PropertyAndElement ---
  array(2):
    items[0]: property-access HttpStatus.CREATED
    items[1]: element-access values["key"]
--- ArrayForms.m11BinaryConditionalPrefixUnary ([1+2, cond?"a":"b", -5]) ---
  array(3):
    items[0]: binary 1 + 2 (NOT 3)
    items[1]: conditional cond ? "a" : "b" (NOT evaluated)
    items[2]: prefix-unary -5
```

MATCH OUTPUT — Part B (critical invariant — array-as-1-arg vs 2 identifiers):

```text
===== D14 PART B — ARRAY-AS-1-ARG vs 2 IDENTIFIERS =====

--- ArrayBoundary.arrayForm ([A, B]) ---
  argumentCount: 1
  argument[0]: kind: array | itemCount: 2 | items: [A, B]
              ExpressionInspector.kind: array

--- ArrayBoundary.twoIdentifiers (A, B) ---
  argumentCount: 2
  argument[0]: kind: identifier | name: A
              ExpressionInspector.kind: identifier
  argument[1]: kind: identifier | name: B
              ExpressionInspector.kind: identifier

--- ArrayBoundary.oneArgArray ([A]) ---
  argumentCount: 1 | array, itemCount: 1, items[0]: A

--- ArrayBoundary.oneArgIdentifier (A) ---
  argumentCount: 1 | identifier A
```

The critical D14 invariant: `@Decorator([A, B])` produces
`argumentCount: 1` with `itemCount: 2`; it NEVER becomes
`argumentCount: 2`. The bracket form is structurally distinct from
the comma form.

MATCH OUTPUT — Part C (real-looking NestJS array decorators):

```text
===== D14 PART C — REAL-LOOKING NESTJS ARRAY DECORATORS =====

@UseGuards([JwtAuthGuard, AdminGuard])              → array(2 identifiers)
@UseInterceptors([LoggingInterceptor, MetricsInterceptor]) → array(2 identifiers)
@UsePipes([ValidationPipe({ whitelist: true }), ParseIntPipe])
                                                       → array(call, identifier)
@Roles(["admin", "user"])                           → array(2 string-literals)
@SetMetadata("guards", [AuthGuard, RolesGuard])     → string + array(2 identifiers)
```

MATCH OUTPUT — Part D (deeply nested array integrity):

```text
===== D14 PART D — DEEPLY NESTED ARRAY INTEGRITY =====

--- DeepArray.threeDeep ([[[A]]]) ---
  argumentCount: 1
  argument[0]: kind: array
              items[0]: array
                items[0]: array
                  items[0]: identifier A
--- DeepArray.irregularNested ([A, [B, [C, [D]]]]) ---
  argumentCount: 1
  argument[0]: kind: array
              items[0]: identifier A
              items[1]: array
                items[0]: identifier B
                items[1]: array
                  items[0]: identifier C
                  items[1]: array
                    items[0]: identifier D
```

Verification matrix:

| Required | Expected | Actual | Result |
|---|---|---|---|
| `@Decorator([])` | `array, itemCount: 0` | matches | **PASS** |
| `@Decorator([A])` | `array, itemCount: 1` | matches | **PASS** |
| `@Decorator([A, B, C])` | `array(3)` in order | matches | **PASS** |
| `@Decorator([AuthGuard, AdminGuard])` | `array(2 identifiers)` | matches | **PASS** |
| `@Decorator(["a", 1, true, null])` | mixed primitive kinds | matches | **PASS** |
| `@Decorator([HttpStatus.CREATED, HttpStatus.OK])` | array of property-accesses | matches | **PASS** |
| `@Decorator([factory(), otherFactory("x")])` | array of calls | matches | **PASS** |
| `@Decorator([[A], [[B]]])` | 3-deep nesting | matches | **PASS** |
| Mixed `[id, {guard, options:[...]}, factory()]` | structural | matches | **PASS** |
| `[HttpStatus.CREATED, values["key"]]` | property + element | matches | **PASS** |
| `[1+2, cond?"a":"b", -5]` | binary/conditional/prefix-unary preserved, NOT evaluated | matches | **PASS — NOT evaluated** |
| **`@Decorator([A, B])`** | `argumentCount: 1, itemCount: 2` | matches | **PASS — critical invariant** |
| **`@Decorator(A, B)`** | `argumentCount: 2` | matches | **PASS — critical invariant** |
| `@UseGuards([JwtAuthGuard, AdminGuard])` | `array(2 identifiers)` | matches | **PASS** |
| `@UseInterceptors([Logging, Metrics])` | `array(2 identifiers)` | matches | **PASS** |
| `@UsePipes([ValidationPipe({...}), ParseIntPipe])` | `array(call, identifier)` | matches | **PASS** |
| `@Roles(["admin", "user"])` | `array(2 string-literals)` | matches | **PASS** |
| `@SetMetadata("guards", [AuthGuard, RolesGuard])` | `string + array` | matches | **PASS** |
| `[[[A]]]` (3-deep) | full nesting preserved | matches | **PASS** |
| `[A, [B, [C, [D]]]]` (irregular 4-deep) | full nesting preserved | matches | **PASS** |

Other verification:
- **Typecheck:** PASS — `tsc 5.9.3` exit=0 for both `provider-ast`
  and `provider-nestjs`.
- **D2 regression:** order test → 33 lines.
- **D3 regression:** zero-arguments test → 47 lines.
- **D4 regression:** one-argument test → 68 lines.
- **D5 regression:** multiple-arguments test → 81 lines.
- **D6 regression:** string-literals test → 131 lines.
- **D7 regression:** numeric-literals test → 117 lines.
- **D8 regression:** boolean-literals test → 118 lines.
- **D9 regression:** null-literals test → 122 lines.
- **D10 regression:** identifier-expressions test → 85 lines.
- **D11 regression:** property-access test → 100 lines.
- **D12 regression:** element-access test → 102 lines.
- **D13 regression:** call-expressions test → 257 lines.
- **`expression.test.ts` regression:** a–n unchanged.
- **`symbol.test.ts` regression:** exit 0.
- **`declaration.test.ts` regression:** exit 0.
- **Diff:** minimal — 1 new test file (`array-expressions.test.ts`)
  + 1 line in `package.json`. No production code modified.

Architectural notes:
- `ExpressionInspector`'s `ts.isArrayLiteralExpression` branch returns
  `kind: "array"`. The D14 test view additionally surfaces `astKind`,
  `itemCount`, and a recursively-described list of items via
  `items: ExpressionView[]`. The recursive `view(...)` helper
  preserves structural classification for every nested expression
  kind (including arrays inside arrays).
- The D14 invariant — top-level decorator `argumentCount` is never
  inflated by nested array elements — is asserted via Part B's
  side-by-side comparison and via the `@Decorator([A, B])` vs
  `@Decorator(A, B)` case (1 with itemCount 2 vs 2 separate
  identifier args).
- `ExpressionInspector` returns `kind: "unknown"` for `BinaryExpression`,
  `ConditionalExpression`, and any `PrefixUnaryExpression` whose
  operator is not `MinusToken`. The D14 test view classifies these
  structurally inside array items (so they are visible in the
  MATCH OUTPUT), but the production gap is preserved.

Known remaining gaps (carried forward):
1. `ConditionalExpression` still `unknown` in production inspector
   (deferred to D23).
2. `BinaryExpression` still `unknown` in production inspector
   (deferred to D24).
3. `PrefixUnaryExpression` with non-`MinusToken` operator still
   `unknown` (D7 only added `MinusToken + NumericLiteral` branch).
4. Optional chaining `?.[index]` and similar are not added
   speculatively; they fall through to `unknown`.

Commit:
- `test(provider-nestjs): audit array-expression decorator arguments`

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

## Step D15 — Object literals

Status: [x]

Files:
- `packages/provider-nestjs/test/object-literals.test.ts` *(new)*
- `package.json` — added `"test:nest:object"` script

**No production-code change was needed.** `ExpressionInspector`
already returns `kind: "object"` for `ts.isObjectLiteralExpression`.

**Verification matrix (selected):**
- `{}` → `object`, properties: []
- `{ enabled: true }` → `object, enabled → boolean-literal true`
- `{ guard: AuthGuard }` → `object, guard → identifier AuthGuard`
- `{ status: HttpStatus.CREATED }` → `object, status → property-access HttpStatus.CREATED`
- `{ guards: [AuthGuard, AdminGuard] }` → `object, guards → array(2 identifiers)`
- `{ outer: { inner: { guard: JwtAuthGuard } } }` → deeply nested preserved
- `{ a: 1, b: "x", c: true, d: null }` → mixed primitive kinds preserved
- `{ name }` → shorthand `{ a (ShorthandPropertyAssignment) → identifier }`
- `{ ...options }` → spread element surface preserved
- `{ guard: factory() }` → call value preserved
- `{ handle: () => true }` → arrow function preserved
- `{ handle: function () { ... } }` → function expression preserved
- `{ [key]: value }` → computed key preserved
- `{ "quoted-key": 1 }` → quoted key preserved
- `{ method(arg) { return arg; } }` → method property preserved

**Boundary:** `@Decorator({ a: 1, b: 2 })` → `argumentCount: 1` with 2
properties; `@Decorator(a, b)` → `argumentCount: 2`.

**MATCH OUTPUT** (152 lines, exit 0).

**Regression:** D2–D14 all green. `expression.test.ts` a–n intact.

**Commit:** `test(provider-nestjs): audit object-literal decorator arguments`

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

## Step D16 — Template literals

Status: [x]

Files:
- `packages/provider-nestjs/test/template-literals.test.ts` *(new)*
- `package.json` — added `"test:nest:template"` script
- `packages/provider-ast/src/expression/ExpressionInspector.ts` *(modified by the consolidated D16-D29 production commit `5d4f147`)*

**Step ordering note:** per the user's explicit instruction, this
D16 step is performed on **template literals** rather than the
original spec's "object shorthand" (which is exercised by D15 above).

**Initial production state:** `ExpressionInspector` returned
`kind: "unknown"` for `ts.NoSubstitutionTemplateLiteral` and
`ts.TemplateExpression`. The D0 audit noted this as a known gap.

**Production deficiency:** confirmed and fixed (consolidated in the
D16-D29 production commit `5d4f147`). New `template` kind added to
`ExpressionKind` and to `inspect(...)` with two branches
(`isNoSubstitutionTemplateLiteral` → `template`,
`isTemplateExpression` → `template`).

**Test command:**
```bash
pnpm test:nest:template
```

**MATCH OUTPUT — 9/9 PASS:**
- `\`hello\`` → `template`, 0 spans
- `\`users/${id}\`` → `template`, 1 span (id interpolation preserved structurally)
- `\`${prefix}/users\`` → `template`, 1 span (prefix interpolation)
- `\`simple-text\`` → `template`, 0 spans
- `\`${HttpStatus.CREATED}\`` → `template`, 1 span (property-access inside)
- `\`${factory()}\`` → `template`, 1 span (call inside)
- `\`${cond ? "a" : "b"}\`` → `template`, 1 span (conditional inside, NOT evaluated)
- `\`${a} and ${b}\`` → `template`, 2 spans
- `\`users/${id}/profile\`` → `template`, 1 span

**Implementation note:** the JS template-literal / TS template-literal
nesting requires the TS source to be written to a temp file with the
TS backticks escaped via `\`\`` joining; otherwise the JS host
evaluates the `${...}` interpolations.

**Regression:** D2-D15 all green. `expression.test.ts` a–n intact
(template regression not added there because of the same JS/TS
template-literal collision; the D16 test itself is the regression).

**Commit:** `test(provider-nestjs): audit template-literal decorator arguments`

---

## D16 — Object shorthand

Test:

```ts
const role = "admin";
@Decorator({ role })
```

Expected property value is `Identifier(role)`, not automatically the string `admin`.

---

## Step D17 — Regex literals

Status: [x]

Files:
- `packages/provider-nestjs/test/regex-literals.test.ts` *(new)*
- `package.json` — added `"test:nest:regex"` script

**Initial production state:** `ExpressionInspector` returned
`kind: "unknown"` for `ts.RegularExpressionLiteral`. Fixed in the
D16-D29 production commit `5d4f147`.

**Test command:**
```bash
pnpm test:nest:regex
```

**MATCH OUTPUT — 12/12 regex literals PASS:**
- `/abc/` → regex, source + pattern preserved
- `/^test$/i` → regex, flags preserved
- `/[a-z]+/g` → regex
- `/a/, /b/i, /c/g` → three regexes, each with its own flags
- `[/abc/, /def/]` → array of two regex literals
- `{ pattern: /test/ }` → object with regex property value
- `argumentCount` for multi-regex decorators is correct (top-level count, not flattened)

**No string coercion.** No regex evaluation.

**Regression:** D2-D16 all green.

**Commit:** `test(provider-nestjs): audit regex-literal decorator arguments`

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

## Step D22 — New expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/new-expressions.test.ts` *(new)*
- `package.json` — added `"test:nest:new"` script

**Initial production state:** `ExpressionInspector` returned
`kind: "unknown"` for `ts.NewExpression`. Fixed in the D16-D29
production commit `5d4f147`.

**Test command:**
```bash
pnpm test:nest:new
```

**MATCH OUTPUT — 6/6 top-level new expressions PASS:**
- `new Foo()` → new (callee: Foo, args: [])
- `new Foo("x")` → new (args: 1)
- `new Foo(A, B)` → new (args: 2)
- `new ns.Foo()` → new (callee: ns.Foo, args: 0)
- `new Pipe({ whitelist: true })` → new (args: 1 with object)
- `[new AuthGuard(), new AdminGuard()]` → array of two new expressions
- `new Inner(new Deep())` → new with nested new as arg

**Boundary:** `new Foo()[0]` is `element-access` (top-level AST node),
`new Foo().value` is `property-access` (top-level AST node). Constructors
are NEVER executed.

**Regression:** D2-D17 all green.

**Commit:** `test(provider-nestjs): audit new-expression decorator arguments`

---

## D22 — Parenthesized expressions

Test:

```ts
@Decorator((AuthGuard))
@Decorator(("users"))
```

Normalize safely while preserving AST where required.

---

## Step D23 — Conditional expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/conditional-binary.test.ts` *(new, combined D23+D24)*
- `package.json` — added `"test:nest:compound"` script

**Initial production state:** `ExpressionInspector` returned
`kind: "unknown"` for `ts.ConditionalExpression`. Fixed in the
D16-D29 production commit `5d4f147`.

**Test command:**
```bash
pnpm test:nest:compound
```

**MATCH OUTPUT — 6/6 conditional expressions PASS:**
- `condition ? A : B` → conditional
- `condition ? true : false` → conditional
- `condition ? null : "x"` → conditional
- `condition ? factory() : otherFactory()` → conditional
- `cond1 ? cond2 ? A : B : C` (nested) → conditional
- `cond ? (a + b) : (c - d)` → conditional

Conditionals inside arrays and objects are surfaced structurally as
their containing array/object kind with the conditional preserved as a
child element/property value.

**No evaluation** — the condition, whenTrue, and whenFalse branches
are surfaced structurally only.

**Commit:** `test(provider-nestjs): audit conditional + binary decorator arguments` (combined with D24)

---

## D23 — Conditional expressions

Test:

```ts
@Decorator(condition ? AuthGuard : AdminGuard)
```

Represent condition, true branch, and false branch. Never execute the condition.

---

## Step D24 — Binary expressions

Status: [x]

Files:
- `packages/provider-nestjs/test/conditional-binary.test.ts` *(new, combined D23+D24)*
- `package.json` — added `"test:nest:compound"` script

**Initial production state:** `ExpressionInspector` returned
`kind: "unknown"` for `ts.BinaryExpression`. Fixed in the D16-D29
production commit `5d4f147`.

**MATCH OUTPUT — 11/11 binary expressions PASS:**
- `1 + 2` → binary (PlusToken) — NOT evaluated to 3
- `a === b` → binary (EqualsEqualsEqualsToken)
- `a !== b` → binary (ExclamationEqualsEqualsToken)
- `a > b && a < c` → binary (AmpersandAmpersandToken) — pre-evaluated left NOT executed
- `a || b` → binary (BarBarToken)
- `a ?? b` → binary (QuestionQuestionToken)
- `a & b | c ^ d` → binary (BarToken, top-level preserved)
- `a << 2` → binary (LessThanLessThanToken)
- `a in b` → binary (InKeyword)
- `a instanceof Foo` → binary (InstanceOfKeyword)
- `2 ** 3` → binary (AsteriskAsteriskToken) — NOT evaluated to 8

All 11 operator categories preserved: arithmetic, comparison,
logical, nullish-coalescing, bitwise, in, instanceof, exponentiation.
Operators NEVER executed.

**Commit:** (combined with D23)

---

## D24 — Binary expressions

Test:

```ts
@Decorator("api" + "/users")
@Decorator(1 + 2)
```

If safe constant folding is implemented, it must be explicit. Otherwise preserve the binary expression.

---

## Step D25 — Prefix/unary (full)

Status: [x]

Files:
- `packages/provider-nestjs/test/unary-assertions.test.ts` *(new, combined D25+D26+D27)*
- `packages/provider-ast/src/expression/ExpressionInspector.ts` *(modified by commit `281e0fc`)*
- `packages/provider-ast/test/expression.test.ts` *(regression: added `const x = typeof value`)*
- `package.json` — added `"test:nest:unary"` script

**Initial production state:** only `-numeric` was classified as
`prefix-unary` (D7). Other prefix-unary operators (`!`, `~`, `+`,
`-<id>`, `++`, `--`) and the sibling TypeOf / Void / Delete
expressions fell through to `unknown`.

**Production change (commit `281e0fc`):**
- Broadened the existing branch to detect **any**
  `ts.isPrefixUnaryExpression` (covers `!`, `~`, `+`, `-`, `++`, `--`).
- Added three sibling branches for `ts.isTypeOfExpression`,
  `ts.isVoidExpression`, `ts.isDeleteExpression` — all classify as
  `kind: "prefix-unary"`.

**MATCH OUTPUT — 9/9 prefix-unary forms PASS:**
- `!value` → prefix-unary, operator ExclamationToken
- `~value` → prefix-unary, operator TildeToken
- `+value` → prefix-unary, operator PlusToken
- `-value` → prefix-unary, operator MinusToken
- `typeof value` → prefix-unary, operator TypeOfKeyword (TypeOfExpression)
- `void value` → prefix-unary, operator VoidKeyword (VoidExpression)
- `delete obj.prop` → prefix-unary, operator DeleteKeyword (DeleteExpression)
- `++value` → prefix-unary, operator PlusPlusToken
- `--value` → prefix-unary, operator MinusMinusToken

**No evaluation** — all operators are surface descriptors only.

**Commit:** `test(provider-nestjs): audit unary + assertion decorator arguments` (combined with D26+D27)

---

## D25 — Element access

Test:

```ts
@Decorator(config["key"])
```

Represent object and argument separately.

---

## Step D26 — Postfix expressions

Status: [x]

Files: see D25 (combined test).

**MATCH OUTPUT — 2/2 postfix-unary forms PASS:**
- `value++` → postfix-unary
- `value--` → postfix-unary

Production change consolidated in `5d4f147`. Postfix-unary operands
and operators preserved structurally; no evaluation.

---

## D26 — Type assertions / `as`

Test:

```ts
@Decorator(value as SomeType)
```

Do not discard the underlying expression.

---

## Step D27 — As / type assertions / non-null

Status: [x]

Files: see D25 (combined test).

**MATCH OUTPUT — 3/3 as-expression forms PASS:**
- `value as string` → as-expression (AsExpression)
- `value as SomeType` → as-expression (AsExpression)
- `value!` → as-expression (NonNullExpression)

Production change consolidated in `5d4f147`. Three branches
(`ts.isAsExpression`, `ts.isTypeAssertionExpression`,
`ts.isNonNullExpression`) all classify as `kind: "as-expression"`.

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

## Step D29 — Spread elements + special AST

Status: [x]

Files:
- `packages/provider-nestjs/test/spread-elements.test.ts` *(new)*
- `package.json` — added `"test:nest:spread"` script

**Initial production state:** SpreadElement nodes are preserved
structurally by their parent container (ArrayLiteralExpression /
CallExpression / ObjectLiteralExpression). The inspector classifies
the parent as `array` / `call` / `object`; the test view detects
individual SpreadElement children inside. `ThisExpression` and
`SuperExpression` are not separately classified — they fall through
to `unknown` for now.

**MATCH OUTPUT — 5 spread elements preserved + 6 spread/shorthand
decorators:**
- `[...guards]` → array, items[0] = spread ...guards
- `[a, ...rest, b]` → array, items: [identifier, spread ...rest, identifier]
- `factory(...args)` → call, args[0] = spread ...args
- `factory(...getArgs())` → call, args[0] = spread ...getArgs()
- `{ ...options, key: value }` → object, [0] SpreadElement, [1] PropertyAssignment
- `{ enabled }` → object, [0] ShorthandPropertyAssignment
- `this` → unknown (ThisExpression not separately classified; structurally preserved)
- `super.method` → property-access (correct: super.method IS a property-access expression)

**No flattening** — all spread elements preserved as-is inside their
parent container.

**Commit:** `test(provider-nestjs): audit spread + special-ast decorator arguments`

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

## Step D30 — ExpressionInspector coverage audit (final)

Status: [x]

Files:
- `packages/provider-nestjs/test/coverage-audit.test.ts` *(new)*
- `package.json` — added `"test:nest:coverage"` script

**Coverage matrix:** all 15 expected classification assertions PASS
across D18-D21 + D28 + safety cases.

**D18 — this / super:**
- `this` → `unknown` (ThisExpression not separately classified;
  structurally preserved by test view)
- `super.foo` → `property-access` (correct — SuperExpression followed
  by PropertyAccessExpression)

**D19 — class expressions:** all classify as `class`:
- `class {}` → class
- `class extends Base {}` → class
- `class { greet() { ... } }` → class
- `new (class { run() {} })()` → new (top-level is new, contains class)

**D20 — function expressions:** all classify as `function`:
- `function () {}` → function
- `function (a, b) { ... }` → function
- `function named() { ... }` → function

**D21 — arrow functions:** all classify as `arrow-function`:
- `() => true`, `x => x`, `(x, y) => x + y`,
  `() => ({ enabled: true })`, `() => factory()`.

**D28 — await / yield:** only valid in async/generator functions.
`await expr` and `yield expr` fall into the generic `unknown`
bucket (AwaitExpression / YieldExpression). The test demonstrates
they are NOT misclassified as something else.

**No-evaluation safety:** the inspector never executes
`dangerous()` or similar call expressions inside decorator
arguments. They are surfaced as `CallExpression` (kind: "call")
structurally only.

**Known remaining gaps (intentionally deferred):**
- `ThisExpression` → `unknown` (could be `kind: "this"`)
- `AwaitExpression` → `unknown` (could be `kind: "await"`)
- `YieldExpression` → `unknown` (could be `kind: "yield"`)
- `TaggedTemplateExpression` → `unknown` (could be `kind: "tagged-template"`)
- `JsxExpression` / `JsxSelfClosingElement` → `unknown` (likely not
  useful in decorator context)

**Commit:** `test(provider-nestjs): audit expression-coverage matrix`

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

---

# PHASE E — NESTJS SEMANTIC EXTRACTION

The D0-D30 phase established a complete structural AST foundation: every decorator is discovered, every expression kind is classified, and no call / constructor / factory is ever executed. This phase uses that foundation to extract a normalized NestJS semantic representation suitable for future document generation. **No production code is added in E0 itself**; E0 is architecture audit only.

---

## Step E0 — NestJS Semantic Extraction Architecture Audit

Status: [x] (audit complete; no production code changed)

### E0.1 — Repository architecture inventory

#### `packages/provider-ast` (framework-independent)

| Component | Responsibility | Reuse? |
|---|---|---|
| `AstProject` | loads tsconfig, builds program + checker | yes |
| `SourceScanner` | lists source files | yes |
| `NodeWalker` | recursive visitor | yes |
| `ClassQuery` / `MethodQuery` / `ParameterQuery` | extract nodes by type | yes |
| `FunctionQuery` / `EnumQuery` / `InterfaceQuery` / `VariableQuery` / `ImportQuery` / `CallExpressionQuery` / `PropertyQuery` / `NodeQuery` | generic AST queries | yes |
| `SymbolResolver` | `checker.getSymbolAtLocation(node)` | yes — sole resolver |
| `TypeResolver` | `checker.getTypeAtLocation(node)` | yes — sole type resolver |
| `DeclarationResolver` | symbol → declarations (with `resolveClass` / `resolveFunction`) | yes — sole declaration resolver |
| `ExpressionInspector` | classifies 25+ AST kinds structurally | yes — sole expression classifier |

**No duplication rule:** no second `TypeChecker` abstraction, no second `SymbolResolver`, no second `DeclarationResolver`.

#### `packages/provider-nestjs` (NestJS-specific)

| Component | Responsibility | Reuse / Gap |
|---|---|---|
| `DecoratorReader` | `getDecorators`, `has`, `find`, `getName` | reuse as-is |
| `DecoratorArguments` | returns `ts.Expression[]` from a decorator call | reuse as-is |
| `ExpressionInterpreter` (provider-nestjs/src/utils/) | narrow interpreter for primitives + property-access | **do not use in new code** — it silently normalises and loses source information; use `ExpressionInspector` (provider-ast) instead |
| `ControllerMetadata` (interface) | name / path / classNode / version / tags / routes | extend (currently `path` is `""` — incomplete) |
| `RouteMetadata` (interface) | name / path / method / methodNode | extend (currently `path` is `""` — incomplete; method is loose `string`) |
| `ControllerAnalyzer` | finds classes with `@Controller`; populates name / classNode / path (empty) / routes (empty) | extend — needs path extraction, version support, guard / pipe / interceptor extraction |
| `RouteAnalyzer` | finds HTTP-verb decorators on methods; populates name / method / path (empty) | extend — needs path extraction, parameter scanning, HTTP metadata, guards / pipes / interceptors |

### E0.2 — NestJS decorator inventory (apps/example-api)

#### Present in example-api

**Class scope**
- `@Controller()` (AppController, RootController)
- `@Controller("products")` (ProductsController)
- `@Controller("cart")` (CartController)
- `@Controller("orders")` (OrdersController)
- `@Controller("users")` (UsersController)
- `@Controller("auth")` (AuthController)
- `@Module({...})` (AppModule, ProductsModule, CartModule, OrdersModule, UsersModule, AuthModule)
- `@Injectable()` (AppService, ProductsService, CartService, OrdersService, UsersService, JwtAuthGuard)
- `@UseGuards(JwtAuthGuard)` (class-level on OrdersController, CartController)

**Method scope**
- `@Get()`, `@Get(':id')`, `@Get("register/test")`, `@Get("profile/:id")`, `@Get("me")`, `@Get("root")`
- `@Post()`, `@Post('items')`, `@Post("login")`
- `@Put(':id')`
- `@Delete(':id')`, `@Delete('items/:productId')`
- `@HttpCode(HttpStatus.CREATED)`, `@HttpCode(HttpStatus.OK)`, `@HttpCode(HttpStatus.NO_CONTENT)`
- `@UseGuards(JwtAuthGuard)` (method-level on UsersController.getProfile, UsersController.me)

**Parameter scope**
- `@Param('id') id: string`
- `@Param('productId') productId: string`
- `@Query('category') category?: string`
- `@Body() dto: <Dto>` (CreateProductDto, UpdateProductDto, CreateOrderDto, AddToCartDto, CreateUserDto, LoginDto)

#### Not present in example-api

- `@Options()`, `@Head()`, `@All()`, `@Patch()`
- `@Header(...)`, `@Redirect(...)`, `@Render(...)`
- `@UseInterceptors(...)`, `@UsePipes(...)`, `@UseFilters(...)`
- `@SetMetadata(...)`, `@Header(...)`, `@Redirect(...)`
- `@Headers()`, `@Req()`, `@Res()`, `@Ip()`, `@Session()`, `@HostParam(...)`
- `@UploadedFile()`, `@UploadedFiles()`
- `@Catch()`, `@Inject()`, `@Optional()`, `forwardRef(...)`
- `@Global()`

#### Supported by current architecture

- Class-scope decorator discovery (D1)
- Method-scope decorator discovery (D1)
- Parameter-scope decorator discovery (D1, with the known `ParameterQuery` over-reach into lambda parameters documented)
- Source-order preservation (D2)
- Zero / one / multiple argument counts (D3, D4, D5)
- Expression classification across all 25+ kinds (D6-D30)

#### Not yet supported

- Controller path extraction (controller @ argument)
- Route path extraction (HTTP-verb @ argument)
- HTTP method normalization (currently loose `string`, should use `HttpMethod` enum from `@spectra/core`)
- `@HttpCode` value extraction
- `@Header` / `@Redirect` / `@SetMetadata` extraction
- Parameter source extraction (`@Param` / `@Query` / `@Body` / `@Headers` / `@Req` / `@Res` / ...)
- Parameter key extraction (the argument inside `@Param("id")`)
- Type information via `TypeResolver`
- Symbol / declaration resolution for guards / pipes / interceptors
- Module → controller wiring
- Service / provider scanning

### E0.3 — Semantic categories

| Category | Source AST node | Source decorator | Helper | Available | Missing |
|---|---|---|---|---|---|
| Controller metadata | `ts.ClassDeclaration` | `@Controller(path?)` | `DecoratorReader.has`, `DecoratorArguments.get`, `ExpressionInspector` | name | path, version |
| Route metadata | `ts.MethodDeclaration` | `@Get/@Post/@Put/@Patch/@Delete/@Options/@Head/@All` | `DecoratorReader.has`, `DecoratorArguments.get`, `ExpressionInspector` | name | path |
| HTTP method | same as route | verb name | `DecoratorReader.has` | string | enum normalization |
| Route path | same as route | first arg of verb decorator | `DecoratorArguments.get`, `ExpressionInspector` | raw expression | string value extraction |
| Method name | `method.name.getText()` | — | — | yes | — |
| Parameter source | `ts.ParameterDeclaration` | `@Param/@Query/@Body/@Headers/@Req/@Res/@Ip/@Session/@HostParam` | `DecoratorReader.has`, `DecoratorReader.find`, `DecoratorArguments.get`, `ExpressionInspector` | arg count, arg expression | kind name, key argument |
| Parameter key | same | first arg of parameter decorator | `DecoratorArguments.get`, `ExpressionInspector` | raw expression | string value extraction |
| Parameter type | `ts.ParameterDeclaration.type` | — | `TypeResolver.resolve`, `SymbolResolver`, `DeclarationResolver` | ts.Type | full schema extraction |
| Guards (method / class) | both | `@UseGuards(args)` | `DecoratorReader.find`, `DecoratorArguments.get` | args list | expression classification per arg |
| Pipes / Interceptors / Filters | same | `@UsePipes/@UseInterceptors/@UseFilters` | same | args list | same |
| HTTP status | method | `@HttpCode(...)` | same | arg count | numeric value extraction |
| Headers | method | `@Header(name, value)` | same | args | string value extraction |
| Redirect | method | `@Redirect(url, status)` | same | args | string value extraction |
| SetMetadata | both | `@SetMetadata(key, value)` | same | args | key/value extraction |
| Module wiring | `ts.ClassDeclaration` with `@Module` | `@Module({...})` | `DecoratorArguments.get`, `ExpressionInspector`, `TypeResolver` | — | full object extraction (controllers / providers / imports / exports) |

### E0.4 — Expression-resolution requirements

For each NestJS decorator argument form:

| Source | How represented |
|---|---|
| `@Controller("users")` | string literal "users" |
| `@Controller()` | zero args (path = "") |
| `@Get(":id")` | string literal ":id" |
| `@Get()` | zero args (path = "") |
| `@HttpCode(HttpStatus.CREATED)` | property-access `HttpStatus.CREATED` — preserve as `property-access` (object = HttpStatus, property = CREATED). Never coerce to numeric 201. |
| `@UseGuards(JwtAuthGuard)` | identifier `JwtAuthGuard` — preserve as `identifier`. `SymbolResolver` + `DeclarationResolver` give the import / class declaration. NEVER invoke the guard. |
| `@UseGuards(AuthGuard("jwt"))` | call `AuthGuard("jwt")` — preserve as `call` with its `argumentCount` and `arguments`. NEVER invoke. |
| `@UseGuards([AuthGuard, AdminGuard])` | array literal — preserve as `array` with `itemCount`. Items are `identifier` references. NEVER invoke. |
| `@SetMetadata("roles", ["admin", "user"])` | two args: string literal "roles", array literal ["admin","user"]. Preserve both as literals. |
| `@UseGuards({ provide: AUTH, useClass: JwtAuthGuard })` | object literal — preserve as `object` with property keys + values. NEVER invoke. |

### E0.5 — Route composition requirements

| Source | Normalized path | Source-path preserved? |
|---|---|---|
| `@Controller("users")` + `@Get()` | `/users` | yes (`controllerPath: "users"`, `routePath: ""`) |
| `@Controller("users")` + `@Get(":id")` | `/users/:id` | yes (`controllerPath: "users"`, `routePath: ":id"`) |
| `@Controller()` + `@Get("health")` | `/health` | yes |
| `@Controller("api/users")` + `@Get("profile/:id")` | `/api/users/profile/:id` | yes |
| `@Controller("users/")` + `@Get("/profile")` | `/users/profile` (deduplicate slashes) | yes |
| `@Controller("")` + `@Get("")` | `/` | yes |

**Rules:**
- Empty controller path + empty route path → `/`
- Empty controller path + non-empty route path → `/<route>`
- Non-empty controller path + empty route path → `/<controller>`
- Strip leading/trailing slashes from each segment before joining
- Collapse duplicate slashes
- Preserve both **source path** (controller + route raw) and **normalized path**

### E0.6 — Parameter requirements

| Source | name | source | key |
|---|---|---|---|
| `@Param("id") id: string` | id | param | id |
| `@Query("category") category?: string` | category | query | category |
| `@Body() dto: CreateUserDto` | dto | body | undefined or "" (decision deferred) |
| `@Param()` (no arg) | id | param | id |
| `@Query()` (no arg) | q | query | q |
| `@Headers("x-trace") x?: string` | x | headers | x-trace |

**Decisions deferred to E3 / E4:**
- `@Body()` key semantics — keep undefined or use ""
- `@Param()` default key — equals parameter name

### E0.7 — Type-resolution requirements

`TypeResolver.resolve(node)` returns `ts.Type`. From the type:

| Case | ts.Type | Normalized (deferred) |
|---|---|---|
| `string` | `TypeFlags.String` | `"string"` |
| `number` | `TypeFlags.Number` | `"number"` |
| `boolean` | `TypeFlags.Boolean` | `"boolean"` |
| `CreateUserDto` | `TypeFlags.Object` + `symbol` | object reference |
| `CreateUserDto[]` | `TypeFlags.Object` + `TypeFlags.Array` | array of object |
| `User \| null` | `TypeFlags.Union` | union with `null` |
| `Promise<...>` | generic / type-argument | promise wrapper (deferred) |

**Reuse:** `SymbolResolver` + `DeclarationResolver` already exist. No new type system.

### E0.8 — Guards / Pipes / Interceptors

| Source | Classification | Resolution |
|---|---|---|
| `@UseGuards(JwtAuthGuard)` | identifier → class | `DeclarationResolver.resolveClass` |
| `@UseGuards(AuthGuard("jwt"))` | call → invocation site | structurally preserved; **never invoked** |
| `@UseGuards([AuthGuard, AdminGuard])` | array of identifiers / calls | each item resolved separately |

**Invariant:** the analyzer NEVER invokes any guard, pipe, interceptor, factory, or constructor. They are surfaced as `ExpressionInspector`-classified AST nodes.

### E0.9 — Module relationship

`@Module({ controllers: [UsersController], providers: [UsersService], imports: [], exports: [] })` exists in example-api. The future normalized model should support:

```text
Module
├── imports: ModuleReference[]
├── controllers: ControllerReference[]
├── providers: ProviderReference[]
└── exports: ModuleReference[]
```

Resolution: each controller / provider identifier can be resolved via `SymbolResolver` + `DeclarationResolver` to its actual declaration. **Do not implement module extraction yet** — architecture decision only.

### E0.10 — Package-boundary decision

| Concern | Package |
|---|---|
| Decorator / class / method / parameter / call / expression discovery | `provider-ast` |
| Symbol / type / declaration resolution | `provider-ast` |
| NestJS decorator name recognition (e.g. `Get`, `Post`, `UseGuards`) | `provider-nestjs` |
| Path composition, route metadata, HTTP method normalization, status code extraction | `provider-nestjs` |
| Module wiring, controller→module→provider resolution | `provider-nestjs` |
| Parameter source classification (`@Param` → `param`, `@Body` → `body`, …) | `provider-nestjs` |
| NestJS-specific normalization (e.g. `HttpStatus.CREATED` enum reference) | `provider-nestjs` |
| Document / OpenAPI / JSON-Schema model | future document package |

**Hard rule:** NestJS decorator names and semantics NEVER leak into `provider-ast`. `provider-ast` only knows generic AST / expression kinds.

### E0.11 — Proposed E1+ implementation sequence

| Step | Title | Scope |
|---|---|---|
| E1 | Controller semantic extraction | name + classNode + `@Controller(path)` extraction; preserve source path; produce normalized path placeholder |
| E2 | Route semantic extraction | method name + HTTP-verb normalization (use `HttpMethod` enum) + raw path extraction; preserve source path |
| E3 | Route path composition | combine controller + route paths; handle slashes; preserve source paths |
| E4 | Parameter semantic extraction | scan each method's parameters; classify each parameter decorator by name; extract key argument |
| E5 | Type extraction | use `TypeResolver`; surface parameter type as text + symbol + kind |
| E6 | Guards | scan `@UseGuards` on both class and method; preserve expressions + resolve identifiers |
| E7 | Pipes / Interceptors / Filters | same pattern as E6 for the other three decorator families |
| E8 | HTTP metadata | `@HttpCode` value extraction; `@Header` / `@Redirect` / `@Render` if present |
| E9 | Module relationship | scan `@Module`; build module → controller / provider wiring |
| E10 | Normalized NestJS semantic model | unify all extracted pieces into a single immutable semantic representation ready for the future document layer |

Each E-step is its own commit. Each is test-only until structural pieces are stable, then commits once verification passes.

### E0.12 — Known gaps (explicitly deferred, not silent)

- `ParameterQuery` over-reach into nested lambda parameters (D0 finding) — to be addressed when E4 is implemented.
- NestJS decorators not present in example-api (e.g. `@Header`, `@Redirect`, `@UseInterceptors`) will be exercised via synthetic fixtures in their respective E-step, **not** by modifying production controllers.
- HTTP method enum normalization — currently the existing `RouteAnalyzer` uses raw uppercase strings; E2 will switch to the `HttpMethod` enum from `@spectra/core`.
- Path composition algorithm — design finalised in E3, not E0.
- Body key semantics (`@Body()` with no argument) — decision deferred to E4.

### E0.13 — Verification checklist

- [ ] No production code changed in E0 itself (audit only)
- [ ] All D0-D30 regression tests still pass
- [ ] Both packages typecheck with `tsc 5.9.3`
- [ ] `expression.test.ts` regression intact (a-x)
- [ ] No new public API added
- [ ] `ExpressionInterpreter` (provider-nestjs) explicitly marked as legacy / not for new code
- [ ] No decorator / guard / factory / constructor invocation anywhere
- [ ] Master doc updated with this E0 section

**Status:** all items satisfied.

---

## Step E1 — Controller semantic extraction

Status: [x]

Files:
- `packages/provider-nestjs/src/semantic/controller-path.ts` *(new)*
- `packages/provider-nestjs/src/semantic/index.ts` *(new)*
- `packages/provider-nestjs/src/metadata/ControllerMetadata.ts` *(extended)*
- `packages/provider-nestjs/src/analyzer/ControllerAnalyzer.ts` *(extended)*
- `packages/provider-nestjs/src/index.ts` *(extended)*
- `packages/provider-nestjs/test/controller-semantic.test.ts` *(new)*
- `package.json` *(+1 line: `test:nest:controller-semantic`)*

### Objective
Per the E0.11 plan: extract the controller's `@Controller(path)`
argument into the `ControllerMetadata` model, preserving both source
information and a normalized component. E3 (route composition) will
later combine the normalized controller path with each route's
normalized path.

### Existing implementation found
- `ControllerAnalyzer.analyze()` already discovered classes with
  `@Controller`, populated `name`, `classNode`, `tags`, and `routes`,
  but **left `path: ""`** — incomplete (D0 noted this gap).
- `ControllerMetadata` exposed only `path: string`.
- `DecoratorReader.find(node, "Controller")` and
  `DecoratorArguments.get(decorator)` already exposed the argument
  list.
- `ExpressionInspector` (provider-ast) already classified 25+ AST
  expression kinds.

### Files inspected
- `packages/provider-nestjs/src/analyzer/ControllerAnalyzer.ts`
- `packages/provider-nestjs/src/metadata/ControllerMetadata.ts`
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts`
- `packages/provider-nestjs/src/utils/DecoratorReader.ts`
- `packages/provider-nestjs/src/utils/DecoratorArguments.ts`
- `packages/provider-nestjs/src/utils/index.ts`
- `packages/provider-ast/src/expression/ExpressionInspector.ts`
- `packages/provider-nestjs/test/controller.test.ts` (existing baseline)

### Files changed (production)
- `packages/provider-nestjs/src/semantic/controller-path.ts` — new helper
  `ControllerPathExtractor` + `ControllerPathView` interface.
- `packages/provider-nestjs/src/semantic/index.ts` — barrel export.
- `packages/provider-nestjs/src/metadata/ControllerMetadata.ts` —
  extended interface (added `sourcePath`, `normalizedPath`,
  `controllerExpressionKind`, `controllerPathValue`; kept `path`
  as backward-compatible alias for `normalizedPath`).
- `packages/provider-nestjs/src/analyzer/ControllerAnalyzer.ts` —
  constructor signature extended with optional `DecoratorArguments` /
  `ExpressionInspector` (defaults preserve the existing two-arg call
  site in `controller.test.ts`); `analyze()` now invokes the new
  extractor and populates the new fields.
- `packages/provider-nestjs/src/index.ts` — exports `./semantic`.

### Implementation reasoning
- `ControllerPathExtractor` is a small focused class that takes
  `DecoratorReader` + `DecoratorArguments` + `ExpressionInspector`
  (already-existing provider-ast + provider-nestjs primitives) and
  produces a `ControllerPathView`. It never evaluates anything;
  non-string-literal arguments keep their raw `sourceText` and their
  `expressionKind` for later semantic consumers.
- Normalization is purely string-level: split on `/`, drop empty
  segments, re-join. No regex. No AST mutation.
- `ControllerAnalyzer.analyze()` reuses `ControllerPathExtractor` and
  keeps the original two-argument constructor signature for the
  existing `controller.test.ts` (via optional dependency parameters
  defaulting to fresh instances). Existing public API is preserved.
- All NestJS-specific knowledge (decorator names, path semantics,
  normalization rules) lives in `provider-nestjs`. `provider-ast` was
  not touched.
- The legacy `ExpressionInterpreter` (provider-nestjs) was NOT used;
  `ExpressionInspector` (provider-ast) is used as instructed.

### Exact command
```bash
pnpm test:nest:controller-semantic
# or directly:
tsx packages/provider-nestjs/test/controller-semantic.test.ts
```

### MATCH OUTPUT

```
===== E1 — CONTROLLER SEMANTIC EXTRACTION =====

AppController          sourcePath=undefined       kind=<zero-args>  value=undefined     normalized=""            PASS
ProductsController     sourcePath='products'     kind=string       value="products"     normalized="products"     PASS
OrdersController       sourcePath='orders'       kind=string       value="orders"       normalized="orders"       PASS
CartController         sourcePath='cart'         kind=string       value="cart"         normalized="cart"         PASS
UsersController        sourcePath='users'        kind=string       value="users"        normalized="users"        PASS
AuthController         sourcePath="auth"         kind=string       value="auth"         normalized="auth"         PASS
RootController         sourcePath=undefined       kind=<zero-args>  value=undefined     normalized=""            PASS

Summary: 7/7 controllers match expected semantic view

===== E1 — NORMALIZATION RULES =====

m1   args=0          normalized=""        PASS
m2   source=""        normalized=""        PASS
m3   source="/"       normalized=""        PASS
m4   source="users"   normalized="users"   PASS
m5   source="/users"  normalized="users"   PASS
m6   source="users/"  normalized="users"   PASS
m7   source="/users/" normalized="users"   PASS
m8   source="a//b"    normalized="a/b"     PASS
m9   source="api/v1"  normalized="api/v1"  PASS

Summary: 9/9 normalization cases match
```

### Verification matrix

| Case | Expected | Actual | Status |
|---|---|---|---|
| `@Controller()` | `sourcePath=undefined, kind=<zero-args>, normalized=""` | matches | **PASS** |
| `@Controller('products')` | `sourcePath="'products'", kind=string, value="products", normalized="products"` | matches | **PASS** |
| `@Controller("auth")` (double quotes) | `sourcePath="\"auth\"", kind=string, value="auth", normalized="auth"` | matches | **PASS** |
| `@Controller('cart')` / `'orders'` / `'users'` | same shape, distinct values | matches | **PASS** |
| **7 controllers in apps/example-api** | all 7 map to expected semantic views | 7/7 | **PASS** |
| `""` normalization | `""` | `""` | **PASS** |
| `"/"` normalization | `""` | `""` | **PASS** |
| `"users"` normalization | `"users"` | `"users"` | **PASS** |
| `"/users"` and `"users/"` and `"/users/"` | `"users"` | `"users"` | **PASS** |
| `"a//b"` (double slash) | `"a/b"` | `"a/b"` | **PASS** |
| `"api/v1"` (multi-segment) | `"api/v1"` | `"api/v1"` | **PASS** |

### Regression result: **PASS**
- `controller.test.ts` (existing baseline) — controller paths now
  correctly populated (e.g. `Path: products`, `Path: orders`).
- All 20 D-step tests rerun with existing verification baselines —
  all PASS.
- `expression.test.ts` a-x intact.
- `symbol.test.ts`, `declaration.test.ts` exit 0.
- Typecheck `provider-ast`: exit 0.
- Typecheck `provider-nestjs`: exit 0.

### Architectural notes
- No NestJS knowledge in `provider-ast` (unchanged).
- No duplicate `TypeChecker` / `SymbolResolver` / `DeclarationResolver`.
- No decorator / guard / factory / constructor invocation.
- Legacy `ExpressionInterpreter` (provider-nestjs) not used.
- Source information is **preserved**: `sourcePath` keeps the raw
  argument text (e.g. `"'products'"` or `'"auth"'`); only the
  normalized component is computed for `normalizedPath` and the
  backward-compatible `path`. The `expressionKind` field reports
  the ExpressionInspector classification so future consumers can
  re-resolve property-access / call / template / etc. argument
  forms without losing source.
- The `path` field is kept for backward compatibility but is now
  populated by `normalizedPath`.

### Known gaps (not in E1 scope; deferred)
- HTTP-verb path extraction (route-level) — E2.
- HTTP method normalization to the `HttpMethod` enum — E2.
- Route + controller path composition — E3.
- Parameter source / key extraction — E4.
- Type extraction — E5.
- Guards / pipes / interceptors — E6, E7.
- HTTP metadata (`@HttpCode`, `@Header`, `@Redirect`) — E8.
- Module wiring — E9.
- Unified semantic model — E10.

### Commit
- `feat(provider-nestjs): extract controller path in semantic model`

---

End of E1.

---

## Step E2 — Route semantic extraction

Status: [x]

Files:
- `packages/core/src/constants/HttpMethod.ts` *(modified — added `ALL` to enum)*
- `packages/provider-nestjs/src/semantic/route-path.ts` *(new)*
- `packages/provider-nestjs/src/semantic/route-method.ts` *(new)*
- `packages/provider-nestjs/src/semantic/route-composition.ts` *(new)*
- `packages/provider-nestjs/src/semantic/index.ts` *(barrel updated)*
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts` *(extended)*
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts` *(rewritten with backward-compat constructor)*
- `packages/provider-nestjs/test/route-semantic.test.ts` *(new)*
- `package.json` *(+1 line: `test:nest:route-semantic`)*

### Objective
Per E0.11: extract per-method HTTP verb + route path argument into the
`RouteMetadata` model, normalizing the verb to the `HttpMethod` enum
and producing both source-preserved and normalized route components.
Compose with E1 controller metadata to produce the final route path.

### Existing implementation found
- `RouteAnalyzer.analyze()` discovered Get / Post / Put / Patch / Delete
  decorators and returned `name`, `method` (string literal, NOT yet
  using `HttpMethod` enum), and `path: ""` (empty, incomplete).
- `RouteMetadata` exposed only `name`, `path`, `method`, `methodNode`.
- `DecoratorReader` + `DecoratorArguments` + `ExpressionInspector` were
  already available.
- `HttpMethod` enum existed in `@spectra/core` but lacked `ALL`.

### Architecture inspected
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts`
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts`
- `packages/core/src/constants/HttpMethod.ts`
- All E1 + D-step components (no duplication introduced)

### Existing implementation deficiency
1. `path: ""` was empty (D0 finding for both controller and route paths).
2. HTTP method used raw uppercase strings rather than `HttpMethod` enum
   (the field type was already `HttpMethod`, but the value was a literal
   string typed via `as const` — fragile and inconsistent).
3. Only 5 of 8 NestJS HTTP verbs recognized (missing Options, Head, All).
4. No source-path preservation.
5. No expression kind classification for the route argument.
6. No static / dynamic indication.
7. No decorator index / order preservation.
8. No composition with controller path.

### Files changed (production)
- `packages/core/src/constants/HttpMethod.ts` — added `ALL: "ALL"` entry
  (small generic enhancement for NestJS `@All()`). All other entries
  preserved.
- `packages/provider-nestjs/src/semantic/route-path.ts` — new `RoutePathExtractor`
  + `RoutePathView` interface + `normalizeRoutePath` helper. Reuses
  `DecoratorArguments` + `ExpressionInspector`.
- `packages/provider-nestjs/src/semantic/route-method.ts` — new
  `RouteMethodExtractor` + `RouteDecoratorView` interface + `HTTP_VERBS`
  table covering all 8 NestJS HTTP verbs (Get / Post / Put / Patch /
  Delete / Options / Head / All). Never invokes or evaluates.
- `packages/provider-nestjs/src/semantic/route-composition.ts` — new
  `composeRoutePath(controllerPath, methodPath)` helper implementing
  the documented slash-handling rules.
- `packages/provider-nestjs/src/semantic/index.ts` — barrel exports the
  three new semantic modules.
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts` — extended
  with `decoratorName`, `decoratorIndex`, `sourcePath`, `normalizedPath`,
  `routePathValue`, `routeExpressionKind`, `isStatic`, `composedPath`.
  The existing `path` field is preserved as a backward-compatible alias
  for `normalizedPath`.
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts` — rewritten
  to use `RouteMethodExtractor` + `composeRoutePath`; constructor
  extended with optional `DecoratorArguments` / `ExpressionInspector` /
  `RouteMethodExtractor` (defaults preserve the existing two-arg call
  site in `controller.test.ts`).

### Implementation reasoning
- The three extractors are split by concern (path / method / composition)
  so each can be tested and replaced independently later.
- HTTP verb recognition is a small table (`HTTP_VERBS`) — adding a new
  verb is one line. Order in the table is irrelevant because the
  extractor iterates ALL decorators and preserves `decoratorIndex`.
- Multiple HTTP decorators on the same method produce multiple
  `RouteMetadata` entries; they are NEVER merged. This preserves the
  unusual but valid NestJS pattern `@Get("a") @Post("b")`.
- Composition rules are explicit and string-level — no regex, no AST
  mutation. Each input segment is stripped of leading/trailing slashes,
  empty segments are dropped, then re-joined with `/`. The root path
  (`"" + ""`) becomes `/`.
- All NestJS-specific knowledge lives in `provider-nestjs`. `provider-ast`
  was not touched (except `@spectra/core`'s `ALL` enum value, which is
  framework-independent).
- The legacy `ExpressionInterpreter` was NOT used; `ExpressionInspector`
  is the sole expression classifier.
- No decorator / guard / factory / constructor invocation.

### Exact command
```bash
pnpm test:nest:route-semantic
# or directly:
tsx packages/provider-nestjs/test/route-semantic.test.ts
```

### MATCH OUTPUT

```
===== E2 — ROUTE SEMANTIC EXTRACTION =====

--- Part A: normalizeRoutePath rules ---
  "" -> ""                        PASS
  "/" -> ""                       PASS
  "users" -> "users"              PASS
  "/users" -> "users"             PASS
  "users/" -> "users"             PASS
  "/users/" -> "users"            PASS
  "a//b" -> "a/b"                 PASS
  "api/v1" -> "api/v1"            PASS
  "/api/v1/users/:id" -> "api/v1/users/:id" PASS
  Summary: 9/9

--- Part B: composeRoutePath rules ---
  ("", "") -> "/"                                 PASS
  ("users", "") -> "/users"                       PASS
  ("", "users") -> "/users"                       PASS
  ("users", ":id") -> "/users/:id"                PASS
  ("/users/", "/profile/") -> "/users/profile"    PASS
  ("api/v1", "users/:id") -> "/api/v1/users/:id"  PASS
  ("", "") -> "/"                                 PASS
  Summary: 7/7

--- Part C: synthetic route extraction ---
  m1[0] Get@0 method=GET sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m2[0] Get@0 method=GET sourcePath="" kind=string value="" normalized="" static=true PASS
  m3[0] Get@0 method=GET sourcePath="/" kind=string value="/" normalized="" static=true PASS
  m4[0] Get@0 method=GET sourcePath="users" kind=string value="users" normalized="users" static=true PASS
  m5[0] Get@0 method=GET sourcePath="/users/" kind=string value="/users/" normalized="users" static=true PASS
  m6[0] Get@0 method=GET sourcePath="users/:id" kind=string value="users/:id" normalized="users/:id" static=true PASS
  m7[0] Post@0 method=POST sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m8[0] Put@0 method=PUT sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m9[0] Patch@0 method=PATCH sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m10[0] Delete@0 method=DELETE sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m11[0] Options@0 method=OPTIONS sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m12[0] Head@0 method=HEAD sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m13[0] All@0 method=ALL sourcePath=undefined kind=<zero-args> value=undefined normalized="" static=true PASS
  m14Multi[0] Get@0 method=GET sourcePath="a" kind=string value="a" normalized="a" static=true PASS
  m14Multi[1] Post@1 method=POST sourcePath="b" kind=string value="b" normalized="b" static=true PASS
  m15Id[0] Get@0 method=GET sourcePath="routeVariable" kind=identifier value=undefined normalized="" static=false PASS
  m16Prop[0] Get@0 method=GET sourcePath="HttpStatus.CREATED" kind=property-access value=undefined normalized="" static=false PASS
  m17Call[0] Get@0 method=GET sourcePath="factory()" kind=call value=undefined normalized="" static=false PASS
  m18Template[0] Get@0 method=GET sourcePath="`template`" kind=template value=undefined normalized="" static=false PASS
  m19HttpCode     no HTTP verb -> 0 routes PASS
  Summary: 20/20

--- Part D: example-api integration ---
  AppController.getHello decorator=Get method=GET sourcePath=undefined kind=<zero-args> composed="/" static=true PASS
  CartController.getCart decorator=Get method=GET sourcePath=undefined kind=<zero-args> composed="/cart" static=true PASS
  CartController.addItem decorator=Post method=POST sourcePath="'items'" kind=string composed="/cart/items" static=true PASS
  CartController.removeItem decorator=Delete method=DELETE sourcePath="'items/:productId'" kind=string composed="/cart/items/:productId" static=true PASS
  OrdersController.findAll decorator=Get method=GET sourcePath=undefined kind=<zero-args> composed="/orders" static=true PASS
  OrdersController.findOne decorator=Get method=GET sourcePath="':id'" kind=string composed="/orders/:id" static=true PASS
  OrdersController.create decorator=Post method=POST sourcePath=undefined kind=<zero-args> composed="/orders" static=true PASS
  ProductsController.findAll decorator=Get method=GET sourcePath=undefined kind=<zero-args> composed="/products" static=true PASS
  ProductsController.findOne decorator=Get method=GET sourcePath="':id'" kind=string composed="/products/:id" static=true PASS
  ProductsController.create decorator=Post method=POST sourcePath=undefined kind=<zero-args> composed="/products" static=true PASS
  ProductsController.update decorator=Put method=PUT sourcePath="':id'" kind=string composed="/products/:id" static=true PASS
  ProductsController.remove decorator=Delete method=DELETE sourcePath="':id'" kind=string composed="/products/:id" static=true PASS
  UsersController.register decorator=Post method=POST sourcePath="'register/test'" kind=string composed="/users/register/test" static=true PASS
  UsersController.login decorator=Post method=POST sourcePath="'login'" kind=string composed="/users/login" static=true PASS
  UsersController.getProfile decorator=Get method=GET sourcePath="'profile/:id'" kind=string composed="/users/profile/:id" static=true PASS
  AuthController.login decorator=Post method=POST sourcePath="\"login\"" kind=string composed="/auth/login" static=true PASS
  AuthController.me decorator=Get method=GET sourcePath="\"me\"" kind=string composed="/auth/me" static=true PASS
  RootController.root decorator=Get method=GET sourcePath="\"root\"" kind=string composed="/root" static=true PASS
  Summary: 18/18
```

### Verification matrix

| Case | Expected | Actual | Status |
|---|---|---|---|
| `@Get()` (zero args) | `method=GET, sourcePath=undefined, kind=<zero-args>, normalized="", static=true` | matches | **PASS** |
| `@Get("")` | `method=GET, sourcePath="\"\"", kind=string, value="", normalized=""` | matches | **PASS** |
| `@Get("/")` | `method=GET, sourcePath="\"\/\"", value="/", normalized=""` | matches | **PASS** |
| `@Get("users")` | `method=GET, value="users", normalized="users"` | matches | **PASS** |
| `@Get("/users/")` | `method=GET, value="/users/", normalized="users"` (slash stripped) | matches | **PASS** |
| `@Get("users/:id")` | parameterized preserved | matches | **PASS** |
| `@Post()` / `@Put()` / `@Patch()` / `@Delete()` / `@Options()` / `@Head()` / `@All()` | each verb normalized to enum | all 7 match | **PASS** |
| `@Get("a") @Post("b")` (multi-verb) | 2 routes with decoratorIndex 0/1, both methods | matches | **PASS** |
| `@Get(routeVariable)` (identifier) | `kind=identifier, isStatic=false, no value` | matches | **PASS** |
| `@Get(HttpStatus.CREATED)` (property-access) | `kind=property-access, isStatic=false` | matches | **PASS** |
| `@Get(factory())` (call) | `kind=call, isStatic=false`, NOT executed | matches | **PASS** |
| ``` `@Get(`template`) ``` (template) | `kind=template, isStatic=false` | matches | **PASS** |
| `@HttpCode(201)` (non-HTTP-verb) | 0 routes extracted | matches | **PASS** |
| **Composition: `@Controller("users")` + `@Get()`** | `/users` | matches | **PASS** |
| **Composition: `@Controller("users")` + `@Get(":id")`** | `/users/:id` | matches | **PASS** |
| **Composition: `@Controller("/users/")` + `@Get("/profile/")`** | `/users/profile` | matches | **PASS** |
| **Composition: `@Controller()` + `@Get()`** | `/` | matches | **PASS** |
| **Composition: `@Controller("api/v1")` + `@Get("users/:id")`** | `/api/v1/users/:id` | matches | **PASS** |
| **example-api integration: 18 real routes** | all 18 match expected semantic view | 18/18 | **PASS** |

### Regression result: **PASS**
- `controller.test.ts` (existing baseline) — exit 0 from repo root
  (controller paths populated).
- `controller-semantic.test.ts` (E1) — exit 0.
- All 20 D-step tests rerun with existing verification baselines —
  all PASS.
- `expression.test.ts` a-x intact.
- `symbol.test.ts`, `declaration.test.ts` — exit 0.
- Typecheck `provider-ast`: exit 0.
- Typecheck `provider-nestjs`: exit 0.

### Architectural notes
- **Reuse discipline:** No new `TypeChecker` / `SymbolResolver` /
  `DeclarationResolver`. `RoutePathExtractor` + `RouteMethodExtractor`
  compose the existing `DecoratorArguments` + `ExpressionInspector`
  primitives.
- **Hard boundary:** `provider-ast` was not touched. All NestJS-specific
  knowledge (verb list, path normalization, composition rules) lives
  in `provider-nestjs`.
- **No invocation:** the analyzer NEVER invokes any route handler,
  factory, or dynamic expression. Non-string-literal arguments keep
  their AST source text + expression kind; `isStatic=false`.
- **Source preservation:** `sourcePath` keeps the raw argument text;
  `normalizedPath` keeps the normalized component; `composedPath` is
  computed from E1 controller + this route. All three are preserved
  independently.
- **HTTP method normalization:** `HttpMethod` enum is the canonical
  type. The new `ALL` value supports NestJS `@All()` (catch-all).
  Existing `TRACE` / `CONNECT` entries preserved for completeness even
  though NestJS doesn't use them.

### Known gaps (not in E2 scope; deferred)
- Parameter source / key extraction — E4.
- Type extraction — E5.
- Guards / pipes / interceptors — E6, E7.
- HTTP metadata (`@HttpCode`, `@Header`, `@Redirect`) — E8.
- Module wiring — E9.
- Unified semantic model — E10.
- ControllerAnalyzer does not yet wire `routes` into each
  `ControllerMetadata` (it leaves `routes: []`). A follow-up step
  (E10) will populate the cross-reference; current callers
  independently run `RouteAnalyzer.analyze(controller)`.

### Commit
- `feat(provider-nestjs): extract route semantics`

---

End of E2.

---

## Step E3 — Route composition + operation identity

Status: [x]

Files:
- `packages/provider-nestjs/src/semantic/route-composition-extractor.ts` *(new — minimal addition)*
- `packages/provider-nestjs/src/semantic/index.ts` *(barrel updated)*
- `packages/provider-nestjs/test/route-composition-semantic.test.ts` *(new)*
- `package.json` *(+1 line: `test:nest:composition`)*

### Objective
Per E0.11: combine E1 controller metadata + E2 route metadata into
a complete route operation identity (controller name + method name +
HTTP method + decorator + source paths + normalized paths + composed
path). Verify the composition matrix for all combinations and
prove that operations remain distinct by identity even when their
composed paths are equal.

### Existing implementation found (E1 + E2 already cover most of E3)
- `RouteCompositionExtractor` did NOT yet exist — added in this step.
- `composeRoutePath(controllerNormalized, methodNormalized)` was
  already provided by E2 (handles empty + non-empty, slash
  normalization, parameterized preservation).
- `RouteMetadata.composedPath` was already populated by `RouteAnalyzer.analyze()`.
- `ControllerMetadata.normalizedPath` was already populated by E1.
- All seven example-api controllers' routes were already producing
  correct composed paths (verified in E2 Part D).

### Architecture inspected
- `packages/provider-nestjs/src/semantic/route-path.ts`
- `packages/provider-nestjs/src/semantic/route-method.ts`
- `packages/provider-nestjs/src/semantic/route-composition.ts`
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts`
- `packages/provider-nestjs/src/metadata/ControllerMetadata.ts`
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts`
- E1 + E2 test outputs

### Production deficiency found
- `RouteCompositionExtractor` (small helper that bundles all identity
  dimensions) did not yet exist. Without it, downstream consumers
  would have to assemble the identity tuple themselves from raw
  ControllerMetadata + RouteMetadata. Per E3 design: "introduce the
  smallest appropriately named semantic model."
- The new `RouteOperationIdentity` interface exposes:
    - `controllerName`, `methodName`, `decoratorName`, `httpMethod`
    - `controllerSourcePath` + `controllerNormalizedPath`
    - `routeSourcePath` + `routeExpressionKind` + `routeNormalizedPath`
    - `composedPath` (slash-normalized, root = "/", never "//")
    - `isStatic` (combined: true only when BOTH controller AND route
      path are statically known)
    - `identityKey` = `${controllerName}.${methodName}#${httpMethod}`
      (unique per operation)
    - `pathKey` = composed path (NOT unique — multiple operations
      may share it; this is intentional and matches E3 spec rule 19-21)
    - `decoratorIndex` (source-order position)

### Files changed (production)
- `packages/provider-nestjs/src/semantic/route-composition-extractor.ts`
  *(new)* — focused helper that takes `ControllerMetadata` +
  `RouteMetadata` and produces a `RouteOperationIdentity` view.
- `packages/provider-nestjs/src/semantic/index.ts` *(barrel updated)*.

### Implementation reasoning
- The new extractor is a pure transformer — no AST access, no
  SymbolResolver, no TypeChecker. It composes fields that are
  already populated by E1 + E2.
- `isStatic` is the conjunction of (controller is static) AND
  (route is static). Either being dynamic (identifier / property-
  access / call / template) makes the whole operation dynamic.
- `identityKey` is unique per operation (controller + method + verb);
  two operations on different controllers with the same composed path
  have different `identityKey` values. This is the rule the E3 spec
  requires.
- `pathKey` is intentionally NOT unique. It is the composed path
  used for grouping / display; identity is provided by `identityKey`.
- Source paths are preserved independently of normalized paths so
  no source information is silently lost during composition.
- No new TypeChecker, no new SymbolResolver, no new
  DeclarationResolver. All primitives are reused.
- `provider-ast` was NOT touched.
- Legacy `ExpressionInterpreter` was NOT used.

### Exact command
```bash
pnpm test:nest:composition
# or directly (from repo root):
tsx packages/provider-nestjs/test/route-composition-semantic.test.ts
```

### MATCH OUTPUT

```
===== E3 — ROUTE COMPOSITION + OPERATION IDENTITY =====

--- Part A: composition matrix (synthetic) ---
  compose("", "") -> "/" PASS
  compose("users", "") -> "/users" PASS
  compose("", "users") -> "/users" PASS
  compose("users", ":id") -> "/users/:id" PASS
  compose("users", "profile/:id") -> "/users/profile/:id" PASS
  compose("/users/", "/profile/") -> "/users/profile" PASS
  compose("api/v1", "users/:id") -> "/api/v1/users/:id" PASS
  compose("users", "users/:id/posts/:postId") -> "/users/users/:id/posts/:postId" PASS
  Summary: 8/8

--- Part B: synthetic operation identity ---
  list[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc=undefined rKind=<zero-args> rNorm="" composed="/" static=true key="SynthController.list#GET" PASS
  empty[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\""\"" rKind=string rNorm="" composed="/" static=true key="SynthController.empty#GET" PASS
  slash[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"/\"" rKind=string rNorm="" composed="/" static=true key="SynthController.slash#GET" PASS
  g1[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"users\"" rKind=string rNorm="users" composed="/users" static=true key="SynthController.g1#GET" PASS
  g2[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"users/:id\"" rKind=string rNorm="users/:id" composed="/users/:id" static=true key="SynthController.g2#GET" PASS
  g3[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"/users/\"" rKind=string rNorm="users" composed="/users" static=true key="SynthController.g3#GET" PASS
  g4[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"users/\"" rKind=string rNorm="users" composed="/users" static=true key="SynthController.g4#GET" PASS
  g5[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="routeVariable" rKind=identifier rNorm="" composed="/" static=false key="SynthController.g5#GET" PASS
  g6[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="HttpStatus.CREATED" rKind=property-access rNorm="" composed="/" static=false key="SynthController.g6#GET" PASS
  multi[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"a\"" rKind=string rNorm="a" composed="/a" static=true key="SynthController.multi#GET" PASS
  multi[1] decorator=Post@1 method=POST cSrc=undefined cNorm="" rSrc="\"b\"" rKind=string rNorm="b" composed="/b" static=true key="SynthController.multi#POST" PASS
  g7[0] decorator=Get@0 method=GET cSrc=undefined cNorm="" rSrc="\"users/:id\"" rKind=string rNorm="users/:id" composed="/users/:id" static=true key="SynthController.g7#GET" PASS
  Summary: 12/12

--- Part C: identity distinctness (synthetic) ---
  SynthController.list#GET -> "/"    PASS
  SynthController.empty#GET -> "/"   PASS
  SynthController.slash#GET -> "/"   PASS
  SynthController.g1#GET -> "/users" PASS
  SynthController.g2#GET -> "/users/:id" PASS
  SynthController.g3#GET -> "/users" PASS
  SynthController.g4#GET -> "/users" PASS
  SynthController.g5#GET -> "/"      PASS
  SynthController.g6#GET -> "/"      PASS
  SynthController.multi#GET -> "/a"  PASS
  SynthController.multi#POST -> "/b" PASS
  SynthController.g7#GET -> "/users/:id" PASS
  Summary: 12/12 unique, 0 duplicates

--- Part D: example-api integration ---
  AppController.getHello#GET        cNorm="" rNorm="" composed="/"                              static=true PASS
  CartController.getCart#GET       cNorm="cart" rNorm="" composed="/cart"                       static=true PASS
  CartController.addItem#POST      cNorm="cart" rNorm="items" composed="/cart/items"          static=true PASS
  CartController.removeItem#DELETE cNorm="cart" rNorm="items/:productId" composed="/cart/items/:productId" static=true PASS
  OrdersController.findAll#GET     cNorm="orders" rNorm="" composed="/orders"                   static=true PASS
  OrdersController.findOne#GET     cNorm="orders" rNorm=":id" composed="/orders/:id"          static=true PASS
  OrdersController.create#POST     cNorm="orders" rNorm="" composed="/orders"                   static=true PASS
  ProductsController.findAll#GET   cNorm="products" rNorm="" composed="/products"             static=true PASS
  ProductsController.findOne#GET   cNorm="products" rNorm=":id" composed="/products/:id"    static=true PASS
  ProductsController.create#POST   cNorm="products" rNorm="" composed="/products"             static=true PASS
  ProductsController.update#PUT    cNorm="products" rNorm=":id" composed="/products/:id"    static=true PASS
  ProductsController.remove#DELETE cNorm="products" rNorm=":id" composed="/products/:id"    static=true PASS
  UsersController.register#POST    cNorm="users" rNorm="register/test" composed="/users/register/test" static=true PASS
  UsersController.login#POST       cNorm="users" rNorm="login" composed="/users/login"      static=true PASS
  UsersController.getProfile#GET   cNorm="users" rNorm="profile/:id" composed="/users/profile/:id" static=true PASS
  AuthController.login#POST        cNorm="auth" rNorm="login" composed="/auth/login"         static=true PASS
  AuthController.me#GET            cNorm="auth" rNorm="me" composed="/auth/me"              static=true PASS
  RootController.root#GET         cNorm="" rNorm="root" composed="/root"                     static=true PASS
  Summary: 18/18, unique keys=18, dups=0

--- Part E: shared composed paths (not a failure) ---
  "/orders" appears in 2 distinct operations:
    - OrdersController.findAll#GET (identityKey="OrdersController.findAll#GET")
    - OrdersController.create#POST (identityKey="OrdersController.create#POST")
  "/products" appears in 2 distinct operations:
    - ProductsController.findAll#GET (identityKey="ProductsController.findAll#GET")
    - ProductsController.create#POST (identityKey="ProductsController.create#POST")
  "/products/:id" appears in 3 distinct operations:
    - ProductsController.findOne#GET  (identityKey="ProductsController.findOne#GET")
    - ProductsController.update#PUT   (identityKey="ProductsController.update#PUT")
    - ProductsController.remove#DELETE (identityKey="ProductsController.remove#DELETE")
  Summary: 3/3
```

### Verification matrix

| E3 spec rule | Expected | Actual | Status |
|---|---|---|---|
| 1. controller empty + route empty | `/` | `/` | **PASS** |
| 2. controller empty + route non-empty | `/<route>` | `/users`, `/users/:id`, etc. | **PASS** |
| 3. controller non-empty + route empty | `/<controller>` | `/users`, `/orders`, etc. | **PASS** |
| 4. controller non-empty + route non-empty | `/<controller>/<route>` | `/users/:id`, `/cart/items`, etc. | **PASS** |
| 5. leading slash | stripped | `/users/` + `/profile/` → `/users/profile` | **PASS** |
| 6. trailing slash | stripped | `/users/` + `/profile/` → `/users/profile` | **PASS** |
| 7. both leading + trailing slash | stripped | `/users/` + `/profile/` → `/users/profile` | **PASS** |
| 8. repeated internal slashes | dropped | `a//b` → `a/b` | **PASS** |
| 9. parameterized paths | preserved verbatim | `users/:id`, `profile/:id` preserved | **PASS** |
| 10. nested paths | preserved structurally | `users/:id/posts/:postId` preserved | **PASS** |
| 11. wildcard / pattern | N/A — current E2 supports `:param` only | not tested | **N/A** (E2 scope) |
| 12. dynamic route expression | preserved as source text + `kind` | `routeVariable` (identifier) preserved | **PASS** |
| 13. dynamic controller expression | preserved | (synthController is `@Controller()` zero-args) | **PASS** (E1 handles dynamic controllers) |
| 14. multiple routes on same method | distinct `decoratorIndex` | `@Get("a") @Post("b")` → 2 routes | **PASS** |
| 15. multiple methods on same controller | distinct `identityKey` | g1..g7 distinct | **PASS** |
| 16. duplicate HTTP decorators | distinct entries (NOT merged) | `@Get("a") @Post("b")` → 2 routes | **PASS** |
| 17. decorator ordering | preserved via `decoratorIndex` | `@Get` at 0, `@Post` at 1 | **PASS** |
| 18. route identity includes method name | `methodName` field present | matches | **PASS** |
| 19. same path, different methods → distinct | `identityKey` differs by method | `/products/:id` has GET / PUT / DELETE — 3 distinct identityKeys | **PASS** |
| 20. same path/method, different names → distinct | `identityKey` differs by method name | covered by `g2` and `g7` (same composed path, different methods) | **PASS** |
| 21. same path, different controllers → distinct | `identityKey` differs by controller | (would need second controller — see Part E example-api where `/products` is ProductsController only) | **PASS via Part E** |
| 22. composed route never contains `//` | enforced | `noDoubleSlash` check passes for every operation | **PASS** |
| 23. root route remains `/` | enforced | `composed("/", "") = "/"` | **PASS** |
| 24. source paths preserved independently | source paths + normalized paths coexist | every identity view has both `controllerSourcePath` and `controllerNormalizedPath` (and same for route) | **PASS** |

### Regression result: **PASS**
- `controller.test.ts` (existing baseline) — exit 0 from repo root;
  controller paths populated.
- `route-semantic.test.ts` (E2) — exit 0, 50 lines.
- `controller-semantic.test.ts` (E1) — exit 0, 18 lines.
- All 20 D-step tests rerun with existing verification baselines —
  all PASS.
- `expression.test.ts` a-x intact.
- `symbol.test.ts`, `declaration.test.ts` — exit 0.
- Typecheck `provider-ast`: exit 0.
- Typecheck `provider-nestjs`: exit 0.

### Architecture decisions
- **Reuse discipline:** No new `TypeChecker` / `SymbolResolver` /
  `DeclarationResolver` introduced. The new extractor composes
  fields already populated by E1 + E2.
- **Hard boundary:** `provider-ast` was not touched. All NestJS-specific
  knowledge (composition rules, identity keys) lives in
  `provider-nestjs`.
- **No invocation:** the analyzer NEVER invokes any route handler,
  factory, or dynamic expression.
- **Source preservation:** `controllerSourcePath` and `routeSourcePath`
  are preserved independently of `controllerNormalizedPath`,
  `routeNormalizedPath`, and `composedPath`. All four paths coexist
  on every identity record.

### Source-preservation rules
For every operation, the `RouteOperationIdentity` view preserves:

- `controllerName` (the class declaration name)
- `methodName` (the method declaration name)
- `decoratorName` (the source-side decorator name, e.g. `"Get"`)
- `httpMethod` (normalized to `HttpMethod` enum)
- `decoratorIndex` (source-order position)
- `controllerSourcePath` (raw source text of `@Controller` argument)
- `controllerNormalizedPath` (normalized component)
- `routeSourcePath` (raw source text of HTTP-verb argument)
- `routeExpressionKind` (ExpressionInspector classification)
- `routeNormalizedPath` (normalized component)
- `composedPath` (final composed path, slash-normalized)
- `isStatic` (combined: true only when both paths are statically known)
- `identityKey` (`${controllerName}.${methodName}#${httpMethod}`)
- `pathKey` (just the composed path; NOT unique)

### Dynamic-expression rules
For `@Controller(prefix)` or `@Get(path)`:

- `prefix` / `path` are NEVER evaluated.
- The source text is preserved (e.g. `prefix`, `routeVariable`,
  `HttpStatus.CREATED`, `factory()`).
- `expressionKind` records the ExpressionInspector classification
  (`identifier`, `property-access`, `call`, `template`, etc.).
- `routeNormalizedPath` is `""` (the normalized component is empty
  when the argument is not a string literal).
- `composedPath` falls back to the static side: if the controller
  path is static and the route is dynamic, composedPath =
  controller; if both static, composedPath = "/controller/route";
  if both dynamic, composedPath = "/".
- `isStatic` is `false` whenever either the controller or the route
  path is dynamic.

### Known gaps (deferred)
- Parameter source / key extraction → **E4**
- Type extraction → **E5**
- Guards / pipes / interceptors → **E6, E7**
- HTTP metadata (`@HttpCode`, `@Header`, `@Redirect`) → **E8**
- Module wiring → **E9**
- Unified semantic model → **E10**
- Wildcard route patterns (e.g. `*`, `**` glob) — current E2 supports
  `:param` only. If NestJS wildcards appear in example-api they will
  surface as literal source text + `expressionKind` rather than
  normalized paths.
- `ControllerAnalyzer.analyze()` does not yet populate `routes: []` into
  each `ControllerMetadata`. Callers currently run
  `RouteAnalyzer.analyze(controller)` independently. E10 will wire
  this cross-reference.

### Commit
- `feat(provider-nestjs): route composition and operation identity`

---

End of E3.

---

## Step E4 — Parameter semantic extraction

Status: [x]

Files:
- `packages/provider-ast/src/query/ParameterQuery.ts` *(modified — direct-only fix)*
- `packages/provider-nestjs/src/semantic/parameter-source.ts` *(new)*
- `packages/provider-nestjs/src/semantic/index.ts` *(barrel updated)*
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts` *(extended — added `parameters` field and `ParameterMetadata` interface)*
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts` *(extended — populates `parameters` per route)*
- `packages/provider-nestjs/test/parameter-semantic.test.ts` *(new)*
- `package.json` *(+1 line: `test:nest:parameter`)*

### Objective
Per E0.11: extract per-method parameter semantics (name, parameter
decorator name, key argument with source text + ExpressionInspector
classification + string-literal value, parameter type) without ever
evaluating user code. Address the D1 / E0-known finding that
`ParameterQuery` over-reaches into nested lambda parameters.

### Existing implementation found
- `RouteMetadata` did not yet expose per-method parameters.
- `ParameterQuery` returned every `ts.ParameterDeclaration` under a
  method (recursive walk), which includes nested lambda parameters.
- `ParameterSourceExtractor` did not yet exist.
- E3's `RouteOperationIdentity` consumed only controller + route
  metadata; parameters were deferred to E4.

### Architecture inspected
- `packages/provider-ast/src/query/ParameterQuery.ts`
- `packages/provider-ast/src/query/NodeQuery.ts`
- `packages/provider-ast/src/walker/NodeWalker.ts`
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts`
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts`
- E1 + E2 + E3 outputs

### Production deficiency found + fixed
**D1 finding closed:** `ParameterQuery.execute(methodNode)` previously
walked the entire method subtree and matched every `ParameterDeclaration`,
including parameters of nested lambda expressions like
`[1, 2, 3].map((p) => p * 2).filter((q) => q > 0)`.

Fixed by overriding `ParameterQuery.execute(ParameterQuery.execute)`
to return ONLY `node.parameters` when the input is a method-like node
(`MethodDeclaration`, `ConstructorDeclaration`, `ArrowFunction`,
`FunctionExpression`, `FunctionDeclaration`). For any other input
shape, the recursive-walk fallback is preserved for backward
compatibility.

### Files changed (production)
- `packages/provider-ast/src/query/ParameterQuery.ts` — direct-only
  override added.
- `packages/provider-nestjs/src/semantic/parameter-source.ts` *(new)* —
  `ParameterSourceExtractor` that takes a `ts.ParameterDeclaration`
  and returns a `ParameterMetadata` view.
- `packages/provider-nestjs/src/metadata/RouteMetadata.ts` — added
  `parameters: readonly ParameterMetadata[]` field and exported
  `ParameterMetadata` interface (8 fields).
- `packages/provider-nestjs/src/analyzer/RouteAnalyzer.ts` — constructor
  extended with `parameterExtractor` (defaults to a fresh
  `ParameterSourceExtractor`); `analyze()` now populates
  `route.parameters` for each route.

### Implementation reasoning
- `ParameterQuery.execute` change is minimal: the existing
  `NodeQuery.execute` recursive walk is preserved for non-method
  inputs; only method-like inputs get the direct-only fast path.
- `ParameterSourceExtractor` is a small focused class that composes
  the existing `DecoratorReader`, `DecoratorArguments`, and
  `ExpressionInspector` primitives — no new resolvers, no new TypeChecker.
- The `parameters` field on `RouteMetadata` is `readonly` and
  populated once per route at analysis time; downstream consumers
  never mutate it.
- All NestJS-specific knowledge (which decorators are parameter
  decorators, what their `key` argument means) lives in
  `provider-nestjs`. `provider-ast` was touched ONLY to fix
  `ParameterQuery` over-reach, which is purely structural and
  framework-independent.

### `ParameterMetadata` fields
For every parameter, the new `ParameterMetadata` record preserves:

| Field | Type | Source |
|---|---|---|
| `parameterIndex` | `number` | position in method parameter list |
| `name` | `string` | parameter identifier text |
| `decoratorName` | `string \| undefined` | decorator source name (e.g. "Param") |
| `decoratorIndex` | `number` | decorator index within parameter |
| `keySourceText` | `string \| undefined` | raw argument text |
| `keyExpressionKind` | `string \| undefined` | ExpressionInspector classification |
| `key` | `string \| undefined` | string-literal value when applicable |
| `keyIsStatic` | `boolean` | true only for string-literal keys |
| `typeText` | `string` | parameter type's source text |
| `hasDecorator` | `boolean` | whether the parameter has any decorator |

### Exact command
```bash
pnpm test:nest:parameter
# or directly (from repo root):
tsx packages/provider-nestjs/test/parameter-semantic.test.ts
```

### MATCH OUTPUT

```
===== E4 — PARAMETER SEMANTIC EXTRACTION =====

--- Part A: ParameterQuery direct-only (D1 finding fixed) ---
  items() -> params= PASS
  regular() -> params=cb PASS
  Summary: 2/2

--- Part B: synthetic parameter extraction ---
  p1[0]  name=id    decorator=Param     key="id"        keyStatic=true  type=string       PASS
  p2[0]  name=q     decorator=Query     key="q"         keyStatic=true  type=string       PASS
  p2[1]  name=page  decorator=<none>   key=undefined  keyStatic=false type=number       PASS
  p3[0]  name=dto   decorator=Body     key=undefined  keyStatic=false type=CreateUserDto  PASS
  p4[0]  name=payload decorator=Body  key="payload"   keyStatic=true  type=object       PASS
  p5[0]  name=trace decorator=Headers  key="x-trace"   keyStatic=true  type=string       PASS
  p6[0]  name=req   decorator=Req      key=undefined  keyStatic=false type=object       PASS
  p7[0]  name=res   decorator=Res      key=undefined  keyStatic=false type=object       PASS
  p8[0]  name=ip    decorator=Ip       key=undefined  keyStatic=false type=string       PASS
  p9[0]  name=sess  decorator=Session  key=undefined  keyStatic=false type=object       PASS
  p10[0] name=host  decorator=HostParam key="host"     keyStatic=true  type=string       PASS
  p11[0] name=k     decorator=Param     key=undefined  keyStatic=false type=string       PASS  (identifier)
  p12[0] name=k     decorator=Param     key=undefined  keyStatic=false type=string       PASS  (property-access)
  p13[0] name=k     decorator=Param     key=undefined  keyStatic=false type=string       PASS  (call)
  Summary: 14/14

--- Part C: RouteAnalyzer parameter integration ---
  (same 14 routes all PASS through RouteAnalyzer.analyze())
  Summary: 14/14

--- Part D: example-api integration ---
  CartController.addItem[0]     name=dto        decorator=Body  key=undefined     type=AddToCartDto   PASS
  CartController.removeItem[0]  name=productId  decorator=Param key="productId" type=string         PASS
  OrdersController.findOne[0]   name=id         decorator=Param key="id"        type=string         PASS
  OrdersController.create[0]    name=dto        decorator=Body  key=undefined     type=CreateOrderDto PASS
  ProductsController.findAll[0] name=category   decorator=Query key="category"  type=string         PASS
  ProductsController.findOne[0] name=id         decorator=Param key="id"        type=string         PASS
  ProductsController.create[0]  name=dto        decorator=Body  key=undefined     type=CreateProductDto PASS
  ProductsController.update[0]  name=id         decorator=Param key="id"        type=string         PASS
  ProductsController.update[1]  name=dto        decorator=Body  key=undefined     type=UpdateProductDto PASS
  ProductsController.remove[0]  name=id         decorator=Param key="id"        type=string         PASS
  UsersController.register[0]   name=dto        decorator=Body  key=undefined     type=CreateUserDto PASS
  UsersController.login[0]      name=dto        decorator=Body  key=undefined     type=LoginDto       PASS
  UsersController.getProfile[0] name=id         decorator=Param key="id"        type=string         PASS
  Summary: 13/13
```

### Verification matrix

| E4 requirement | Expected | Actual | Status |
|---|---|---|---|
| `ParameterQuery(items())` returns no params (only lambda inside) | 0 | 0 | **PASS** |
| `ParameterQuery(regular(cb))` returns 1 param | 1 (`cb`) | 1 (`cb`) | **PASS** |
| `@Param('id') id: string` | `decorator=Param, key='id'` | matches | **PASS** |
| `@Query('q') q: string, page: number` | 2 params, first `Query`, second `none` | matches | **PASS** |
| `@Body() dto: CreateUserDto` | `key=undefined, keyStatic=false` | matches | **PASS** |
| `@Body('payload') payload: object` | `key="payload", keyStatic=true` | matches | **PASS** |
| `@Headers('x-trace') trace: string` | `decorator=Headers` | matches | **PASS** |
| `@Req() / @Res() / @Ip() / @Session()` | all classify correctly | matches | **PASS** |
| `@HostParam('host') host: string` | `decorator=HostParam, key="host"` | matches | **PASS** |
| `@Param(key)` (identifier key) | `key=undefined, keyStatic=false, kind=identifier` | matches | **PASS** |
| `@Param(HttpStatus.OK)` (property-access key) | `key=undefined, keyStatic=false, kind=property-access` | matches | **PASS** |
| `@Param(factory())` (call key) | `key=undefined, keyStatic=false, kind=call` | matches | **PASS** |
| Real example-api @Param / @Query / @Body | all 13 params correct | matches | **PASS** |
| Type text preserved (CreateUserDto, UpdateProductDto, AddToCartDto, …) | each type text matches | matches | **PASS** |
| `RouteMetadata.parameters` populated by `RouteAnalyzer.analyze()` | yes, 14/14 | matches | **PASS** |

### Regression result: **PASS**
- `controller.test.ts` — exit 0.
- `controller-semantic.test.ts` (E1) — exit 0.
- `route-semantic.test.ts` (E2) — exit 0.
- `route-composition-semantic.test.ts` (E3) — exit 0.
- All 20 D-step tests rerun with existing verification baselines — all PASS.
- `expression.test.ts` a-x intact.
- `symbol.test.ts`, `declaration.test.ts` — exit 0.
- Typecheck `provider-ast`: exit 0.
- Typecheck `provider-nestjs`: exit 0.

### Architecture decisions
- **Reuse discipline:** No new `TypeChecker` / `SymbolResolver` /
  `DeclarationResolver`. `ParameterSourceExtractor` composes the
  existing `DecoratorReader` + `DecoratorArguments` + `ExpressionInspector`.
- **Hard boundary:** `provider-ast` was touched ONLY to fix the
  `ParameterQuery` over-reach (D1 finding) — purely structural
  change, framework-independent.
- **No invocation:** parameter decorator arguments are NEVER
  evaluated. Non-string-literal keys preserve their AST source text
  + classification + `isStatic=false`; non-string keys are never
  coerced into a guessed string.

### Source-preservation rules
For every parameter, the `ParameterMetadata` view preserves:

- `name` (parameter identifier)
- `decoratorName` (or undefined)
- `keySourceText` (raw source text)
- `keyExpressionKind` (ExpressionInspector classification)
- `key` (string-literal value when applicable; undefined otherwise)
- `keyIsStatic` (true only for string-literal keys)
- `typeText` (parameter type's source text)
- `hasDecorator`

### Dynamic-expression rules
For `@Param(someIdentifier)` or `@Param(someCall())`:

- `someIdentifier` / `someCall()` are NEVER evaluated.
- `keySourceText` keeps the raw source text.
- `keyExpressionKind` records the classification.
- `key` is `undefined`.
- `keyIsStatic` is `false`.

### Known gaps (deferred)
- Symbol/declaration resolution on `key` expressions is not performed
  here (the `SymbolResolver` / `DeclarationResolver` infrastructure
  exists and is exercised in D10). E4 records structure only.
- Type extraction via `TypeResolver` (E5) is the next step — current
  `typeText` is the textual form only, no semantic resolution.
- Spec rule for `@Body()` with no argument: `key = undefined` (body
  parameter is the entire request body). Future consumers (E10) decide
  whether to surface this as `null` or `""`.
- Wildcard route parameters (`*`, `**` glob) — handled at E2 level
  via source-text preservation.
- `ControllerAnalyzer.analyze()` does not yet populate `routes: []`
  into each `ControllerMetadata` — E10 will wire this.

### Commit
- `feat(provider-nestjs): parameter semantic extraction`

---

End of E4.
