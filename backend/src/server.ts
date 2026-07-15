import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupInterviewSockets } from './sockets/interview.socket';

const port = process.env.PORT || 4000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Setup Sockets
setupInterviewSockets(io);

httpServer.listen(port, () => {
  console.log(`HireIQ backend running on http://localhost:${port}`);
});
