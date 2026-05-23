import { Server, Socket } from 'socket.io';
import axios from 'axios';

const aiBase = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

export const setupInterviewSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    socket.on('join-room', ({ room, user, peerId }) => {
      socket.join(room);
      socket.to(room).emit('peer-joined', { user, peerId, socketId: socket.id });
    });

    socket.on('message', ({ room, message }) => {
      io.to(room).emit('message', message);
    });

    socket.on('code-sync', ({ room, code }) => {
      socket.to(room).emit('code-sync', code);
    });

    socket.on('typing', ({ room, user }) => {
      socket.to(room).emit('typing', { user });
    });

    socket.on('ai-moderate', async ({ room, context }) => {
      try {
        const response = await axios.post(`${aiBase}/career/mentor`, {
          message: "Analyze the current coding context and provide a short, professional interview hint or moderation tip.",
          context: `Current code in editor: ${context}`
        });
        
        const hint = response.data.mentorResponse.reply;
        io.to(room).emit('message', { 
          user: 'AI Moderator', 
          text: hint 
        });
      } catch (error) {
        console.error('AI Moderation failed:', error);
      }
    });

    socket.on('disconnect', () => {
      // Handle cleanup if needed
    });
  });
};
