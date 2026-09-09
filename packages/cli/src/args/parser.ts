export type CliCommand =
    | "generate"
    | "help"
    | "version";

export interface GenerateArgs {
    readonly command: "generate";
    readonly verify: boolean;
    readonly json: boolean;
    readonly destination?: string;
    readonly endpointExplicit?: string;
    readonly endpointAuto: boolean;
}

export interface CliArgs {
    readonly command: CliCommand;
    readonly generate?: GenerateArgs;
}