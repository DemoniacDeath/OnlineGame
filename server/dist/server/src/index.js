"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("./Server");
const socket_io_1 = require("socket.io");
const port = process.env.PORT || 8081;
const io = socket_io_1.listen(port, { origins: '*:*' });
io.on('connection', (socket) => {
    server.connect(socket);
    socket.on('disconnect', () => {
        server.disconnect(socket);
    });
});
const server = new Server_1.Server();
//# sourceMappingURL=index.js.map