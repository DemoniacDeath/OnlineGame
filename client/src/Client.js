// =============================================================================
//  The Client.
// =============================================================================
export class Client {
  constructor(canvas, status, network) {
    // Local representation of the entities.
    this.entities = {};
    // Input state.
    this.key_left = false;
    this.key_right = false;
    // Network connection.
    this.network = network;
    // Unique ID of our entity. Assigned by Server on connection.
    this.entity_id = network.socket_id;
    // Data needed for reconciliation.
    this.input_sequence_number = 0;
    this.pending_inputs = [];
    // UI.
    this.canvas = canvas;
    this.status = status;
    // Update rate.
    this.setUpdateRate(50);
  }
  setUpdateRate(hz) {
    this.update_rate = hz;
    clearInterval(this.update_interval);
    this.update_interval = setInterval((function (self) { return function () { self.update(); }; })(this), 1000 / this.update_rate);
  }
  // Update Client state.
  update() {
    // Listen to the server.
    this.processServerMessages();
    if (this.entity_id == null) {
      return; // Not connected yet.
    }
    // Process inputs.
    this.processInputs();
    // Interpolate other entities.
    this.interpolateEntities();
    // Render the World.
    this.renderWorld(this.canvas, this.entities);
  }
  // Render all the entities in the given canvas.
  renderWorld(canvas, entities) {
    // Clear the canvas.
    canvas.width = canvas.width;
  
    for (var i in entities) {
      var entity = entities[i];
  
      // Compute size and position.
      var radius = canvas.height * 0.9 / 2;
      var x = (entity.x / 10.0) * canvas.width;
  
      // Draw the entity.
      var ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(x, canvas.height / 2, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "dark" + "green";
      ctx.stroke();
    }
  }
  addEntity(entity) {
    this.entities[entity.entity_id] = entity;
  }
  removeEntity(entity) {
    delete this.entities[entity.entity_id];
  }
  // Get inputs and send them to the server.
  // If enabled, do client-side prediction.
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
      dt: dt_sec,
      x: 0
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
    this.network.sendMove(input);
    // Do client-side prediction.
    this.entities[this.entity_id].applyInput(input);
    // Save this input for later reconciliation.
    this.pending_inputs.push(input);
  }
  // Process all messages from the server, i.e. world updates.
  // If enabled, do server reconciliation.
  processServerMessages() {
    while (true) {
      var message = this.network.receive();
      if (!message) {
        break;
      }
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
  }
  interpolateEntities() {
    // Compute render timestamp.
    var now = +new Date();
    var render_timestamp = now - (100.0);
    for (var i in this.entities) {
      var entity = this.entities[i];
      // No point in interpolating this client's entity.
      if (entity.entity_id == this.entity_id) {
        continue;
      }
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
}
