const MATRIX_GRID_SIZE = 5; // 5x5 = 25 tiles
const MATRIX_SELECT_TIME_LIMIT = 15;

const CANDY_TYPES = [
    { id: "candy1", label: "Candy 1", emoji: "🍬", image: "pictures/candy1.png" },
    { id: "candy2", label: "Candy 2", emoji: "🍭", image: "pictures/candy2.png" },
    { id: "cottonCandy", label: "Cotton Candy", emoji: "☁️", image: "pictures/cottoncandy.png" }
];

CANDY_TYPES.forEach((c) => {
    if (c.image) {
        const img = new Image();
        img.src = c.image;
    }
});

const MATRIX_ROUNDS = [
    { highlightCount: 3, memorizeMs: 4000 },
    { highlightCount: 6, memorizeMs: 5000 },
    { highlightCount: 9, memorizeMs: 5000 }
];

let matrixState = {
    round: 0,
    highlightSet: new Set(),
    candyAt: new Map(),
    foundSet: new Set(),
    phase: "memorize", // memorize | selecting | done
    timeLeft: MATRIX_SELECT_TIME_LIMIT,
    timerId: null,
    memorizeTimeoutId: null
};

function renderCandy(candy){
    return candy.image
        ? `<img src="${candy.image}" class="matrix-candy-img" alt="">`
        : candy.emoji;
}

function startMatrixGame(){

    if (matrixState.timerId) clearInterval(matrixState.timerId);
    if (matrixState.memorizeTimeoutId) clearTimeout(matrixState.memorizeTimeoutId);

    matrixState = {
        round: 0,
        highlightSet: new Set(),
        candyAt: new Map(),
        foundSet: new Set(),
        phase: "memorize",
        timeLeft: MATRIX_SELECT_TIME_LIMIT,
        timerId: null,
        memorizeTimeoutId: null
    };

    startMatrixRound();

    playSound("nostalgia");

}

function startMatrixRound(){

    const config = MATRIX_ROUNDS[matrixState.round];
    const totalTiles = MATRIX_GRID_SIZE * MATRIX_GRID_SIZE;

    const allIndexes = Array.from({ length: totalTiles }, (_, i) => i);
    const shuffled = allIndexes.sort(() => Math.random() - 0.5);
    const chosenIndexes = shuffled.slice(0, config.highlightCount);

    matrixState.highlightSet = new Set(chosenIndexes);
    matrixState.candyAt = new Map(chosenIndexes.map((i) => [i, pickRandom(CANDY_TYPES)]));
    matrixState.foundSet = new Set();
    matrixState.phase = "memorize";
    matrixState.timeLeft = MATRIX_SELECT_TIME_LIMIT;

    renderMatrixGrid(`Round ${matrixState.round + 1} of ${MATRIX_ROUNDS.length} — memorize!`, true);

    matrixState.memorizeTimeoutId = setTimeout(() => {
        matrixState.phase = "selecting";
        renderMatrixGrid(`${matrixState.timeLeft}s left — find the ${config.highlightCount} tiles`, false);
        startMatrixTimer();
    }, config.memorizeMs);

}

function renderMatrixGrid(statusText, showHighlights){

    const totalTiles = MATRIX_GRID_SIZE * MATRIX_GRID_SIZE;

    const tilesHtml = Array.from({ length: totalTiles }, (_, i) => {
        const isHighlighted = showHighlights && matrixState.highlightSet.has(i);
        const isFound = matrixState.foundSet.has(i);
        const cls = isFound ? "found" : "";
        const candy = matrixState.candyAt.get(i);
        const showCandy = isHighlighted || isFound;
        return `
            <div class="matrix-tile ${cls}" data-index="${i}" onclick="handleMatrixTileClick(${i})">
                ${showCandy && candy ? renderCandy(candy) : ""}
            </div>
        `;
    }).join("");

    document.getElementById("game").innerHTML = `

        <h1>Sweet Memory</h1>

        <p class="match-timer" id="matrixStatus">${statusText}</p>

        <div class="matrix-grid">
            ${tilesHtml}
        </div>

    `;

}

function startMatrixTimer(){

    matrixState.timerId = setInterval(() => {

        matrixState.timeLeft -= 1;

        const statusEl = document.getElementById("matrixStatus");
        const config = MATRIX_ROUNDS[matrixState.round];
        if (statusEl) {
            statusEl.textContent = `${matrixState.timeLeft}s left — find the ${config.highlightCount} tiles`;
        }

        if (matrixState.timeLeft <= 0) {
            clearInterval(matrixState.timerId);
            endMatrixGame(false);
        }

    }, 1000);

}

function handleMatrixTileClick(index){

    if (matrixState.phase !== "selecting") return;
    if (matrixState.foundSet.has(index)) return;

    if (!matrixState.highlightSet.has(index)) {

        // wrong tile — flash it red, then end the round as a loss
        const el = document.querySelector(`.matrix-tile[data-index="${index}"]`);
        if (el) el.classList.add("wrong");

        clearInterval(matrixState.timerId);
        setTimeout(() => endMatrixGame(false), 500);
        return;

    }

    matrixState.foundSet.add(index);

    const el = document.querySelector(`.matrix-tile[data-index="${index}"]`);
    if (el) el.classList.add("found");

    if (matrixState.foundSet.size === matrixState.highlightSet.size) {

        clearInterval(matrixState.timerId);

        if (matrixState.round === MATRIX_ROUNDS.length - 1) {
            setTimeout(() => endMatrixGame(true), 400);
            return;
        }

        matrixState.round += 1;
        setTimeout(startMatrixRound, 700);

    }

}

function endMatrixGame(isWin){

    matrixState.phase = "done";

    if (matrixState.timerId) clearInterval(matrixState.timerId);
    if (matrixState.memorizeTimeoutId) clearTimeout(matrixState.memorizeTimeoutId);

    stopSound("nostalgia");

    if (!isWin) {
        revealMatrixSolution();
        setTimeout(() => finishRound(false), RESULT_REVEAL_MS);
        return;
    }

    finishRound(true, 4);

}

function revealMatrixSolution(){

    const totalTiles = MATRIX_GRID_SIZE * MATRIX_GRID_SIZE;

    const tilesHtml = Array.from({ length: totalTiles }, (_, i) => {
        const wasFound = matrixState.foundSet.has(i);
        const isCorrect = matrixState.highlightSet.has(i);
        const cls = wasFound ? "found" : isCorrect ? "reveal" : "";
        const candy = matrixState.candyAt.get(i);
        const showCandy = wasFound || isCorrect;
        return `<div class="matrix-tile ${cls}">${showCandy && candy ? renderCandy(candy) : ""}</div>`;
    }).join("");

    document.getElementById("game").innerHTML = `

        <h1>Sweet Memory</h1>

        <p class="match-timer">Here's where they were</p>

        <div class="matrix-grid">
            ${tilesHtml}
        </div>

    `;

}