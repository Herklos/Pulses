import { getClient } from "@/lib/starfish";
import type { UserProfile } from "@/lib/types";

export async function pullProfile(userId: string): Promise<UserProfile | null> {
  try {
    const client = getClient();
    const result = await client.pull(`/pull/profile/${userId}`);
    if (!result.data) return null;
    return result.data as unknown as UserProfile;
  } catch {
    return null;
  }
}

export async function pushProfile(
  userId: string,
  profile: UserProfile,
  baseHash?: string | null,
): Promise<void> {
  const client = getClient();

  let currentHash: string | null;
  if (baseHash !== undefined) {
    currentHash = baseHash;
  } else {
    try {
      currentHash = (await client.pull(`/pull/profile/${userId}`)).hash;
    } catch {
      currentHash = null;
    }
  }

  await client.push(`/push/profile/${userId}`, profile as unknown as Record<string, unknown>, currentHash);
}
