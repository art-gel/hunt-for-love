// The finale — shown once hearts hit maxHearts. "Will you go on a
// date with me?" with a No button that dodges the cursor, leading
// to a short form, submitted to Formspree — no backend/database
// needed for a static GitHub Pages site, and no secrets exposed in
// this public code, since a Formspree form endpoint can only ever
// submit to that one form, not access anything else.
//
// SETUP REQUIRED: replace FORMSPREE_ENDPOINT below with your own
// form's URL from formspree.io (sign up, New Form, copy the
// endpoint — looks like https://formspree.io/f/xxxxxxxx). Submit
// the form once yourself after deploying to confirm it shows up in
// your Formspree dashboard.

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xrenndbd"; // <-- replace this before deploying

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

    // #game has backdrop-filter set, which makes it the containing
    // block for any position:fixed descendant in most browsers —
    // meaning "fixed" would actually be relative to #game's own box,
    // not the real viewport. Moving the button to document.body
    // sidesteps that entirely.
    if (btn.parentElement !== document.body) {
        document.body.appendChild(btn);
    }

    const btnWidth = btn.offsetWidth || 80;
    const btnHeight = btn.offsetHeight || 46;

    // confine the dodge to a box around the center of the screen,
    // rather than the full viewport — keeps it from ever reaching
    // the edges or corners
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
                Name (First name + last initial is fine)
                <input type="text" name="name" placeholder="e.g.Harry P." required>
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
                <textarea name="aboutYou" rows="3"></textarea>
            </label>

            <button type="submit" id="proposalSubmitBtn">
                Submit
            </button>

        </form>

    `;

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
        aboutYou: form.aboutYou.value
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

    document.getElementById("game").innerHTML = `

        <h1 class="animate__animated animate__tada">I'm looking forward to meeting you!💕</h1>

        <p>We'll be in touch soon.</p>

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