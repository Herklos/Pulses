import { getClient } from "@/lib/starfish";
import type { UserProfile } from "@/lib/types";

export async function pullProfile(userId: string): Promise<UserProfile | null> {
  try {
    const client = getClient();
    const result = await client.pull(`/pull/profile/${userId}`);
    if (!result.data) return null;
    return result.data as UserProfile;
  } catch {
    return null;
  }
}

export async function pushProfile(
  userId: string,
  profile: UserProfile,
  baseHash?: string,
): Promise<void> {
  const client = getClient();
  const currentHash =
    baseHash ?? (await client.pull(`/pull/profile/${userId}`)).hash;
  await client.push(`/push/profile/${userId}`, profile, currentHash);
}
