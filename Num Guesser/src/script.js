const secretNumber =
    Math.floor(
        1000 + Math.random() * 9000
    ).toString();

const guessInput =
    document.getElementById("guessInput");

const guessBtn =
    document.getElementById("guessBtn");

const message =
    document.getElementById("message");

const attemptsText =
    document.getElementById("attempts");

const bestScoreText =
    document.getElementById("bestScore");

const historyList =
    document.getElementById("historyList");

let attempts = 0;

/* LOAD BEST SCORE */

let bestScore =
    localStorage.getItem("bestScore");

if (bestScore === null) {

    bestScore = "-";
}

bestScoreText.textContent =
    `🏆 Personal Best: ${bestScore}`;

/* EVENT LISTENERS */

guessBtn.addEventListener(
    "click",
    submitGuess
);

guessInput.addEventListener(
    "keypress",
    (event) => {

        if (event.key === "Enter") {

            submitGuess();
        }

    }
);

/* MOBILE INPUT SANITIZATION */

guessInput.addEventListener(
    "input",
    () => {

        guessInput.value =
            guessInput.value
                .replace(/\D/g, "")
                .slice(0, 4);

    }
);

/* MAIN GAME FUNCTION */

function submitGuess() {

    const guess =
        guessInput.value;

    /* VALIDATION */

    if (!/^\d{4}$/.test(guess)) {

        message.textContent =
            "Enter exactly 4 digits";

        return;
    }

    attempts++;

    attemptsText.textContent =
        `Attempts: ${attempts}`;

    /* WIN CONDITION */

    if (guess === secretNumber) {

        message.textContent =
            "🎉 Correct!";

        message.classList.add("win");

        addHistory(
            guess,
            "WIN"
        );

        saveBestScore();

        guessInput.disabled = true;

        guessBtn.disabled = true;

        return;
    }

    let correctDigits = 0;

    let correctPositions = 0;

    /* FIXED DIGIT COUNT LOGIC */

    const secretArr =
        secretNumber.split("");

    const guessArr =
        guess.split("");

    for (let digit of guessArr) {

        const index =
            secretArr.indexOf(digit);

        if (index !== -1) {

            correctDigits++;

            secretArr[index] = null;
        }

    }

    /* COUNT CORRECT POSITIONS */

    for (let i = 0; i < 4; i++) {

        if (
            guess[i] ===
            secretNumber[i]
        ) {

            correctPositions++;
        }

    }

    const feedback =
        `${correctDigits}C ${correctPositions}P`;

    message.textContent =
        feedback;

    message.classList.remove("win");

    addHistory(
        guess,
        feedback
    );

    guessInput.value = "";

    guessInput.focus();

}

/* HISTORY PANEL */

function addHistory(
    guess,
    feedback
) {

    const historyItem =
        document.createElement("div");

    historyItem.classList.add(
        "history-item"
    );

    historyItem.innerHTML = `

        <span class="guess-number">
            ${guess}
        </span>

        <span class="feedback">
            ${feedback}
        </span>

    `;

    historyList.prepend(
        historyItem
    );

}

/* SAVE PERSONAL BEST */

function saveBestScore() {

    const currentBest =
        localStorage.getItem("bestScore");

    if (
        currentBest === null ||
        attempts < Number(currentBest)
    ) {

        localStorage.setItem(
            "bestScore",
            attempts
        );

        bestScoreText.textContent =
            `🏆 Personal Best: ${attempts}`;
    }

}

console.log(
    "Secret Number:",
    secretNumber
);