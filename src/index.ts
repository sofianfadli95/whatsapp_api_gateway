import Fastify from 'fastify';
import 'dotenv/config';

const app = Fastify({ logger: true });

app.get('/healthz', async () => ({ status: 'ok' }));

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server running on http://${host}:${port}`);
});
