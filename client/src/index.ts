import { main } from './main';
import { Engine, Render, World, Bodies } from "matter-js"

// main();

const gameCanvas = document.getElementById('game');
if (!(gameCanvas instanceof HTMLCanvasElement)) throw("#game is not a canvas");

const setCanvasSize = function(canvas: HTMLCanvasElement){
  var style = window.getComputedStyle(canvas);
  canvas.width = ~~style.width.replace('px', '');
  canvas.height = ~~style.height.replace('px', '');
};

window.addEventListener("resize", function(){
  setCanvasSize(gameCanvas);
});

setCanvasSize(gameCanvas);

const engine = Engine.create();

const render = Render.create({
  canvas: gameCanvas,
  engine: engine
});

const boxA = Bodies.rectangle(400, 200, 80, 80);
const boxB = Bodies.rectangle(450, 50, 80, 80);
const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

World.add(engine.world, [boxA, boxB, ground]);

Engine.run(engine);

Render.run(render);
