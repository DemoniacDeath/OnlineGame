const { Network } = require("./Network");
const { Entity } = require("./Entity");
// =============================================================================
//  The Server.
// =============================================================================
class Server {
  constructor() {
    this.update_interval = 100;
    // Connected clients and their entities.
    this.clients = {};
    this.entities = {};
    // Last processed input for each client.
    this.last_processed_input = {};
    // Default update rate.
    setInterval(() => {
      this.processInputs();
      this.sendWorldState();
    }, this.update_interval);
  }
  connect(socket) {
    // Give the Client enough data to identify itself.
    const newClient = socket;

    // Entity ID == Socket.ID (for now)
    const entity_id = newClient.id;

    // Create a new Entity for this Client.
    // Set the initial state of the Entity (e.g. spawn point)
    const newEntity = new Entity(entity_id, ~~(Math.random() * 10));

    this.entities[entity_id] = newEntity;

    // Send new entity to all existing clients
    for (let i in this.clients) {
      let client = this.clients[i];
      client.emit('new', newEntity);
    }

    // Send all entities to new client
    for (let i in this.entities) {
      let entity = this.entities[i];
      newClient.emit('new', entity);
    }

    // Remember the new client
    this.clients[entity_id] = newClient;

    newClient.on('move', (message) => {
      this.processInput(message);
    });
  }
  disconnect(socket) {
    if (!this.entities[socket.id]) return;

    // Cache the entity that is going to be deleted
    let entity = this.entities[socket.id];

    // Delete the entity and the client
    delete this.entities[socket.id];
    delete this.clients[socket.id];
    delete this.last_processed_input[socket.id];

    // Notify all remaining clients of the fact that the entity has left the server
    for (let i in this.clients) {
      let client = this.clients[i];
      client.emit('left', entity);
    }
  }
  // Check whether this input seems to be valid (e.g. "make sense" according
  // to the physical rules of the World)
  validateInput(input) {
    if (input.dt > 1 / 10) {
      return false;
    }
    return true;
  }
  processInputs() {
    // // Process all pending messages from clients.
    // while (true) {
    //   let messages = [];
    //   for (let clientId in this.clients) {
    //     let message = this.clients[clientId].receive();
    //     if (message) {
    //       messages.push(message);
    //     }
    //   }
    //   if (!messages.length) {
    //     break;
    //   }
    //   for (let message of messages) {
    //     this.processInput(message);
    //   }
    // }
  }
  processInput(message) {
    // Update the state of the entity, based on its input.
    // We just ignore inputs that don't look valid; this is what prevents clients from cheating.
    if (this.validateInput(message)) {
      var id = message.eid;
      this.entities[id].applyInput(message);
      this.last_processed_input[id] = message.id;
    }
  }
  // Send the world state to all the connected clients.
  sendWorldState() {
    // Gather the state of the world. In a real app, state could be filtered to avoid leaking data
    // (e.g. position of invisible enemies).
    var world_state = [];
    for (let entity_id in this.entities) {
      let entity = this.entities[entity_id];
      world_state.push({
        entity_id: entity.entity_id,
        position: entity.x,
        last_processed_input: this.last_processed_input[entity_id]
      });
    }
    // Broadcast the state to all the clients.
    for (let entity_id in this.clients) {
      let client = this.clients[entity_id];
      client.emit('state', world_state);
    }
  }
}
exports.Server = Server;
