import { requestAnimFrame } from "./util";

import { Entity } from "../../shared/Entity";
import { Input } from "../../shared/Input";
import { State } from "../../shared/State";

// =============================================================================
//  The Client.
// =============================================================================
export class Client {
  interpolation_interval: number;
  entities: { [index:string] : Entity};
  key_left: boolean;
  key_right: boolean;
  key_up: boolean;
  key_down: boolean;
  network: SocketIOClient.Socket;
  entity_id: string;
  input_sequence_number: number;
  pending_inputs: Input[];
  canvas: HTMLCanvasElement;

  private last_ts: number;

  constructor(canvas: HTMLCanvasElement, network: SocketIOClient.Socket) {
    this.interpolation_interval = 100.0;

    // Local representation of the entities.
    this.entities = {};
    // Input state.
    this.key_left = false;
    this.key_right = false;
    this.key_up = false;
    this.key_down = false;
    // Websocket connection.
    this.network = network;
    this.network.on('state', (message: State[]) => {
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
  addEntity(entity: Entity) {
    this.entities[entity.entity_id] = entity;
  }
  removeEntity(entity_id: string) {
    delete this.entities[entity_id];
  }

  processServerMessage(message: State[]) {
    // World state is a list of entity states.
    for (var i = 0; i < message.length; i++) {
      var state = message[i];
      var entity = this.entities[state.entity_id];
      if (!entity)
        continue;
      if (state.entity_id == this.entity_id) {
        // Received the authoritative position of this client's entity.
        entity.x = state.x;
        entity.y = state.y;
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
        entity.position_buffer.push({timestamp, x: state.x, y: state.y});
      }
    }
  }

  // Get inputs and send them to the server. Do client-side prediction.
  processInputs() {
    if (!this.entities[this.entity_id])
      return;
    const entity = this.entities[this.entity_id];
    // Compute delta time since last update.
    const now_ts = +new Date();
    const last_ts = this.last_ts || now_ts;
    const dt_sec = (now_ts - last_ts) / 1000.0;
    this.last_ts = now_ts;
    // Package client's input.
    const input: Input = {
      eid: this.entity_id,
      dt: dt_sec,
      x: 0,
      y: 0,
      id: 0
    };
    if (this.key_right && entity.x < 10.0) {
      input.x = 1;
    }
    else if (this.key_left && entity.x > 0.0) {
      input.x = -1;
    }
    if (this.key_up && entity.y > 0.0) {
      input.y = -1;
    }
    else if (this.key_down && entity.y < 10.0) {
      input.y = 1;
    }
    if (input.x == 0 && input.y == 0) {
      return;
    }
    input.id = this.input_sequence_number++;
    // Send the input to the server.
    this.network.emit('move', input);
    // Do client-side prediction.
    if (entity.validateInput(input)) {
      entity.applyInput(input);
    }
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
      while (buffer.length >= 2 && buffer[1].timestamp <= render_timestamp) {
        buffer.shift();
      }
      // Interpolate between the two surrounding authoritative positions.
      if (buffer.length >= 2 && buffer[0].timestamp <= render_timestamp && render_timestamp <= buffer[1].timestamp) {
        var x0 = buffer[0].x;
        var x1 = buffer[1].x;
        var y0 = buffer[0].y;
        var y1 = buffer[1].y;
        var t0 = buffer[0].timestamp;
        var t1 = buffer[1].timestamp;
        entity.x = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
        entity.y = y0 + (y1 - y0) * (render_timestamp - t0) / (t1 - t0);
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
      var y = (entity.y / 10.0) * this.canvas.height;
  
      // Draw the entity.
      var ctx = this.canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "dark" + "green";
      ctx.stroke();
    }
  }
}
