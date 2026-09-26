export interface JsonOutput {
    readonly projectRoot: string;
    readonly destination: string;
    readonly bytesWritten: number;
    readonly elapsedMs: number;
    readonly stats: unknown;
    readonly endpoint: string;
    readonly endpointSource: string;
    readonly verification: unknown;
}

export function printJson(
    result: JsonOutput,
): void {
    console.log(
        JSON.stringify(result, null, 2),
    );
}