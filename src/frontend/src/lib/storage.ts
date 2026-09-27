import { loadConfig } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";

/**
 * Lazily-created object-storage client. The backend stores file references as
 * plain `FileId` strings (the storage hash), so the frontend uploads bytes here
 * and passes the returned hash to the backend.
 */
let clientPromise: Promise<StorageClient> | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => undefined);
      }
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    })();
  }
  return clientPromise;
}

/** Upload a browser File and return its storage hash (the backend `FileId`). */
export async function uploadFile(file: File): Promise<string> {
  const client = await getStorageClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { hash } = await client.putFile(bytes, undefined, file.type, file.name);
  return hash;
}

/** Resolve a stored `FileId` hash into a displayable direct URL. */
export async function resolveFileUrl(hash: string): Promise<string> {
  const client = await getStorageClient();
  return client.getDirectURL(hash);
}
