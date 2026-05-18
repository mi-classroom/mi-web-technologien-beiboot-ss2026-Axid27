<script>
    import { onMount } from 'svelte';
    import { requestGyroPermission } from './stores/gyro.js';
    import { initGame, startGameLoop, stopGameLoop } from './game/loop.js';
    
    import StartScreen from './components/StartScreen.svelte';
    import GameOverScreen from './components/GameOverScreen.svelte';
    import GyroPanel from './components/GyroPanel.svelte';
    import './app.css';

    let gameState = 'START';
    let highscore = 0;
    let score = 0;
    let timerInterval;

    let canvasContainer;
    let canvas;

    onMount(() => {
        const saved = localStorage.getItem('plate_highscore');
        if (saved) highscore = parseInt(saved, 10);

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });

    function handleResize() {
        if (canvas && canvasContainer) {
            canvas.width = canvasContainer.clientWidth;
            canvas.height = canvasContainer.clientHeight;
            
            if (gameState === 'PLAYING') {
                initGame(canvas);
            }
        }
    }

    async function startGame() {
        const granted = await requestGyroPermission();
        
        score = 0;
        gameState = 'PLAYING';
        
        setTimeout(() => {
            handleResize();
            if (canvas) {
                initGame(canvas);
                
                clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    score += 1;
                }, 1000);

                startGameLoop(handleGameOver);
            }
        }, 0);
    }

    function handleGameOver() {
        gameState = 'GAME OVER';
        clearInterval(timerInterval);

        if (score > highscore) {
            highscore = score;
            localStorage.setItem('plate_highscore', highscore.toString());
        }
    }
</script>

<main class="game-wrapper">
    {#if gameState === 'START'}
        <div class="screen-container">
            <StartScreen {highscore} onStart={startGame} />
        </div>
    {:else if gameState === 'GAME OVER'}
        <div class="screen-container">
            <GameOverScreen {score} {highscore} onRetry={startGame} />
        </div>
    {/if}

    {#if gameState === 'PLAYING'}
        <div class="hud">
            <div class="hud-item timer">Score: {score}s</div>
            <div class="hud-item highscore">Best: {highscore}s</div>
        </div>
        
        <div class="canvas-container" bind:this={canvasContainer}>
            <canvas bind:this={canvas}></canvas>
        </div>
        
        <div class="panel-container">
            <GyroPanel />
        </div>
    {/if}
</main>

<style>
    .game-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: #fff;
    }

    .screen-container {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .hud {
        display: flex;
        justify-content: space-around;
        padding: 1rem 0;
        font-size: 1.2rem;
        font-weight: 800;
        color: #000;
        border-bottom: 2px solid #000;
        flex-shrink: 0;
    }

    .canvas-container {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    canvas {
        display: block;
    }

    .panel-container {
        flex-shrink: 0;
        padding: 1rem 1rem 0 1rem;
        border-top: 2px solid #000;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #fff;
    }
</style>
