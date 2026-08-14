const COLOR_DODGE_ROUNDS = 8;
const COLOR_DODGE_WIN_THRESHOLD = 6; // Need 6 out of 8 correct to win
const COLOR_DODGE_TIME_LIMIT = 5; // seconds per round

const COLOR_DODGE_PALETTE = [
    { name: "Red", hex: "#d02d2d" },
    { name: "Blue", hex: "#3498db" },
    { name: "Green", hex: "#48ba78" },
    { name: "Pink", hex: "#e4759a" },
    { name: "Purple", hex: "#9b59b6" },
    { name: "Orange", hex: "#e6944c" }
];

let colorDodgeState = {
    round: 0,
    correctCount: 0,
    targetWord: null, // the color the word SAYS
    inkColor: null,   // the (different) color the word is PRINTED in
    askForInkColor: false, // this round's rule — true on even rounds
    timeLeft: COLOR_DODGE_TIME_LIMIT,
    timerId: null,
    awaitingClick: false
};

function startColorDodgeGame(){

    if (colorDodgeState.timerId) clearInterval(colorDodgeState.timerId);

    colorDodgeState = {
        round: 0,
        correctCount: 0,
        targetWord: null,
        inkColor: null,
        askForInkColor: false,
        timeLeft: COLOR_DODGE_TIME_LIMIT,
        timerId: null,
        awaitingClick: false
    };

    nextColorDodgeRound();

    playSound("nostalgia");

}

function nextColorDodgeRound(){

    colorDodgeState.round += 1;
    colorDodgeState.askForInkColor = colorDodgeState.round % 2 === 0; // even rounds ask for ink color
    colorDodgeState.targetWord = pickRandom(COLOR_DODGE_PALETTE);

    const inkOptions = COLOR_DODGE_PALETTE.filter((c) => c.name !== colorDodgeState.targetWord.name);
    colorDodgeState.inkColor = pickRandom(inkOptions);

    colorDodgeState.timeLeft = COLOR_DODGE_TIME_LIMIT;
    colorDodgeState.awaitingClick = true;

    renderColorDodgeRound();

    colorDodgeState.timerId = setInterval(() => {

        colorDodgeState.timeLeft -= 1;

        const timerEl = document.getElementById("colorDodgeTimer");
        if (timerEl) timerEl.textContent = `${colorDodgeState.timeLeft}s left`;

        if (colorDodgeState.timeLeft <= 0) {
            clearInterval(colorDodgeState.timerId);
            resolveColorDodgeRound(false);
        }

    }, 1000);

}

function renderColorDodgeRound(){

    // shuffle swatch order each round so position isn't a giveaway
    const swatches = [...COLOR_DODGE_PALETTE].sort(() => Math.random() - 0.5);

    const swatchesHtml = swatches.map((color) => `
        <div class="color-swatch" style="background: ${color.hex};" onclick="handleColorDodgeClick('${color.name}')"></div>
    `).join("");

    const instruction = colorDodgeState.askForInkColor
        ? "Pick the color it's PRINTED in!"
        : "Pick the color the word SAYS!";

    document.getElementById("game").innerHTML = `

        <h1>Ink'D</h1>

        <p class="match-timer">Round ${colorDodgeState.round} of ${COLOR_DODGE_ROUNDS}</p>

        <p><strong>${instruction}</strong></p>

        <h1 style="color: ${colorDodgeState.inkColor.hex};">${colorDodgeState.targetWord.name.toUpperCase()}</h1>

        <div class="color-swatch-grid">
            ${swatchesHtml}
        </div>

        <p class="catch-hint" id="colorDodgeTimer">${colorDodgeState.timeLeft}s left</p>

    `;

}

function handleColorDodgeClick(colorName){

    if (!colorDodgeState.awaitingClick) return;

    clearInterval(colorDodgeState.timerId);

    const correctAnswer = colorDodgeState.askForInkColor
        ? colorDodgeState.inkColor.name
        : colorDodgeState.targetWord.name;

    const isCorrect = colorName === correctAnswer;
    resolveColorDodgeRound(isCorrect);

}

function resolveColorDodgeRound(isCorrect){

    colorDodgeState.awaitingClick = false;

    if (isCorrect) {
        colorDodgeState.correctCount += 1;
    }

    const correctAnswer = colorDodgeState.askForInkColor
        ? colorDodgeState.inkColor.name
        : colorDodgeState.targetWord.name;

    const answerLabel = colorDodgeState.askForInkColor
        ? `The ink was ${correctAnswer}`
        : `It said "${correctAnswer}"`;

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated ${isCorrect ? "animate__tada" : "animate__headShake"}">
            ${isCorrect ? "Nice!" : "Oops!"}
        </h1>

        <p>${answerLabel}</p>

    `;

    const isLastRound = colorDodgeState.round === COLOR_DODGE_ROUNDS;

    setTimeout(() => {

        if (isLastRound) {
            stopSound("nostalgia");
            renderColorDodgeFinalTally();
            const won = colorDodgeState.correctCount >= COLOR_DODGE_WIN_THRESHOLD;
            setTimeout(() => finishRound(won, 3), RESULT_REVEAL_MS);
            return;
        }

        nextColorDodgeRound();

    }, 900);

}

function renderColorDodgeFinalTally(){

    const won = colorDodgeState.correctCount >= COLOR_DODGE_WIN_THRESHOLD;

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated ${won ? "animate__tada" : "animate__headShake"}">
            ${colorDodgeState.correctCount} of ${COLOR_DODGE_ROUNDS} correct
        </h1>

        <p>${won ? "Great focus!" : "So close."}</p>

    `;

}