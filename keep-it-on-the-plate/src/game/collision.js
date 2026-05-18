import { ball } from './ball.js';
import { plate } from './plate.js';

export function isGameOver() {
    // Check distance between ball center and plate center
    // Note: Since plate translates context, its abstract position is x, y
    // However, we didn't offset the ball context, so ball.x and ball.y are absolute.
    // plate.x and plate.y are also absolute.
    const dx = ball.x - plate.x;
    const dy = ball.y - plate.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Ball falls off if its center passes the edge of the plate
    // Actually, visually it looks better if it falls off when its edge passes the plate edge:
    // distance > plate.radius - ball.radius
    return distance > (plate.radius - ball.radius);
}
