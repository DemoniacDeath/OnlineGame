const { Network } = require("./Network");
const { Entity } = require("./Entity");
// =============================================================================
//  The Server.
// =============================================================================
class Server {
    constructor() {
        // Connected clients and their entities.
        this.clients = {};
        this.entities = {};
        // Last processed input for each client.
        this.last_processed_input = {};
        // Default update rate.
        this.setUpdateRate(10);
    }
    connect(socket) {
        // Give the Client enough data to identify itself.
        var entity_id = socket.id;
        this.clients[entity_id] = new Network(socket);
        // Create a new Entity for this Client.
        var entity = new Entity(entity_id, ~~(Math.random() * 10));
        this.entities[entity_id] = entity;
        // Set the initial state of the Entity (e.g. spawn point)
        for (let i in this.entities) {
            let entity = this.entities[i];
            this.clients[entity_id].sendNew(entity);
        }
        for (let i in this.clients) {
            if (i == entity_id)
                continue;
            let client = this.clients[i];
            client.sendNew(entity);
        }
    }
    disconnect(socket) {
        if (this.entities[socket.id]) {
            let entity = this.entities[socket.id];
            delete this.entities[socket.id];
            delete this.clients[socket.id];
            for (let i in this.clients) {
                let client = this.clients[i];
                client.sendLeft(entity);
            }
        }
    }
    setUpdateRate(hz) {
        this.update_rate = hz;
        clearInterval(this.update_interval);
        this.update_interval = setInterval((function (self) {
            return function () {
                self.update();
            };
        })(this), 1000 / this.update_rate);
    }
    update() {
        this.processInputs();
        this.sendWorldState();
    }
    // Check whether this input seems to be valid (e.g. "make sense" according
    // to the physical rules of the World)
    validateInput(input) {
        if (input.dt > 1 / 40) {
            return false;
        }
        return true;
    }
    processInputs() {
        // Process all pending messages from clients.
        while (true) {
            let messages = [];
            for (let clientId in this.clients) {
                let message = this.clients[clientId].receive();
                if (message) {
                    messages.push(message);
                }
            }
            if (!messages.length) {
                break;
            }
            for (let message of messages) {
                // Update the state of the entity, based on its input.
                // We just ignore inputs that don't look valid; this is what prevents clients from cheating.
                if (this.validateInput(message)) {
                    var id = message.eid;
                    this.entities[id].applyInput(message);
                    this.last_processed_input[id] = message.id;
                }
            }
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
            client.sendState(world_state);
        }
    }
}
exports.Server = Server;
