
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const waveEl = document.getElementById("wave");

const KEYS = {};

// =====================================
// CONTROLES
// =====================================

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if ([" ", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
    }

    // Evita repetir comandos enquanto a tecla está pressionada
    if (e.repeat) return;

    if (key === "p" && !gameOver) {
        pause = !pause;

        // Evita um dt enorme depois de despausar
        last = performance.now();
    }

    if (key === "r" && gameOver) {
        startGame();
    }

    KEYS[key] = true;
});

window.addEventListener("keyup", (e) => {
    KEYS[e.key.toLowerCase()] = false;
});

// =====================================
// COLISÃO AABB
// =====================================

function aabb(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

// =====================================
// CLASSE PLAYER
// =====================================

class Player {
    constructor() {
        this.w = 36;
        this.h = 36;

        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 65;

        this.speed = 280;
        this.cooldown = 0;
    }

    update(dt) {

        if (KEYS["arrowleft"] || KEYS["a"]) {
            this.x -= this.speed * dt;
        }

        if (KEYS["arrowright"] || KEYS["d"]) {
            this.x += this.speed * dt;
        }

        // Impede a nave de sair da tela
        this.x = Math.max(
            0,
            Math.min(canvas.width - this.w, this.x)
        );

        // Controle do intervalo entre tiros
        this.cooldown -= dt;

        if (KEYS[" "] && this.cooldown <= 0) {
            bullets.push(
                new Bullet(this.x + this.w / 2 - 3, this.y)
            );

            this.cooldown = 0.22;
        }
    }

    draw() {
        ctx.save();

        // Brilho da nave
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;

        // Corpo da nave
        ctx.fillStyle = "#38bdf8";

        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h * 0.8);
        ctx.lineTo(this.x + this.w * 0.7, this.y + this.h);
        ctx.lineTo(this.x + this.w * 0.3, this.y + this.h);
        ctx.lineTo(this.x, this.y + this.h * 0.8);
        ctx.closePath();

        ctx.fill();

        // Cabine
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e0f2fe";

        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y + 8);
        ctx.lineTo(this.x + this.w * 0.68, this.y + 24);
        ctx.lineTo(this.x + this.w * 0.32, this.y + 24);
        ctx.closePath();

        ctx.fill();

        // Motores
        ctx.fillStyle = "#f97316";
        ctx.fillRect(this.x + 6, this.y + 29, 5, 7);
        ctx.fillRect(this.x + 25, this.y + 29, 5, 7);

        ctx.restore();
    }
}

// =====================================
// CLASSE BULLET
// =====================================

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.w = 6;
        this.h = 14;

        this.speed = 420;
        this.dead = false;
    }

    update(dt) {
        this.y -= this.speed * dt;

        if (this.y + this.h < 0) {
            this.dead = true;
        }
    }

    draw() {
        ctx.save();

        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;

        ctx.fillStyle = "#facc15";

        ctx.fillRect(
            this.x,
            this.y,
            this.w,
            this.h
        );

        ctx.restore();
    }
}

// =====================================
// CLASSE ENEMY
// =====================================

class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;

        this.w = 30;
        this.h = 30;

        this.speed = speed;
        this.dead = false;
    }

    update(dt) {
        this.y += this.speed * dt;
    }

    draw() {
        ctx.save();

        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 12;

        // Corpo do inimigo
        ctx.fillStyle = "#ef4444";

        ctx.beginPath();
        ctx.moveTo(this.x + this.w / 2, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h / 2);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h);
        ctx.lineTo(this.x, this.y + this.h / 2);
        ctx.closePath();

        ctx.fill();

        // Detalhes internos
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fecaca";

        ctx.fillRect(
            this.x + 10,
            this.y + 10,
            10,
            10
        );

        ctx.restore();
    }
}

// =====================================
// SISTEMA DE PARTÍCULAS (VFX)
// =====================================

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        // Velocidade aleatória em todas as direções
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.life = 0.45 + Math.random() * 0.35;
        this.maxLife = this.life;

        this.size = 2 + Math.random() * 3;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.life -= dt;
    }

    draw() {
        ctx.save();

        ctx.globalAlpha = Math.max(
            0,
            this.life / this.maxLife
        );

        ctx.fillStyle = "#facc15";

        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 10;

        ctx.fillRect(
            this.x,
            this.y,
            this.size,
            this.size
        );

        ctx.restore();
    }
}

// =====================================
// EXPLOSÃO DOS INIMIGOS
// =====================================

function createExplosion(x, y) {

    // Cria um burst de 10 faíscas
    for (let i = 0; i < 10; i++) {
        particles.push(
            new Particle(x, y)
        );
    }
}

// =====================================
// VARIÁVEIS DO JOGO
// =====================================

let player;
let bullets;
let enemies;
let particles;

let score;
let lives;
let waves;

let last;
let gameOver;
let pause;

let spawnTimer;
let spawnedEnemies;

// =====================================
// INICIAR JOGO
// =====================================

function startGame() {

    player = new Player();

    bullets = [];
    enemies = [];
    particles = [];

    score = 0;
    lives = 3;
    waves = 1;

    spawnTimer = 0;
    spawnedEnemies = 0;

    pause = false;
    gameOver = false;

    last = performance.now();

    syncHud();
}

// =====================================
// ATUALIZAR JOGO
// =====================================

function update(dt) {

    if (pause || gameOver) return;

    player.update(dt);

    // Atualiza tiros
    bullets.forEach((b) => b.update(dt));

    // Atualiza inimigos
    enemies.forEach((e) => e.update(dt));

    // Atualiza partículas
    particles.forEach((p) => p.update(dt));

    // Gera inimigos
    spawnWave(dt);

    // =================================
    // COLISÃO ENTRE TIROS E INIMIGOS
    // =================================

    bullets.forEach((b) => {

        enemies.forEach((e) => {

            if (
                !b.dead &&
                !e.dead &&
                aabb(b, e)
            ) {

                b.dead = true;
                e.dead = true;

                score += 15;

                // Efeito visual da morte
                createExplosion(
                    e.x + e.w / 2,
                    e.y + e.h / 2
                );
            }

        });

    });

    // =================================
    // COLISÃO COM O JOGADOR
    // =================================

    enemies.forEach((e) => {

        if (
            !e.dead &&
            aabb(e, player)
        ) {

            e.dead = true;

            lives -= 1;

            createExplosion(
                e.x + e.w / 2,
                e.y + e.h / 2
            );

            if (lives <= 0) {
                lives = 0;
                gameOver = true;
            }
        }

    });

    // =================================
    // INIMIGOS QUE ESCAPAM PELA BASE
    // =================================

    enemies.forEach((e) => {

        if (
            !e.dead &&
            e.y > canvas.height
        ) {

            e.dead = true;

            // Cada inimigo que escapa tira 1 vida
            lives -= 1;

            if (lives <= 0) {
                lives = 0;
                gameOver = true;
            }
        }

    });

    // =================================
    // REMOVER ELEMENTOS MORTOS
    // =================================

    enemies = enemies.filter((e) => !e.dead);

    bullets = bullets.filter((b) => !b.dead);

    particles = particles.filter((p) => p.life > 0);

    // =================================
    // PROGRESSÃO DAS ONDAS
    // =================================

    if (
        spawnedEnemies >= 6 + (waves - 1) * 2 &&
        enemies.length === 0
    ) {

        waves += 1;
        spawnedEnemies = 0;
        spawnTimer = 0.5;
    }

    syncHud();
}

// =====================================
// HUD
// =====================================

function syncHud() {

    scoreEl.textContent = score;
    livesEl.textContent = lives;
    waveEl.textContent = waves;

}

// =====================================
// SISTEMA DE ONDAS
// =====================================

function spawnWave(dt) {

    // Os três eixos de balanceamento:
    //
    // QUANTIDADE:
    // Começa com 6 inimigos e aumenta 2 por onda.
    //
    // VELOCIDADE:
    // Começa em 70 pixels/s e aumenta 10 por onda.
    //
    // INTERVALO:
    // Começa em 0.85 segundo e diminui 0.05 por onda,
    // até o limite mínimo de 0.35 segundo.
    //
    // Assim, as ondas ficam progressivamente mais difíceis,
    // aumentando a pressão sem sobrecarregar o início do jogo.

    const quantity = 6 + (waves - 1) * 2;

    const speed = 70 + (waves - 1) * 10;

    const interval = Math.max(
        0.35,
        0.85 - (waves - 1) * 0.05
    );

    spawnTimer -= dt;

    if (
        spawnTimer <= 0 &&
        spawnedEnemies < quantity
    ) {

        const x = Math.random() * (canvas.width - 30);

        enemies.push(
            new Enemy(x, -35, speed)
        );

        spawnedEnemies++;

        spawnTimer = interval;
    }
}

// =====================================
// FUNDO ESTRELADO
// =====================================

function drawBackground() {

    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        20,
        canvas.width / 2,
        canvas.height / 2,
        canvas.height
    );

    gradient.addColorStop(0, "#0b1935");
    gradient.addColorStop(1, "#020617");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Estrelas
    ctx.fillStyle = "#94a3b8";

    for (let i = 0; i < 40; i++) {

        const x = (i * 97) % canvas.width;
        const y = (i * 53) % canvas.height;

        ctx.globalAlpha = 0.5;

        ctx.fillRect(x, y, 2, 2);
    }

    ctx.globalAlpha = 1;
}

// =====================================
// DESENHAR JOGO
// =====================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawBackground();

    player.draw();

    enemies.forEach((e) => e.draw());

    bullets.forEach((b) => b.draw());

    particles.forEach((p) => p.draw());

    if (pause) {
        drawOverlay(
            "PAUSADO",
            "Pressione P para continuar"
        );
    }

    if (gameOver) {
        drawOverlay(
            "GAME OVER",
            "Pressione R para reiniciar"
        );
    }
}

// =====================================
// OVERLAY
// =====================================

function drawOverlay(title, subtitle) {

    ctx.fillStyle = "rgba(2, 6, 23, 0.8)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 36px Segoe UI";

    ctx.fillText(
        title,
        canvas.width / 2,
        canvas.height / 2 - 15
    );

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "16px Segoe UI";

    ctx.fillText(
        subtitle,
        canvas.width / 2,
        canvas.height / 2 + 25
    );

}

// =====================================
// LOOP PRINCIPAL
// =====================================

function loop(timestamp) {

    let dt = (timestamp - last) / 1000;

    last = timestamp;

    // Limita o dt para evitar saltos grandes
    // quando o navegador fica lento.
    dt = Math.min(dt, 0.033);

    update(dt);

    draw();

    requestAnimationFrame(loop);
}

// =====================================
// EXECUÇÃO
// =====================================

startGame();

requestAnimationFrame(loop);
