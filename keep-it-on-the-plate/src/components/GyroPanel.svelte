<script>
    import { gyroStore } from '../stores/gyro.js';

    $: beta = $gyroStore.beta || 0;
    $: gamma = $gyroStore.gamma || 0;
    $: alpha = $gyroStore.alpha || 0;

    $: visualBeta = Math.max(-90, Math.min(90, beta));
    $: visualGamma = Math.max(-90, Math.min(90, gamma));

    $: bubbleX = visualGamma / 90;
    $: bubbleY = visualBeta / 90;
</script>

<div class="gyro-panel">
    <div class="values">
        <div class="value-item"><span>pitch</span> <strong>{beta.toFixed(1)}°</strong></div>
        <div class="value-item"><span>roll</span> <strong>{gamma.toFixed(1)}°</strong></div>
        <div class="value-item"><span>yaw</span> <strong>{alpha.toFixed(1)}°</strong></div>
    </div>

    <div class="indicators">
        <div class="bubble-level">
            <div class="bubble" style="transform: translate(calc({bubbleX} * 40px - 50%), calc({bubbleY} * 40px - 50%))"></div>
            <div class="crosshair-h"></div>
            <div class="crosshair-v"></div>
            <div class="center-ring"></div>
        </div>
        
        <div class="bars">
            <div class="bar-container horizontal">
                <div class="bar-fill" style="width: 50%; left: 50%; transform: translateX({visualGamma > 0 ? 0 : '-100%'}) scaleX({Math.abs(visualGamma) / 90}); transform-origin: {visualGamma > 0 ? 'left' : 'right'};"></div>
                <div class="bar-center"></div>
            </div>
            
            <div class="bar-container vertical">
                <div class="bar-fill" style="height: 50%; top: 50%; transform: translateY({visualBeta > 0 ? 0 : '-100%'}) scaleY({Math.abs(visualBeta) / 90}); transform-origin: {visualBeta > 0 ? 'top' : 'bottom'};"></div>
                <div class="bar-center"></div>
            </div>
        </div>
    </div>
</div>

<style>
    .gyro-panel {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .values {
        display: flex;
        justify-content: space-between;
        font-family: monospace;
        font-size: 0.9em;
    }

    .value-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .value-item span {
        color: #555;
        font-size: 0.8em;
        text-transform: uppercase;
        font-weight: 600;
    }

    .value-item strong {
        color: #000;
        font-size: 1.2em;
    }

    .indicators {
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding-top: 0.5rem;
    }

    .bubble-level {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px solid #000;
        background: #f0f0f0;
        overflow: hidden;
    }

    .bubble {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        background: #000;
        border-radius: 50%;
        transition: transform 0.1s linear;
    }

    .crosshair-h {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(0,0,0,0.2);
    }

    .crosshair-v {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        background: rgba(0,0,0,0.2);
    }

    .center-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.3);
    }

    .bars {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .bar-container {
        position: relative;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #ccc;
    }

    .bar-container.horizontal {
        width: 80px;
        height: 12px;
    }

    .bar-container.vertical {
        width: 12px;
        height: 80px;
    }

    .bar-fill {
        position: absolute;
        background: #000;
        transition: transform 0.1s linear;
    }

    .horizontal .bar-fill {
        height: 100%;
    }

    .vertical .bar-fill {
        width: 100%;
    }

    .bar-center {
        position: absolute;
        background: #fff;
    }

    .horizontal .bar-center {
        width: 2px;
        height: 100%;
        left: 50%;
        transform: translateX(-50%);
    }

    .vertical .bar-center {
        height: 2px;
        width: 100%;
        top: 50%;
        transform: translateY(-50%);
    }
</style>
