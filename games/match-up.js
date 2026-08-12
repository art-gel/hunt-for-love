const MATCH_SET_FAVORITES = [
    { type: "image", value: "pictures/rose.png" },
    { type: "image", value: "pictures/strawberry.png" },
    { type: "image", value: "pictures/paint.png" },
    { type: "image", value: "pictures/plane.png" },
    { type: "image", value: "pictures/luigi.png" },
    { type: "image", value: "pictures/octopus.png" }
];

const MATCH_SET_DISLIKES = [
    { type: "image", value: "pictures/cherries.png" },
    { type: "image", value: "pictures/clown.png" },
    { type: "image", value: "pictures/cottoncandy.png" },
    { type: "image", value: "pictures/egg.png" },
    { type: "image", value: "pictures/boba.png" },
    { type: "image", value: "pictures/smoking.png" }
];

const MATCH_SETS = [MATCH_SET_FAVORITES, MATCH_SET_DISLIKES];

let matchSetIndex = 0;

MATCH_SETS.flat().forEach((symbol) => {
    if (symbol.type === "image") {
        const preloadImg = new Image();
        preloadImg.src = symbol.value;
    }
});

const MATCH_TIME_LIMIT = 35; // seconds

function getMatchUpRulesText(){
    return matchSetIndex === 0
        ? "Match every pair of Angel's's favorite things before the timer runs out!"
        : "Match all the things Angel doesn't like before the timer runs out!";
}

function renderMatchSymbol(symbol){
    if (symbol.type === "image") {
        return `<img src="${symbol.value}" class="match-symbol-img" alt="">`;
    }
    return symbol.value;
}

let matchState = {
    symbols: MATCH_SET_FAVORITES,
    deck: [],
    flipped: [],
    matchedCount: 0,
    locked: false,
    timeLeft: MATCH_TIME_LIMIT,
    timerId: null
};

function startMatchGame(){

    if (matchState.timerId) {
        clearInterval(matchState.timerId);
    }

    const activeSymbols = MATCH_SETS[matchSetIndex];
    matchSetIndex = (matchSetIndex + 1) % MATCH_SETS.length; // ready for next time

    const pairedSymbols = [...activeSymbols, ...activeSymbols];
    const shuffled = pairedSymbols
        .map((symbol) => ({ symbol, matched: false }))
        .sort(() => Math.random() - 0.5);

    matchState = {
        symbols: activeSymbols,
        deck: shuffled,
        flipped: [],
        matchedCount: 0,
        locked: false,
        timeLeft: MATCH_TIME_LIMIT,
        timerId: null
    };

    renderMatchGame();

    playSound("nostalgia");

    matchState.timerId = setInterval(() => {
        matchState.timeLeft -= 1;

        const timerEl = document.getElementById("matchTimer");
        if (timerEl) {
            timerEl.textContent = `${matchState.timeLeft}s left`;
        }

        if (matchState.timeLeft <= 0) {
            clearInterval(matchState.timerId);
            revealMatchBoard();
        }
    }, 1000);

}

function revealMatchBoard(){

    matchState.locked = true;

    document.querySelectorAll(".match-card").forEach((cardEl) => {
        cardEl.classList.add("flipped");
    });

    const timerEl = document.getElementById("matchTimer");
    if (timerEl) timerEl.textContent = "Here's where they all were";

    setTimeout(() => endMatchGame(false), RESULT_REVEAL_MS);

}

function renderMatchGame(){

    const cardsHtml = matchState.deck.map((card, index) => `
        <div class="match-card" data-index="${index}" onclick="handleMatchCardClick(${index})">
            <div class="match-card-inner">
                <div class="match-face match-front">❓</div>
                <div class="match-face match-back">${renderMatchSymbol(card.symbol)}</div>
            </div>
        </div>
    `).join("");

    document.getElementById("game").innerHTML = `

        <h1>Match Up</h1>

        <p class="match-timer" id="matchTimer">${matchState.timeLeft}s left</p>

        <div class="match-grid">
            ${cardsHtml}
        </div>

    `;

}

function handleMatchCardClick(index){

    if (matchState.locked) return;

    const card = matchState.deck[index];
    if (card.matched) return;
    if (matchState.flipped.includes(index)) return;

    const cardEl = document.querySelector(`.match-card[data-index="${index}"]`);
    cardEl.classList.add("flipped");

    matchState.flipped.push(index);

    if (matchState.flipped.length === 2) {

        matchState.locked = true;

        const [firstIndex, secondIndex] = matchState.flipped;
        const isMatch = matchState.deck[firstIndex].symbol === matchState.deck[secondIndex].symbol;

        if (isMatch) {

            matchState.deck[firstIndex].matched = true;
            matchState.deck[secondIndex].matched = true;
            matchState.matchedCount += 1;

            document.querySelector(`.match-card[data-index="${firstIndex}"]`).classList.add("matched");
            document.querySelector(`.match-card[data-index="${secondIndex}"]`).classList.add("matched");

            matchState.flipped = [];
            matchState.locked = false;

            if (matchState.matchedCount === matchState.symbols.length) {
                clearInterval(matchState.timerId);
                setTimeout(() => endMatchGame(true), 1200);
            }

        } else {

            setTimeout(() => {
                document.querySelector(`.match-card[data-index="${firstIndex}"]`).classList.remove("flipped");
                document.querySelector(`.match-card[data-index="${secondIndex}"]`).classList.remove("flipped");
                matchState.flipped = [];
                matchState.locked = false;
            }, 700);

        }

    }

}

function endMatchGame(isWin){

    stopSound("gameboy");
    finishRound(isWin, 2);

}