// =============================================================================
//  A message queue via network
// =============================================================================
export class Network {
  constructor(socket) {
    this.messages = [];
    this.socket = socket;
    this.socket_id = socket.id;
    this.socket.on('state', (message) => {
      this.messages.push(message);
    });
  }
  // Send a message.
  sendMove(message) {
    if (this.socket) {
      this.socket.emit('move', message);
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
