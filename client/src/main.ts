import { Client } from "./Client";

import { Entity } from "../../shared/Entity";
import { emitKeypressEvents } from "readline";

export function main() {
  // =============================================================================
  //  Get everything up and running.
  // =============================================================================

  // Actual network using socket.io
  var socket = require('socket.io-client').connect('http://localhost:8081/');
  socket.on('connect', () => {
    const gameCanvas = document.getElementById('game');
    if (!(gameCanvas instanceof HTMLCanvasElement)) return;

    const setCanvasSize = function(canvas: HTMLCanvasElement){
      var style = window.getComputedStyle(canvas);
      canvas.width = ~~style.width.replace('px', '');
      canvas.height = ~~style.height.replace('px', '');
    };

    window.addEventListener("resize", function(){
      setCanvasSize(gameCanvas);
    });

    setCanvasSize(gameCanvas);

    var client = new Client(gameCanvas, socket);

    //@ts-ignore
    window.client = client;

    // When the client presses the a/d keys, set the corresponding flag in the client.
    var keyHandler = function (e: KeyboardEvent) {
      switch (e.key) {
      case 'd':
        client.key_right = (e.type == "keydown");
        break;
      case 'a':
        client.key_left = (e.type == "keydown");
        break;
      case 'w':
        client.key_up = (e.type == "keydown");
        break;
      case 's':
        client.key_down = (e.type == "keydown");
        break;
      }
    }
    document.body.onkeydown = keyHandler;
    document.body.onkeyup = keyHandler;

    socket.on('new', (entity: {entity_id: string, x: number, y: number, speed: number}) => {
      client.addEntity(new Entity(entity.entity_id, entity.x, entity.y, entity.speed));
    });
    socket.on('left', (entity: {entity_id: string}) => {
      client.removeEntity(entity.entity_id);
    });
  });
}