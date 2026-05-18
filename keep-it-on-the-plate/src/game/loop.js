import { resetBall, updateBall, drawBall } from './ball.js';
import { setupPlate, updatePlate, drawPlate } from './plate.js';
import { isGameOver } from './collision.js';

let animationFrameId;
let isRunning = false;
let ctx;
let canvasWidth;
let canvasHeight;

export function initGame(canvas) {
    ctx = canvas.getContext('2d');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    
    const minDim = Math.min(canvasWidth, canvasHeight);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2; // Exact center of canvas

    setupPlate(centerX, centerY, minDim);
    resetBall(centerX, centerY);
}

export function startGameLoop(onGameOver) {
    if (isRunning) return;
    isRunning = true;

    function loop() {
        if (!isRunning) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Update physics & input
        updatePlate();
        updateBall();

        // Draw everything
        drawPlate(ctx);
        drawBall(ctx);

        // Check for Game Over
        if (isGameOver()) {
            stopGameLoop();
            if (onGameOver) onGameOver();
            return;
        }

        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}

export function stopGameLoop() {
    isRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}
