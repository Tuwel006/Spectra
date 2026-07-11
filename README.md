# Spectra

Spectra is an open-source API documentation platform focused on automation, developer experience, and maintainability.

Unlike traditional documentation tools that require developers to manually maintain decorators or OpenAPI specifications, Spectra is designed around a simple principle:

> Source code is the single source of truth.

The long-term vision is to generate high-quality API documentation directly from application source code with little to no manual configuration while remaining extensible through multiple metadata providers.

## Vision

Modern backend applications evolve rapidly, but API documentation often becomes outdated because it relies on manual maintenance.

Spectra aims to eliminate this problem by analyzing application code, extracting meaningful metadata, and presenting it through a modern documentation experience.

The project is being designed with long-term extensibility in mind so that multiple providers—such as AST analysis, runtime metadata, and OpenAPI imports—can all produce a common documentation model consumed by the user interface.

## Project Status

Spectra is currently under active development.

At this stage, the repository focuses on establishing a solid architectural foundation before implementing production features.

## Repository Structure

```text
apps/
  docs/           Official documentation website
  studio/         Main Spectra application
  example-api/    Sample NestJS application used for development

packages/
  core/               Shared domain and documentation model
  provider-ast/       TypeScript AST provider
  provider-runtime/   Runtime metadata provider (planned)
  provider-openapi/   OpenAPI provider (planned)
  ui/                 Shared UI components
  cli/                Command-line interface
  nestjs/             NestJS integration
  shared/             Shared utilities and types
  config/             Shared tooling configuration

docs/                 Internal architecture documentation
```

## Development Philosophy

Spectra is built around a few core principles:

* Source code is the single source of truth.
* Convention over configuration.
* Minimal developer setup.
* Extensible provider architecture.
* Clean separation between parsing, processing, and presentation.
* Long-term maintainability over short-term convenience.

## Planned Architecture

```text
NestJS Application
        │
        ▼
Provider (AST / Runtime / OpenAPI)
        │
        ▼
Documentation Model
        │
        ▼
Core Engine
        │
        ▼
Studio
```

Each provider is responsible for collecting metadata from a different source while producing the same documentation model. This allows the Studio application to remain independent of how the metadata was generated.

## Roadmap

The project will be developed incrementally.

1. Repository foundation
2. Core documentation model
3. AST provider
4. Live documentation generation
5. Studio interface
6. CLI
7. Plugin system
8. Additional providers

## Contributing

The project is in its early stages and the architecture is expected to evolve as implementation progresses.

Contributions, discussions, and architectural feedback will be welcome once the initial foundation is complete.

## License

This project is licensed under the MIT License.
