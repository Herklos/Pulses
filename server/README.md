# Pulses Sync Server

Cloudflare Worker that acts as the encrypted-blob sync backend for the Pulses chat app. It is intentionally **dumb** — it never sees plaintext. All encryption/decryption happens on the client.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| HTTP framework | [Hono](https://hono.dev) |
| Sync protocol | `@drakkar.software/starfish-server` v1.14.0 |
| Storage | Cloudflare R2 |

## Collections

| Name | Storage path | Read | Write | Notes |
|---|---|---|---|---|
| `profile` | `profile/{identity}` | any user | self only | Public plaintext profile |
| `user-index` | `user-index/{identity}` | self only | self only | Encrypted conversation list |
| `conv-meta` | `conv/{conversationId}/meta` | any user | any user | Encrypted conversation metadata |
| `conv-messages` | `conv/{conversationId}/msg/{dateKey}` | any user | any user | Encrypted per-day messages |

All collections use `encryption: "none"` at the server level — client-side AES-256-GCM handles confidentiality.

## Authentication

Requests must include a `Bearer <authToken>` header. The server derives `userId` as the first 16 hex characters of the token. No secrets are verified server-side; access control is enforced by collection `readRoles`/`writeRoles`.

## Environment Variables

| Variable | Description |
|---|---|
| `ENCRYPTION_SECRET` | Server-level secret used by starfish-server internals. **Change before deploying to production.** |

R2 bucket binding is named `BUCKET` (see `wrangler.toml`).

## Development

```bash
pnpm install
pnpm dev        # starts wrangler dev at http://localhost:8787
```

Set `EXPO_PUBLIC_SYNC_URL=http://localhost:8787/v1` in the app's `.env.local` to point the client at the local server.

## Deployment

```bash
pnpm deploy     # wrangler deploy
```

Make sure to set `ENCRYPTION_SECRET` as a Wrangler secret rather than a plain `[vars]` entry in production:

```bash
wrangler secret put ENCRYPTION_SECRET
```

## Project Structure

```
server/
├── index.ts            # Worker entry point — R2ObjectStore + Hono router
├── starfish-config.ts  # Collection definitions (SyncConfig)
├── wrangler.toml       # Cloudflare Worker + R2 binding config
├── package.json
└── tsconfig.json
```
