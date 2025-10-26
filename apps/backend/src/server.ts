import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app';
import { startRealtime } from './realtime/publisher';

dotenv.config();

const port = Number(process.env.PORT || 3000);
const server = createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'https://your-app.vercel.app',
      'http://localhost:5173' // For local development
    ],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  socket.on('subscribe:dashboard', (employeeId: number) => {
    socket.join(`emp:${employeeId}`);
  });
});

// Start realtime publisher (optimized for client-aware polling)
startRealtime(io);

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://0.0.0.0:${port}`);
});
