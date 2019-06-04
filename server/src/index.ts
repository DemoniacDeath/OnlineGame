import {Server} from './Server';
import {listen, Socket} from 'socket.io';

const port = process.env.PORT || 8081;
const io = listen(port, { origins: '*:*' });

io.on('connection', (socket: Socket) => {
  server.connect(socket);
  socket.on('disconnect', () => {
    server.disconnect(socket);
  });
});

const server = new Server();
