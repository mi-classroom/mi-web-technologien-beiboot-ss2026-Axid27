import { currentGyro } from '../stores/gyro.js';

export const ball = {
    x: 0,
    y: 0,
    radius: 15,
    vx: 0,
    vy: 0,
    color: '#000000'
};

const DAMPING = 0.95;
const SENSITIVITY = 0.05;

export function resetBall(centerX, centerY) {
    ball.x = centerX;
    ball.y = centerY;
    ball.vx = 0;
    ball.vy = 0;
}

export function updateBall() {
    let gamma = currentGyro.gamma || 0;
    let beta = currentGyro.beta || 0;

    gamma = Math.max(-90, Math.min(90, gamma));
    beta = Math.max(-90, Math.min(90, beta));

    ball.vx += gamma * SENSITIVITY;
    ball.vy += beta * SENSITIVITY;

    ball.vx *= DAMPING;
    ball.vy *= DAMPING;

    ball.x += ball.vx;
    ball.y += ball.vy;
}

export function drawBall(ctx) {
    // Shadow
    ctx.beginPath();
    ctx.arc(ball.x + 4, ball.y + 4, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fill();
    ctx.closePath();

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(ball.x - 4, ball.y - 4, ball.radius / 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    ctx.closePath();
}
