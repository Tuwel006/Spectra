import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ProjectInspector } from "../src";

/**
 * Unit tests for the framework-agnostic ProjectInspector.
 *
 * Verifies:
 *   - tsconfig.json is discovered when present.
 *   - package.json fields are parsed and validated.
 *   - .env files are parsed in canonical order.
 *   - Missing files never throw.
 *   - listSourceFiles() excludes framework build artefacts.
 */

console.log("===== PROJECT INSPECTOR =====\n");

let pass = 0;
let total = 0;
const check = (name: string, ok: boolean): void => {
    total++;
    if (ok) pass++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
};

const inspector = new ProjectInspector();
const tmpRoot = mkdtempSync(join(tmpdir(), "spectra-pi-"));

try {
    // 1. Empty project — only projectRoot.
    {
        const dir = join(tmpRoot, "empty");
        mkdirSync(dir, { recursive: true });
        const result = inspector.inspect(dir);
        check("empty: projectRoot", result.projectRoot === dir);
        check("empty: tsconfigPath undefined", result.tsconfigPath === undefined);
        check("empty: packageJson undefined", result.packageJson === undefined);
        check("empty: env empty object", Object.keys(result.env).length === 0);
    }

    // 2. tsconfig.json only.
    {
        const dir = join(tmpRoot, "tsconfig-only");
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "tsconfig.json"), "{}");
        const result = inspector.inspect(dir);
        check(
            "tsconfig-only: tsconfigPath resolved",
            result.tsconfigPath === join(dir, "tsconfig.json"),
        );
    }

    // 3. package.json with all fields.
    {
        const dir = join(tmpRoot, "with-pkg");
        mkdirSync(dir, { recursive: true });
        writeFileSync(
            join(dir, "package.json"),
            JSON.stringify({
                name: "@spectra/example",
                version: "1.2.3",
                description: "Hello world",
                license: "MIT",
            }),
        );
        const result = inspector.inspect(dir);
        check("pkg: name", result.packageJson?.name === "@spectra/example");
        check("pkg: version", result.packageJson?.version === "1.2.3");
        check(
            "pkg: description",
            result.packageJson?.description === "Hello world",
        );
        check(
            "pkg: raw.license === 'MIT'",
            (result.packageJson?.raw.license as string) === "MIT",
        );
    }

    // 4. package.json with non-string fields ignored.
    {
        const dir = join(tmpRoot, "pkg-malformed");
        mkdirSync(dir, { recursive: true });
        writeFileSync(
            join(dir, "package.json"),
            JSON.stringify({
                name: 42,
                version: ["1.0.0"],
                description: { text: "x" },
            }),
        );
        const result = inspector.inspect(dir);
        check(
            "pkg-malformed: name dropped (not a string)",
            result.packageJson?.name === undefined,
        );
        check(
            "pkg-malformed: version dropped",
            result.packageJson?.version === undefined,
        );
        check(
            "pkg-malformed: description dropped",
            result.packageJson?.description === undefined,
        );
    }

    // 5. .env files in canonical order with override semantics.
    {
        const dir = join(tmpRoot, "with-env");
        mkdirSync(dir, { recursive: true });
        writeFileSync(
            join(dir, ".env"),
            "PORT=3000\nBASE_URL=http://localhost:3000\n# comment\n",
        );
        writeFileSync(
            join(dir, ".env.local"),
            'BASE_URL="http://localhost:4000"\n',
        );
        writeFileSync(
            join(dir, ".env.development"),
            "NODE_ENV=development\n",
        );
        const result = inspector.inspect(dir);
        check(
            "env: PORT from .env",
            result.env["PORT"] === "3000",
        );
        check(
            "env: BASE_URL overridden by .env.local",
            result.env["BASE_URL"] === "http://localhost:4000",
        );
        check(
            "env: NODE_ENV from .env.development",
            result.env["NODE_ENV"] === "development",
        );
        check(
            "env: comments are skipped",
            !Object.keys(result.env).some(k => k.startsWith("#")),
        );
    }

    // 6. listSourceFiles excludes framework build artefacts.
    {
        const dir = join(tmpRoot, "with-build");
        mkdirSync(dir, { recursive: true });
        for (const sub of ["src", "node_modules", "dist", ".turbo"]) {
            mkdirSync(join(dir, sub), { recursive: true });
        }
        writeFileSync(join(dir, "src", "main.ts"), "");
        writeFileSync(join(dir, "node_modules", "x.ts"), "");
        writeFileSync(join(dir, "dist", "x.js"), "");
        const files = inspector.listSourceFiles(dir);
        check(
            "listSourceFiles: src/main.ts included",
            files.some(f => f.endsWith("main.ts")),
        );
        check(
            "listSourceFiles: node_modules excluded",
            !files.some(f => f.includes("node_modules")),
        );
        check(
            "listSourceFiles: dist excluded",
            !files.some(f => f.includes("/dist/")),
        );
    }

    // 7. Non-existent project root throws a clear error.
    let threw = false;
    try {
        inspector.inspect(join(tmpRoot, "no-such"));
    } catch {
        threw = true;
    }
    check("non-existent root: throws", threw);

    // 8. Path that is a file, not a directory, throws.
    {
        const dir = join(tmpRoot, "is-a-file");
        writeFileSync(dir, "x");
        let threwFile = false;
        try {
            inspector.inspect(dir);
        } catch {
            threwFile = true;
        }
        check("file-as-root: throws", threwFile);
        // Sanity: confirm it really is a file (the check above depends on it).
        check("file-as-root: is a file", existsSync(dir));
    }
} finally {
    rmSync(tmpRoot, { recursive: true, force: true });
}

console.log(`\nSummary: ${pass}/${total}`);
if (pass !== total) process.exit(1);