const PASSWORD_ENTRIES = [
    { word: "JAZZ", hint: "Music genre", extraHint: "Often played with brass instruments" },
    { word: "SPONGEBOB", hint: "Cartoon character", extraHint: "Owns a pineapple house" },
    { word: "SWEETHEART", hint: "A term of endearment", extraHint: "Two words: Something sugary + organ" },
    { word: "OCTOPUS", hint: "Sea creature", extraHint: "Has three hearts and is one of Angel's favorite animals" },
    { word: "SURPRISE", hint: "Unexpected", extraHint: "A type of party or gift for someone" },
    { word: "PUZZLE", hint: "Brain teaser", extraHint: "Jigsaw pieces make up one of these" },
    { word: "TARANTULA", hint: "Feared creature", extraHint: "Insect" },
    { word: "LUIGI", hint: "Video game character", extraHint: "Italian plumber" },
    { word: "MINION", hint: "Cartoon character", extraHint: "Loves bananas" },
    { word: "HEART", hint: "Organ", extraHint: "Can't win the game without it" }
];

const PASSWORD_MAX_WRONG = 6;
const PASSWORD_EXTRA_HINT_THRESHOLD = 3; // wrong guesses needed to unlock the extra hint

const PASSWORD_STAGES = ["🙂", "😐", "😟", "😧", "😢", "😭", "💀"];

function renderCharacterStage(wrongCount){

    const emoji = PASSWORD_STAGES[wrongCount];

    return `<div class="password-character-wrap"><span>${emoji}</span></div>`;

}

let passwordState = {
    word: "",
    hint: "",
    extraHint: "",
    extraHintRevealed: false,
    guessed: new Set(),
    wrongCount: 0
};

let passwordKeyListener = null;

function startPasswordGame(){

    const entry = PASSWORD_ENTRIES[Math.floor(Math.random() * PASSWORD_ENTRIES.length)];

    passwordState = {
        word: entry.word.toUpperCase(),
        hint: entry.hint,
        extraHint: entry.extraHint,
        extraHintRevealed: false,
        guessed: new Set(),
        wrongCount: 0
    };

    attachPasswordKeyListener();
    renderPassword();

    playSound("nostalgia");

}

function attachPasswordKeyListener(){

    removePasswordKeyListener();

    passwordKeyListener = (e) => {
        const letter = e.key.toUpperCase();
        if (/^[A-Z]$/.test(letter)) {
            handlePasswordGuess(letter);
        }
    };

    document.addEventListener("keydown", passwordKeyListener);

}

function removePasswordKeyListener(){

    if (passwordKeyListener) {
        document.removeEventListener("keydown", passwordKeyListener);
        passwordKeyListener = null;
    }

}

function renderPassword(){

    const displayWord = passwordState.word
        .split("")
        .map((letter) => (passwordState.guessed.has(letter) ? letter : "_"))
        .join(" ");

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const lettersHtml = alphabet.map((letter) => {
        const isGuessed = passwordState.guessed.has(letter);
        const isCorrect = isGuessed && passwordState.word.includes(letter);
        const isWrong = isGuessed && !passwordState.word.includes(letter);

        const stateClass = isCorrect ? "correct" : isWrong ? "wrong" : "";

        return `
            <button class="password-letter ${stateClass}" ${isGuessed ? "disabled" : ""} onclick="handlePasswordGuess('${letter}')">
                ${letter}
            </button>
        `;
    }).join("");

    document.getElementById("game").innerHTML = `

        <h1>Password</h1>

        ${renderCharacterStage(passwordState.wrongCount)}

        <p class="password-word">${displayWord}</p>

        <p class="password-hint">Hint: ${passwordState.hint}</p>

        ${passwordState.wrongCount >= PASSWORD_EXTRA_HINT_THRESHOLD ? (
            passwordState.extraHintRevealed
                ? `<p class="password-hint">Extra hint: ${passwordState.extraHint}</p>`
                : `<button onclick="revealExtraHint()">Show Extra Hint</button>`
        ) : ""}

        <p class="match-timer">${PASSWORD_MAX_WRONG - passwordState.wrongCount} wrong guesses left</p>

        <div class="password-keyboard">
            ${lettersHtml}
        </div>

    `;

}

function renderPasswordReveal(isWin){

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated ${isWin ? "animate__tada" : "animate__headShake"}">
            ${isWin ? "You got it!" : "Out of guesses"}
        </h1>

        <p>The password was: <span class="password-word-inline">${passwordState.word}</span></p>

    `;

}

function revealExtraHint(){
    passwordState.extraHintRevealed = true;
    renderPassword();
}

function handlePasswordGuess(letter){

    if (passwordState.guessed.has(letter)) return;

    passwordState.guessed.add(letter);

    if (!passwordState.word.includes(letter)) {
        passwordState.wrongCount += 1;
    }

    const isWordComplete = passwordState.word
        .split("")
        .every((l) => passwordState.guessed.has(l));

    if (isWordComplete) {
        removePasswordKeyListener();
        stopSound("nostalgia");
        renderPasswordReveal(true);
        setTimeout(() => finishRound(true, 3), RESULT_REVEAL_MS);
        return;
    }

    if (passwordState.wrongCount >= PASSWORD_MAX_WRONG) {
        removePasswordKeyListener();
        stopSound("nostalgia");
        renderPasswordReveal(false);
        setTimeout(() => finishRound(false), RESULT_REVEAL_MS);
        return;
    }

    renderPassword();

}