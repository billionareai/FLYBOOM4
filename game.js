const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Проверяем, мобильное устройство или нет (примитивная проверка)
const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS/i.test(navigator.userAgent) || window.innerWidth < 600;

// Адаптивный интерфейс: если мобильное, увеличим кнопки
if (isMobile) {
    document.getElementById("fireButton").style.fontSize = "30px";
    document.getElementById("fireButton").style.padding = "15px 30px";
    document.getElementById("bombButton").style.fontSize = "30px";
    document.getElementById("bombButton").style.padding = "15px 30px";
}

// Параметры самолёта и начальное положение
let planeWidth = 50;
let planeHeight = 80;
let planeX = canvas.width/2 - planeWidth/2;
let planeY = canvas.height - 100; 

// Параметры пуль
let bullets = [];
const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 7;

// Параметры бомбы
let bombs = [];
const bombSize = 10;
const bombSpeed = 3;
const bombExplosionRadius = 100;

// Параметры врагов
let enemies = [];
const enemyWidth = 30;
const enemyHeight = 30;
let enemySpeed = 1.5; // Стартовая скорость (будет увеличиваться со счетом)
let spawnInterval = 1500; // Интервал появления врагов в мс
let lastSpawn = 0;

let score = 0;
let lives = 4; // Увеличили жизни на 1
let gameOver = false;

// Взрывы
let explosions = [];
const explosionFrames = 5; // Количество кадров в explosion.png
const explosionFrameWidth = 64; // ширина одного кадра взрыва
const explosionFrameHeight = 64; // высота кадра
// Параметры анимации взрыва
// Каждый взрыв хранит: x, y, frame (текущий кадр), maxFrame, удаление после завершения

let keys = {};

// Управление с клавиатуры (стрелки + пробел + B)
document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    // Стрельба по пробелу
    if (e.code === "Space" && !gameOver) {
        fireBullet();
    }
    // Бомба по клавише "B"
    if (e.code === "KeyB" && !gameOver) {
        dropBomb();
    }
});
document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// Кнопка "Огонь!" на экране
document.getElementById("fireButton").addEventListener("click", () => {
    if (!gameOver) {
        fireBullet();
    }
});

// Кнопка "Бомба!" на экране
document.getElementById("bombButton").addEventListener("click", () => {
    if (!gameOver) {
        dropBomb();
    }
});

// Управление для мобильных устройств (касание экрана)
canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);

function handleTouch(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    planeX = Math.max(0, Math.min(canvas.width - planeWidth, touchX - planeWidth/2));
}

// Загрузка изображений
const planeImg = new Image();
planeImg.src = "plane.png";

const enemyImg = new Image();
enemyImg.src = "enemy.png";

const explosionImg = new Image();
explosionImg.src = "explosion.png"; 
// Предполагается, что в explosion.png 5 кадров взрыва по горизонтали, каждый 64x64 пикс

// Пули можно оставить прямоугольниками, либо использовать спрайт
// const bulletImg = new Image();
// bulletImg.src = "bullet.png";

planeImg.onload = () => console.log("Plane image loaded");
enemyImg.onload = () => console.log("Enemy image loaded");
explosionImg.onload = () => console.log("Explosion image loaded");

function fireBullet() {
    bullets.push({
        x: planeX + planeWidth/2 - bulletWidth/2,
        y: planeY,
        width: bulletWidth,
        height: bulletHeight
    });
}

function dropBomb() {
    bombs.push({
        x: planeX + planeWidth/2 - bombSize/2,
        y: planeY,
        size: bombSize
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

function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        frame: 0,
        maxFrame: explosionFrames,
    });
}

function update(delta, timestamp) {
    if (gameOver) return;

    // Обновляем скорость врагов в зависимости от счета
    enemySpeed = 1.5 + score/20;

    // Движение самолёта (клавиатура)
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

    // Обновляем позиции бомб
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].y -= bombSpeed;
        if (bombs[i].y < 0) {
            // Бомба взрывается, уничтожает врагов в радиусе
            explodeBomb(bombs[i].x + bombSize/2, bombs[i].y + bombSize/2);
            bombs.splice(i, 1);
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
                // Создаем взрыв
                createExplosion(enemies[j].x + enemyWidth/2, enemies[j].y + enemyHeight/2);
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score++;
                break;
            }
        }
    }

    // Проверка столкновений бомб с врагами
    for (let i = bombs.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bombs[i], enemies[j])) {
                // Взрываем бомбу
                explodeBomb(bombs[i].x + bombSize/2, bombs[i].y + bombSize/2);
                bombs.splice(i, 1);
                break;
            }
        }
    }

    // Обновляем взрывы
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].frame += 0.1; // Плавно меняем кадры
        if (explosions[i].frame >= explosions[i].maxFrame) {
            explosions.splice(i, 1);
        }
    }
}

function explodeBomb(cx, cy) {
    // Уничтожаем всех врагов в радиусе
    for (let i = enemies.length - 1; i >= 0; i--) {
        let ex = enemies[i].x + enemyWidth/2;
        let ey = enemies[i].y + enemyHeight/2;
        let dist = Math.hypot(cx - ex, cy - ey);
        if (dist < bombExplosionRadius) {
            createExplosion(ex, ey);
            enemies.splice(i, 1);
            score++;
        }
    }
    // Создаём взрыв в месте бомбы
    createExplosion(cx, cy);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем самолет
    ctx.drawImage(planeImg, planeX, planeY, planeWidth, planeHeight);

    // Рисуем пули (желтые прямоугольники)
    ctx.fillStyle = "yellow";
    for (let b of bullets) {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // Рисуем бомбы (синие круги)
    for (let bomb of bombs) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(bomb.x + bomb.size/2, bomb.y + bomb.size/2, bomb.size/2, 0, Math.PI*2);
        ctx.fill();
    }

    // Рисуем врагов
    for (let e of enemies) {
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
    }

    // Рисуем взрывы
    for (let exp of explosions) {
        let frameIndex = Math.floor(exp.frame);
        ctx.drawImage(explosionImg,
            frameIndex * explosionFrameWidth, 0, explosionFrameWidth, explosionFrameHeight,
            exp.x - explosionFrameWidth/2, exp.y - explosionFrameHeight/2, explosionFrameWidth, explosionFrameHeight
        );
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
