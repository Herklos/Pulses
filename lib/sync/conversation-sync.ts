import { getClient } from "@/lib/starfish";
import { createConversationEncryptor } from "@/lib/crypto";
import type { ConversationMeta, ConvMembers, DayMessages } from "@/lib/types";

// ---------------------------------------------------------------------------
// Conv Members — plaintext server-side membership list for the group enricher
// ---------------------------------------------------------------------------

export async function pullConvMembers(
  conversationId: string,
): Promise<{ members: ConvMembers; hash: string } | null> {
  try {
    const client = getClient();
    const result = await client.pull(`/pull/conv/${conversationId}/members`);
    if (!result.data) return null;
    return { members: result.data as unknown as ConvMembers, hash: result.hash };
  } catch {
    return null;
  }
}

export async function pushConvMembers(
  conversationId: string,
  members: ConvMembers,
  baseHash: string | null,
): Promise<void> {
  const client = getClient();
  await client.push(
    `/push/conv/${conversationId}/members`,
    members as unknown as Record<string, unknown>,
    baseHash,
  );
}

// ---------------------------------------------------------------------------
// Conv Meta — encrypted with conversationKey
// ---------------------------------------------------------------------------

export async function pullConversationMeta(
  conversationId: string,
  conversationKey: string,
): Promise<{ meta: ConversationMeta; hash: string } | null> {
  try {
    const client = getClient();
    const result = await client.pull(`/pull/conv/${conversationId}/meta`);
    if (!result.data) return null;

    const encryptor = createConversationEncryptor(conversationKey, conversationId);
    const decrypted = await encryptor.decrypt(result.data);
    return { meta: decrypted as unknown as ConversationMeta, hash: result.hash };
  } catch {
    return null;
  }
}

export async function pushConversationMeta(
  conversationId: string,
  conversationKey: string,
  meta: ConversationMeta,
  baseHash?: string | null,
): Promise<void> {
  const client = getClient();
  const encryptor = createConversationEncryptor(conversationKey, conversationId);
  const encrypted = await encryptor.encrypt(meta as unknown as Record<string, unknown>);

  let currentHash: string | null;
  if (baseHash !== undefined) {
    // Caller provided explicit hash (or null for a known-new document)
    currentHash = baseHash;
  } else {
    // Pull current hash; if doc doesn't exist yet, create new
    try {
      currentHash = (await client.pull(`/pull/conv/${conversationId}/meta`)).hash;
    } catch {
      currentHash = null;
    }
  }

  await client.push(`/push/conv/${conversationId}/meta`, encrypted, currentHash);
}

export async function pullDayMessages(
  conversationId: string,
  conversationKey: string,
  dateKey: string,
): Promise<DayMessages | null> {
  try {
    const client = getClient();
    const result = await client.pull(
      `/pull/conv/${conversationId}/msg/${dateKey}`,
    );
    if (!result.data) return null;

    const encryptor = createConversationEncryptor(conversationKey, conversationId);
    const decrypted = await encryptor.decrypt(result.data);
    return decrypted as unknown as DayMessages;
  } catch {
    return null;
  }
}
