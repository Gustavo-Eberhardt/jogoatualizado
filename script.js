const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

const scoreEl = document.getElementById("score")
const stateEl = document.getElementById("state")
const bestEl = document.getElementById("snake-best")
const mapEl = document.getElementById("map")

const CELL = 24
const COLS = canvas.width / CELL
const ROWS = canvas.height / CELL

const STATES = {
    READY: "PRONTO",
    PLAYING: "JOGANDO",
    PAUSED: "PAUSADO",
    OVER: "GAME OVER"
}

// =====================================================
// MAPAS
// =====================================================

const maps = {
    1: {
        name: "ABERTO",
        speed: 90,

        obstacles: [
            { x: 4, y: 4 },
            { x: 5, y: 4 },
            { x: 6, y: 4 },

            { x: 13, y: 12 },
            { x: 14, y: 12 },
            { x: 15, y: 12 }
        ]
    },

    2: {
        name: "TÁTICO",
        speed: 125,

        obstacles: [
            { x: 3, y: 3 },
            { x: 4, y: 3 },
            { x: 5, y: 3 },
            { x: 6, y: 3 },

            { x: 13, y: 3 },
            { x: 14, y: 3 },
            { x: 15, y: 3 },

            { x: 3, y: 12 },
            { x: 3, y: 13 },
            { x: 3, y: 14 },

            { x: 15, y: 12 },
            { x: 15, y: 13 },
            { x: 15, y: 14 },

            { x: 8, y: 7 },
            { x: 9, y: 7 },
            { x: 10, y: 7 },

            { x: 8, y: 12 },
            { x: 9, y: 12 },
            { x: 10, y: 12 }
        ]
    }
}

// =====================================================
// VARIÁVEIS DO JOGO
// =====================================================

let currentMap = 1

let state = STATES.READY

let snake = []

let dir = {
    x: 1,
    y: 0
}

let nextDir = {
    x: 1,
    y: 0
}

let food = {
    x: 10,
    y: 10
}

let score = 0

let acc = 0
let last = 0

let best = Number(localStorage.getItem("snake-best")) || 0

bestEl.textContent = best

// =====================================================
// MAPA ATUAL
// =====================================================

function getMap() {
    return maps[currentMap]
}

// =====================================================
// RESET
// =====================================================

function reset() {

    const midX = Math.floor(COLS / 2)
    const midY = Math.floor(ROWS / 2)

    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY }
    ]

    dir = {
        x: 1,
        y: 0
    }

    nextDir = {
        x: 1,
        y: 0
    }

    score = 0

    acc = 0

    scoreEl.textContent = score

    mapEl.textContent = `${currentMap} - ${getMap().name}`

    spawnApple()

    state = STATES.READY

    stateEl.textContent = state
}

// =====================================================
// OBSTÁCULOS
// =====================================================

function isObstacle(x, y) {

    return getMap().obstacles.some(
        obstacle =>
            obstacle.x === x &&
            obstacle.y === y
    )
}

// =====================================================
// COBRA
// =====================================================

function isSnake(x, y) {

    return snake.some(
        segment =>
            segment.x === x &&
            segment.y === y
    )
}

// =====================================================
// COMIDA
// =====================================================

function spawnApple() {

    do {

        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        }

    } while (
        isSnake(food.x, food.y) ||
        isObstacle(food.x, food.y)
    )
}

// =====================================================
// DIREÇÃO
// =====================================================

function setDirection(x, y) {

    // Impede uma curva de 180 graus
    if (
        dir.x + x === 0 &&
        dir.y + y === 0
    ) {
        return
    }

    nextDir = {
        x,
        y
    }
}

// =====================================================
// CONTROLES
// =====================================================

window.addEventListener("keydown", (e) => {

    const key = e.key.toLowerCase()

    // Movimento
    if (key === "arrowup" || key === "w") {
        setDirection(0, -1)
    }

    if (key === "arrowdown" || key === "s") {
        setDirection(0, 1)
    }

    if (key === "arrowleft" || key === "a") {
        setDirection(-1, 0)
    }

    if (key === "arrowright" || key === "d") {
        setDirection(1, 0)
    }

    // Reiniciar
    if (key === "r") {
        reset()
    }

    // Mapa 1
    if (key === "1") {

        currentMap = 1

        reset()
    }

    // Mapa 2
    if (key === "2") {

        currentMap = 2

        reset()
    }

    // Pausa
    if (key === " ") {

        if (state === STATES.PLAYING) {

            state = STATES.PAUSED

        } else if (
            state === STATES.PAUSED ||
            state === STATES.READY
        ) {

            state = STATES.PLAYING
        }

        stateEl.textContent = state
    }

    // Começar o jogo usando movimento
    if (
        state === STATES.READY &&
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d"
        ].includes(key)
    ) {

        state = STATES.PLAYING

        stateEl.textContent = state
    }
})

// =====================================================
// TICK
// =====================================================

function tick() {

    dir = nextDir

    const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    }

    // Parede
    const hitWall =
        head.x < 0 ||
        head.y < 0 ||
        head.x >= COLS ||
        head.y >= ROWS

    // Corpo
    const hitBody = snake.some(
        segment =>
            segment.x === head.x &&
            segment.y === head.y
    )

    // Obstáculo
    const hitObstacle =
        isObstacle(head.x, head.y)

    // Game Over
    if (
        hitWall ||
        hitBody ||
        hitObstacle
    ) {

        state = STATES.OVER

        stateEl.textContent = state

        if (score > best) {

            best = score

            localStorage.setItem(
                "snake-best",
                String(best)
            )

            bestEl.textContent = best
        }

        return
    }

    // Nova cabeça
    snake.unshift(head)

    // Comeu
    if (
        head.x === food.x &&
        head.y === food.y
    ) {

        score += 10

        scoreEl.textContent = score

        spawnApple()

    } else {

        // Não comeu
        snake.pop()
    }
}

// =====================================================
// DESENHO DE CÉLULA
// =====================================================

function drawCell(x, y, color) {

    ctx.fillStyle = color

    ctx.fillRect(
        x * CELL + 2,
        y * CELL + 2,
        CELL - 4,
        CELL - 4
    )
}

// =====================================================
// DESENHO
// =====================================================

function draw() {

    // Fundo
    ctx.fillStyle = "#07111f"

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    )

    // Grade
    ctx.strokeStyle = "#102033"

    ctx.lineWidth = 1

    for (
        let x = 0;
        x <= canvas.width;
        x += CELL
    ) {

        ctx.beginPath()

        ctx.moveTo(x, 0)

        ctx.lineTo(
            x,
            canvas.height
        )

        ctx.stroke()
    }

    for (
        let y = 0;
        y <= canvas.height;
        y += CELL
    ) {

        ctx.beginPath()

        ctx.moveTo(0, y)

        ctx.lineTo(
            canvas.width,
            y
        )

        ctx.stroke()
    }

    // Obstáculos
    getMap().obstacles.forEach(obstacle => {

        drawCell(
            obstacle.x,
            obstacle.y,
            "#a855f7"
        )
    })

    // Comida
    drawCell(
        food.x,
        food.y,
        "#facc15"
    )

    // Cobra
    snake.forEach((segment, index) => {

        drawCell(
            segment.x,
            segment.y,
            index === 0
                ? "#22d3ee"
                : "#06b6d4"
        )
    })

    // Tela de estado
    if (state !== STATES.PLAYING) {

        ctx.fillStyle =
            "rgba(3, 7, 18, 0.72)"

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        )

        ctx.textAlign = "center"

        ctx.fillStyle = "#ffffff"

        ctx.font =
            "bold 28px Segoe UI"

        ctx.fillText(
            state,
            canvas.width / 2,
            canvas.height / 2
        )

        ctx.font =
            "16px Segoe UI"

        let message

        if (state === STATES.OVER) {

            message =
                "Pressione R para reiniciar"

        } else {

            message =
                "Pressione ESPAÇO para jogar"
        }

        ctx.fillText(
            message,
            canvas.width / 2,
            canvas.height / 2 + 32
        )
    }
}

// =====================================================
// LOOP
// =====================================================

function loop(ts) {

    const dt = ts - last

    last = ts

    if (state === STATES.PLAYING) {

        acc += dt

        while (
            acc >= getMap().speed
        ) {

            tick()

            acc -= getMap().speed
        }
    }

    draw()

    requestAnimationFrame(loop)
}

// =====================================================
// INICIAR
// =====================================================

reset()

requestAnimationFrame(loop)