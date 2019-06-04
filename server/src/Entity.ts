// =============================================================================
//  An Entity in the world.
// =============================================================================
class Entity {
  constructor(entity_id, x = 0, speed = 2) {
    this.entity_id = entity_id;
    this.x = x;
    this.speed = speed; // units/s
    this.position_buffer = [];
  }
  // Apply user's input to this entity.
  applyInput(input) {
    this.x += input.x * input.dt * this.speed;
  }
}
exports.Entity = Entity;
