// =============================================================================
//  A message queue via network
// =============================================================================
class Network {
    constructor(socket) {
        this.messages = [];
        this.socket = socket;
        this.socket_id = socket.id;
        this.socket.on('move', (message) => {
            this.messages.push(message);
        });
    }
    // Send a message.
    sendState(message) {
        if (this.socket) {
            this.socket.emit('state', message);
        }
    }
    sendNew(message) {
        if (this.socket) {
            this.socket.emit('new', message);
        }
    }
    sendLeft(message) {
        if (this.socket) {
            this.socket.emit('left', message);
        }
    }
    // Returns a received message, or undefined if there are no messages available yet.
    receive() {
        if (this.messages.length > 0) {
            var message = this.messages.splice(0, 1).pop();
            return message;
        }
    }
}
exports.Network = Network;
