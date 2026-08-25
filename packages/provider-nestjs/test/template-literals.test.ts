import ts from "typescript";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D16 audit test — template literal expressions.
 *
 * Verifies that template literals (NoSubstitutionTemplateLiteral and
 * TemplateExpression) used as decorator arguments are correctly
 * classified by ExpressionInspector as kind: "template" — without
 * evaluating interpolations.
 *
 * The TS source is written to a temp file because the test source
 * itself uses JS template literals (which would otherwise collide with
 * the TS template literals being tested).
 */

const tmpDir = mkdtempSync(join(tmpdir(), "spectra-d16-"));
const srcPath = join(tmpDir, "template-fixture.ts");
const source = [
    "class TemplateForms {",
    "  @Decorator(`hello`) m1() {}",
    "  @Decorator(`users/${'$'}{id}`) m2() {}",
    "  @Decorator(`${'$'}{prefix}/users`) m3() {}",
    "  @Decorator(`simple-text`) m4() {}",
    "  @Decorator(`${'$'}{HttpStatus.CREATED}`) m5() {}",
    "  @Decorator(`${'$'}{factory()}`) m6() {}",
    "  @Decorator(`${'$'}{cond ? \"a\" : \"b\"}`) m7() {}",
    "  @Decorator(`${'$'}{a} and ${'$'}{b}`) m8() {}",
    "  @Decorator(`users/${'$'}{id}/profile`) m9() {}",
    "}",
].join("\n");
writeFileSync(srcPath, source);

const sf = ts.createSourceFile(
    srcPath,
    readFileSync(srcPath, "utf-8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

const cls = sf.statements.find(ts.isClassDeclaration);
if (!cls) throw new Error("no class");

let totalCases = 0;
let totalPasses = 0;

function view(arg: ts.Expression) {
    const text = arg.getText();
    if (ts.isNoSubstitutionTemplateLiteral(arg)) {
        return { kind: "template", text, spanCount: 0 };
    }
    if (ts.isTemplateExpression(arg)) {
        return {
            kind: "template",
            text,
            spanCount: arg.templateSpans.length,
        };
    }
    return { kind: "<other>", text };
}

console.log("===== D16 — TEMPLATE LITERAL EXPRESSIONS =====\n");

for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        const args = decoratorArguments.get(d);
        totalCases++;
        const arg = args[0];
        if (!arg) continue;
        const v = view(arg);
        const inspected = inspector.inspect(arg);
        const ok =
            inspected.kind === "template" &&
            (v.kind === "template");
        if (ok) totalPasses++;
        console.log(
            `${methodName.padEnd(8)} inspector.kind=${inspected.kind.padEnd(12)} ` +
                `text=${JSON.stringify(v.text.slice(0, 60))}` +
                (v.kind === "template" && "spanCount" in v
                    ? ` spans=${v.spanCount}`
                    : "") +
                `  ${ok ? "PASS" : "FAIL"}`,
        );
    }
}

console.log(
    `\nSummary: ${totalPasses}/${totalCases} cases classify as template`,
);

rmSync(tmpDir, { recursive: true, force: true });

if (totalPasses !== totalCases) {
    process.exit(1);
}