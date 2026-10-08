import type { Provider } from "@nestjs/common";

/**
 * Injection tokens — strings used by NestJS to identify the providers
 * inside the module's DI container.
 *
 * <p>(Why a constant for the file path? Because we need to use it
 * both in the module definition and the controllers. NestJS providers
 * are identified by symbols or strings, not module paths, so we
 * declare it once here.)</p>
 */
export const SPECTRA_PROJECT_ROOT = "SPECTRA_PROJECT_ROOT";
export const SPECTRA_OPTIONS = "SPECTRA_OPTIONS";
export const SPECTRA_STATIC_FILES_LOADER =
    "SPECTRA_STATIC_FILES_LOADER";

/**
 * Provider factories for the DI tokens.
 *
 * <p>Beginner's note: in NestJS a `Provider` is a recipe — a description
 * of how to create something. Using `useValue` here means "every
 * controller that injects this token gets back this exact value." The
 * value lives as long as the application does.</p>
 */
export const spectraProviders = (
    projectRoot: string,
    endpoint?: string,
): Provider[] => [
    {
        provide: SPECTRA_PROJECT_ROOT,
        useValue: projectRoot,
    },
    ...(typeof endpoint === "string"
        ? [
              {
                  provide: "SPECTRA_ENDPOINT",
                  useValue: endpoint,
              },
          ]
        : []),
];
