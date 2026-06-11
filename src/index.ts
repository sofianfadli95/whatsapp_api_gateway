import Fastify from 'fastify';
import 'dotenv/config';
import { getSessionManager } from './baileys/session.js';
import { registerInboundHandler } from './baileys/inbound.js';

const app = Fastify({ logger: true });
const sessionManager = getSessionManager(process.env.AUTH_DIR);

sessionManager.onSocketCreated((sock) => {
  registerInboundHandler(sock);
});

await sessionManager.start();

// Routes
app.get('/healthz', async () => ({ status: 'ok' }));

app.get('/qr', async (_, reply) => {
  const state = sessionManager.getConnectionState();
  const qr = sessionManager.getQrDataUrl();

  if (qr) {
    return { qr_data_url: qr };
  }
  if (state === 'connected') {
    return { status: 'connected' };
  }
  reply.status(503);
  return { status: 'initializing' };
});

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server on http://${host}:${port}`);
});
