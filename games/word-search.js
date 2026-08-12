

const WORD_SEARCH_GRID_SIZE = 10;
const WORD_SEARCH_TIME_LIMIT_S = 45;
const WORD_SEARCH_WIN_THRESHOLD = 5; // out of 8 words per category

const WORD_SEARCH_CATEGORIES = [
    { name: "Animals", words: ["CAT", "DOG", "LION", "TIGER", "BEAR", "WOLF", "FOX", "DEER"] },
    { name: "Fruits", words: ["APPLE", "GRAPE", "MANGO", "LEMON", "PEACH","PLUM"] },
    { name: "Colors", words: ["RED", "BLUE", "GREEN", "BLACK", "WHITE", "BROWN", "PURPLE", "PINK"] },
    { name: "Sports", words: ["GOLF", "TENNIS", "BOXING", "SOCCER", "HOCKEY", "SKIING"] }
];

const WORD_SEARCH_DIRECTIONS = [
    [0, 1],  // right
    [1, 0],  // down
    [1, 1],  // diagonal down-right
    [1, -1]  // diagonal down-left
];

let wordSearchCategoryBag = [];
let lastWordSearchCategory = null;

function drawWordSearchCategory(){

    if (wordSearchCategoryBag.length === 0) {

        wordSearchCategoryBag = [...WORD_SEARCH_CATEGORIES].sort(() => Math.random() - 0.5);

        const nextUp = wordSearchCategoryBag[wordSearchCategoryBag.length - 1];
        if (wordSearchCategoryBag.length > 1 && nextUp === lastWordSearchCategory) {
            [wordSearchCategoryBag[wordSearchCategoryBag.length - 1], wordSearchCategoryBag[0]] =
                [wordSearchCategoryBag[0], wordSearchCategoryBag[wordSearchCategoryBag.length - 1]];
        }

    }

    const category = wordSearchCategoryBag.pop();
    lastWordSearchCategory = category;
    return category;

}

let wordSearchState = {
    category: null,
    grid: [], // 2D array of letters
    placements: [], // [{ word, cells: [[r,c], ...] }]
    foundWords: new Set(),
    firstClick: null, // {r, c} of the first cell clicked, or null
    timeLeft: WORD_SEARCH_TIME_LIMIT_S,
    timerId: null,
    phase: "playing" // playing | done
};

function buildWordSearchGrid(words){

    const size = WORD_SEARCH_GRID_SIZE;
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const placements = [];

    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    sortedWords.forEach((word) => {

        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 200) {

            attempts += 1;

            const [dr, dc] = pickRandom(WORD_SEARCH_DIRECTIONS);
            const startRow = Math.floor(Math.random() * size);
            const startCol = Math.floor(Math.random() * size);
            const endRow = startRow + dr * (word.length - 1);
            const endCol = startCol + dc * (word.length - 1);

            if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

            const cells = [];
            let fits = true;

            for (let i = 0; i < word.length; i++) {
                const r = startRow + dr * i;
                const c = startCol + dc * i;
                const existing = grid[r][c];
                if (existing !== null && existing !== word[i]) {
                    fits = false;
                    break;
                }
                cells.push([r, c]);
            }

            if (!fits) continue;

            cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
            placements.push({ word, cells });
            placed = true;

        }

    });

    // fill remaining empty cells with random letters
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === null) {
                grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }

    return { grid, placements };

}

function startWordSearchGame(){

    if (wordSearchState.timerId) clearInterval(wordSearchState.timerId);

    const category = drawWordSearchCategory();
    const { grid, placements } = buildWordSearchGrid(category.words);

    wordSearchState = {
        category,
        grid,
        placements,
        foundWords: new Set(),
        firstClick: null,
        timeLeft: WORD_SEARCH_TIME_LIMIT_S,
        timerId: null,
        phase: "playing"
    };

    renderWordSearch();

    playSound("nostalgia");

    wordSearchState.timerId = setInterval(() => {
        wordSearchState.timeLeft -= 1;
        if (wordSearchState.timeLeft <= 0) {
            endWordSearch();
            return;
        }
        const timerEl = document.getElementById("wordSearchTimer");
        if (timerEl) timerEl.textContent = `${wordSearchState.timeLeft}s`;
    }, 1000);

}

function handleWordSearchCellClick(r, c){

    if (wordSearchState.phase !== "playing") return;

    if (!wordSearchState.firstClick) {
        wordSearchState.firstClick = { r, c };
        renderWordSearch();
        return;
    }

    const first = wordSearchState.firstClick;
    wordSearchState.firstClick = null;

    if (first.r === r && first.c === c) {
        renderWordSearch(); // clicked the same cell twice, just deselect
        return;
    }

    // does this line match any unplaced word's cells (in either direction)?
    const match = wordSearchState.placements.find((p) => {
        if (wordSearchState.foundWords.has(p.word)) return false;
        const cellsForward = p.cells;
        const startsMatch = (cellsForward[0][0] === first.r && cellsForward[0][1] === first.c &&
            cellsForward[cellsForward.length - 1][0] === r && cellsForward[cellsForward.length - 1][1] === c);
        const endsMatch = (cellsForward[cellsForward.length - 1][0] === first.r && cellsForward[cellsForward.length - 1][1] === first.c &&
            cellsForward[0][0] === r && cellsForward[0][1] === c);
        return startsMatch || endsMatch;
    });

    if (match) {
        wordSearchState.foundWords.add(match.word);
        if (wordSearchState.foundWords.size >= wordSearchState.category.words.length) {
            renderWordSearch();
            setTimeout(() => endWordSearch(), RESULT_REVEAL_MS);
            return;
        }
    }

    renderWordSearch();

}

function renderWordSearch(){

    const foundCellKeys = new Set();
    wordSearchState.placements.forEach((p) => {
        if (wordSearchState.foundWords.has(p.word)) {
            p.cells.forEach(([r, c]) => foundCellKeys.add(`${r}_${c}`));
        }
    });

    const gridHtml = wordSearchState.grid.map((row, r) =>
        row.map((letter, c) => {
            const key = `${r}_${c}`;
            const isFound = foundCellKeys.has(key);
            const isSelected = wordSearchState.firstClick && wordSearchState.firstClick.r === r && wordSearchState.firstClick.c === c;
            const classes = ["word-search-cell"];
            if (isFound) classes.push("word-search-cell-found");
            if (isSelected) classes.push("word-search-cell-selected");
            return `<div class="${classes.join(" ")}" onclick="handleWordSearchCellClick(${r},${c})">${letter}</div>`;
        }).join("")
    ).join("");

    const wordListHtml = wordSearchState.category.words.map((word) => `
        <span class="word-search-word ${wordSearchState.foundWords.has(word) ? "word-search-word-found" : ""}">${word}</span>
    `).join("");

    document.getElementById("game").innerHTML = `

        <div class="heist-header">
            <h1>Word Search</h1>
            <p class="heist-tries" id="wordSearchTimer">${wordSearchState.timeLeft}s</p>
        </div>

        <p class="catch-hint" style= "font-size: 14px; margin-bottom: 10px;">
            Category: <strong>${wordSearchState.category.name}</strong> — click a word's first and last letter
        </p>

        <div class="word-search-grid" style="grid-template-columns: repeat(${WORD_SEARCH_GRID_SIZE}, 1fr);">
            ${gridHtml}
        </div>

        <div class="word-search-words">${wordListHtml}</div>

    `;

}

function endWordSearch(){

    if (wordSearchState.phase !== "playing") return;
    wordSearchState.phase = "done";

    clearInterval(wordSearchState.timerId);
    stopSound("nostalgia");

    const foundCount = wordSearchState.foundWords.size;
    const isWin = foundCount >= WORD_SEARCH_WIN_THRESHOLD;

    renderWordSearchReveal();

    setTimeout(() => finishRound(isWin, 2), RESULT_REVEAL_MS);

}

function renderWordSearchReveal(){

    const foundCellKeys = new Set();
    const missedCellKeys = new Set();

    wordSearchState.placements.forEach((p) => {
        const target = wordSearchState.foundWords.has(p.word) ? foundCellKeys : missedCellKeys;
        p.cells.forEach(([r, c]) => target.add(`${r}_${c}`));
    });

    const gridHtml = wordSearchState.grid.map((row, r) =>
        row.map((letter, c) => {
            const key = `${r}_${c}`;
            const classes = ["word-search-cell"];
            if (foundCellKeys.has(key)) classes.push("word-search-cell-found");
            else if (missedCellKeys.has(key)) classes.push("word-search-cell-missed");
            return `<div class="${classes.join(" ")}">${letter}</div>`;
        }).join("")
    ).join("");

    const wordListHtml = wordSearchState.category.words.map((word) => `
        <span class="word-search-word ${wordSearchState.foundWords.has(word) ? "word-search-word-found" : "word-search-word-missed"}">${word}</span>
    `).join("");

    document.getElementById("game").innerHTML = `

        <h1>Time's up!</h1>

        <p class="catch-hint">Here are the remaining words</p>

        <div class="word-search-grid" style="grid-template-columns: repeat(${WORD_SEARCH_GRID_SIZE}, 1fr);">
            ${gridHtml}
        </div>

        <div class="word-search-words">${wordListHtml}</div>

    `;

}