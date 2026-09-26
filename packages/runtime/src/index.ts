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
 */
export { SpectraModule } from "./spectra.module.js";
export type { SpectraModuleOptions } from "./spectra.module.js";
export { SpectraController } from "./spectra.controller.js";
export { SpectraStaticFilesService } from "./static-files.service.js";
