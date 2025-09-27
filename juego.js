const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer-display');
const messageDisplay = document.getElementById('message-display');

// --- CONFIGURACIÓN DEL JUEGO ---
const GRAVITY = 0.6;
const PLAYER_SPEED = 5;
const PLAYER_JUMP = -12;
const ENEMY_SPEED = 1;
const LEVEL_TIME = 30; // Tiempo máximo por nivel

// --- IMÁGENES (Opcional: Si quieres usar tu imagen, descomenta la línea de abajo y borra 'player.draw()' y 'playerImg' del código) ---
// const playerImg = new Image();
// playerImg.src = 'labestia.jpg'; // Asegúrate de que tu imagen se llame 'labestia.jpg'

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
        // Dibujar un cubo azul como personaje
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Si quisieras usar la imagen, tendrías que haberla cargado antes y el código sería así:
        // ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }

    update() {
        // Movimiento horizontal
        if (keys.right) this.velocityX = PLAYER_SPEED;
        else if (keys.left) this.velocityX = -PLAYER_SPEED;
        else this.velocityX = 0;

        this.x += this.velocityX;

        // Gravedad
        if (!this.onGround) {
            this.velocityY += GRAVITY;
            this.y += this.velocityY;
        }
        this.onGround = false; 

        // Colisión con los límites del canvas
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }

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
        ctx.fillStyle = '#706fd3'; // Color de las plataformas
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
        this.active = true; // El enemigo está activo hasta que se le salta encima
    }

    draw() {
        if (!this.active) return; // Si el enemigo no está activo, no se dibuja
        ctx.fillStyle = '#ff4757'; // Color de los enemigos
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        if (!this.active) return;
        this.x += this.speed;
        // Cambiar de dirección si alcanza su rango de movimiento
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
        ctx.fillStyle = '#2ed573'; // Color verde para la meta
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// --- DEFINICIÓN DE NIVELES ---
const levels = [
    // Nivel 1: Introducción
    {
        platforms: [
            new Platform(0, 380, 800, 20), // Suelo principal
            new Platform(200, 300, 150, 20), // Plataforma 1
            new Platform(450, 220, 150, 20)  // Plataforma 2
        ],
        enemies: [new Enemy(300, 350)], // Un enemigo
        goal: new Goal(750, 330, 50, 50), // Meta
        startPos: { x: 50, y: 340 } // Posición inicial del jugador
    },
    // Nivel 2: Más plataformas y enemigos
    {
        platforms: [
            new Platform(0, 380, 200, 20),
            new Platform(280, 300, 100, 20),
            new Platform(450, 250, 100, 20),
            new Platform(600, 200, 150, 20)
        ],
        enemies: [new Enemy(100, 350), new Enemy(500, 220, 30)],
        goal: new Goal(730, 150, 50, 50),
        startPos: { x: 20, y: 340 }
    },
    // Nivel 3: Saltos precisos
    {
        platforms: [
            new Platform(0, 380, 100, 20),
            new Platform(200, 320, 80, 20),
            new Platform(350, 260, 80, 20),
            new Platform(500, 200, 80, 20),
            new Platform(650, 320, 150, 80)
        ],
        enemies: [new Enemy(200, 290, 60), new Enemy(500, 170, 60)],
        goal: new Goal(730, 270, 50, 50),
        startPos: { x: 20, y: 340 }
    },
    // Nivel 4: Cuidado al caer
    {
        platforms: [
            new Platform(0, 380, 800, 20),
            new Platform(100, 300, 50, 20),
            new Platform(250, 220, 50, 20),
            new Platform(400, 300, 50, 20),
            new Platform(550, 220, 50, 20),
            new Platform(700, 150, 50, 20)
        ],
        enemies: [new Enemy(150, 350, 400)],
        goal: new Goal(700, 100, 50, 50),
        startPos: { x: 20, y: 340 }
    },
    // Nivel 5: El desafío final
    {
        platforms: [
            new Platform(0, 380, 50, 20),
            new Platform(120, 320, 50, 20),
            new Platform(240, 260, 50, 20),
            new Platform(360, 320, 50, 20),
            new Platform(480, 260, 50, 20),
            new Platform(600, 200, 200, 200)
        ],
        enemies: [
            new Enemy(100, 350, 400),
            new Enemy(650, 170, 80)
        ],
        goal: new Goal(750, 150, 50, 50),
        startPos: { x: 10, y: 340 }
    }
];

// --- FUNCIONES PRINCIPALES DEL JUEGO ---

function loadLevel(levelIndex) {
    const levelData = levels[levelIndex];
    player = new Player(levelData.startPos.x, levelData.startPos.y);
    platforms = levelData.platforms;
    // Reiniciar enemigos para el nuevo nivel
    enemies = levelData.enemies.map(e => new Enemy(e.x, e.y, e.range)); // Asegurarse de que empiezan activos
    goal = levelData.goal;

    levelDisplay.textContent = `Nivel: ${levelIndex + 1}`;
    timer = LEVEL_TIME;
    timerDisplay.textContent = `Tiempo: ${timer}`;
    messageDisplay.textContent = '¡Usa las flechas para moverte y saltar! ¡Pisa a los enemigos!';
}

function startGame() {
    currentLevel = 0;
    loadLevel(currentLevel);
    
    // Limpiar intervalos anteriores para evitar duplicados al reiniciar
    clearInterval(gameInterval);
    clearInterval(timerInterval);

    gameInterval = setInterval(gameLoop, 1000 / 60); // Ejecuta gameLoop 60 veces por segundo (60 FPS)
    timerInterval = setInterval(() => {
        timer--;
        timerDisplay.textContent = `Tiempo: ${timer}`;
        if (timer <= 0) {
            gameOver('¡Se acabó el tiempo! Pulsa Enter para reiniciar.');
        }
    }, 1000); // Cada segundo
}

function nextLevel() {
    currentLevel++;
    if (currentLevel < levels.length) {
        messageDisplay.textContent = `¡Nivel ${currentLevel + 1}! ¡Bien hecho!`;
        loadLevel(currentLevel);
    } else {
        gameOver('¡FELICIDADES! ¡HAS GANADO EL JUEGO! Pulsa Enter para jugar de nuevo.');
    }
}

function gameOver(message) {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    messageDisplay.textContent = `${message}`;
    // Escuchar la tecla Enter para reiniciar el juego
    document.addEventListener('keydown', restartHandler);
}

function restartHandler(e) {
    if (e.key === 'Enter') {
        document.removeEventListener('keydown', restartHandler); // Quitar el listener para no duplicar
        startGame();
    }
}


function checkCollisions() {
    // Colisión con plataformas
    platforms.forEach(platform => {
        // Colisión superior de la plataforma (jugador aterriza)
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + 20 && // Pequeño margen para la colisión superior
            player.velocityY >= 0) { // Solo si está cayendo
            
            player.y = platform.y - player.height; // Ajusta la posición del jugador
            player.velocityY = 0; // Detiene la caída
            player.onGround = true; // El jugador está en el suelo
        }
    });

    // Colisión con enemigos
    enemies.forEach(enemy => {
        if (!enemy.active) return; // Si el enemigo ya ha sido derrotado, no comprobar colisión

        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            // Si el jugador está cayendo sobre la parte superior del enemigo
            if (player.velocityY > 0 && player.y + player.height - 10 < enemy.y + (enemy.height / 2)) {
                enemy.active = false; // El enemigo es derrotado
                player.velocityY = -8; // Pequeño rebote para el jugador
                messageDisplay.textContent = '¡Enemigo aplastado!';
            } else {
                // Toca al enemigo por los lados o por abajo, GAME OVER
                gameOver('¡Has perdido! Tocado por un enemigo. Pulsa Enter para reiniciar.');
            }
        }
    });

    // Colisión con la meta
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {
        nextLevel(); // Pasa al siguiente nivel
    }
}

function gameLoop() {
    // Limpiar canvas en cada fotograma
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar y actualizar objetos
    platforms.forEach(p => p.draw());
    enemies.forEach(e => e.draw()); // Solo dibuja enemigos activos
    goal.draw();
    player.draw();

    enemies.forEach(e => e.update()); // Solo actualiza enemigos activos
    player.update();
    
    checkCollisions(); // Comprobar colisiones
}

// --- MANEJO DE CONTROLES DEL TECLADO ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowUp' && player.onGround) { // Solo permite saltar si está en el suelo
        player.velocityY = PLAYER_JUMP;
        player.onGround = false; // Ya no está en el suelo
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowLeft') keys.left = false;
});

// Iniciar el juego la primera vez
startGame();
