const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const levelEl = document.getElementById("level");
const stateEl = document.getElementById("state");

const STATES = {
    READY: "PRONTO",
    PLAYING: "JOGANDO",
    PAUSED: "PAUSADO",
    OVER: "GAME OVER",
    WIN: "NÍVEL CONCLUÍDO"
};


// =====================================================
// RAQUETE
// =====================================================

const paddle = {
    width: 90,
    originalWidth: 90,
    minWidth: 48,
    height: 12,
    x: canvas.width / 2 - 45,
    y: canvas.height - 34,
    speed: 7
};


// =====================================================
// BOLA
// =====================================================

const ball = {
    x: canvas.width / 2,
    y: paddle.y - 10,
    radius: 7,
    vx: 3.2,
    vy: -4.2,
    speed: 5.3
};


// =====================================================
// VARIÁVEIS
// =====================================================

let score = 0;
let best = Number(localStorage.getItem("neon-breakout-best")) || 0;
let level = 1;

let state = STATES.READY;

let rightPressed = false;
let leftPressed = false;

let bricks = [];

let destroyedBricks = 0;

// Power-up
let pickup = null;

// Efeito da raquete
let paddleWide = false;
let paddleWideUntil = 0;


// =====================================================
// LAYOUT AUTORAL DOS TIJOLOS
// =====================================================

function createBricks() {

    bricks = [];

    /*
    Layout autoral em forma de pirâmide com um corredor central.

    O jogador arrisca a bola no topo porque precisa direcioná-la
    por espaços menores e rebater em ângulos mais difíceis.

    As fileiras superiores valem mais pontos, criando uma relação
    de risco e recompensa.
    */

    const rows = [
        {
            y: 70,
            xPositions: [150, 190, 230, 270],
            points: 50
        },
        {
            y: 105,
            xPositions: [110, 150, 190, 230, 270, 310],
            points: 40
        },
        {
            y: 140,
            xPositions: [70, 110, 150, 190, 230, 270, 310, 350],
            points: 30
        },
        {
            y: 175,
            xPositions: [70, 110, 150, 230, 270, 310, 350],
            points: 20
        },
        {
            y: 210,
            xPositions: [110, 150, 190, 230, 270, 310],
            points: 10
        }
    ];

    rows.forEach((row, rowIndex) => {

        row.xPositions.forEach((x, index) => {

            // Tijolo blindado: precisa de dois impactos.
            const armored =
                rowIndex === 2 && index === 3;

            bricks.push({
                x: x,
                y: row.y,
                width: 34,
                height: 20,
                points: row.points,
                alive: true,
                hp: armored ? 2 : 1,
                armored: armored
            });

        });

    });

}


// =====================================================
// ESTADO DO JOGO
// =====================================================

function updateState(newState) {

    state = newState;

    stateEl.textContent = state;

}


// =====================================================
// RESET / INÍCIO
// =====================================================

function resetGame() {

    score = 0;
    level = 1;

    destroyedBricks = 0;

    paddle.width = paddle.originalWidth;

    paddleWide = false;
    paddleWideUntil = 0;

    pickup = null;

    paddle.x =
        canvas.width / 2 - paddle.width / 2;

    resetBall();

    createBricks();

    scoreEl.textContent = score;
    levelEl.textContent = level;

    updateState(STATES.READY);

}


function resetBall() {

    ball.x =
        paddle.x + paddle.width / 2;

    ball.y =
        paddle.y - ball.radius - 1;

    ball.vx = 3.2;
    ball.vy = -4.2;

    ball.speed = 5.3;

}


// =====================================================
// CONTROLES
// =====================================================

window.addEventListener("keydown", (e) => {

    const key = e.key.toLowerCase();

    if (
        ["arrowleft", "arrowright", " "].includes(key)
    ) {
        e.preventDefault();
    }

    if (key === "arrowright" || key === "d") {
        rightPressed = true;
    }

    if (key === "arrowleft" || key === "a") {
        leftPressed = true;
    }

    // Iniciar e pausar
    if (
        key === " " &&
        (
            state === STATES.READY ||
            state === STATES.PAUSED
        )
    ) {

        updateState(STATES.PLAYING);

    } else if (
        key === " " &&
        state === STATES.PLAYING
    ) {

        updateState(STATES.PAUSED);

    }

    // Reiniciar
    if (key === "r") {
        resetGame();
    }

});


window.addEventListener("keyup", (e) => {

    const key = e.key.toLowerCase();

    if (key === "arrowright" || key === "d") {
        rightPressed = false;
    }

    if (key === "arrowleft" || key === "a") {
        leftPressed = false;
    }

});


// =====================================================
// CURVA DE DIFICULDADE
// =====================================================

function nextLevel() {

    level++;

    // A raquete encolhe 8 px a cada nível concluído.
    // Ela nunca fica menor que 48 px.
    paddle.width = Math.max(
        paddle.minWidth,
        paddle.originalWidth - ((level - 1) * 8)
    );

    paddle.x =
        canvas.width / 2 - paddle.width / 2;

    destroyedBricks = 0;

    pickup = null;

    paddleWide = false;
    paddleWideUntil = 0;

    // Aumenta levemente a velocidade da bola a cada nível.
    ball.speed = Math.min(
        7,
        5.3 + ((level - 1) * 0.25)
    );

    resetBall();

    createBricks();

    levelEl.textContent = level;

    updateState(STATES.READY);

}


// =====================================================
// POWER-UP
// =====================================================

function spawnPickup(x, y) {

    // Só existe um power-up caindo por vez.
    if (pickup !== null) {
        return;
    }

    pickup = {
        x: x,
        y: y,
        width: 20,
        height: 20,
        speed: 2.5
    };

}


// =====================================================
// PEGAR POWER-UP
// =====================================================

function collectPickup() {

    // Aumenta a raquete temporariamente.
    paddleWide = true;

    // Efeito dura 8 segundos.
    paddleWideUntil = Date.now() + 8000;

    // Aumenta a raquete em 40 px.
    paddle.width = Math.min(
        paddle.originalWidth + 40,
        130
    );

    // Impede a raquete de sair da tela.
    paddle.x = Math.max(
        0,
        Math.min(
            canvas.width - paddle.width,
            paddle.x
        )
    );

    pickup = null;

}


// =====================================================
// RECORDES
// =====================================================

function saveBest() {

    if (score > best) {

        best = score;

        localStorage.setItem(
            "neon-breakout-best",
            String(best)
        );

        bestEl.textContent = best;

    }

}


// =====================================================
// ATUALIZAÇÃO DO JOGO
// =====================================================

function update() {

    // Movimento da raquete
    if (rightPressed) {
        paddle.x += paddle.speed;
    }

    if (leftPressed) {
        paddle.x -= paddle.speed;
    }

    // Impede a raquete de sair da tela
    paddle.x = Math.max(
        0,
        Math.min(
            canvas.width - paddle.width,
            paddle.x
        )
    );


    // =================================================
    // POWER-UP: TEMPO DO EFEITO
    // =================================================

    if (
        paddleWide &&
        Date.now() >= paddleWideUntil
    ) {

        paddleWide = false;

        paddle.width = Math.max(
            paddle.minWidth,
            paddle.originalWidth - ((level - 1) * 8)
        );

        paddle.x = Math.max(
            0,
            Math.min(
                canvas.width - paddle.width,
                paddle.x
            )
        );

    }


    // =================================================
    // POWER-UP: MOVIMENTO DO ITEM
    // =================================================

    if (pickup !== null && state === STATES.PLAYING) {

        pickup.y += pickup.speed;

        // Colisão do item com a raquete
        const caught =
            pickup.y + pickup.height >= paddle.y &&
            pickup.y <= paddle.y + paddle.height &&
            pickup.x + pickup.width >= paddle.x &&
            pickup.x <= paddle.x + paddle.width;

        if (caught) {

            collectPickup();

        } else if (
            pickup.y > canvas.height
        ) {

            // Item caiu sem ser pego
            pickup = null;

        }

    }


    // =================================================
    // BOLA PARADA ANTES DO JOGO
    // =================================================

    if (state !== STATES.PLAYING) {

        if (state === STATES.READY) {

            ball.x =
                paddle.x + paddle.width / 2;

            ball.y =
                paddle.y - ball.radius - 1;

        }

        return;

    }


    // =================================================
    // MOVIMENTO DA BOLA
    // =================================================

    ball.x += ball.vx;
    ball.y += ball.vy;


    // =================================================
    // COLISÃO COM AS PAREDES
    // =================================================

    // Parede esquerda
    if (ball.x - ball.radius <= 0) {

        ball.x = ball.radius;

        ball.vx = Math.abs(ball.vx);

    }

    // Parede direita
    if (ball.x + ball.radius >= canvas.width) {

        ball.x = canvas.width - ball.radius;

        ball.vx = -Math.abs(ball.vx);

    }

    // Teto
    if (ball.y - ball.radius <= 0) {

        ball.y = ball.radius;

        ball.vy = Math.abs(ball.vy);

    }


    // =================================================
    // QUIQUE NA RAQUETE
    // =================================================

    const hitPaddle =
        ball.vy > 0 &&
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width;

    if (hitPaddle) {

        // Posiciona a bola acima da raquete.
        ball.y = paddle.y - ball.radius;

        // Calcula o ponto de contato.
        const hitPosition =
            (
                ball.x -
                (paddle.x + paddle.width / 2)
            ) /
            (paddle.width / 2);

        // Ângulo de até 60 graus nas pontas.
        const angle =
            hitPosition * (Math.PI / 3);

        // Aumenta a velocidade levemente.
        ball.speed = Math.min(
            7,
            Math.hypot(ball.vx, ball.vy) + 0.08
        );

        ball.vx =
            ball.speed * Math.sin(angle);

        // Garante que a bola suba após o quique.
        ball.vy =
            -Math.abs(
                ball.speed * Math.cos(angle)
            );

    }


    // =================================================
    // PERDEU A BOLA
    // =================================================

    if (ball.y - ball.radius > canvas.height) {

        updateState(STATES.OVER);

        saveBest();

        return;

    }


    // =================================================
    // COLISÃO COM OS TIJOLOS
    // =================================================

    for (const brick of bricks) {

        if (!brick.alive) {
            continue;
        }

        const collided =
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height;

        if (collided) {

            // Identifica o lado da colisão.
            const overlapLeft =
                ball.x + ball.radius - brick.x;

            const overlapRight =
                brick.x + brick.width -
                (ball.x - ball.radius);

            const overlapTop =
                ball.y + ball.radius - brick.y;

            const overlapBottom =
                brick.y + brick.height -
                (ball.y - ball.radius);

            const minOverlap = Math.min(
                overlapLeft,
                overlapRight,
                overlapTop,
                overlapBottom
            );


            // Rebate a bola.
            if (
                minOverlap === overlapLeft ||
                minOverlap === overlapRight
            ) {

                ball.vx *= -1;

            } else {

                ball.vy *= -1;

            }


            // Diminui a vida do tijolo.
            brick.hp--;


            // Tijolo blindado muda de cor após o primeiro hit.
            if (brick.armored && brick.hp === 1) {

                brick.color = "#f97316";

            }


            // Destrói o tijolo quando a vida chega a zero.
            if (brick.hp <= 0) {

                brick.alive = false;

                score += brick.points;

                scoreEl.textContent = score;

                destroyedBricks++;

                saveBest();


                // =================================================
                // POWER-UP A CADA 8 TIJOLOS DESTRUÍDOS
                // =================================================

                if (destroyedBricks % 8 === 0) {

                    spawnPickup(
                        brick.x + brick.width / 2 - 10,
                        brick.y
                    );

                }

            }


            // Evita atingir vários tijolos no mesmo frame.
            break;

        }

    }


    // =================================================
    // FIM DO NÍVEL
    // =================================================

    if (bricks.every(brick => !brick.alive)) {

        nextLevel();

    }

}


// =====================================================
// DESENHO DOS TIJOLOS
// =====================================================

function drawBricks() {

    bricks.forEach(brick => {

        if (!brick.alive) {
            return;
        }

        // Cor especial para o tijolo blindado.
        ctx.fillStyle =
            brick.armored && brick.hp === 2
                ? "#f97316"
                : colorByPoints(brick.points);

        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );


        // Contorno
        ctx.strokeStyle =
            "rgba(255,255,255,0.35)";

        ctx.strokeRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );


        // Mostra a vida do tijolo blindado.
        if (brick.armored) {

            ctx.fillStyle = "#fff7ed";

            ctx.font = "bold 12px Segoe UI";

            ctx.textAlign = "center";

            ctx.fillText(
                brick.hp,
                brick.x + brick.width / 2,
                brick.y + 14
            );

        }

    });

}


// =====================================================
// CORES DOS TIJOLOS
// =====================================================

function colorByPoints(points) {

    if (points === 50) return "#f472b6";

    if (points === 40) return "#c084fc";

    if (points === 30) return "#818cf8";

    if (points === 20) return "#38bdf8";

    return "#22d3ee";

}


// =====================================================
// DESENHO DO POWER-UP
// =====================================================

function drawPickup() {

    if (pickup === null) {
        return;
    }

    // Power-up verde.
    ctx.fillStyle = "#4ade80";

    ctx.shadowColor = "#4ade80";

    ctx.shadowBlur = 12;

    ctx.fillRect(
        pickup.x,
        pickup.y,
        pickup.width,
        pickup.height
    );

    ctx.shadowBlur = 0;


    // Símbolo de aumento.
    ctx.fillStyle = "#052e16";

    ctx.font = "bold 16px Segoe UI";

    ctx.textAlign = "center";

    ctx.fillText(
        "+",
        pickup.x + pickup.width / 2,
        pickup.y + 15
    );

}


// =====================================================
// DESENHO DO JOGO
// =====================================================

function draw() {

    // Fundo
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#07111f";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Grade
    ctx.strokeStyle = "#102033";

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x <= canvas.width;
        x += 24
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(x, canvas.height);

        ctx.stroke();

    }

    for (
        let y = 0;
        y <= canvas.height;
        y += 24
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(canvas.width, y);

        ctx.stroke();

    }


    // Tijolos
    drawBricks();


    // Power-up
    drawPickup();


    // Raquete
    ctx.fillStyle = paddleWide
        ? "#4ade80"
        : "#22d3ee";

    ctx.shadowColor = ctx.fillStyle;

    ctx.shadowBlur = 12;

    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );

    ctx.shadowBlur = 0;


    // Bola
    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#facc15";

    ctx.shadowColor = "#facc15";

    ctx.shadowBlur = 12;

    ctx.fill();

    ctx.shadowBlur = 0;


    // =================================================
    // TELA DE ESTADO
    // =================================================

    if (state !== STATES.PLAYING) {

        ctx.fillStyle =
            "rgba(3, 7, 18, 0.72)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 27px Segoe UI";

        ctx.fillText(
            state,
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.font = "16px Segoe UI";

        let message =
            "Pressione ESPAÇO para jogar";

        if (state === STATES.PAUSED) {

            message =
                "Pressione ESPAÇO para continuar";

        }

        if (state === STATES.OVER) {

            message =
                "Pressione R para reiniciar";

        }

        if (state === STATES.WIN) {

            message =
                "Pressione R para reiniciar";

        }

        ctx.fillText(
            message,
            canvas.width / 2,
            canvas.height / 2 + 34
        );

    }

}


// =====================================================
// LOOP PRINCIPAL
// =====================================================

function loop() {

    update();

    draw();

    requestAnimationFrame(loop);

}


// =====================================================
// INICIAR
// =====================================================

resetGame();

bestEl.textContent = best;

requestAnimationFrame(loop);