export function printHelp(): void {
    console.log(`
Spectra — API Documentation Generator

Usage:
  spectra generate [options]

Commands:
  generate                  Generate API documentation

Options:
  --endpoint <path>         Set documentation endpoint
  --endpoint                Auto-generate endpoint
  --out, -o <path>          Override document output
  --no-verify               Skip document verification
  --json                    Print result as JSON
  --help, -h                Show this help

Examples:

  spectra generate

  spectra generate --endpoint /api-docs

  spectra generate --endpoint

  spectra generate --no-verify

  spectra generate --json
`);
}