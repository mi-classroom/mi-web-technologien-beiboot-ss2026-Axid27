import { currentGyro } from '../stores/gyro.js';

export const plate = {
    x: 0,
    y: 0,
    radius: 150,
    angle: 0
};

export function setupPlate(centerX, centerY, minDimension) {
    plate.x = centerX;
    plate.y = centerY;
    plate.radius = minDimension * 0.48; // Scales to 96% of the available area
}

export function updatePlate() {
    if (currentGyro.alpha !== null && currentGyro.alpha !== undefined) {
        plate.angle = currentGyro.alpha * (Math.PI / 180);
    }
}

export function drawPlate(ctx) {
    ctx.save();
    ctx.translate(plate.x, plate.y);
    ctx.rotate(plate.angle);

    // Plate shadow
    ctx.beginPath();
    ctx.arc(8, 8, plate.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fill();
    ctx.closePath();

    // Plate base
    ctx.beginPath();
    ctx.arc(0, 0, plate.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.closePath();

    // Top indicator mark
    ctx.beginPath();
    ctx.moveTo(0, -plate.radius);
    ctx.lineTo(0, -plate.radius + 20);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    // Inner decorative ring
    ctx.beginPath();
    ctx.arc(0, 0, plate.radius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
}
