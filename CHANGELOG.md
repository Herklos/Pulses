# Changelog

## [0.4.0] — 2026-04-16

### Changed

- **Starfish upgraded to v1.17.1** — bug-fixes only: TTL expiry was non-functional (always compared against zero instead of stored write timestamp); replica manager no longer crashes on corrupt documents; proxy push no longer leaks internal host/port; config-endpoint and polling errors are now logged instead of silently swallowed; mobile lifecycle flush/pull errors are now logged.
- **`conv-meta` + `conv-messages` gated to group members** — `readRoles`/`writeRoles` changed from `["user"]` to `["group-member"]`. The server now rejects requests from users not listed in the conversation's member document. **Breaking: existing conversations have no `conv-members` document and will be inaccessible after this deploy. Clear the R2 bucket before upgrading.**

### Added

- **`createGroupRoleEnricher`** wired on the server — reads `conv/{conversationId}/members` (a plaintext JSON array of userId strings) and grants the `"group-member"` role to callers whose identity appears in the list. `cacheTtlMs: 0` so membership takes effect immediately on join.
- **`conv-members` collection** — new plaintext collection (`conv/{conversationId}/members`) storing the userId list consumed by the enricher. `readRoles: ["user"]`, `writeRoles: ["user"]` (see POC limitations in README).
- **`pullConvMembers` / `pushConvMembers`** client helpers in `lib/sync/conversation-sync.ts`.
- **Create flow** pushes `conv-members` (with the creator's userId) before pushing `conv-meta`, so the creator has `group-member` access from the start.
- **Join flow** pulls `conv-members`, adds the joiner's userId, pushes it back, then pulls `conv-meta` (now accessible).

## [0.3.0] — 2026-04-15

### Changed

- **Starfish upgraded to v1.17.0** — all three packages (`starfish-client`, `starfish-protocol`, `starfish-server`).
  - `deriveCredentials` now returns `groupPublicKey` + `groupPrivateKey` (X25519 ECDH keys for future group key rotation). Both fields are stored in `AuthState` and returned by `deriveAuth`.
  - Type system is stricter (`Record<string, unknown>` boundaries); all push/pull casts updated. Domain types now carry `[key: string]: unknown` index signatures so they satisfy the Starfish generic constraints.
- **`SyncStatusBadge`** — replaced hand-rolled status logic with `deriveSyncStatus` from the official Zustand binding.

### Added

- **`createMobileLifecycle`** — wired in `_layout.tsx` after the index store is ready. Flushes dirty data when the app goes to background and pulls fresh data when foregrounded. Uses `AppState` + `NetInfo` (dependency injection, no extra deps).
- **`setupCrossTabSync`** — enabled on web only in `index-sync.ts`. Uses `BroadcastChannel` (falls back to `localStorage` events) to keep multiple browser tabs in sync without extra server round-trips.
- **Unread message count** — `useConversationsStore` tracks per-conversation unread counts (`incrementUnread`/`clearUnread`). Badges appear on conversation list items and on the Chats tab icon. Counts reset when a conversation is opened.
- **Message edit & delete** — long-press any own message to edit (inline modal) or delete (soft tombstone via `deleted: true`). Edit shows a pencil icon on the timestamp row. Both actions use the existing `editedAt`/`deleted` fields on `Message` and trigger a debounced push.
- **Pull-to-refresh** on the conversation list — pulls the index store to get the latest conversation list from the server.
- **`KeyboardAvoidingView` in conversation screen** — the message composer no longer hides behind the keyboard on iOS.

### Fixed

- **Yesterday label** — date separator used `new Date(Date.now() - 86400000)` which produces wrong results near midnight in some timezones. Now uses a fixed noon UTC time (`dateKey + "T12:00:00"`) for locale formatting.

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
