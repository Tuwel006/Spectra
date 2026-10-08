/**
 * `@spectra/runtime` — NestJS runtime helpers for serving the
 * Spectra docs studio next to your API.
 *
 * <pre>
 * &#64;Module({
 *   imports: [SpectraModule.forRoot({ endpoint: "/spectra" })],
 * })
 * export class AppModule {}
 * </pre>
 *
 * <p>The <code>endpoint</code> you pass to <code>forRoot</code> becomes
 * the URL prefix where both the studio UI and the encoded
 * <code>document.bin</code> are served. So
 * <code>{ endpoint: "/my-docs" }</code> gives you a studio at
 * <code>http://localhost:3000/my-docs</code>.</p>
 */
export { SpectraModule } from "./spectra.module.js";
export type { SpectraModuleOptions } from "./spectra.module.js";
export { makeSpectraController } from "./spectra.controller.js";
export type { SpectraControllerInstance } from "./spectra.controller.js";
export { SpectraStaticFilesService } from "./static-files.service.js";