import { Input } from "./Input";

export interface EntityPosition {
  timestamp: number;
  x: number;
  y: number
}
// =============================================================================
//  An Entity in the world.
// =============================================================================
export class Entity {
  entity_id: string;
  x: number;
  y: number;
  speed: number;
  position_buffer: EntityPosition[];
  constructor(entity_id: string, x: number = 0, y: number = 0, speed: number = 2) {
    this.entity_id = entity_id;
    this.x = x;
    this.y = y;
    this.speed = speed; // units/s
    this.position_buffer = [];
  }
  // Apply user's input to this entity.
  applyInput(input: Input) {
    this.x += input.x * input.dt * this.speed;
    this.y += input.y * input.dt * this.speed;
  }
  validateInput(input: Input) {
    if (input.x > 0 && this.x >= 10.0) return false;
    if (input.x < 0 && this.x <= 0.0) return false;
    if (input.y > 0 && this.y >= 10.0) return false;
    if (input.y < 0 && this.y <= 0.0) return false;
    if (input.dt > 1 / 10) {
      return false;
    }
    return true;
  }
}
