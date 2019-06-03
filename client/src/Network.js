// =============================================================================
//  A message queue via network
// =============================================================================
export class Network {
  constructor(socket) {
    this.socket = socket;
    this.id = socket.id;
  }
  emit(name, message) {
    this.socket.emit(name, message);
  }
  on(name, listener) {
    if (!listener) return;

    this.socket.on(name, listener);
  }
}
