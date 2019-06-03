import { requestAnimFrame } from "./util";

// =============================================================================
//  The Client.
// =============================================================================
export class Client {
  constructor(canvas, network) {
    this.interpolation_interval = 100.0;

    // Local representation of the entities.
    this.entities = {};
    // Input state.
    this.key_left = false;
    this.key_right = false;
    // Network connection.
    this.network = network;
    this.network.on('state', (message) => {
      this.processServerMessage(message);
    });
    // Unique ID of our entity.
    this.entity_id = network.id;
    // Data needed for reconciliation.
    this.input_sequence_number = 0;
    this.pending_inputs = [];
    // UI.
    this.canvas = canvas;
    // Update rate.
    this.update();
  }
  // Update Client state.
  update() {
    // Process inputs.
    this.processInputs();
    // Entity interpolation
    this.interpolateEntities();
    // Render the World.
    this.renderWorld();
    requestAnimFrame(() => {
      this.update();
    });
  }
  addEntity(entity) {
    this.entities[entity.entity_id] = entity;
  }
  removeEntity(entity_id) {
    delete this.entities[entity_id];
  }

  processServerMessage(message) {
    // World state is a list of entity states.
    for (var i = 0; i < message.length; i++) {
      var state = message[i];
      var entity = this.entities[state.entity_id];
      if (!entity)
        continue;
      if (state.entity_id == this.entity_id) {
        // Received the authoritative position of this client's entity.
        entity.x = state.position;
        // Server Reconciliation. Re-apply all the inputs not yet processed by
        // the server.
        var j = 0;
        while (j < this.pending_inputs.length) {
          var input = this.pending_inputs[j];
          if (input.id <= state.last_processed_input) {
            // Already processed. Its effect is already taken into account into the world update
            // we just got, so we can drop it.
            this.pending_inputs.splice(j, 1);
          }
          else {
            // Not processed by the server yet. Re-apply it.
            entity.applyInput(input);
            j++;
          }
        }
      }
      else {
        // Received the position of an entity other than this client's.
        // Add it to the position buffer.
        var timestamp = +new Date();
        entity.position_buffer.push([timestamp, state.position]);
      }
    }
  }

  // Get inputs and send them to the server. Do client-side prediction.
  processInputs() {
    if (!this.entities[this.entity_id])
      return;
    // Compute delta time since last update.
    var now_ts = +new Date();
    var last_ts = this.last_ts || now_ts;
    var dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;
    // Package client's input.
    var input = {
      eid: this.entity_id,
      dt: dt_sec
    };
    if (this.key_right) {
      input.x = 1;
    }
    else if (this.key_left) {
      input.x = -1;
    }
    else {
      // Nothing interesting happened.
      return;
    }
    input.id = this.input_sequence_number++;
    // Send the input to the server.
    this.network.emit('move', input);
    // Do client-side prediction.
    this.entities[this.entity_id].applyInput(input);
    // Save this input for later reconciliation.
    this.pending_inputs.push(input);
  }

  // Entity interpolation
  interpolateEntities() {
    // Compute render timestamp.
    const now = +new Date();
    const render_timestamp = now - this.interpolation_interval;
    for (let entity_id in this.entities) {
      // No point in interpolating this client's entity.
      if (entity_id == this.entity_id) continue;

      var entity = this.entities[entity_id];
      // Find the two authoritative positions surrounding the rendering timestamp.
      var buffer = entity.position_buffer;
      // Drop older positions.
      while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
        buffer.shift();
      }
      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
        var x0 = buffer[0][1];
        var x1 = buffer[1][1];
        var t0 = buffer[0][0];
        var t1 = buffer[1][0];
        entity.x = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
      }
    }
  }

  // Render all the entities in the given canvas.
  renderWorld() {

    // Clear the canvas.
    this.canvas.width = this.canvas.width;
  
    for (var i in this.entities) {
      var entity = this.entities[i];
  
      // Compute size and position.
      var radius = this.canvas.width / 20.0;
      var x = (entity.x / 10.0) * this.canvas.width;
  
      // Draw the entity.
      var ctx = this.canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(x, this.canvas.height / 2, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "dark" + "green";
      ctx.stroke();
    }
  }
}
