"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =============================================================================
//  An Entity in the world.
// =============================================================================
class Entity {
    constructor(entity_id, x = 0, y = 0, speed = 2) {
        this.entity_id = entity_id;
        this.x = x;
        this.y = y;
        this.speed = speed; // units/s
        this.position_buffer = [];
    }
    // Apply user's input to this entity.
    applyInput(input) {
        this.x += input.x * input.dt * this.speed;
        this.y += input.y * input.dt * this.speed;
    }
    validateInput(input) {
        if (input.x > 0 && this.x >= 10.0)
            return false;
        if (input.x < 0 && this.x <= 0.0)
            return false;
        if (input.y > 0 && this.y >= 10.0)
            return false;
        if (input.y < 0 && this.y <= 0.0)
            return false;
        if (input.dt > 1 / 10) {
            return false;
        }
        return true;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map