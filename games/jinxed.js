const JINXED_SYMBOLS = [
    { type: "image", value: "pictures/cherries.png" },
    { type: "image", value: "pictures/clown.png" },
    { type: "image", value: "pictures/cottoncandy.png" },
    { type: "image", value: "pictures/egg.png" },
    { type: "image", value: "pictures/boba.png" },
    { type: "image", value: "pictures/smoking.png" }
];

JINXED_SYMBOLS.forEach((symbol) => {
    const preloadImg = new Image();
    preloadImg.src = symbol.value;
});

const JINXED_TIME_LIMIT = 30; // seconds

function renderJinxedSymbol(symbol){
    return `<img src="${symbol.value}" class="jinxed-symbol-img" alt="">`;
}

let jinxedState = {
    deck: [],
    flipped: [],
    matchedCount: 0,
    locked: false,
    timeLeft: JINXED_TIME_LIMIT,
    timerId: null
};

function startJinxedGame(){

    if (jinxedState.timerId) {
        clearInterval(jinxedState.timerId);
    }

    const pairedSymbols = [...JINXED_SYMBOLS, ...JINXED_SYMBOLS];
    const shuffled = pairedSymbols
        .map((symbol) => ({ symbol, matched: false }))
        .sort(() => Math.random() - 0.5);

    jinxedState = {
        deck: shuffled,
        flipped: [],
        matchedCount: 0,
        locked: false,
        timeLeft: JINXED_TIME_LIMIT,
        timerId: null
    };

    renderJinxedGame();

    playSound("nostalgia");

    jinxedState.timerId = setInterval(() => {
        jinxedState.timeLeft -= 1;

        const timerEl = document.getElementById("jinxedTimer");
        if (timerEl) {
            timerEl.textContent = `${jinxedState.timeLeft}s left`;
        }

        if (jinxedState.timeLeft <= 0) {
            clearInterval(jinxedState.timerId);
            revealJinxedBoard();
        }
    }, 1000);

}

function revealJinxedBoard(){

    jinxedState.locked = true;

    document.querySelectorAll(".jinxed-card").forEach((cardEl) => {
        cardEl.classList.add("flipped");
    });

    const timerEl = document.getElementById("jinxedTimer");
    if (timerEl) timerEl.textContent = "Here's where they all were";

    setTimeout(() => endJinxedGame(false), RESULT_REVEAL_MS);

}

function renderJinxedGame(){

    const cardsHtml = jinxedState.deck.map((card, index) => `
        <div class="match-card jinxed-card" data-index="${index}" onclick="handleJinxedCardClick(${index})">
            <div class="match-card-inner">
                <div class="match-face match-front"><img src=\"icons/red-question-mark.svg\"></div>
                <div class="match-face match-back">${renderJinxedSymbol(card.symbol)}</div>
            </div>
        </div>
    `).join("");

    document.getElementById("game").innerHTML = `

        <h1>Jinxed</h1>

        <p class="match-timer" id="jinxedTimer">${jinxedState.timeLeft}s left</p>

        <div class="match-grid">
            ${cardsHtml}
        </div>

    `;

}

function handleJinxedCardClick(index){

    if (jinxedState.locked) return;

    const card = jinxedState.deck[index];
    if (card.matched) return;
    if (jinxedState.flipped.includes(index)) return;

    const cardEl = document.querySelector(`.jinxed-card[data-index="${index}"]`);
    cardEl.classList.add("flipped");

    jinxedState.flipped.push(index);

    if (jinxedState.flipped.length === 2) {

        jinxedState.locked = true;

        const [firstIndex, secondIndex] = jinxedState.flipped;
        const isMatch = jinxedState.deck[firstIndex].symbol === jinxedState.deck[secondIndex].symbol;

        if (isMatch) {

            jinxedState.deck[firstIndex].matched = true;
            jinxedState.deck[secondIndex].matched = true;
            jinxedState.matchedCount += 1;

            document.querySelector(`.jinxed-card[data-index="${firstIndex}"]`).classList.add("matched");
            document.querySelector(`.jinxed-card[data-index="${secondIndex}"]`).classList.add("matched");

            jinxedState.flipped = [];
            jinxedState.locked = false;

            if (jinxedState.matchedCount === JINXED_SYMBOLS.length) {
                clearInterval(jinxedState.timerId);
                setTimeout(() => endJinxedGame(true), 1200);
            }

        } else {

            setTimeout(() => {
                document.querySelector(`.jinxed-card[data-index="${firstIndex}"]`).classList.remove("flipped");
                document.querySelector(`.jinxed-card[data-index="${secondIndex}"]`).classList.remove("flipped");
                jinxedState.flipped = [];
                jinxedState.locked = false;
            }, 700);

        }

    }

}

function endJinxedGame(isWin){

    stopSound("nostalgia");
    finishRound(isWin, 2);

}