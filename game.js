const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const targetLabelEl = document.getElementById("targetLabel");
const modeSelect = document.getElementById("modeSelect");
const restartBtn = document.getElementById("restartBtn");
const messageEl = document.getElementById("message");
const wordBadgeEl = document.getElementById("wordBadge");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const speedMs = 120;

const modes = {
  nouns_vs_verbs: {
    label: "Nouns vs Verbs (eat nouns)",
    targetLabel: "Nouns",
    targetWords: ["river", "teacher", "planet", "window", "puppy", "mountain"],
    distractorWords: ["run", "explain", "dance", "measure", "listen", "grow"]
  },
  positive_vs_negative_traits: {
    label: "Positive vs Negative traits (eat positive)",
    targetLabel: "Positive traits",
    targetWords: ["kind", "honest", "brave", "patient", "curious", "fair"],
    distractorWords: ["rude", "selfish", "lazy", "cruel", "arrogant", "jealous"]
  },
  opinions_vs_facts: {
    label: "Opinions vs Facts (eat facts)",
    targetLabel: "Facts",
    targetWords: [
      "Water boils at 100C",
      "Earth orbits the Sun",
      "Humans have 206 bones",
      "The Pacific is largest",
      "Plants need sunlight",
      "The moon reflects light"
    ],
    distractorWords: [
      "Summer is best",
      "Math is boring",
      "Cats are superior",
      "Rainy days are cozy",
      "Pizza is overrated",
      "Blue is prettiest"
    ]
  }
};

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let score = 0;
let best = 0;
let currentModeKey = "nouns_vs_verbs";
let gameOver = false;
let intervalId = null;

function initModeSelect() {
  Object.entries(modes).forEach(([key, mode]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = mode.label;
    modeSelect.append(option);
  });

  modeSelect.value = currentModeKey;
  modeSelect.addEventListener("change", () => {
    currentModeKey = modeSelect.value;
    resetGame();
  });
}

function randomCell() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

function randomWordData() {
  const mode = modes[currentModeKey];
  const isTarget = Math.random() < 0.6;
  const pool = isTarget ? mode.targetWords : mode.distractorWords;
  const word = pool[Math.floor(Math.random() * pool.length)];
  return { word, isTarget };
}

function spawnFood() {
  let cell = randomCell();
  while (snake.some((part) => part.x === cell.x && part.y === cell.y)) {
    cell = randomCell();
  }
  const wordData = randomWordData();
  food = { ...cell, ...wordData };
  wordBadgeEl.textContent = `Word: ${food.word}`;
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  messageEl.textContent = "";
  updateHud();
  spawnFood();
}

function updateHud() {
  const mode = modes[currentModeKey];
  scoreEl.textContent = score;
  bestEl.textContent = best;
  targetLabelEl.textContent = mode.targetLabel;
}

function endGame() {
  gameOver = true;
  messageEl.textContent = "Game over — press Restart to try again.";
}

function moveSnake() {
  if (gameOver) return;

  direction = nextDirection;
  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  const hitWall =
    newHead.x < 0 ||
    newHead.x >= tileCount ||
    newHead.y < 0 ||
    newHead.y >= tileCount;

  const hitSelf = snake.some((part) => part.x === newHead.x && part.y === newHead.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    if (food.isTarget) {
      score += 1;
      messageEl.textContent = `Great! "${food.word}" is part of ${modes[currentModeKey].targetLabel}.`;
    } else {
      score -= 1;
      snake.pop();
      snake.pop();
      messageEl.textContent = `Oops! "${food.word}" is not ${modes[currentModeKey].targetLabel}.`;
      if (snake.length < 2) {
        endGame();
      }
    }
    best = Math.max(best, score);
    updateHud();
    spawnFood();
  } else {
    snake.pop();
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f1940";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < tileCount; i += 1) {
    for (let j = 0; j < tileCount; j += 1) {
      if ((i + j) % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
      }
    }
  }

  ctx.fillStyle = food.isTarget ? "#38d996" : "#ef6a8a";
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

  ctx.fillStyle = "#fffbcc";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(food.word.slice(0, 8), food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);

  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? "#89a7ff" : "#bfd0ff";
    ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
  });
}

function tick() {
  moveSnake();
  drawBoard();
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  const map = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 }
  };

  const proposed = map[key];
  if (!proposed) return;

  const reversing = proposed.x === -direction.x && proposed.y === -direction.y;
  if (!reversing) {
    nextDirection = proposed;
  }
});

restartBtn.addEventListener("click", () => resetGame());

initModeSelect();
resetGame();
intervalId = window.setInterval(tick, speedMs);

window.addEventListener("beforeunload", () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
