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
      // Per-conversation metadata (name, members, active date keys) — encrypted client-side
      // Any authenticated user can read/write; only key holders can decrypt
      name: "conv-meta",
      storagePath: "conv/{conversationId}/meta",
      readRoles: ["user"],
      writeRoles: ["user"],
      encryption: "none",
      maxBodyBytes: 65_536,
      allowedMimeTypes: ["application/json"],
    },
    {
      // Per-conversation per-day messages — encrypted client-side
      // storagePath uses two dynamic params: conversationId and dateKey (YYYY-MM-DD)
      name: "conv-messages",
      storagePath: "conv/{conversationId}/msg/{dateKey}",
      readRoles: ["user"],
      writeRoles: ["user"],
      encryption: "none",
      maxBodyBytes: 524_288,
      allowedMimeTypes: ["application/json"],
    },
  ],
};
