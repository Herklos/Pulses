import type { SyncConfig } from "@drakkar.software/starfish-server";

export const config: SyncConfig = {
  version: 1,
  collections: [
    {
      // Public user profiles — readable by any authenticated user, writable only by self
      name: "profile",
      storagePath: "profile/{identity}",
      readRoles: ["user"],
      writeRoles: ["self"],
      encryption: "none",
      maxBodyBytes: 16_384,
      allowedMimeTypes: ["application/json"],
    },
    {
      // Private encrypted conversation index — only the owner can read/write
      name: "user-index",
      storagePath: "user-index/{identity}",
      readRoles: ["self"],
      writeRoles: ["self"],
      encryption: "none",
      maxBodyBytes: 262_144,
      allowedMimeTypes: ["application/json"],
    },
    {
      // Plaintext member list used by createGroupRoleEnricher to gate conv access.
      // Any authenticated user can read (to check membership) and write (to add
      // themselves). POC limitation: admin-only enforcement not implemented — a user
      // could add themselves without an invite. Defense-in-depth only; actual
      // confidentiality is provided by client-side encryption with the conversationKey.
      name: "conv-members",
      storagePath: "conv/{conversationId}/members",
      readRoles: ["user"],
      writeRoles: ["user"],
      encryption: "none",
      maxBodyBytes: 65_536,
      allowedMimeTypes: ["application/json"],
    },
    {
      // Per-conversation metadata (name, members, active date keys) — encrypted client-side.
      // Gated to group members via createGroupRoleEnricher (reads conv-members doc).
      name: "conv-meta",
      storagePath: "conv/{conversationId}/meta",
      readRoles: ["group-member"],
      writeRoles: ["group-member"],
      encryption: "none",
      maxBodyBytes: 65_536,
      allowedMimeTypes: ["application/json"],
    },
    {
      // Per-conversation per-day messages — encrypted client-side.
      // Gated to group members via createGroupRoleEnricher.
      name: "conv-messages",
      storagePath: "conv/{conversationId}/msg/{dateKey}",
      readRoles: ["group-member"],
      writeRoles: ["group-member"],
      encryption: "none",
      maxBodyBytes: 524_288,
      allowedMimeTypes: ["application/json"],
    },
  ],
};
