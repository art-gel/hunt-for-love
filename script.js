let gameState = {
    hearts: 0,
    roundsCompleted: 0,
    maxHearts: 10,
    quitAttempts: 0,
    hasProposed: false
};

const RESULT_REVEAL_MS = 3800;

const SOUNDS = {
    tickingClock: new Audio("audio/tickingclock.mp3"),
    buzzer: new Audio("audio/freesound_community-wrong-buzzer-6268.mp3"),
    correct: new Audio("audio/dragon-studio-correct-472358.mp3"),
    shuffle: new Audio("audio/freesound_community-riffle-card-shuffle-104313.mp3"),
    nostalgia: new Audio("audio/HiLau & tubebackr - Guava (freetouse.com).mp3")
};

SOUNDS.tickingClock.loop = true;
SOUNDS.nostalgia.loop = true;

function playSound(name){
    const sound = SOUNDS[name];
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function stopSound(name){
    const sound = SOUNDS[name];
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
}

function stopAllMusic(){
    Object.keys(SOUNDS).forEach((name) => {
        if (SOUNDS[name].loop) {
            stopSound(name);
        }
    });
}

const startButton = document.getElementById("startButton");

startButton.addEventListener("click", showChallengeSelection);

updateHearts();


const challenges = [
    {
        id: "stopTheClock",
        title: "Hit Ten <img src=\"icons/timer-clock.svg\" class=\"title-icon\">",
        rules: "Stop the timer as close to 10.00s as you can, the second round runs faster."
    },
    {
        id: "perfectMatch",
        title: "Perfect Match <img src=\"icons/smiling-face-with-halo.svg\" class=\"title-icon\">",
        rules: "Match every pair of Angel's's favorite things before the timer runs out!"
    },
    {
        id: "jinxed",
        title: "Jinxed <img src=\"icons/smiling-face-with-horns.svg\" class=\"title-icon\">",
        rules: "Match all the things that Angel doesn't like before the timer runs out!"
    },
    {
        id: "matrix",
        title: "Sweet Memory <img src=\"icons/candy.svg\" class=\"title-icon\">",
        rules: "Memorize where the candies are, then click their locations after they disappear. Each round gets tougher."
    },
    {
        id: "password",
        title: "Password <img src=\"icons/key.svg\" class=\"title-icon\">",
        rules: "Figure out the hidden password. 6 wrong guesses and it's game over."
    },
    {
        id: "findHeart",
        title: "Find The Heart <img src=\"icons/heart-suit.svg\" class=\"title-icon\">",
        rules: "Keep your eye on the heart, then pick the right card after they're shuffled."
    },
    {
        id: "colorDodge",
        title: "Ink'D <img src=\"icons/paintbrush.svg\" class=\"title-icon\">",
        rules: "ODD round - Click what the word SAYS, EVEN round - Click the color it's PRINTED in. Get at least 6 rounds right to win!"
    },
    {
        id: "chainReaction",
        title: "Word Chain <img src=\"icons/link.svg\" class=\"title-icon\">",
        rules: "Guess the missing words to complete the chain!"
    },
    {
        id: "wordSearch",
        title: "Word Search <img src=\"icons/magnifying-glass-tilted-left.svg\" class=\"title-icon\">",
        rules: "Find at least 5 hidden words to win before the timer runs out!"
    }
    
];

const randomFacts = [
    "I won two art awards in high school!",
    "I'm a self-taught artist!",
    "My prefereed medium is digital art!",
    "Watercolor is my new hobby!",
    "Drawing calms my mind and brings me peace.",
    "I competeted in cross country during high school!",
    "My dream destinations are Japan and Italy!",
];

const unluckyPhrases = [
    "Wow...you suck",
    "Are you even trying?",
    "Impressive miss",
    "Nice try...almost",
];

const quitterPhrases = [
    "Quitting already?",
    "Getting tired of losing?",
];

function pickRandom(list){
    return list[Math.floor(Math.random() * list.length)];
}

function drawTwoChallenges(){
    const shuffled = [...challenges].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
}

let recentlyPlayed = [];
const RECENT_HISTORY_LENGTH = 4;

// Never trimmed, unlike recentlyPlayed — tracks every game played at
// least once this session, so we can tell someone what they missed.
let gamesEverPlayed = new Set();

function trackPlayed(challengeId){
    recentlyPlayed = [challengeId, ...recentlyPlayed.filter((id) => id !== challengeId)]
        .slice(0, RECENT_HISTORY_LENGTH);
    gamesEverPlayed.add(challengeId);
}

function pickFreshChallenge(excludeIds){

    // prefer something neither currently shown nor recently played
    let candidates = challenges.filter((c) =>
        !excludeIds.includes(c.id) && !recentlyPlayed.includes(c.id)
    );

    // pool too small (small roster + recent history) — relax to just "not currently shown"
    if (candidates.length === 0) {
        candidates = challenges.filter((c) => !excludeIds.includes(c.id));
    }

    return pickRandom(candidates);

}

let currentPair = [];
let lastPickedId = null;
let keptCardStreak = 0;
const KEPT_CARD_REFRESH_THRESHOLD = 2; // force a refresh after sitting unplayed this many draws

function showChallengeSelection() {

    if (currentPair.length === 0) {

        // first draw of the session — grab two at random
        currentPair = drawTwoChallenges();

    } else if (lastPickedId) {

        // only swap out the card that was just played; keep the other
        // one — UNLESS it's been sitting unplayed too long, in which
        // case refresh it too so it can't camp there indefinitely
        const keptChallenge = currentPair.find((c) => c.id !== lastPickedId);

        const newPlayedCard = pickFreshChallenge([lastPickedId, keptChallenge.id]);

        keptCardStreak += 1;

        if (keptCardStreak >= KEPT_CARD_REFRESH_THRESHOLD) {

            const newKeptCard = pickFreshChallenge([keptChallenge.id, newPlayedCard.id]);
            currentPair = currentPair.map((c) => {
                if (c.id === lastPickedId) return newPlayedCard;
                if (c.id === keptChallenge.id) return newKeptCard;
                return c;
            });
            keptCardStreak = 0;

        } else {

            currentPair = currentPair.map((c) =>
                c.id === lastPickedId ? newPlayedCard : c
            );

        }

        lastPickedId = null;

    }

    const cardsHtml = currentPair.map((challenge, index) => `
        <div class="card" data-index="${index}" onclick="flipCard(this)">

            <div class="card-inner">

                <div class="card-front">
                    <img src=\"icons/red-question-mark.svg\">
                </div>

                <div class="card-back">

                    <h2>${challenge.title}</h2>

                    <button onclick="startChallenge(event, '${challenge.id}')">
                        Start Game
                    </button>

                </div>

            </div>

        </div>
    `).join("");

    document.getElementById("game").innerHTML = `

        <h1>Pick a mystery card</h1>

        <div class="card-row">
            ${cardsHtml}
        </div>

    `;
}

function flipCard(card){

    card.classList.add("flipped");

    document.querySelectorAll(".card").forEach((otherCard) => {
        if (otherCard !== card) {
            otherCard.classList.add("hidden-away");
        }
    });

}

// Maps each challenge id to the function (defined in its own file
// under /games) that actually starts that game's gameplay.
const GAME_STARTERS = {
    stopTheClock: () => startStopTheClockGame(),
    matrix: () => startMatrixGame(),
    password: () => startPasswordGame(),
    findHeart: () => startFindHeartGame(),
    colorDodge: () => startColorDodgeGame(),
    chainReaction: () => startChainReactionGame(),
    wordSearch: () => startWordSearchGame(),
    perfectMatch: () => startPerfectMatchGame(),
    jinxed: () => startJinxedGame()
};

function startChallenge(event, challengeId){

    event.stopPropagation();

    lastPickedId = challengeId;

    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    document.getElementById("game").innerHTML = `

        <h1>How to Play</h1>

        <p>${challenge.rules}</p>

        <button onclick="beginGame('${challengeId}')">
            I'm ready
        </button>

    `;

}

function clearSidePanel(){

    const panel = document.getElementById("sidePanel");
    if (panel) {
        panel.innerHTML = "";
        panel.style.display = "none";
    }

}

function beginGame(challengeId){

    clearSidePanel();
    trackPlayed(challengeId);

    document.getElementById("game").classList.remove("game-compact-padding");

    const startGame = GAME_STARTERS[challengeId];
    if (startGame) {
        startGame();
    }

}

// Called by each game when it ends. isCorrect = true for a win, false for a loss.
function finishRound(isCorrect, heartAmount = 1){

    gameState.roundsCompleted += 1;

    stopAllMusic();

    if (isCorrect) {

        const before = gameState.hearts;
        gameState.hearts = Math.min(gameState.maxHearts, gameState.hearts + heartAmount);
        const actualGained = gameState.hearts - before;

        updateHearts();

        if (actualGained > 0) {
            triggerHeartbeat();
        }

        const isMaxedOut = gameState.hearts >= gameState.maxHearts && !gameState.hasProposed;
        const canReplayProposal = gameState.hearts >= gameState.maxHearts && gameState.hasProposed;

        playSound("correct");

        showResult({
            heading: `+${heartAmount} Heart${heartAmount === 1 ? "" : "s"}`,
            message: `Random Fact about Angel: ${pickRandom(randomFacts)}`,
            animation: "animate__tada",
            isFinal: isMaxedOut,
            canReplayProposal
        });

    } else {

        gameState.hearts = Math.max(0, gameState.hearts - 1);

        updateHearts();

        playSound("buzzer");

        showResult({
            heading: "-1 Heart",
            message: pickRandom(unluckyPhrases),
            animation: "animate__headShake"
        });

    }

}

function showResult({ heading, message, animation, isFinal, canReplayProposal }){

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated ${animation}">${heading}</h1>

        ${message ? `<p>${message}</p>` : ""}

        ${isFinal ? `
            <button onclick="showProposalScreen()">
                Continue
            </button>
        ` : `
            <button onclick="showChallengeSelection()">
                Draw Again
            </button>

            <button onclick="showFinalScreen()">
                Give up
            </button>

            ${canReplayProposal ? `
                <button onclick="showProposalScreen()">
                    Ask Me The Question Again?
                </button>
            ` : ""}
        `}

    `;

}

function showFinalScreen(){

    gameState.quitAttempts += 1;

    if (gameState.quitAttempts >= 2) {

        document.getElementById("game").innerHTML = `

            <h1 class="animate__animated animate__fadeOut" style="animation-delay: 1.5s;">
                Game over.
            </h1>

        `;

        setTimeout(resetGame, 2800);

        return;

    }

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated animate__wobble">${pickRandom(quitterPhrases)}</h1>

        <button onclick="showChallengeSelection()">
            One more round
        </button>

    `;

}

function resetGame(){

    gameState.hearts = 0;
    gameState.roundsCompleted = 0;
    gameState.quitAttempts = 0;
    currentPair = [];
    lastPickedId = null;
    recentlyPlayed = [];
    gamesEverPlayed = new Set();
    keptCardStreak = 0;

    updateHearts();

    document.getElementById("game").innerHTML = `

        <h1>Hunt for Love <img src=\"icons/heart-suit.svg\" class=\"title-icon\"></h1>

        <p id="introText">
            I have a question for you...
            <br>
            But first, you have to complete a few challenges!
        </p>

        <p class="art-credit"><span class="material-symbols-outlined">palette</span> All the artwork in this game was hand-drawn by me</p>

        <button id="startButton" onclick="showChallengeSelection()">
            Start Adventure
        </button>

    `;

}

function triggerHeartbeat(){

    const heartsPill = document.getElementById("heartsPill");

    heartsPill.classList.remove("animate__animated", "animate__heartBeat");

    // force reflow so the animation can restart if it fires again quickly
    void heartsPill.offsetWidth;

    heartsPill.classList.add("animate__animated", "animate__heartBeat");

    heartsPill.addEventListener("animationend", () => {
        heartsPill.classList.remove("animate__animated", "animate__heartBeat");
    }, { once: true });

}

function updateHearts(){

    const heartsDisplay = document.getElementById("heartsDisplay");

    let hearts = "";

    for (let i = 0; i < gameState.maxHearts; i++) {
        if (i < gameState.hearts) {
            hearts += `<span class="material-symbols-outlined heart-filled">favorite</span>`;
        } else {
            hearts += `<span class="material-symbols-outlined heart-empty">favorite</span>`;
        }
    }

    heartsDisplay.innerHTML = hearts;

}