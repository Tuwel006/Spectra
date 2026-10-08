#!/usr/bin/env node
/**
 * Move the CJS build into place and rename `.js` → `.cjs`.
 *
 * <p>When tsc emits CommonJS it writes <code>.js</code> files. With
 * the package's <code>"type": "module"</code> set, those files
 * would be loaded as ESM and crash on <code>require()</code>. So
 * we move them into the published <code>dist-cjs/</code> folder with
 * a <code>.cjs</code> extension and create a single
 * <code>dist/index.cjs</code> entry that re-exports from them.</p>
 *
 * <p>Why not just emit <code>.cjs</code> from tsc? Because tsc's
 * <code>"module": "commonjs"</code> always emits <code>.js</code>.</p>
 */

import {
    readdirSync,
    statSync,
    renameSync,
    writeFileSync,
    mkdirSync,
} from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const srcDir = path.join(pkgRoot, "dist-cjs");
const dstDir = path.join(pkgRoot, "dist");

if (!exists(srcDir)) {
    console.error(`dist-cjs not found — run \`tsc -p tsconfig.cjs.json\` first.`);
    process.exit(1);
}

mkdirSync(dstDir, { recursive: true });

/* Walk dist-cjs, rename each .js to .cjs, move into dist/. */
const walk = (dir, rel = "") => {
    for (const entry of readdirSync(dir)) {
        const abs = path.join(dir, entry);
        const s = statSync(abs);
        const nextRel = rel ? path.join(rel, entry) : entry;
        if (s.isDirectory()) {
            mkdirSync(path.join(dstDir, nextRel), { recursive: true });
            walk(abs, nextRel);
        } else if (entry.endsWith(".js")) {
            const target = path.join(dstDir, nextRel.replace(/\.js$/, ".cjs"));
            renameSync(abs, target);
        } else {
            /* keep .map etc. */
            const target = path.join(dstDir, nextRel);
            renameSync(abs, target);
        }
    }
};
walk(srcDir);

/* Drop a tiny barrel that re-exports everything so consumers see
   a single dist/index.cjs entry. tsc's emitted CommonJS module
   trees aren't directly resolvable via package.json's main in some
   set-ups, so the barrel keeps the public surface obvious. */
const barrel = `'use strict';
const { SpectraModule } = require('./spectra.module.cjs');
const { makeSpectraController } = require('./spectra.controller.cjs');
const { SpectraStaticFilesService } = require('./static-files.service.cjs');

module.exports = { SpectraModule, makeSpectraController, SpectraStaticFilesService };
module.exports.SpectraModule = SpectraModule;
module.exports.makeSpectraController = makeSpectraController;
module.exports.SpectraStaticFilesService = SpectraStaticFilesService;
`;
writeFileSync(path.join(dstDir, "index.cjs"), barrel);

console.log(`✓ moved CJS build into ${path.relative(pkgRoot, dstDir)}`);

function exists(p) {
    try {
        statSync(p);
        return true;
    } catch {
        return false;
    }
}