export interface EntityPosition {
  timestamp: number;
  position: number;
}
// =============================================================================
//  An Entity in the world.
// =============================================================================
export class Entity {
  entity_id: string;
  x: number;
  speed: number;
  position_buffer: EntityPosition[];
  constructor(entity_id: string, x: number = 0, speed: number = 2) {
    this.entity_id = entity_id;
    this.x = x;
    this.speed = speed; // units/s
    this.position_buffer = [];
  }
  // Apply user's input to this entity.
  applyInput(input: {x: number, dt: number}) {
    this.x += input.x * input.dt * this.speed;
  }
}
