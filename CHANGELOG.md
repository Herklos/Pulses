# Changelog

## [0.2.0] — 2026-04-14

### Fixed

- **`startAdaptivePolling` crash** — was called as a method on `SyncManager` (which has no such method). Both `index-sync.ts` and `message-sync.ts` now import and call it as the standalone function it is. The companion `stopAdaptivePolling` on teardown was also a no-op; polling intervals now properly stop when switching conversations or logging out.
- **Encryption silently disabled** — `SyncManager` only reads `encryptionSecret`/`encryptionSalt` string options; an `encryptor` object key is silently ignored. Both sync managers now pass the correct options, so user-index and conversation message documents are actually encrypted at rest. **Note: existing unencrypted server data will not be readable after this fix — clear R2 bucket before upgrading.**
- **"Create conversation" always failed** — `pushConversationMeta` (and `pushProfile`) pulled the current document hash before pushing. For a brand-new document the server returns 404 → `StarfishHttpError` → "Failed to create". Both functions now catch the 404 and fall back to `null` as `baseHash` (the correct value for a first push per the StarfishClient API).

### Added

- **Message history across days** — the chat screen now loads messages from all past days tracked in `activeDateKeys` when a conversation is opened. Only days within the configurable history window are fetched; already-loaded date keys are skipped on re-entry.
- **`mergeMessages` store action** — upserts messages by `id` (incoming version wins, enabling future edit/delete support) instead of replacing all messages on every poll. Prevents today's polling from erasing history pulled from older day documents.
- **History Days setting** — Profile tab has a new "Message History" control. Users can set how many days of history to load per conversation (default: 7, persisted, range: 1–365). Changing the setting re-opens the current conversation with the new window.

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
