<script>
    export let highscore = 0;
    export let onStart = () => {};
</script>

<div class="glass-panel">
    <h1>Keep it on the Plate</h1>
    
    <div class="score-display">
        Highscore: <br/>
        <strong>{highscore}s</strong>
    </div>

    <button on:click={onStart}>
        Tap to Start
    </button>
</div>

<style>
    .glass-panel {
        animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
