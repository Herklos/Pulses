# Pulses

A proof-of-concept **end-to-end encrypted chat app** with direct messages and group conversations. Built with Expo (iOS/Android/Web) and a Cloudflare Workers + R2 backend using the [Starfish sync protocol](https://github.com/Drakkar-Software/satellite).

## Architecture

Pulses uses the **starfish architecture** — a pattern where the server is a dumb encrypted-blob store and all security happens client-side:

```
┌──────────────────────────────────┐     ┌─────────────────────────────┐
│          Expo App (client)        │     │    Cloudflare Worker (server) │
│                                  │     │                             │
│  passphrase → credentials        │     │  R2ObjectStore              │
│  createEncryptor(key, salt)       │────▶│  createSyncRouter(config)   │
│  SyncManager (pull/push/poll)    │     │  4 collections              │
│  Zustand stores                  │     │  CORS + auth                │
└──────────────────────────────────┘     └─────────────────────────────┘
```

### Server Collections

| Collection | Path | Access | Purpose |
|---|---|---|---|
| `profile` | `profile/{identity}` | any user read, self write | Public display name |
| `user-index` | `user-index/{identity}` | self only | Private encrypted conversation list |
| `conv-members` | `conv/{id}/members` | any user read/write | Plaintext member list (userId array) read by the group enricher |
| `conv-meta` | `conv/{id}/meta` | group members only | Encrypted conversation metadata |
| `conv-messages` | `conv/{id}/msg/{date}` | group members only | Encrypted per-day messages |

Access to `conv-meta` and `conv-messages` is enforced by `createGroupRoleEnricher` on the server: a request is granted the `"group-member"` role only if the caller's userId appears in `conv/{id}/members`. Non-members receive a 403 before they ever see an encrypted blob.

> **POC limitation**: `conv-members` has `writeRoles: ["user"]`, so any authenticated user can add themselves to the membership list. A determined user with a valid auth token could therefore access any conversation's encrypted blobs — but they still cannot decrypt them without the conversation key. The enricher is a defense-in-depth measure, not a hard access boundary.

### Encryption

- **User index**: AES-256-GCM with key derived from `encryptionSecret + userId`
- **Conversations**: AES-256-GCM with a random 256-bit key per conversation
- **Key distribution**: Conversation keys are shared via deep-link invite URLs (URL-safe base64)
- **Server-side**: Stores opaque `{ "_encrypted": "base64..." }` blobs only

### Identity

A 12-word passphrase deterministically derives all credentials:
```
passphrase → authToken (Bearer token)
           → userId    (first 16 hex chars of authToken)
           → encryptionSecret (AES key material)
```
No user registration, no email, no server-side password storage. The passphrase is the only credential.

## Project Structure

```
Pulses/
  app/                    # Expo Router screens
    _layout.tsx           # Root layout + auth gate
    login.tsx             # Passphrase creation / login
    join.tsx              # Deep link handler
    new-conversation.tsx  # Create DM or group
    (tabs)/               # Bottom tab navigator
      index.tsx           # Conversation list
      profile.tsx         # Profile + settings (display name, server URL, history days)
    conversation/
      [conversationId].tsx           # Chat screen
      [conversationId]/members.tsx   # Member list + invite
  lib/                    # Core utilities
    identity.ts           # Passphrase + credential derivation
    starfish.ts           # StarfishClient singleton
    crypto.ts             # Encryptor helpers
    invite.ts             # Invite URL encode/decode
    date.ts               # Date key utilities
    sync/                 # Sync managers
      index-sync.ts       # User index SyncManager
      message-sync.ts     # Active conversation SyncManager
      conversation-sync.ts # Conv meta + history (direct pull/push)
      profile-sync.ts     # Profile (direct pull/push)
  store/                  # Zustand state stores
  components/             # Shared UI components
  server/                 # Cloudflare Worker
    index.ts              # Hono app + R2ObjectStore
    starfish-config.ts    # Collection definitions
    wrangler.toml         # R2 bucket binding
```

## Getting Started

### 1. Deploy the server

```bash
cd server
pnpm install
# Create your R2 bucket in the Cloudflare dashboard, then:
pnpm deploy
```

### 2. Run the client

```bash
pnpm install
# Set the server URL:
echo "EXPO_PUBLIC_SYNC_URL=https://pulses-sync.your-subdomain.workers.dev" > .env.local
pnpm start --web
```

Or for mobile:
```bash
pnpm ios
pnpm android
```

### 3. Test E2E chat

1. Open two browser tabs (or devices)
2. Tab A: "Create New Identity" → save passphrase
3. Tab B: "Create New Identity" → different passphrase
4. Tab A: Tap "+" → create a conversation → open it
5. Tab A: Members (👥) → "Share Invite Link" → copy the URL
6. Tab B: Open the invite URL in the browser
7. Both tabs can now send messages that sync via polling

## Development

### Local server setup

```bash
# 1. Create local secrets file (gitignored)
touch server/.dev.vars

# 2. Start the local Starfish server on port 8787
#    R2 is simulated locally — data stored in server/.wrangler/state/
npm run server:dev        # or: cd server && pnpm dev

# 3. In a second terminal, point the app at localhost
echo 'EXPO_PUBLIC_SYNC_URL=http://localhost:8787' > .env.local

# 4. Start Expo dev server
pnpm start
```

> For iOS simulator or physical device, replace `localhost` with your machine's LAN IP (e.g. `http://192.168.1.x:8787`).

```bash
# Health check
curl http://localhost:8787/health
```

## Known POC Limitations

- **Polling only** — no WebSocket push. Messages appear after the next poll interval (~5s while in a conversation, ~10s on the list screen)
- **No key rotation** — removing a member from a group doesn't revoke their access to new messages (the conversation key is fixed)
- **No push notifications** — background message delivery requires a separate notification service
- **History window** — only the last N days of messages are loaded per conversation (configurable in Profile → Message History, default 7 days)
- **Open member registration** — `conv-members` is writable by any authenticated user. Any user who knows a `conversationId` can add themselves and gain server access to the encrypted blobs. Confidentiality still depends entirely on not knowing the conversation key.
