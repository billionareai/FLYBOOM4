const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Новые размеры самолёта
let planeX = canvas.width/2 - 25; // Исходя из ширины 50 px, чтобы центрировать
let planeY = canvas.height - 100; // Смещаем немного вверх
const planeWidth = 50;
const planeHeight = 80;

let bullets = [];
const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 7;

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
});
document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

document.getElementById("fireButton").addEventListener("click", () => {
    if (!gameOver) {
        fireBullet();
    }
});

// Загрузка нового изображения самолёта
const planeImg = new Image();
planeImg.src = "plane.png"; // Поместите ваш изображение самолета под этим именем рядом с index.html

const enemyImg = new Image();
enemyImg.src = "enemy.png";

const bulletImg = new Image();
bulletImg.src = "bullet.png";

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

    // Движение самолёта
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
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) {
                gameOver = true;
            }
        }
    }

    // Проверка столкновений пуль с врагами
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score++;
                break;
            }
        }
    }

    // Усложнение игры со временем
    if (score > 10) {
        enemySpeed = 3;
    }
    if (score > 20) {
        spawnInterval = 1000;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем самолет с новым спрайтом
    ctx.drawImage(planeImg, planeX, planeY, planeWidth, planeHeight);

    // Рисуем пули
    for (let b of bullets) {
        ctx.drawImage(bulletImg, b.x, b.y, bulletWidth, bulletHeight);
    }

    // Рисуем врагов
    for (let e of enemies) {
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
    }

    // Рисуем счет и жизни
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Счёт: " + score, 10, 20);
    ctx.fillText("Жизни: " + lives, 10, 40);

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Игра окончена!", canvas.width/2 - 100, canvas.height/2);
    }
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

let lastTime = 0;
function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta, timestamp);
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
