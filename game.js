const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Параметры самолёта и начальное положение
let planeX = canvas.width/2 - 25; // самолет шириной 50 px
let planeY = canvas.height - 100; 
const planeWidth = 50;
const planeHeight = 80;

// Параметры пуль
let bullets = [];
const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 7;

// Параметры врагов
let enemies = [];
const enemyWidth = 30;
const enemyHeight = 30;
let enemySpeed = 2;
let spawnInterval = 1500; // Интервал появления врагов в мс
let lastSpawn = 0;

let score = 0;
let lives = 3;
let gameOver = false;

let keys = {};
document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    // Добавляем стрельбу по нажатию пробела:
    if (e.code === "Space" && !gameOver) {
        fireBullet();
    }
});
document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

document.getElementById("fireButton").addEventListener("click", () => {
    if (!gameOver) {
        fireBullet();
    }
});

// Обработчики касаний для мобильных устройств
canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);

function handleTouch(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    // Перемещаем самолет по горизонтали к точке касания
    planeX = Math.max(0, Math.min(canvas.width - planeWidth, touchX - planeWidth/2));
}

// Загрузка изображений
const planeImg = new Image();
planeImg.src = "plane.png"; // Убедитесь, что этот файл существует

const enemyImg = new Image();
enemyImg.src = "enemy.png"; // Убедитесь, что этот файл существует

// Пули для отладки можно отрисовывать прямоугольниками. После проверки можно вернуть изображение.
// const bulletImg = new Image();
// bulletImg.src = "bullet.png";

planeImg.onload = () => console.log("Plane image loaded");
enemyImg.onload = () => console.log("Enemy image loaded");

function fireBullet() {
    bullets.push({
        x: planeX + planeWidth/2 - bulletWidth/2,
        y: planeY,
        width: bulletWidth,
        height: bulletHeight
    });
}

function spawnEnemy(timestamp) {
    enemies.push({
        x: Math.random()*(canvas.width - enemyWidth),
        y: -enemyHeight,
        width: enemyWidth,
        height: enemyHeight,
        vx: Math.random() > 0.5 ? 1 : -1
    });
    lastSpawn = timestamp;
}

function update(delta, timestamp) {
    if (gameOver) return;

    // Движение самолёта с клавиатуры
    if (keys["ArrowLeft"] && planeX > 0) {
        planeX -= 5;
    }
    if (keys["ArrowRight"] && planeX < canvas.width - planeWidth) {
        planeX += 5;
    }

    // Обновляем позиции пуль
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Появление врагов
    if (timestamp - lastSpawn > spawnInterval) {
        spawnEnemy(timestamp);
    }

    // Обновляем позиции врагов
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        enemy.y += enemySpeed;
        enemy.x += enemy.vx * 0.5; 
        if (enemy.x < 0 || enemy.x > canvas.width - enemy.width) {
            enemy.vx = -enemy.vx;
        }

        // Проверка, достиг ли враг низа
       
