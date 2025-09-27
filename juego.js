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
