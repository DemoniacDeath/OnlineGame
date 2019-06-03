import { Client } from "./Client";

import { Network } from "./Network";

import { Entity } from "./Entity";

// =============================================================================
//  Get everything up and running.
// =============================================================================

// Actual network using socket.io
var socket = require('socket.io-client').connect('http://localhost:8081/');
socket.on('connect', () => {
  var client = new Client(document.getElementById("client_canvas"), document.getElementById("client_status"), new Network(socket));
  window.client = client;

  // When the client presses the arrow keys, set the corresponding flag in the client.
  var keyHandler = function (e) {
    e = e || window.event;
    if (e.key == 'd') {
      client.key_right = (e.type == "keydown");
    } else if (e.key == 'a') {
      client.key_left = (e.type == "keydown");
    }
  }
  document.body.onkeydown = keyHandler;
  document.body.onkeyup = keyHandler;

  socket.on('new', (entity) => {
    client.addEntity(new Entity(entity.entity_id, entity.x, entity.speed));
  });
  socket.on('left', (entity) => {
    client.removeEntity(entity);
  });
});
