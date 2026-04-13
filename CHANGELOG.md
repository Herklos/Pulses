# Changelog

## [0.1.0] — 2026-04-13

### Added

- Initial proof-of-concept implementation of Pulses — an E2E encrypted chat app
- **Server** — Cloudflare Workers + R2 backend using `@drakkar.software/starfish-server` v1.14.0
  - 4 collections: `profile`, `user-index`, `conv-meta`, `conv-messages`
  - R2ObjectStore adapter for native Workers R2 binding
  - Bearer-token role resolver (userId = first 16 chars of auth token)
  - CORS + security headers enabled
- **Identity** — passphrase-derived zero-knowledge identity
  - `generatePassphrase()` — 12-word BIP39-style passphrase
  - `deriveCredentials()` — deterministic authToken + userId + encryptionSecret from passphrase
  - No user registration, no email/password, no server-side secrets
- **Encryption** — AES-256-GCM client-side encryption
  - User index encrypted with per-user key (`encryptionSecret + userId`)
  - Conversation documents encrypted with per-conversation key (random 256-bit, shared via invite URL)
  - Server stores opaque `{ _encrypted: "..." }` blobs only
- **Sync** — Starfish pull/push document sync
  - SyncManager for user-index (polling ~10s)
  - SyncManager for active conversation today-messages (polling ~5s)
  - Conflict resolution via `createUnionMerge` with message deduplication by UUID
- **Conversations**
  - Direct messages (DM) and group conversations
  - Invite links encode conversationId + conversationKey as URL-safe base64
  - Deep link handler for `pulses://join?t=...`
- **Chat screen**
  - Per-day message documents (one JSON document per YYYY-MM-DD per conversation)
  - Optimistic local add + debounced push
  - Adaptive polling for incoming messages
  - Date separators in message list
- **UI** — Expo Router + NativeWind v5 (Tailwind v4)
  - iOS, Android, Web targets
  - Indigo/violet brand palette
  - Conversation list, chat screen, member management, profile screen
