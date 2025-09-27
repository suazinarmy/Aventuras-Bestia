const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer-display');
const messageDisplay = document.getElementById('message-display');

// --- CONFIGURACIÓN DEL JUEGO ---
const GRAVITY = 0.6;
const PLAYER_SPEED = 5;
const PLAYER_JUMP = -13; // He aumentado un poco la fuerza del salto
const ENEMY_SPEED = 1;
const LEVEL_TIME = 30;

// --- IMÁGENES ---
const playerImg = new Image();
playerImg.src = 'labestia.jpg';

// --- ESTADO DEL JUEGO ---
let player;
let platforms = [];
let enemies = [];
let goal;
let keys = { right: false, left: false, up: false };
let currentLevel = 0;
let timer = LEVEL_TIME;
let gameInterval;
let timerInterval;

// --- CLASES DE OBJETOS ---

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
    }

    draw() {
        ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }

    update() {
        // Movimiento horizontal
        if (keys.right) this.velocityX = PLAYER_SPEED;
        else if (keys.left) this.velocityX = -PLAYER_SPEED;
        else this.velocityX = 0;

        this.x += this.velocityX;

        // Gravedad (siempre se aplica si no está en el suelo)
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Evitar que el jugador salga por los lados del canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = '#706fd3';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Enemy {
    constructor(x, y, range = 50) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = ENEMY_SPEED;
        this.startX = x;
        this.range = range;
        this.active = true;
    }

    draw() {
        if (!this.active) return;
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        if (!this.active) return;
        this.x += this.speed;
        if (this.x < this.startX || this.x > this.startX + this.range) {
            this.speed *= -1;
        }
    }
}

class Goal {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// --- DEFINICIÓN DE NIVELES ---
const levels = [
    {
        platforms: [new Platform(0, 380, 800, 20), new Platform(200, 300, 150, 20), new Platform(450, 220, 150, 20)],
        enemies: [new Enemy(300, 350)],
        goal: new Goal(750, 330, 50, 50),
        startPos: { x: 50, y: 340 }
    },
    {
        platforms: [new Platform(0, 380, 200, 20), new Platform(280, 300, 100, 20), new Platform(450, 250, 100, 20), new Platform(600, 200, 150, 20)],
        enemies: [new Enemy(100, 350), new Enemy(500, 220, 30)],
        goal: new Goal(730, 150, 50, 50),
        startPos: { x: 20, y: 340 }
    },
    {
        platforms: [new Platform(0, 380, 100, 20), new Platform(200, 320, 80, 20), new Platform(350, 260, 80, 20), new Platform(500, 200, 80, 20), new Platform(650, 320, 150, 80)],
        enemies: [new Enemy(200, 290, 60), new Enemy(500, 170, 60)],
        goal: new Goal(730, 270, 50, 50),
        startPos: { x: 20, y: 340 }
    },
    {
        platforms: [new Platform(0, 380, 800, 20), new Platform(100, 300, 50, 20), new Platform(250, 220, 50, 20), new Platform(400, 300, 50, 20), new Platform(550, 220, 50, 20), new Platform(700, 150, 50, 20)],
        enemies: [new Enemy(150, 350, 400)],
        goal: new Goal(700, 100, 50, 50),
        startPos: { x: 20, y: 340 }
    },
    {
        platforms: [new Platform(0, 380, 50, 20), new Platform(120, 320, 50, 20), new Platform(240, 260, 50, 20), new Platform(360, 320, 50, 20), new Platform(480, 260, 50, 20), new Platform(600, 200, 200, 200)],
        enemies: [new Enemy(100, 350, 400), new Enemy(650, 170, 80)],
        goal: new Goal(750, 150, 50, 50),
        startPos: { x: 10, y: 340 }
    }
];

function loadLevel(levelIndex) {
    const levelData = levels[levelIndex];
    player = new Player(levelData.startPos.x, levelData.startPos.y);
    platforms = levelData.platforms;
    enemies = levelData.enemies.map(e => new Enemy(e.x, e.y, e.range));
    goal = levelData.goal;
    levelDisplay.textContent = `Nivel: ${levelIndex + 1}`;
    timer = LEVEL_TIME;
    timerDisplay.textContent = `Tiempo: ${timer}`;
    messageDisplay.textContent = '¡Usa las flechas para moverte y saltar!';
}

function startGame() {
    currentLevel = 0;
    loadLevel(currentLevel);
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);
    timerInterval = setInterval(() => {
        timer--;
        timerDisplay.textContent = `Tiempo: ${timer}`;
        if (timer <= 0) gameOver('¡Se acabó el tiempo! Pulsa Enter para reiniciar.');
    }, 1000);
}

function nextLevel() {
    currentLevel++;
    if (currentLevel < levels.length) {
        messageDisplay.textContent = `¡Nivel ${currentLevel + 1}!`;
        loadLevel(currentLevel);
    } else {
        gameOver('¡HAS GANADO EL JUEGO! Pulsa Enter para jugar de nuevo.');
    }
}

function gameOver(message) {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    messageDisplay.textContent = message;
    document.addEventListener('keydown', restartHandler);
}

function restartHandler(e) {
    if (e.key === 'Enter') {
        document.removeEventListener('keydown', restartHandler);
        startGame();
    }
}

function checkCollisions() {
    let isGroundedThisFrame = false;

    // Colisión con plataformas
    platforms.forEach(platform => {
        if (player.x + player.width > platform.x && player.x < platform.x + platform.width && player.y + player.height > platform.y && player.y + player.height < platform.y + 1 && player.velocityY >= 0) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            isGroundedThisFrame = true;
        }
    });
     // Colisión con el suelo
     if (player.y + player.height >= canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        isGroundedThisFrame = true;
    }

    player.onGround = isGroundedThisFrame;

    // Colisión con enemigos
    enemies.forEach(enemy => {
        if (enemy.active && player.x < enemy.x + enemy.width && player.x + player.width > enemy.x && player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) {
            if (player.velocityY > 0 && player.y + player.height < enemy.y + 20) {
                enemy.active = false;
                player.velocityY = -8;
                messageDisplay.textContent = '¡Enemigo aplastado!';
            } else {
                gameOver('¡Has perdido! Tocado por un enemigo. Pulsa Enter para reiniciar.');
            }
        }
    });

    // Colisión con la meta
    if (player.x < goal.x + goal.width && player.x + player.width > goal.x && player.y < goal.y + goal.height && player.y + player.height > goal.y) {
        nextLevel();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    platforms.forEach(p => p.draw());
    enemies.forEach(e => e.draw());
    goal.draw();
    
    player.update();
    checkCollisions(); // Llama a las colisiones DESPUÉS de actualizar la posición
    player.draw();
}

// --- MANEJO DE CONTROLES ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowUp' && player.onGround) {
        player.velocityY = PLAYER_JUMP;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowLeft') keys.left = false;
});

startGame();
