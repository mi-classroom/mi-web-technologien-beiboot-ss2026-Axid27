import { writable } from 'svelte/store';

export const gyroStore = writable({ alpha: 0, beta: 0, gamma: 0, active: false });

// For the canvas game loop to read directly without subscription overhead
export const currentGyro = { alpha: null, beta: 0, gamma: 0 };

function handleOrientation(event) {
    currentGyro.alpha = event.alpha;
    currentGyro.beta = event.beta;
    currentGyro.gamma = event.gamma;
    
    // We update the store for the UI. (We can throttle this if performance becomes an issue, but for simple panels it should be okay).
    gyroStore.set({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        active: true
    });
}

export async function requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
                return true;
            }
        } catch (error) {
            console.error('Error requesting gyro permission:', error);
            return false;
        }
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
        return true;
    }
    return false;
}
