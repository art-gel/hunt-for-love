const CHAIN_MAX_ATTEMPTS = 6;
const CHAIN_MAX_HINTS = 6; // shared across the whole chain, not per-word

const CHAIN_PUZZLES = [
    ["CARD", "SHARK", "TANK", "TOP", "SECRET", "SANTA"],
    ["FAST", "FOOD", "TRUCK", "STOP", "SIGN", "LANGUAGE"],
    ["OPEN", "SESAME", "STREET", "SMART", "COOKIE", "MONSTER"],
    ["SLOW", "MOTION", "PICTURE", "PERFECT", "CRIME", "SCENE"],
    ["RAW", "VEGAN", "DIET", "SODA", "POP", "CULTURE"],
    ["COUNTRY", "MUSIC", "VIDEO", "GAME", "OVER", "BOARD"],
    ["BABY", "FACE", "PAINT", "BALL", "ROOM", "SERVICE"],
    ["WISDOM", "TOOTH", "FAIRY", "DUST", "CLOUD", "NINE"],
    ["WALKING", "DEAD", "BODY", "GUARD", "DOG", "PARK"],
    ["HAPPY", "BIRTHDAY", "GIFT", "BOX", "OFFICE", "PARTY"],
    ["WILD", "ANIMAL", "PLANET", "EARTH", "WORM", "HOLE"],
    ["GUT", "FEELING", "MUTUAL", "FRIEND", "ZONE", "OUT"],
    ["TRASH", "TALK", "RADIO", "SILENT", "TREATMENT", "PLAN"],
    ["GHOST", "TOWN", "SQUARE", "ROOT", "BEER", "PONG"],
];

let chainState = {
    words: [], // full solution
    revealed: [], // player's confirmed-correct words so far (index-aligned with words)
    currentBlankIndex: 1, // which word (1..length-2) we're currently guessing
    currentWordRevealedCount: 1, // how many letters of the CURRENT word are shown (starts at 1 — just the first letter)
    attemptsLeft: CHAIN_MAX_ATTEMPTS,
    hintsLeft: CHAIN_MAX_HINTS,
    phase: "playing" // playing | done
};
 
function startChainReactionGame(){
 
    const words = pickRandom(CHAIN_PUZZLES);
 
    chainState = {
        words,
        revealed: words.map((w, i) => (i === 0 || i === words.length - 1 ? w : null)),
        currentBlankIndex: 1,
        currentWordRevealedCount: 1,
        attemptsLeft: CHAIN_MAX_ATTEMPTS,
        hintsLeft: CHAIN_MAX_HINTS,
        phase: "playing"
    };
 
    renderChainReaction();
 
    playSound("nostalgia");
 
}
 
function handleChainHint(){
 
    if (chainState.phase !== "playing") return;
    if (chainState.hintsLeft <= 0) return;
 
    const currentWord = chainState.words[chainState.currentBlankIndex];
    if (chainState.currentWordRevealedCount >= currentWord.length) return; // already fully revealed
 
    chainState.currentWordRevealedCount += 1;
    chainState.hintsLeft -= 1;
 
    renderChainReaction();
 
}
 
function handleChainSubmit(event){
 
    event.preventDefault();
 
    if (chainState.phase !== "playing") return;
 
    const input = document.getElementById("chainInput");
    const guess = input.value.trim().toUpperCase();
    if (!guess) return;
 
    const target = chainState.words[chainState.currentBlankIndex];
    const isCorrect = guess === target;
 
    if (isCorrect) {
 
        chainState.revealed[chainState.currentBlankIndex] = target;
        chainState.currentBlankIndex += 1;
        chainState.currentWordRevealedCount = 1;
 
        const isChainComplete = chainState.currentBlankIndex === chainState.words.length - 1;
        if (isChainComplete) {
            endChainReactionGame(true);
            return;
        }
 
        renderChainReaction();
        return;
 
    }
 
    chainState.attemptsLeft -= 1;
 
    if (chainState.attemptsLeft <= 0) {
        endChainReactionGame(false);
        return;
    }
 
    renderChainReaction(true);
 
}
 
function renderChainReaction(wasWrong = false){
 
    const chainHtml = chainState.words.map((word, i) => {
 
        if (chainState.revealed[i]) {
            return `<span class="chain-word chain-word-solved">${chainState.revealed[i]}</span>`;
        }
 
        if (i === chainState.currentBlankIndex) {
            const revealedPart = word.slice(0, chainState.currentWordRevealedCount);
            const blankPart = "_".repeat(word.length - chainState.currentWordRevealedCount);
            return `<span class="chain-word chain-word-active">${revealedPart}${blankPart}</span>`;
        }
 
        return `<span class="chain-word chain-word-locked">?</span>`;
 
    });
 
    // interleave with "+" between words and "=" is implied by adjacency (compound words)
    const chainDisplay = chainHtml.join(`<span class="chain-plus">+</span>`);
 
    document.getElementById("game").innerHTML = `
 
        <div class="heist-header">
            <h1>Word Chain</h1>
            <p class="heist-tries">${chainState.attemptsLeft} ${chainState.attemptsLeft === 1 ? "attempt" : "attempts"} left</p>
        </div>
  
        <div class="chain-row">
            ${chainDisplay}
        </div>
  
        <form id="chainForm" class="chain-form" onsubmit="handleChainSubmit(event)">

            <button type="button" onclick="handleChainHint()" ${chainState.hintsLeft <= 0 ? "disabled" : ""}>
                ${chainState.hintsLeft} hints left
            </button>

            <input type="text" id="chainInput" class="cipher-input" placeholder="Type the word" autocomplete="off">
            <button type="submit">Submit</button>

        </form>
 
    `;
 
}
 
function endChainReactionGame(isWin){
 
    chainState.phase = "done";
    stopSound("nostalgia");
 
    document.getElementById("game").innerHTML = `
 
        <h1 class="animate__animated ${isWin ? "animate__tada" : "animate__headShake"}">
            ${isWin ? "Chain complete!" : "Out of attempts"}
        </h1>
 
        <p>The full chain was: <span style="font-size: 17px;">${chainState.words.join(" + ")}</span></p>
 
    `;
 
    setTimeout(() => finishRound(isWin, 4), RESULT_REVEAL_MS);
 
}