from flask import Flask, jsonify, render_template, request, session
import random

app = Flask(__name__)
app.secret_key = "hangman-quest-2026"


WORDS = {
    "basic": {
        3: ["CAT", "DOG", "SUN", "PEN", "CUP"],
        4: ["MOON", "STAR", "FISH", "TREE", "CAKE"],
        5: ["APPLE", "BREAD", "GRAPE", "CHAIR", "TIGER"],
        6: ["PYTHON", "GARDEN", "ROCKET", "PLANET", "SCHOOL"],
        7: ["RAINBOW", "DOLPHIN", "JOURNEY", "LAPTOP"],
        8: ["MOUNTAIN", "NOTEBOOK", "ELEPHANT", "BUILDING"],
    },
    "medium": {
        4: ["CLOUD", "RIVER", "DREAM", "MUSIC"],
        5: ["OCEAN", "BRAVE", "SMILE", "LIGHT"],
        6: ["FOREST", "PUZZLE", "CASTLE", "WINTER"],
        7: ["FREEDOM", "SUNRISE", "KINGDOM", "BALANCE"],
        8: ["DISCOVER", "VACATION", "AIRPLANE", "TREASURE"],
        9: ["ADVENTURE", "CHOCOLATE", "BUTTERFLY", "KNOWLEDGE"],
        10: ["PLAYGROUND", "FRIENDSHIP", "BASKETBALL"],
    },
    "hard": {
        5: ["QUARTZ", "ZEPHYR", "JAZZED", "VORTEX"],
        6: ["ECLIPSE", "MYSTIC", "OXYGEN", "JUNGLE"],
        7: ["WHISPER", "CRYSTAL", "PHOENIX", "QUANTUM"],
        8: ["LABYRINTH", "HORIZONS", "SYMPHONY", "DYNAMICS"],
        9: ["ALGORITHM", "BLUEPRINT", "EQUILIBRIUM"],
        10: ["ASTRONOMY", "INNOVATION", "ARCHITECTS"],
        11: ["PROGRAMMING", "CELEBRATION", "DEVELOPMENT"],
        12: ["CONVERSATION", "EXPERIMENTAL", "COMPUTERIZED"],
    },
}


def get_word_length(mode, level):
    if mode == "basic":
        return min(level + 2, 8)

    if mode == "medium":
        return min(level + 3, 10)

    return min(level + 4, 12)


def get_time_limit(mode, level):
    if mode == "basic":
        if level <= 5:
            return 45
        if level <= 10:
            return 80
        return 120

    if mode == "medium":
        if level <= 5:
            return 35
        if level <= 10:
            return 60
        return 90

    if level <= 5:
        return 25
    if level <= 10:
        return 45
    return 60


def display_word(word, guessed_letters):
    return [letter if letter in guessed_letters else "_" for letter in word]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/start-level", methods=["POST"])
def start_level():
    data = request.get_json() or {}
    mode = str(data.get("mode", "basic")).lower()

    try:
        level = int(data.get("level", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid level."}), 400

    if mode not in WORDS:
        return jsonify({"error": "Choose Basic, Medium, or Hard."}), 400

    if level < 1 or level > 20:
        return jsonify({"error": "Level must be from 1 to 20."}), 400

    word_length = get_word_length(mode, level)
    word = random.choice(WORDS[mode][word_length])

    session["mode"] = mode
    session["level"] = level
    session["word"] = word
    session["guessed_letters"] = []
    session["wrong_guesses"] = 0

    return jsonify({
        "level": level,
        "mode": mode,
        "display": ["_"] * len(word),
        "word_length": len(word),
        "wrong_guesses": 0,
        "time_limit": get_time_limit(mode, level)
    })


@app.route("/guess", methods=["POST"])
def guess():
    if "word" not in session:
        return jsonify({"error": "Start a level first."}), 400

    data = request.get_json() or {}
    letter = str(data.get("letter", "")).upper()

    if len(letter) != 1 or not letter.isalpha():
        return jsonify({"error": "Choose one letter."}), 400

    word = session["word"]
    guessed_letters = session.get("guessed_letters", [])
    wrong_guesses = session.get("wrong_guesses", 0)

    if letter not in guessed_letters:
        guessed_letters.append(letter)

        if letter not in word:
            wrong_guesses += 1

    display = display_word(word, guessed_letters)
    word_complete = "_" not in display
    game_over = wrong_guesses >= 6

    session["guessed_letters"] = guessed_letters
    session["wrong_guesses"] = wrong_guesses

    return jsonify({
        "display": display,
        "wrong_guesses": wrong_guesses,
        "word_complete": word_complete,
        "level_complete": word_complete,
        "game_over": game_over,
        "answer": word if word_complete or game_over else "",
        "current_level": session["level"],
        "mode": session["mode"]
    })


if __name__ == "__main__":
    app.run(debug=True)