import {
  StarfishClient,
} from "@drakkar.software/starfish-client";
import { createResilientFetch } from "@drakkar.software/starfish-client/fetch";

let client: StarfishClient | null = null;

export function initStarfish(serverUrl: string, authToken: string): StarfishClient {
  const { fetch: resilientFetch } = createResilientFetch(
    { maxRetries: 3, initialDelayMs: 500 },
    { threshold: 5, cooldownMs: 30_000 },
  );

  client = new StarfishClient({
    baseUrl: serverUrl,
    auth: async () => ({ Authorization: `Bearer ${authToken}` }),
    fetch: resilientFetch,
  });

  return client;
}

export function getClient(): StarfishClient {
  if (!client) throw new Error("Starfish client not initialized");
  return client;
}

export function teardownStarfish(): void {
  client = null;
}
