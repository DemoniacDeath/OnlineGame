const { Server } = require("./Server");
const port = process.env.PORT || 8081;
const io = require("socket.io").listen(port, { origins: '*:*' });
io.on('connection', (socket) => {
    server.connect(socket);
    socket.on('disconnect', () => {
        server.disconnect(socket);
    });
});
const server = new Server();
//# sourceMappingURL=index.js.map