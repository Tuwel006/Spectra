import ts from "typescript";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D17 audit test — regular expression literal expressions.
 *
 * Verifies that ts.RegularExpressionLiteral used as a decorator
 * argument classifies as kind: "regex" with pattern + flags preserved.
 *
 * The TS source is written to a temp file because tsx's parser would
 * otherwise attempt to compile the regex literal in the host script
 * (which would also bind it to a regex runtime object — defeating the
 * purpose of structural inspection).
 */

const tmpDir = mkdtempSync(join(tmpdir(), "spectra-d17-"));
const srcPath = join(tmpDir, "regex-fixture.ts");

const source = [
    "class RegexForms {",
    "  @Decorator(/abc/)                              m1() {}",
    "  @Decorator(/^test$/i)                          m2() {}",
    "  @Decorator(/users\\\\/\\\\d+/)                       m3() {}",
    "  @Decorator(/[a-z]+/g)                          m4() {}",
    "  @Decorator(/^https?:\\\\/\\\\/[a-z]+$/i)            m5() {}",
    "  @Decorator([/abc/, /def/])                     m6() {}",
    "  @Decorator({ pattern: /test/ })                m7() {}",
    "  @Decorator(/a/, /b/i, /c/g)                    m8() {}",
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

console.log("===== D17 — REGEX LITERAL EXPRESSIONS =====\n");

let totalRegex = 0;
let totalPass = 0;

function walk(arg: ts.Expression, indent = "  "): string {
    if (ts.isRegularExpressionLiteral(arg)) {
        totalRegex++;
        const ok = inspector.inspect(arg).kind === "regex";
        if (ok) totalPass++;
        return (
            `${indent}regex sourceText=${JSON.stringify(arg.getText())} ` +
                `pattern=${JSON.stringify(arg.text)} ${ok ? "PASS" : "FAIL"}`
        );
    }
    if (ts.isArrayLiteralExpression(arg)) {
        return (
            `${indent}array itemCount=${arg.elements.length}\n` +
            arg.elements
                .map(e => walk(e, indent + "  "))
                .join("\n")
        );
    }
    if (ts.isObjectLiteralExpression(arg)) {
        return (
            `${indent}object properties=${arg.properties.length}\n` +
            arg.properties
                .map(p =>
                    ts.isPropertyAssignment(p)
                        ? walk(p.initializer, indent + "  ")
                        : `${indent}  <unsupported>`,
                )
                .join("\n")
        );
    }
    return `${indent}<other kind=${inspector.inspect(arg).kind}>`;
}

for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        const args = decoratorArguments.get(d);
        console.log(`--- ${methodName} ---`);
        console.log(`  argumentCount: ${args.length}`);
        args.forEach((arg, i) => {
            console.log(`  argument[${i}]:`);
            console.log(walk(arg));
        });
    }
}

console.log(
    `\nSummary: ${totalPass}/${totalRegex} regex literals classify as regex`,
);

rmSync(tmpDir, { recursive: true, force: true });

if (totalPass !== totalRegex) {
    process.exit(1);
}