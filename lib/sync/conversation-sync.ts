import { getClient } from "@/lib/starfish";
import { createConversationEncryptor } from "@/lib/crypto";
import type { ConversationMeta, DayMessages } from "@/lib/types";

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
    return { meta: decrypted as ConversationMeta, hash: result.hash };
  } catch {
    return null;
  }
}

export async function pushConversationMeta(
  conversationId: string,
  conversationKey: string,
  meta: ConversationMeta,
  baseHash?: string,
): Promise<void> {
  const client = getClient();
  const encryptor = createConversationEncryptor(conversationKey, conversationId);
  const encrypted = await encryptor.encrypt(meta);

  const currentHash =
    baseHash ??
    (await client.pull(`/pull/conv/${conversationId}/meta`)).hash;
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
    return decrypted as DayMessages;
  } catch {
    return null;
  }
}
