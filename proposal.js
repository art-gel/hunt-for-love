const FORMSPREE_ENDPOINT = "https://formspree.io/f/xrenndbd";

function showProposalScreen(){

    document.getElementById("game").innerHTML = `

        <h1>Will you go on a date with me?</h1>

        <div class="proposal-buttons">
            <button onclick="showProposalForm()">
                Yes
            </button>

            <button id="noButton" class="no-button" onmouseenter="dodgeNoButton(event)" onclick="dodgeNoButton(event)">
                No
            </button>
        </div>

    `;

}

function dodgeNoButton(event){

    const btn = document.getElementById("noButton");
    if (!btn) return;

    if (btn.parentElement !== document.body) {
        document.body.appendChild(btn);
    }

    const btnWidth = btn.offsetWidth || 80;
    const btnHeight = btn.offsetHeight || 46;

    const regionWidth = window.innerWidth * 0.5;
    const regionHeight = window.innerHeight * 0.5;
    const regionLeft = (window.innerWidth - regionWidth) / 2;
    const regionTop = (window.innerHeight - regionHeight) / 2;

    const newLeft = regionLeft + Math.random() * Math.max(0, regionWidth - btnWidth);
    const newTop = regionTop + Math.random() * Math.max(0, regionHeight - btnHeight);

    btn.style.position = "fixed";
    btn.style.left = `${newLeft}px`;
    btn.style.top = `${newTop}px`;
    btn.style.margin = "0";

}

function showProposalForm(){

    const orphanedNoButton = document.getElementById("noButton");
    if (orphanedNoButton) orphanedNoButton.remove();

    document.getElementById("game").innerHTML = `

        <h1>Almost there!</h1>

        <form id="proposalForm" class="proposal-form" onsubmit="handleProposalSubmit(event)">

            <label>
                First Name
                <input type="text" name="name" placeholder="e.g. Harry P." required>
            </label>

            <label>
                Date suggestions
                <input type="text" name="dateSuggestions" placeholder="Where should we go?">
            </label>

            <label>
                Which days are you usually free?
                <input type="text" name="freeDays" placeholder="e.g. weekends, Tuesday evenings">
            </label>

            <label>
                Tell me something about yourself!
                <textarea name="aboutYou" rows="3" placeholder="e.g. I'm a nerd :)"></textarea>
            </label>

            <label>
                Any thoughts on this game?
                <textarea name="gameFeedback" rows="3" placeholder="Tell me about your experience!"></textarea>
            </label>

            <button type="submit" id="proposalSubmitBtn">
                Submit
            </button>

        </form>

    `;

}

function getProposalSourceId(){
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
}

async function handleProposalSubmit(event){

    event.preventDefault();

    const form = event.target;
    const submitBtn = document.getElementById("proposalSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    const data = {
        name: form.name.value,
        dateSuggestions: form.dateSuggestions.value,
        freeDays: form.freeDays.value,
        aboutYou: form.aboutYou.value,
        gameFeedback: form.gameFeedback.value,
        linkId: getProposalSourceId()
    };

    try {

        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error("Formspree submission returned an error:", response.status);
        }

    } catch (err) {
        // even if the network request fails, still show the closing
        // message — don't leave the person stuck on a broken form
        console.error("Proposal form submission failed:", err);
    }

    showProposalThanks();
    triggerConfetti();

}

function showProposalThanks(){

    gameState.hasProposed = true;

    const unplayedGames = challenges
        .filter((c) => !gamesEverPlayed.has(c.id))
        .map((c) => c.title
            .replace(/<span class="material-symbols-outlined">.*?<\/span>/g, "") // drop the whole icon element, name included
            .replace(/<[^>]+>/g, "") // catch any other stray tags
            .trim()
        );

    const unplayedMessage = unplayedGames.length > 0
        ? `<p class="proposal-closing-text">You haven't played ${unplayedGames.join(", ")} yet — go check them out!</p>`
        : "";

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated animate__tada">I can't wait to see you! <img src=\"icons/heart-suit.svg\" class=\"title-icon\"></h1>

            ${unplayedMessage}

        <button onclick="continuePlayingAfterProposal()">
            Keep Playing
        </button>

    `;

}

function continuePlayingAfterProposal(){

    gameState.hearts = 0;
    gameState.roundsCompleted = 0;
    updateHearts();

    showChallengeSelection();

}

function triggerConfetti(){

    const colors = ["#e9a9b8", "#c3a47d", "#b16f83", "#7e1234", "#f4a6c1", "#a8d8f0"];
    const container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);

    const particleCount = 70;

    for (let i = 0; i < particleCount; i++) {

        const particle = document.createElement("div");
        particle.className = "confetti-piece";

        const fromLeft = i % 2 === 0;
        const startY = Math.random() * 100;
        const travelX = fromLeft
            ? 30 + Math.random() * 50
            : -(30 + Math.random() * 50);
        const travelY = -20 + Math.random() * 140;
        const rotation = Math.random() * 720 - 360;
        const delay = Math.random() * 0.4;
        const duration = 1.8 + Math.random() * 1.2;

        particle.style.left = fromLeft ? "-2%" : "102%";
        particle.style.top = `${startY}%`;
        particle.style.background = pickRandom(colors);
        particle.style.setProperty("--tx", `${travelX}vw`);
        particle.style.setProperty("--ty", `${travelY}vh`);
        particle.style.setProperty("--rot", `${rotation}deg`);
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;

        container.appendChild(particle);

    }

    setTimeout(() => container.remove(), 3500);

}