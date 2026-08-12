const PERFECT_MATCH_SYMBOLS = [
    { type: "image", value: "pictures/rose.png" },
    { type: "image", value: "pictures/strawberry.png" },
    { type: "image", value: "pictures/paint.png" },
    { type: "image", value: "pictures/plane.png" },
    { type: "image", value: "pictures/luigi.png" },
    { type: "image", value: "pictures/octopus.png" }
];

PERFECT_MATCH_SYMBOLS.forEach((symbol) => {
    const preloadImg = new Image();
    preloadImg.src = symbol.value;
});

const PERFECT_MATCH_TIME_LIMIT = 30; // seconds

function renderPerfectMatchSymbol(symbol){
    return `<img src="${symbol.value}" class="perfect-match-symbol-img" alt="">`;
}

let perfectMatchState = {
    deck: [],
    flipped: [],
    matchedCount: 0,
    locked: false,
    timeLeft: PERFECT_MATCH_TIME_LIMIT,
    timerId: null
};

function startPerfectMatchGame(){

    if (perfectMatchState.timerId) {
        clearInterval(perfectMatchState.timerId);
    }

    const pairedSymbols = [...PERFECT_MATCH_SYMBOLS, ...PERFECT_MATCH_SYMBOLS];
    const shuffled = pairedSymbols
        .map((symbol) => ({ symbol, matched: false }))
        .sort(() => Math.random() - 0.5);

    perfectMatchState = {
        deck: shuffled,
        flipped: [],
        matchedCount: 0,
        locked: false,
        timeLeft: PERFECT_MATCH_TIME_LIMIT,
        timerId: null
    };

    renderPerfectMatchGame();

    playSound("nostalgia");

    perfectMatchState.timerId = setInterval(() => {
        perfectMatchState.timeLeft -= 1;

        const timerEl = document.getElementById("perfectMatchTimer");
        if (timerEl) {
            timerEl.textContent = `${perfectMatchState.timeLeft}s left`;
        }

        if (perfectMatchState.timeLeft <= 0) {
            clearInterval(perfectMatchState.timerId);
            revealPerfectMatchBoard();
        }
    }, 1000);

}

function revealPerfectMatchBoard(){

    perfectMatchState.locked = true;

    document.querySelectorAll(".perfect-match-card").forEach((cardEl) => {
        cardEl.classList.add("flipped");
    });

    const timerEl = document.getElementById("perfectMatchTimer");
    if (timerEl) timerEl.textContent = "Here's where they all were";

    setTimeout(() => endPerfectMatchGame(false), RESULT_REVEAL_MS);

}

function renderPerfectMatchGame(){

    const cardsHtml = perfectMatchState.deck.map((card, index) => `
        <div class="match-card perfect-match-card" data-index="${index}" onclick="handlePerfectMatchCardClick(${index})">
            <div class="match-card-inner">
                <div class="match-face match-front"> <img src=\"icons/red-question-mark.svg\"></div>
                <div class="match-face match-back">${renderPerfectMatchSymbol(card.symbol)}</div>
            </div>
        </div>
    `).join("");

    document.getElementById("game").innerHTML = `

        <h1>Perfect Match</h1>

        <p class="match-timer" id="perfectMatchTimer">${perfectMatchState.timeLeft}s left</p>

        <div class="match-grid">
            ${cardsHtml}
        </div>

    `;

}

function handlePerfectMatchCardClick(index){

    if (perfectMatchState.locked) return;

    const card = perfectMatchState.deck[index];
    if (card.matched) return;
    if (perfectMatchState.flipped.includes(index)) return;

    const cardEl = document.querySelector(`.perfect-match-card[data-index="${index}"]`);
    cardEl.classList.add("flipped");

    perfectMatchState.flipped.push(index);

    if (perfectMatchState.flipped.length === 2) {

        perfectMatchState.locked = true;

        const [firstIndex, secondIndex] = perfectMatchState.flipped;
        const isMatch = perfectMatchState.deck[firstIndex].symbol === perfectMatchState.deck[secondIndex].symbol;

        if (isMatch) {

            perfectMatchState.deck[firstIndex].matched = true;
            perfectMatchState.deck[secondIndex].matched = true;
            perfectMatchState.matchedCount += 1;

            document.querySelector(`.perfect-match-card[data-index="${firstIndex}"]`).classList.add("matched");
            document.querySelector(`.perfect-match-card[data-index="${secondIndex}"]`).classList.add("matched");

            perfectMatchState.flipped = [];
            perfectMatchState.locked = false;

            if (perfectMatchState.matchedCount === PERFECT_MATCH_SYMBOLS.length) {
                clearInterval(perfectMatchState.timerId);
                setTimeout(() => endPerfectMatchGame(true), 1200);
            }

        } else {

            setTimeout(() => {
                document.querySelector(`.perfect-match-card[data-index="${firstIndex}"]`).classList.remove("flipped");
                document.querySelector(`.perfect-match-card[data-index="${secondIndex}"]`).classList.remove("flipped");
                perfectMatchState.flipped = [];
                perfectMatchState.locked = false;
            }, 700);

        }

    }

}

function endPerfectMatchGame(isWin){

    stopSound("nostalgia");
    finishRound(isWin, 2);

}