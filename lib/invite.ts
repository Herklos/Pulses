import * as Linking from "expo-linking";
import { buildConvInviteUrl, parseConvInviteToken } from "@/lib/identity";

/** Build a deep link invite URL for a conversation */
export function buildInviteUrl(
  conversationId: string,
  conversationKey: string,
  name: string,
): string {
  const baseUrl = Linking.createURL("join");
  return buildConvInviteUrl(baseUrl, conversationId, conversationKey, name);
}

/** Extract invite params from a deep link URL. Returns null if not an invite link. */
export function parseInviteUrl(
  url: string,
): { conversationId: string; conversationKey: string; name: string } | null {
  // Extract the token param from the URL
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get("t");
    if (!token) return null;
    return parseConvInviteToken(token);
  } catch {
    return null;
  }
}
