import type { Server } from "@spectra/core";

export const mockServers: readonly Server[] = [
  {
    id: "server-production",
    name: "Production",
    url: "https://api.spectra.example.com/v1",
    description:
      "Live production cluster. All traffic is rate-limited per API key and per IP.",
    variables: {
      region: {
        default: "eu-west-1",
        enum: ["eu-west-1", "eu-central-1", "us-east-1", "us-west-2", "ap-southeast-1"],
        description: "Regional edge that terminates the request.",
      },
    },
  },
  {
    id: "server-staging",
    name: "Staging",
    url: "https://staging.api.spectra.example.com/v1",
    description:
      "Mirrors production with synthetic data. Safe for integration testing.",
    variables: {
      region: {
        default: "eu-west-1",
        enum: ["eu-west-1", "us-east-1"],
        description: "Regional staging edge.",
      },
    },
  },
  {
    id: "server-sandbox",
    name: "Sandbox",
    url: "http://localhost:4000/v1",
    description:
      "Local development server. Always returns deterministic fixture data.",
  },
];