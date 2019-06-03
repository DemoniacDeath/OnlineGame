// =============================================================================
//  A message queue via network
// =============================================================================
export class Network {
  constructor(socket) {
    this.buffers = {
      state: []
    };
    this.listener_intervals = {
      state: null
    };
    this.socket = socket;
    this.socket_id = socket.id;
    this.stats = {
      length: 0
    };
  }
  // Send a message.
  sendMove(message) {
    this.socket.emit('move', message);
  }
  registerStateBufferedListener(listener, interval) {
    this.registerBufferedListener(listener, interval, 'state');
  }
  registerStateListener(listener) {
    this.registerListener(listener, 'state');
  }
  registerListener(listener, name) {
    this.socket.on(name, listener);
  }
  registerBufferedListener(listener, interval, name) {
    if (!listener) return;

    this.socket.on(name, (message) => {
      this.buffers[name].push(message);
    });
    clearInterval(this.listener_intervals[name]);
    this.listener_intervals[name] = setInterval(() => {
      while (true) {
        const message = this.buffers[name].shift();
        if (!message) break;
        listener(message);
      }
    }, interval);
  }
}
