import { FastifyInstance } from 'fastify';
import type { SessionManagerInterface } from '../baileys/session.js';

export async function qrRoutes(
  app: FastifyInstance,
  opts: { sessionManager: SessionManagerInterface }
) {
  const { sessionManager } = opts;

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
}
