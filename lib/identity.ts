import {
  generatePassphrase as _generatePassphrase,
  deriveCredentials,
  buildInviteUrl as _buildInviteUrl,
  parseInviteUrl as _parseInviteUrl,
} from "@drakkar.software/starfish-client/identity";

export interface Credentials {
  passphrase: string;
  userId: string;
  authToken: string;
  encryptionSecret: string;
  groupPublicKey: string;
  groupPrivateKey: string;
}

/** Generate a random 12-word passphrase */
export function generatePassphrase(): string {
  return _generatePassphrase().replace(/ /g, "-");
}

/** Derive deterministic credentials from a passphrase */
export async function deriveAuth(passphrase: string): Promise<Credentials> {
  const { authToken, userId, encryptionSecret, groupPublicKey, groupPrivateKey } =
    await deriveCredentials(passphrase.trim());
  return {
    passphrase: passphrase.trim(),
    userId,
    authToken,
    encryptionSecret,
    groupPublicKey,
    groupPrivateKey,
  };
}

/** Encode conversation invite data into a URL-safe base64 token */
export function buildConvInviteUrl(
  baseUrl: string,
  conversationId: string,
  conversationKey: string,
  name: string,
): string {
  return _buildInviteUrl(baseUrl, { c: conversationId, k: conversationKey, n: name });
}

/** Decode an invite token. Returns null if malformed. */
export function parseConvInviteToken(token: string): {
  conversationId: string;
  conversationKey: string;
  name: string;
} | null {
  const result = _parseInviteUrl(`?t=${token}`);
  if (
    !result ||
    typeof result.c !== "string" ||
    typeof result.k !== "string" ||
    typeof result.n !== "string"
  )
    return null;
  return {
    conversationId: result.c,
    conversationKey: result.k,
    name: result.n,
  };
}
