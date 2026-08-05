const CLOCK_TARGET = 10.00; // seconds
const CLOCK_WIN_MARGIN = 0.3; 

const CLOCK_ROUNDS = [
    { speedMultiplier: 1.3 }, // round 1 — easy, original pace
    { speedMultiplier: 1.7 }  // round 2 — harder, clock runs noticeably faster
];

let clockState = {
    round: 0,
    startTime: null,
    intervalId: null,
    running: false
};

function startStopTheClockGame(){

    if (clockState.intervalId) {
        clearInterval(clockState.intervalId);
    }

    clockState = {
        round: 0,
        startTime: null,
        intervalId: null,
        running: false
    };

    startClockRound();

}

function startClockRound(){

    clockState.startTime = performance.now();
    clockState.running = true;

    const roundNum = clockState.round + 1;

    document.getElementById("game").innerHTML = `

        <h1>Hit Ten</h1>

        <p class="match-timer">Round ${roundNum} of ${CLOCK_ROUNDS.length}</p>

        <p>Stop the clock as close to <strong>${CLOCK_TARGET.toFixed(2)}s</strong> as you can.</p>

        <div class="clock-display" id="clockDisplay">0.00</div>

        <button onclick="stopTheClock()">
            Stop
        </button>

    `;

    clockState.intervalId = setInterval(updateClockDisplay, 10);

    playSound("tickingClock");

}

function updateClockDisplay(){

    if (!clockState.running) return;

    const config = CLOCK_ROUNDS[clockState.round];
    const elapsed = ((performance.now() - clockState.startTime) / 1000) * config.speedMultiplier;

    const displayEl = document.getElementById("clockDisplay");
    if (displayEl) {
        displayEl.textContent = elapsed.toFixed(2);
    }

}

function stopTheClock(){

    if (!clockState.running) return;

    clockState.running = false;
    clearInterval(clockState.intervalId);
    stopSound("tickingClock");

    const config = CLOCK_ROUNDS[clockState.round];
    const elapsed = ((performance.now() - clockState.startTime) / 1000) * config.speedMultiplier;
    const diff = Math.abs(elapsed - CLOCK_TARGET);
    const isCorrect = diff <= CLOCK_WIN_MARGIN;
    const isExact = elapsed.toFixed(2) === CLOCK_TARGET.toFixed(2);
    const isLastRound = clockState.round === CLOCK_ROUNDS.length - 1;

    document.getElementById("game").innerHTML = `

        <h1>${elapsed.toFixed(2)}s</h1>

        <p>${diff.toFixed(2)}s off target</p>

        ${isExact ? `<p>Exactly 10 seconds! 🎯</p>` : ""}

    `;

    if (!isCorrect) {
        setTimeout(() => finishRound(false), 1200);
        return;
    }

    if (!isLastRound) {
        clockState.round += 1;
        setTimeout(() => startClockRound(), 1200);
        return;
    }

    const heartAmount = isExact ? 3 : 1;
    setTimeout(() => finishRound(true, heartAmount), 1200);

}