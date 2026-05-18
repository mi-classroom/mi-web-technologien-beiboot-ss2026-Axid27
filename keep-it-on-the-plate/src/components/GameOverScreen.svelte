<script>
    export let score = 0;
    export let highscore = 0;
    export let onRetry = () => {};

    $: isNewRecord = score > 0 && score >= highscore;
</script>

<div class="glass-panel">
    <h1>Game Over</h1>
    
    {#if isNewRecord}
        <div class="new-record">New Record!</div>
    {/if}

    <div class="score-display">
        Final Score: <strong>{score}s</strong><br/>
        Highscore: <strong>{highscore}s</strong>
    </div>

    <button on:click={onRetry}>
        Retry
    </button>
</div>

<style>
    .glass-panel {
        animation: dropIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .new-record {
        color: #000;
        font-weight: 800;
        font-size: 1.2em;
        margin-bottom: 1rem;
        animation: pulse 1s infinite alternate;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    @keyframes dropIn {
        from { opacity: 0; transform: scale(0.8) translateY(-30px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes pulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
    }
</style>
