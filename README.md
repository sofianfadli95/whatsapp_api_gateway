# WhatsApp Gateway

WhatsApp Web gateway built with [Baileys](https://github.com/WhiskeySockets/Baileys) and [Fastify](https://fastify.dev).

## Prerequisites

- Node.js >= 20
- pnpm >= 11

## Install

```bash
pnpm install
```

## Environment

Copy `.env.example` or edit `.env` directly:

```env
PORT=3001
HOST=0.0.0.0
WHATSAPP_GATEWAY_INTERNAL_TOKEN=your-secret-token
WHATSAPP_BACKEND_INBOUND_URL=http://localhost:8080/internal/whatsapp/inbound
AUTH_DIR=./auth_state
```

## Run

```bash
# Dev (hot reload)
pnpm dev

# Build & start
pnpm build
pnpm start
```

## Test

```bash
pnpm test
```

## Lint & Typecheck

```bash
pnpm lint
pnpm tsc --noEmit
```

## Endpoints

| Method | Path       | Description                        |
|--------|------------|------------------------------------|
| GET    | `/healthz` | Health check                       |
| GET    | `/qr`      | QR code data URL for WhatsApp link |

### Linking WhatsApp

1. Start the server: `pnpm dev`
2. Open `http://localhost:3001/qr` in your browser
3. Scan the QR code with WhatsApp on your phone
4. Once connected, the endpoint returns `{ "status": "connected" }`

## Project Structure

```
src/
├── index.ts              # Entrypoint — Fastify server & wiring
├── baileys/
│   ├── connect.ts        # Socket creation & event handling
│   ├── session.ts        # SessionManager singleton
│   └── inbound.ts        # Message classification & text extraction
└── routes/
    └── qr.ts             # QR route (reserved)
```
