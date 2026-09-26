import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import type ts from "typescript";

import type {
    Components,
    Documentation,
    NamedCollection,
    Schema,
    Server,
} from "@spectra/core";
import { writeSpectraBin } from "@spectra/core/encoding";
import {
    AstProject,
    ClassQuery,
    DeclarationResolver,
    ExpressionInspector,
    MethodQuery,
    NodeWalker,
    ProjectInspector,
    SchemaExtractor,
    SourceScanner,
    SymbolResolver,
    TypeResolver,
} from "@spectra/provider-ast";

import { NestBootstrapInspector } from "../bootstrap/NestBootstrapInspector";
import { ComponentGenerator } from "../generators/ComponentGenerator";
import { PathGenerator } from "../generators/PathGenerator";
import { TagGenerator } from "../generators/TagGenerator";
import { ControllerAnalyzer } from "../analyzer/ControllerAnalyzer";
import { RouteAnalyzer } from "../analyzer/RouteAnalyzer";
import { ModuleSourceExtractor } from "../semantic/module-source";
import {
    UnifiedSemanticExtractor,
    SpectraSemanticModel,
} from "../semantic/unified-model";
import {
    DecoratorArguments,
    DecoratorReader,
} from "../utils";

import type { IDocumentationBuilder } from "../pipeline/interfaces/IDocumentationBuilder";

/**
 * Full Documentation builder.
 *
 * Takes a project root directory and produces a complete
 * `Documentation` value object by orchestrating four pipeline stages:
 *
 *   1. **Configuration inspection** (provider-ast, framework-agnostic)
 *      `ProjectInspector` reads `tsconfig.json`, `package.json`,
 *      `.env*`.
 *
 *   2. **Bootstrap inspection** (provider-nestjs, Nest-specific)
 *      `NestBootstrapInspector` reads `src/main.ts` and
 *      `src/app.module.ts` to discover the listening port and the
 *      bootstrap module.
 *
 *   3. **Semantic extraction** (E1–E10, Nest-specific)
 *      `UnifiedSemanticExtractor` produces a
 *      {@link SpectraSemanticModel}: modules, controllers,
 *      operations, module edges.
 *
 *   4. **Documentation generation** (F, Nest-specific)
 *      `PathGenerator`, `ComponentGenerator`, `TagGenerator`
 *      project the semantic model into `paths`, `components`, and
 *      `tags`.
 *
 * `info` and `servers` are computed from stages 1 + 2.
 *
 * The builder never executes application code. No DTO, class, guard,
 * pipe, interceptor, filter, factory, or decorator callback is ever
 * invoked. The TypeScript program is loaded once and shared across
 * all stages.
 *
 * Dependency injection is supported through
 * {@link DocumentationBuilderOptions.unifiedExtractor}: tests can pass
 * a pre-built extractor. Production code accepts the default
 * extractor that this class wires up.
 */
export interface DocumentationBuilderOptions {
    readonly bootstrapEntryRel?: string;
    readonly rootModuleRel?: string;
    /**
     * Override the semantic extractor. Useful for synthetic tests
     * that want to feed an in-memory `ts.SourceFile` instead of a
     * full project. Production code uses the default extractor.
     */
    readonly unifiedExtractor?: UnifiedSemanticExtractor;
}

export class DocumentationBuilder implements IDocumentationBuilder {
    private readonly projectRoot: string;
    private readonly projectInspector: ProjectInspector;
    private readonly bootstrapInspector: NestBootstrapInspector;
    private readonly unifiedExtractor: UnifiedSemanticExtractor | undefined;

    public constructor(
        projectRoot: string,
        options: DocumentationBuilderOptions = {},
    ) {
        this.projectRoot = path.resolve(projectRoot);
        this.projectInspector = new ProjectInspector();
        this.bootstrapInspector = new NestBootstrapInspector({
            bootstrapEntryRel: options.bootstrapEntryRel,
            rootModuleRel: options.rootModuleRel,
        });
        this.unifiedExtractor = options.unifiedExtractor;
    }

    /**
     * One-shot build of the entire `Documentation` value object.
     *
     * <p>This is a pure function — no I/O beyond reading source files
     * for analysis. Encoding and persistence are handled by the
     * pipeline collaborators
     * ({@link IDocumentationEncoder}, {@link IDocumentationWriter}) so
     * the builder stays focused on its single responsibility:
     * producing a Documentation value object from project sources.</p>
     */
    public build(): Documentation {
        const project = this.projectInspector.inspect(this.projectRoot);
        const tsconfigPath = project.tsconfigPath;
        if (tsconfigPath === undefined) {
            throw new Error(
                `DocumentationBuilder: no tsconfig.json found in ${this.projectRoot}`,
            );
        }

        const astProject = new AstProject({ tsconfigPath });
        const bootstrap = this.bootstrapInspector.inspect(
            this.projectRoot,
            astProject,
        );

        const semantic = this.runSemanticExtractor(astProject);
        const sourceFiles = [...new SourceScanner(astProject).scan()];
        const pathGenerator = new PathGenerator();
        const componentGenerator = new ComponentGenerator();
        const tagGenerator = new TagGenerator();

        return {
            id: "documentation",
            info: this.buildInfo(project.packageJson),
            servers: this.buildServers(bootstrap, project.env),
            tags: [...tagGenerator.generate(semantic.controllers)],
            components: this.buildComponents(semantic, sourceFiles),
            paths: pathGenerator.generate(semantic.operations),
        };
    }

    /**
     * Convenience: build + write a `.spectra/document.bin` for the
     * project root this builder was constructed with. Provided for
     * callers that don't want to wire the full pipeline; production
     * code should prefer {@link SpectraBuildPipeline} which is fully
     * configurable via dependency injection.
     */
    public async buildAndWrite(): Promise<{
        readonly documentation: Documentation;
        readonly outputPath: string;
    }> {
        const documentation = this.build();
        const outputPath = await writeSpectraBin(documentation, this.projectRoot);
        return { documentation, outputPath };
    }

    private runSemanticExtractor(
        astProject: AstProject,
    ): SpectraSemanticModel {
        if (this.unifiedExtractor) {
            const scanner = new SourceScanner(astProject);
            const sourceFiles = [...scanner.scan()].sort((a, b) =>
                a.fileName.localeCompare(b.fileName),
            );
            const walker = new NodeWalker();
            const classQuery = new ClassQuery(walker);
            return this.unifiedExtractor.extract(sourceFiles, sf =>
                classQuery.execute(sf),
            );
        }

        const walker = new NodeWalker();
        const classQuery = new ClassQuery(walker);
        const methodQuery = new MethodQuery(walker);
        const decoratorReader = new DecoratorReader();
        const decoratorArguments = new DecoratorArguments();
        const inspector = new ExpressionInspector();
        const symbolResolver = new SymbolResolver(astProject);
        const declarationResolver = new DeclarationResolver(astProject);
        const typeResolver = new TypeResolver(astProject);

        const controllerAnalyzer = new ControllerAnalyzer(
            classQuery,
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
        const routeAnalyzer = new RouteAnalyzer(
            methodQuery,
            decoratorReader,
            decoratorArguments,
            inspector,
            typeResolver,
            symbolResolver,
            declarationResolver,
        );
        const moduleExtractor = new ModuleSourceExtractor(
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
        const unified = new UnifiedSemanticExtractor(
            controllerAnalyzer,
            routeAnalyzer,
            moduleExtractor,
        );

        const scanner = new SourceScanner(astProject);
        const sourceFiles = [...scanner.scan()].sort((a, b) =>
            a.fileName.localeCompare(b.fileName),
        );
        return unified.extract(sourceFiles, sf => classQuery.execute(sf));
    }

    /**
     * `Info` is built strictly from what the developer wrote in
     * `package.json`. We never invent descriptions, contact
     * information, or licenses.
     */
    private buildInfo(
        packageJson: ReturnType<ProjectInspector["inspect"]>["packageJson"],
    ): Documentation["info"] {
        const title =
            (packageJson?.name && packageJson.name.length > 0
                ? packageJson.name
                : undefined) ??
            path.basename(this.projectRoot) ??
            "Untitled";
        const version =
            (packageJson?.version && packageJson.version.length > 0
                ? packageJson.version
                : undefined) ?? "0.0.0";
        const summary =
            packageJson?.description && packageJson.description.length > 0
                ? packageJson.description
                : undefined;

        return {
            id: "info",
            title,
            version,
            summary,
        };
    }

    /**
     * Server list synthesis:
     *   1. Bootstrap port literal (or env fallback) → localhost URL.
     *   2. `.env*` URL keys (`BASE_URL`, `HOST` + `PORT`, etc.).
     *   3. `spectra.config.json` explicit `servers` array.
     */
    private buildServers(
        bootstrap: ReturnType<NestBootstrapInspector["inspect"]>,
        env: Readonly<Record<string, string>>,
    ): Server[] {
        const seen = new Set<string>();
        const out: Server[] = [];

        const pushUrl = (url: string, description: string): void => {
            if (seen.has(url)) return;
            seen.add(url);
            out.push({
                id: this.serverId(url, out.length),
                url,
                description,
            });
        };

        const port = bootstrap.port?.staticFallback;
        if (typeof port === "number") {
            pushUrl(`http://localhost:${port}`, "Detected from bootstrap entry");
        }

        for (const envUrl of this.extractServerUrlsFromEnv(env)) {
            pushUrl(envUrl, "From .env");
        }

        for (const cfgUrl of this.readSpectraConfigServers()) {
            pushUrl(cfgUrl.url, cfgUrl.description ?? "From spectra.config.json");
        }

        return out;
    }

    private *extractServerUrlsFromEnv(
        env: Readonly<Record<string, string>>,
    ): IterableIterator<string> {
        const directKeys = [
            "BASE_URL",
            "API_URL",
            "SERVER_URL",
            "PUBLIC_URL",
            "APP_URL",
        ];
        for (const key of directKeys) {
            const value = env[key];
            if (typeof value === "string" && this.looksLikeUrl(value)) {
                yield value;
            }
        }

        const host = env["HOST"];
        if (typeof host === "string" && host.length > 0) {
            if (this.looksLikeUrl(host)) {
                yield host;
            } else {
                const port =
                    typeof env["PORT"] === "string" && env["PORT"].length > 0
                        ? env["PORT"]
                        : "3000";
                yield `http://${host}:${port}`;
            }
        }
    }

    private looksLikeUrl(value: string): boolean {
        return /^https?:\/\//i.test(value);
    }

    private readSpectraConfigServers(): readonly Server[] {
        const configPath = path.join(
            this.projectRoot,
            "spectra.config.json",
        );
        if (!existsSync(configPath)) return [];
        let raw: unknown;
        try {
            raw = JSON.parse(readFileSync(configPath, "utf-8"));
        } catch {
            return [];
        }
        if (typeof raw !== "object" || raw === null) return [];
        const obj = raw as Record<string, unknown>;
        if (!Array.isArray(obj.servers)) return [];
        const out: Server[] = [];
        for (let i = 0; i < obj.servers.length; i++) {
            const entry = obj.servers[i] as Record<string, unknown>;
            if (typeof entry?.url === "string") {
                out.push({
                    id: this.serverId(entry.url, i),
                    url: entry.url,
                    description:
                        typeof entry.description === "string"
                            ? entry.description
                            : undefined,
                });
            }
        }
        return out;
    }

    private serverId(url: string, index: number): string {
        const safe = url
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return `server-${safe || String(index)}`;
    }

    /**
     * Schema pool. We emit every class and interface declared in the
     * project source files. Only schemas that are actually referenced
     * from at least one operation (in the body schema or in a
     * response schema) are kept, so unrelated service classes do not
     * pollute the documentation.
     */
    private buildComponents(
        semantic: SpectraSemanticModel,
        sourceFiles: readonly ts.SourceFile[],
    ): Components {
        const componentGenerator = new ComponentGenerator();
        const all = componentGenerator.generate(sourceFiles);

        const referenced = this.referencedSchemaIds(semantic);
        const filtered: Record<string, Schema> = {};
        for (const [id, schema] of Object.entries(all)) {
            if (referenced.has(id)) {
                filtered[id] = schema;
            }
        }
        return {
            schemas:
                Object.keys(filtered).length > 0
                    ? (filtered as NamedCollection<Schema>)
                    : (all as NamedCollection<Schema>),
            responses: {},
            parameters: {},
            requestBodies: {},
            headers: {},
            examples: {},
            securitySchemes: {},
        };
    }

    /**
     * Collect every `schemaId` referenced from any operation's
     * request body or response body.
     */
    private referencedSchemaIds(
        semantic: SpectraSemanticModel,
    ): Set<string> {
        const ids = new Set<string>();
        const extractor = new SchemaExtractor();
        for (const op of semantic.operations) {
            for (const p of op.parameters) {
                if (p.decoratorName === "Body") {
                    const id = extractor.schemaId(
                        this.extractClassName(p.type.sourceText),
                    );
                    if (id) ids.add(id);
                }
            }
            const returnType = op.methodNode.type?.getText().trim();
            if (returnType && returnType !== "void") {
                const className = this.unwrapType(returnType);
                const id = extractor.schemaId(className);
                if (id) ids.add(id);
            }
        }
        return ids;
    }

    private extractClassName(sourceText: string): string {
        return this.unwrapType(sourceText);
    }

    private unwrapType(text: string): string {
        // Strip Promise<...>, Array<...>, ...[], etc.
        let inner = text;
        inner = inner.replace(/^Promise<\s*(.*)\s*>$/, "$1");
        inner = inner.replace(/^Array<\s*(.*)\s*>$/, "$1");
        inner = inner.replace(/\[\]$/, "");
        // Take before any generic arguments.
        const cleaned = inner.replace(/<.*$/, "").trim();
        return cleaned;
    }

    private findTsconfigPath(): string | undefined {
        const candidate = path.join(this.projectRoot, "tsconfig.json");
        return existsSync(candidate) ? candidate : undefined;
    }

    private emptyComponents(): Components {
        return {
            schemas: {},
            responses: {},
            parameters: {},
            requestBodies: {},
            headers: {},
            examples: {},
            securitySchemes: {},
        };
    }
}