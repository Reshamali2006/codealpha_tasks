const TOTAL_LEVELS = 20;

const homeScreen = document.getElementById("home-screen");
const levelScreen = document.getElementById("level-screen");
const gameScreen = document.getElementById("game-screen");

const modeTitle = document.getElementById("mode-title");
const levelsBox = document.getElementById("levels");
const gameTitle = document.getElementById("game-title");
const timer = document.getElementById("timer");
const wordDisplay = document.getElementById("word-display");
const wrongDisplay = document.getElementById("wrong-display");
const message = document.getElementById("message");
const keyboard = document.getElementById("keyboard");
const nextButton = document.getElementById("next-level-button");

const pauseOverlay = document.getElementById("pause-overlay");
const overlayTitle = document.getElementById("overlay-title");
const countdown = document.getElementById("countdown");

let currentMode = "basic";
let currentLevel = 1;
let secondsLeft = 0;
let timerId = null;
let countdownId = null;
let gameActive = false;


function modeName() {
    return currentMode[0].toUpperCase() + currentMode.slice(1);
}

function storageKey() {
    return `hangman-unlocked-${currentMode}`;
}

function unlockedLevel() {
    return Number(localStorage.getItem(storageKey())) || 1;
}

function saveUnlockedLevel(level) {
    localStorage.setItem(storageKey(), level);
}

function clearAllTimers() {
    clearInterval(timerId);
    clearInterval(countdownId);
    timerId = null;
    countdownId = null;
}

function showHome() {
    clearAllTimers();
    gameActive = false;
    homeScreen.hidden = false;
    levelScreen.hidden = true;
    gameScreen.hidden = true;
}

function showLevels() {
    clearAllTimers();
    gameActive = false;
    homeScreen.hidden = true;
    levelScreen.hidden = false;
    gameScreen.hidden = true;
    modeTitle.textContent = `${modeName()} Levels`;
    drawLevelButtons();
}

function drawLevelButtons() {
    const unlocked = unlockedLevel();
    levelsBox.innerHTML = "";

    for (let level = 1; level <= TOTAL_LEVELS; level++) {
        const button = document.createElement("button");
        const isLocked = level > unlocked;

        button.className = isLocked ? "level-button locked" : "level-button";
        button.disabled = isLocked;

        if (isLocked) {
            button.innerHTML = `🔒 Level ${level}<span>Complete Level ${level - 1}</span>`;
        } else {
            button.innerHTML = `▶ Level ${level}<span>Play now</span>`;
            button.addEventListener("click", () => startLevel(level));
        }

        levelsBox.appendChild(button);
    }
}

async function startLevel(level) {
    clearAllTimers();
    currentLevel = level;
    gameActive = false;
    nextButton.hidden = true;
    pauseOverlay.hidden = true;

    try {
        const response = await fetch("/start-level", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mode: currentMode,
                level: currentLevel
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Level could not start.");
        }

        homeScreen.hidden = true;
        levelScreen.hidden = true;
        gameScreen.hidden = false;

        gameTitle.textContent = `${modeName()} · Level ${currentLevel}`;
        wordDisplay.textContent = result.display.join(" ");
        wrongDisplay.textContent = "Wrong guesses: 0 / 6";
        message.textContent = "Find the hidden word!";
        secondsLeft = result.time_limit;
        timer.classList.remove("low-time");

        drawHangman(0);
        createKeyboard();
        gameActive = true;
        startTimer();
    } catch (error) {
        alert(error.message);
        showLevels();
    }
}

function createKeyboard() {
    keyboard.innerHTML = "";

    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        const button = document.createElement("button");
        button.className = "key";
        button.textContent = letter;
        button.addEventListener("click", () => guessLetter(letter, button));
        keyboard.appendChild(button);
    }
}

async function guessLetter(letter, button) {
    if (!gameActive) {
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch("/guess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ letter })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Letter could not be checked.");
        }

        const correct = result.display.includes(letter);
        button.classList.add(correct ? "correct" : "wrong");

        wordDisplay.textContent = result.display.join(" ");
        wrongDisplay.textContent = `Wrong guesses: ${result.wrong_guesses} / 6`;
        drawHangman(result.wrong_guesses);

        if (result.level_complete) {
            levelWon();
        } else if (result.game_over) {
            levelLost(result.answer);
        } else if (correct) {
            message.textContent = "Correct! Keep going!";
        } else {
            message.textContent = "Wrong letter. Try again!";
        }
    } catch (error) {
        button.disabled = false;
        message.textContent = error.message;
    }
}

function levelWon() {
    gameActive = false;
    clearInterval(timerId);
    timerId = null;
    disableKeyboard();

    const newUnlockedLevel = Math.min(TOTAL_LEVELS, currentLevel + 1);

    if (newUnlockedLevel > unlockedLevel()) {
        saveUnlockedLevel(newUnlockedLevel);
    }

    if (currentLevel === TOTAL_LEVELS) {
        message.textContent = `Amazing! You completed all ${TOTAL_LEVELS} ${modeName()} levels! 🏆`;
        return;
    }

    message.textContent = `Level ${currentLevel} complete! 🎉`;
    nextButton.textContent = `Next Level ${currentLevel + 1} →`;
    nextButton.hidden = false;
}

function levelLost(answer) {
    gameActive = false;
    clearInterval(timerId);
    timerId = null;
    disableKeyboard();
    message.textContent = `Game over! The word was ${answer}. Press Restart.`;
}

function disableKeyboard() {
    document.querySelectorAll(".key").forEach((button) => {
        button.disabled = true;
    });
}

function drawHangman(wrongGuesses) {
    const parts = [
        ".head",
        ".body",
        ".left-arm",
        ".right-arm",
        ".left-leg",
        ".right-leg"
    ];

    parts.forEach((part, index) => {
        document.querySelector(part).style.display =
            index < wrongGuesses ? "block" : "none";
    });
}

function startTimer() {
    updateTimer();

    timerId = setInterval(() => {
        secondsLeft -= 1;
        updateTimer();

        if (secondsLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            gameActive = false;
            disableKeyboard();
            message.textContent = "Time is up! Press Restart to play this level again.";
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, "0");

    timer.textContent = `⏱ ${minutes}:${seconds}`;
    timer.classList.toggle("low-time", secondsLeft <= 10);
}

document.querySelectorAll(".difficulty-card").forEach((button) => {
    button.addEventListener("click", () => {
        currentMode = button.dataset.mode;
        showLevels();
    });
});

document.getElementById("back-home").addEventListener("click", showHome);
document.getElementById("levels-button").addEventListener("click", showLevels);

document.getElementById("previous-button").addEventListener("click", () => {
    if (currentLevel > 1) {
        startLevel(currentLevel - 1);
    } else {
        showLevels();
    }
});

document.getElementById("restart-button").addEventListener("click", () => {
    startLevel(currentLevel);
});

nextButton.addEventListener("click", () => {
    startLevel(currentLevel + 1);
});

document.getElementById("pause-button").addEventListener("click", () => {
    if (!gameActive || timerId === null) {
        return;
    }

    clearInterval(timerId);
    timerId = null;
    gameActive = false;
    pauseOverlay.hidden = false;
    overlayTitle.textContent = "Game Paused";
    countdown.textContent = "Your timer is paused.";
});

document.getElementById("resume-button").addEventListener("click", () => {
    let number = 3;

    overlayTitle.textContent = "Get ready!";
    countdown.textContent = number;

    countdownId = setInterval(() => {
        number -= 1;

        if (number > 0) {
            countdown.textContent = number;
        } else {
            clearInterval(countdownId);
            countdownId = null;
            pauseOverlay.hidden = true;
            gameActive = true;
            startTimer();
        }
    }, 1000);
});