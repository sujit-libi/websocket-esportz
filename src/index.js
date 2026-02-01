import express from 'express';
import http from 'http';
import { matchesRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';

const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 8000;

const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.use(securityMiddleware());

app.use('/matches', matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server running at ${baseUrl}`);
  console.log(
    `WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`,
  );
});
