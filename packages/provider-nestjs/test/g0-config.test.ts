import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
    SpectraConfig,
    SpectraConfigError,
    SpectraConfigLoader,
} from "../src";

console.log("===== G0 — CONFIGURATION LOADING =====\n");

let aPass = 0;
let aTotal = 0;

function check(name: string, ok: boolean): void {
    aTotal++;
    if (ok) aPass++;
    console.log(`  ${name}: ${ok ? "PASS" : "FAIL"}`);
}

function expectError(
    label: string,
    fn: () => void,
): void {
    let threw = false;
    try {
        fn();
    } catch (e) {
        threw = e instanceof SpectraConfigError;
    }
    check(label, threw);
}

const tmpRoot = mkdtempSync(join(tmpdir(), "spectra-g0-"));

try {
    // 1. No config, no package.json — safe defaults.
    {
        const projectRoot = join(tmpRoot, "no-config");
        mkdirSync(projectRoot, { recursive: true });
        const cfg: SpectraConfig = new SpectraConfigLoader().load(projectRoot);
        check("No config: projectRoot", cfg.projectRoot === projectRoot);
        check(
            "No config: outputPath default",
            cfg.outputPath ===
                join(projectRoot, "spectra-output", "documentation.json"),
        );
        check("No config: outputFormat = json", cfg.outputFormat === "json");
        check(
            "No config: infoTitle = dir basename",
            cfg.infoTitle === "no-config",
        );
        check("No config: infoVersion = 0.0.0", cfg.infoVersion === "0.0.0");
        check("No config: infoSummary = undefined", cfg.infoSummary === undefined);
        check(
            "No config: servers default",
            cfg.servers.length === 1 &&
                cfg.servers[0].url === "http://localhost:3000",
        );
    }

    // 2. package.json with full info fields.
    {
        const projectRoot = join(tmpRoot, "with-pkg");
        mkdirSync(projectRoot, { recursive: true });
        writeFileSync(
            join(projectRoot, "package.json"),
            JSON.stringify({
                name: "my-api",
                version: "3.2.1",
                description: "An example NestJS API",
            }),
        );
        const cfg = new SpectraConfigLoader().load(projectRoot);
        check("Full pkg: infoTitle = package.json.name", cfg.infoTitle === "my-api");
        check("Full pkg: infoVersion = package.json.version", cfg.infoVersion === "3.2.1");
        check(
            "Full pkg: infoSummary = package.json.description",
            cfg.infoSummary === "An example NestJS API",
        );
    }

    // 3. Partial package.json — only name present.
    {
        const projectRoot = join(tmpRoot, "partial-pkg");
        mkdirSync(projectRoot, { recursive: true });
        writeFileSync(
            join(projectRoot, "package.json"),
            JSON.stringify({ name: "minimal" }),
        );
        const cfg = new SpectraConfigLoader().load(projectRoot);
        check("Partial pkg: title from pkg", cfg.infoTitle === "minimal");
        check("Partial pkg: version default 0.0.0", cfg.infoVersion === "0.0.0");
        check("Partial pkg: summary undefined", cfg.infoSummary === undefined);
    }

    // 4. spectra.config.json partial override.
    {
        const projectRoot = join(tmpRoot, "with-config");
        mkdirSync(projectRoot, { recursive: true });
        writeFileSync(
            join(projectRoot, "package.json"),
            JSON.stringify({ name: "pkg-name", version: "1.0.0" }),
        );
        writeFileSync(
            join(projectRoot, "spectra.config.json"),
            JSON.stringify({
                info: { title: "Custom Title", description: "Custom Desc" },
                output: { path: "./custom-output/doc.json" },
                servers: [{ url: "https://api.example.com" }],
            }),
        );
        const cfg = new SpectraConfigLoader().load(projectRoot);
        check("Config: title from file", cfg.infoTitle === "Custom Title");
        check(
            "Config: version from pkg (config not overriding)",
            cfg.infoVersion === "1.0.0",
        );
        check("Config: description from file", cfg.infoSummary === "Custom Desc");
        check(
            "Config: output path resolved to root",
            cfg.outputPath ===
                join(projectRoot, "custom-output", "doc.json"),
        );
        check(
            "Config: server URL from file",
            cfg.servers.length === 1 &&
                cfg.servers[0].url === "https://api.example.com",
        );
    }

    // 5. spectra.config.json with explicit format=json.
    {
        const projectRoot = join(tmpRoot, "explicit-json");
        mkdirSync(projectRoot, { recursive: true });
        writeFileSync(
            join(projectRoot, "spectra.config.json"),
            JSON.stringify({ output: { format: "json" } }),
        );
        const cfg = new SpectraConfigLoader().load(projectRoot);
        check("Explicit format=json: ok", cfg.outputFormat === "json");
    }

    // 6. Invalid JSON in spectra.config.json → SpectraConfigError.
    {
        const projectRoot = join(tmpRoot, "invalid-json");
        mkdirSync(projectRoot, { recursive: true });
        writeFileSync(
            join(projectRoot, "spectra.config.json"),
            "{ broken json",
        );
        expectError("Invalid JSON: SpectraConfigError", () => {
            new SpectraConfigLoader().load(projectRoot);
        });
    }

    // 7. Invalid semantic config → SpectraConfigError.
    {
        const projectRoot = join(tmpRoot, "invalid-semantic");
        mkdirSync(projectRoot, { recursive: true });
        writeFileSync(
            join(projectRoot, "spectra.config.json"),
            JSON.stringify({ output: { format: "yaml" } }),
        );
        expectError("Invalid format=yaml: SpectraConfigError", () => {
            new SpectraConfigLoader().load(projectRoot);
        });
    }

    // 8. Non-existent project root → SpectraConfigError.
    expectError("Non-existent root: SpectraConfigError", () => {
        new SpectraConfigLoader().load(join(tmpRoot, "does-not-exist"));
    });

    // 9. Caller overrideRoot takes priority.
    {
        const cfg = new SpectraConfigLoader().load("/tmp");
        check("Override: projectRoot = override", cfg.projectRoot === "/tmp");
    }
} finally {
    rmSync(tmpRoot, { recursive: true, force: true });
}

console.log(`\nSummary: ${aPass}/${aTotal}`);
if (aPass !== aTotal) process.exit(1);
