import { createEncryptor, type Encryptor } from "@drakkar.software/starfish-client";
import type { Credentials } from "@/lib/identity";

/** Encryptor for the user's private conversation index */
export function createUserIndexEncryptor(creds: Credentials): Encryptor {
  return createEncryptor(creds.encryptionSecret, creds.userId);
}

/** Encryptor for a conversation's meta and message documents */
export function createConversationEncryptor(
  conversationKey: string,
  conversationId: string,
): Encryptor {
  return createEncryptor(conversationKey, conversationId);
}
