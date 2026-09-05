import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    MethodQuery,
} from "@spectra/provider-ast";

import { DecoratorReader } from "../src";

/**
 * D2 audit test — decorator order.
 *
 * Verifies that decorators on every scope (class / method / parameter) keep
 * their exact source order. Reuses DecoratorReader.getDecorators which
 * delegates to ts.getDecorators — the TypeScript API returns decorators in
 * the order they appear in source code.
 *
 * Three fixtures exercise this:
 *
 *   A. Synthetic source file mirroring the D2 master-spec example
 *      (@First/@Second/@Third on the class, @Get on a method, and a
 *      stacked-parameter case with @Beta/@Alpha/@Gamma).
 *
 *   B. Non-alphabetical synthetic case (@Zeta/@Alpha/@Mu on a method) that
 *      would reorder to (Alpha, Mu, Zeta) under alphabetical sort — proves
 *      no sort happens.
 *
 *   C. Real NestJS methods from apps/example-api:
 *        ProductsController.create   → @Post + @HttpCode(CREATED)
 *        ProductsController.remove   → @Delete(':id') + @HttpCode(NO_CONTENT)
 *        OrdersController.create     → @Post + @HttpCode(CREATED)
 *        CartController.addItem      → @Post('items') + @HttpCode(OK)
 *        UsersController.register    → @Post('register/test') + @HttpCode(CREATED)
 *        UsersController.getProfile  → @Get('profile/:id') + @UseGuards(JwtAuthGuard)
 *
 * Output format per scope:
 *   index 0 → Name
 *   index 1 → Name
 *   ...
 */

const decoratorReader = new DecoratorReader();

function printScope(
    scopeLabel: string,
    decorators: readonly ts.Decorator[],
) {
    console.log(`Scope: ${scopeLabel}`);
    if (decorators.length === 0) {
        console.log("  (no decorators)");
        return;
    }
    decorators.forEach((d, i) => {
        const name = decoratorReader.getName(d) ?? "<unnamed>";
        console.log(`  index ${i} → ${name}`);
    });
}

// ============================================================
// Part A — synthetic D2 spec fixture
// ============================================================
console.log(
    "\n===== D2 PART A — SYNTHETIC SPEC EXAMPLE =====\n",
);

const syntheticSource = `
@First()
@Second()
@Third()
class Test {
    @First()
    @Second()
    @Get()
    method(@Third() value: string) {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-fixture.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const classDeclaration =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!classDeclaration) {
    throw new Error("synthetic source had no class");
}

printScope(
    "class | Test",
    decoratorReader.getDecorators(classDeclaration),
);

for (const member of classDeclaration.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    printScope(
        `method | ${methodName}`,
        decoratorReader.getDecorators(member),
    );
    for (const param of member.parameters) {
        printScope(
            `parameter | ${methodName}.${param.name.getText()}`,
            decoratorReader.getDecorators(param),
        );
    }
}

// ============================================================
// Part B — non-alphabetical case (proves no sort)
// ============================================================
console.log(
    "\n===== D2 PART B — NON-ALPHABETICAL ORDER =====\n",
);

const nonAlphaSource = `
@Zeta()
@Alpha()
@Mu()
class Sort {
    @Zeta()
    @Alpha()
    @Mu()
    fn() {}

    stacked(@Beta() @Alpha() @Gamma() value: string) {}
}
`;

const nonAlphaFile = ts.createSourceFile(
    "non-alpha-fixture.ts",
    nonAlphaSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nonAlphaClass =
    nonAlphaFile.statements.find(ts.isClassDeclaration);

if (!nonAlphaClass) {
    throw new Error("non-alpha source had no class");
}

printScope(
    "class | Sort",
    decoratorReader.getDecorators(nonAlphaClass),
);

for (const member of nonAlphaClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    printScope(
        `method | ${methodName}`,
        decoratorReader.getDecorators(member),
    );
    for (const param of member.parameters) {
        printScope(
            `parameter | ${methodName}.${param.name.getText()}`,
            decoratorReader.getDecorators(param),
        );
    }
}

// ============================================================
// Part C — real NestJS methods from apps/example-api
// ============================================================
console.log(
    "\n===== D2 PART C — REAL NESTJS METHODS =====\n",
);

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const scanner = new SourceScanner(project);
const walker = new NodeWalker();
const classQuery = new ClassQuery(walker);
const methodQuery = new MethodQuery(walker);

const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

const targetMethods = new Set<string>([
    "ProductsController::create",     // @Post() + @HttpCode(HttpStatus.CREATED)
    "ProductsController::remove",     // @Delete(':id') + @HttpCode(HttpStatus.NO_CONTENT)
    "OrdersController::create",       // @Post() + @HttpCode(HttpStatus.CREATED)
    "CartController::addItem",        // @Post('items') + @HttpCode(HttpStatus.OK)
    "UsersController::register",      // @Post('register/test') + @HttpCode(HttpStatus.CREATED)
    "UsersController::getProfile",    // @Get('profile/:id') + @UseGuards(JwtAuthGuard)
]);

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        if (!className) continue;
        const methods = methodQuery.execute(classNode);
        for (const methodNode of methods) {
            const methodName = methodNode.name.getText();
            const key = `${className}::${methodName}`;
            if (!targetMethods.has(key)) continue;
            printScope(
                `method | ${key}`,
                decoratorReader.getDecorators(methodNode),
            );
        }
    }
}