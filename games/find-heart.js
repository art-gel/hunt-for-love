const FIND_HEART_CARD_COUNT = 5;
const FIND_HEART_CARD_WIDTH = 180;
const FIND_HEART_CARD_GAP = 12;
const FIND_HEART_PEEK_MS = 1400;
const FIND_HEART_SHUFFLE_STEPS = 5;
const FIND_HEART_SHUFFLE_STEP_MS = 260;

let findHeartState = {
    heartCardId: 0,
    cardOrder: [], 
    canGuess: false,
    revealed: false
};

function slotX(slotIndex){
    return slotIndex * (FIND_HEART_CARD_WIDTH + FIND_HEART_CARD_GAP);
}

function slotForCard(cardId){
    return findHeartState.cardOrder.indexOf(cardId);
}

function startFindHeartGame(){

    findHeartState = {
        heartCardId: Math.floor(Math.random() * FIND_HEART_CARD_COUNT),
        cardOrder: Array.from({ length: FIND_HEART_CARD_COUNT }, (_, i) => i), 
        canGuess: false,
        revealed: false
    };

    buildFindHeartArena(true, "Remember where it is...");

    setTimeout(() => {

        setAllFindHeartCardsFlipped(false);
        setFindHeartStatus("Shuffling...");

        setTimeout(() => {
            playSound("shuffle");
            runShuffleStep(0);
        }, 300);

    }, FIND_HEART_PEEK_MS);

}

function buildFindHeartArena(showFaces, statusText){

    const arenaWidth = FIND_HEART_CARD_COUNT * FIND_HEART_CARD_WIDTH
        + (FIND_HEART_CARD_COUNT - 1) * FIND_HEART_CARD_GAP;

    const cardsHtml = Array.from({ length: FIND_HEART_CARD_COUNT }, (_, i) => i).map((cardId) => {
        const isHeart = cardId === findHeartState.heartCardId;
        const left = slotX(slotForCard(cardId));

        return `
            <div class="card find-card ${showFaces ? "flipped" : ""}" id="findCard${cardId}"
                 style="left: ${left}px;" onclick="handleFindHeartGuess(${cardId})">
                <div class="card-inner">
                    <div class="card-front">❓</div>
                    <div class="card-back">${isHeart ? `<img src="pictures/heart.png" class="find-card-img">` : `<img src="pictures/skull.png" class="find-card-img">`}</div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("game").innerHTML = `

        <h1>Find The Heart</h1>

        <p id="findHeartStatus">${statusText}</p>

        <div class="shuffle-arena" style="width: ${arenaWidth}px;">
            ${cardsHtml}
        </div>

    `;

}

function setAllFindHeartCardsFlipped(shouldFlip){
    Array.from({ length: FIND_HEART_CARD_COUNT }, (_, i) => i).forEach((cardId) => {
        const el = document.getElementById(`findCard${cardId}`);
        if (!el) return;
        el.classList.toggle("flipped", shouldFlip);
    });
}

function setFindHeartStatus(text){
    const statusEl = document.getElementById("findHeartStatus");
    if (statusEl) statusEl.textContent = text;
}

function swapSlots(slotA, slotB){

    const cardA = findHeartState.cardOrder[slotA];
    const cardB = findHeartState.cardOrder[slotB];

    findHeartState.cardOrder[slotA] = cardB;
    findHeartState.cardOrder[slotB] = cardA;

    const elA = document.getElementById(`findCard${cardA}`);
    const elB = document.getElementById(`findCard${cardB}`);

    if (elA) elA.style.left = slotX(slotB) + "px";
    if (elB) elB.style.left = slotX(slotA) + "px";

}

function runShuffleStep(stepIndex){

    if (stepIndex >= FIND_HEART_SHUFFLE_STEPS) {
        findHeartState.canGuess = true;
        setFindHeartStatus("Pick a card!");
        return;
    }

    const slotA = Math.floor(Math.random() * FIND_HEART_CARD_COUNT);
    let slotB = Math.floor(Math.random() * FIND_HEART_CARD_COUNT);
    while (slotB === slotA) {
        slotB = Math.floor(Math.random() * FIND_HEART_CARD_COUNT);
    }

    swapSlots(slotA, slotB);

    setTimeout(() => runShuffleStep(stepIndex + 1), FIND_HEART_SHUFFLE_STEP_MS);

}

function handleFindHeartGuess(cardId){

    if (!findHeartState.canGuess || findHeartState.revealed) return;

    findHeartState.canGuess = false;
    findHeartState.revealed = true;

    stopSound("shuffle");

    const isCorrect = cardId === findHeartState.heartCardId;

    setAllFindHeartCardsFlipped(true);
    setFindHeartStatus(isCorrect ? "You found it!" : "Not quite.");

    setTimeout(() => finishRound(isCorrect), RESULT_REVEAL_MS);

}