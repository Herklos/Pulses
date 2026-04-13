# Pulses — CLAUDE.md

## Project Overview

Pulses is a proof-of-concept E2E encrypted chat application:
- **Client**: Expo SDK 55 (React Native 0.83, React 19.2) using Expo Router + NativeWind v5 + Zustand v5
- **Server**: Cloudflare Workers + R2 via `@drakkar.software/starfish-server` v1.14.0
- **Protocol**: `@drakkar.software/starfish-client` v1.14.0 — pull/push document sync with conflict resolution

## Architecture

The "starfish architecture" pattern:
1. Server is a **dumb encrypted-blob store** — never sees plaintext
2. All encryption is **client-side** using `createEncryptor(secret, salt)` (AES-256-GCM)
3. Identity is **passphrase-derived** — `deriveCredentials(passphrase)` → authToken + userId + encryptionSecret
4. Data is structured as **collections** of JSON documents with hash-based optimistic concurrency

## Key Files

| File | Purpose |
|---|---|
| `server/starfish-config.ts` | 4 server collections (profile, user-index, conv-meta, conv-messages) |
| `server/index.ts` | Cloudflare Worker entry: R2ObjectStore + Hono router |
| `lib/types.ts` | All TypeScript interfaces |
| `lib/identity.ts` | Passphrase / credential derivation wrappers |
| `lib/crypto.ts` | `createEncryptor` helpers per collection type |
| `lib/starfish.ts` | StarfishClient singleton |
| `lib/sync/index-sync.ts` | User-index SyncManager (always polling) |
| `lib/sync/message-sync.ts` | Active conversation SyncManager (polling while chat open) |
| `lib/sync/conversation-sync.ts` | Direct pull/push for conv-meta and historical messages |
| `store/useAuthStore.ts` | Identity, credentials, login/logout |
| `store/useConversationsStore.ts` | Conversation index (mirror of user-index document) |
| `store/useMessagesStore.ts` | Active conversation messages |

## Encryption Scheme

```
user-index:      createEncryptor(encryptionSecret, userId)
conv-meta:       createEncryptor(conversationKey, conversationId)
conv-messages:   createEncryptor(conversationKey, conversationId)
profile:         plaintext (no encryption)
```

Conversation keys are random 256-bit hex strings generated at creation time and shared via deep-link invite URLs (URL-safe base64 encoded with `buildInviteUrl` / `parseConvInviteToken`).

## Sync Pattern

- **1 StarfishClient** per session (created on login)
- **1 SyncManager** for user-index (polling every ~10s, always active)
- **1 SyncManager** for active conversation today-messages (polling every ~5s, only while chat is open)
- **Direct pull/push** for profiles, conv-meta, historical days (on-demand)
- Conflict resolution: `createUnionMerge({ timestampKey: "timestamp" })` for messages — deduplicates by `message.id`

## Coding Conventions

- TypeScript strict mode
- Zustand v5 stores with `create<State & Actions>`
- NativeWind v5 + Tailwind v4 for styling (use `className` prop, not `StyleSheet`)
- `@/` path alias for project root
- Server files excluded from root `tsconfig.json` (separate `server/tsconfig.json`)
- No `StyleSheet.create()` — use NativeWind className everywhere
- Components use `View`/`Text` from `react-native` (not react-native-css/components, except for web-specific cases)

## Running Locally

```bash
# App
pnpm install
pnpm start --web    # or: pnpm ios / pnpm android

# Server
cd server
pnpm install
pnpm dev            # localhost:8787
```

Set `EXPO_PUBLIC_SYNC_URL=http://localhost:8787/v1` in `.env.local` for local dev.

## Adding Features

### New collection
1. Add to `server/starfish-config.ts`
2. Add direct pull/push helpers in `lib/sync/`
3. Add TypeScript interfaces in `lib/types.ts`

### New screen
- Add file under `app/` following Expo Router file-based routing
- Use `SafeAreaView` at the root, `className` for all styling

### Modifying sync behavior
- `lib/sync/index-sync.ts` — user's conversation list
- `lib/sync/message-sync.ts` — active conversation messages  
- Both use `createDebouncedSync` for write debouncing and `startAdaptivePolling` for reads

## Starfish API Reference (v1.14.0)

```ts
// Client
new StarfishClient({ baseUrl, auth, fetch })
client.pull(path) → { data, hash, timestamp }
client.push(path, data, baseHash) → { hash, timestamp }

// Sync manager
new SyncManager({ client, pullPath, pushPath, encryptor?, onConflict?, ... })
sync.pull() / sync.push(data) / sync.update(fn)
sync.startAdaptivePolling({ intervalMs, onUpdate })

// Encryptor
createEncryptor(secret, salt) → { encrypt(data), decrypt(wrapper) }

// Zustand binding
createStarfishStore({ name, syncManager, onRemoteUpdate }) → StoreApi<StarfishStore>
createDebouncedSync(store, { delayMs, serialize }) → { notify, cancel }

// Identity
generatePassphrase() → string
deriveCredentials(passphrase) → { authToken, userId, encryptionSecret }
buildInviteUrl(baseUrl, params) → url string
parseInviteUrl(url) → params | null
```
