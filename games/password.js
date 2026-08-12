const PASSWORD_ENTRIES = [
    { word: "SPONGEBOB", hint: "Cartoon character", extraHint: "Owns a pineapple house" },
    { word: "SWEETHEART", hint: "A term of endearment", extraHint: "Two words: Something sugary + organ" },
    { word: "OCTOPUS", hint: "Sea creature", extraHint: "Has three hearts and eight arms" },
    { word: "SURPRISE", hint: "Unexpected", extraHint: "A type of party or gift for someone" },
    { word: "PUZZLE", hint: "Brain teaser", extraHint: "Jigsaw pieces make up one of these" },
    { word: "HEART", hint: "Organ", extraHint: "Can't win the game without it" }
];

const PASSWORD_MAX_WRONG = 6;
const PASSWORD_EXTRA_HINT_THRESHOLD = 3; // wrong guesses needed to unlock the extra hint

let passwordState = {
    word: "",
    hint: "",
    extraHint: "",
    guessed: new Set(),
    wrongCount: 0
};

let passwordKeyListener = null;

// A shuffled "bag" drawn from without replacement, so every word in
// PASSWORD_ENTRIES gets used once before any repeats. When the bag
// empties, it reshuffles a fresh one — with a small check so the
// last word of one cycle can't immediately repeat as the first word
// of the next.
let passwordBag = [];
let lastPasswordEntry = null;

function drawPasswordEntry(){

    if (passwordBag.length === 0) {

        passwordBag = [...PASSWORD_ENTRIES].sort(() => Math.random() - 0.5);

        const nextUp = passwordBag[passwordBag.length - 1];
        if (passwordBag.length > 1 && nextUp === lastPasswordEntry) {
            [passwordBag[passwordBag.length - 1], passwordBag[0]] = [passwordBag[0], passwordBag[passwordBag.length - 1]];
        }

    }

    const entry = passwordBag.pop();
    lastPasswordEntry = entry;
    return entry;

}

function startPasswordGame(){

    const entry = drawPasswordEntry();
    passwordState = {
        word: entry.word.toUpperCase(),
        hint: entry.hint,
        extraHint: entry.extraHint,
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

        <p class="password-word">${displayWord}</p>

        <p class="password-hint">Hint: ${passwordState.hint}</p>

        ${passwordState.wrongCount >= PASSWORD_EXTRA_HINT_THRESHOLD ? `
            <p class="password-hint"> Extra hint: ${passwordState.extraHint}</p>
        ` : ""}

        <p class="password-tries-corner">${PASSWORD_MAX_WRONG - passwordState.wrongCount} ${(PASSWORD_MAX_WRONG - passwordState.wrongCount) === 1 ? "guess" : "guesses"} left</p>

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

        <p>The password was: <span style="font-size: 17px;">${passwordState.word}</span></p>

    `;

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