const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Проверяем, мобильное устройство или нет
const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|webOS/i.test(navigator.userAgent) || window.innerWidth < 600;

const fireBtn = document.getElementById("fireButton");
const bombBtn = document.getElementById("bombButton");
if (isMobile) {
    fireBtn.style.fontSize = "30px";
    fireBtn.style.padding = "15px 30px";
    bombBtn.style.fontSize = "30px";
    bombBtn.style.padding = "15px 30px";
}

// Параметры самолёта
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
let enemySpeed = 1.5; 
let spawnInterval = 1500; // Интервал появления врагов в мс
let lastSpawn = 0;

let score = 0;
let lives = 4; // Увеличили жизни

let gameOver = false;

// Взрывы (один кадр)
const explosionFrames = 1; 
const explosionFrameWidth = 64; 
const explosionFrameHeight = 64;

let explosions = [];

// Управление с клавиатуры (стрелки + пробел + B)
let keys = {};
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

// Кнопки на экране
fireBtn.addEventListener("click", () => {
    if (!gameOver) {
        fireBullet();
    }
});

bombBtn.addEventListener("click", () => {
    if (!gameOver) {
        dropBomb();
    }
});

// Управление на мобильных (касание)
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

// Флаги загрузки изображений
let planeLoaded = false;
let enemyLoaded = false;
let explosionLoaded = false;

planeImg.onload = () => { planeLoaded = true; };
enemyImg.onload = () => { enemyLoaded = true; };
explosionImg.onload = () => { explosionLoaded = true; };

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
        maxFrame: explosionFrames
    });
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

function update(delta, timestamp) {
    if (gameOver) return;

    // Скорость врагов растет со счетом
    enemySpeed = 1.5 + score/20;

    // Движение самолёта (клавиатура)
    if (keys["ArrowLeft"] && planeX > 0) {
        planeX -= 5;
    }
    if (keys["ArrowRight"] && planeX < canvas.width - planeWidth) {
        planeX += 5;
    }

    // Пули
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Бомбы
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].y -= bombSpeed;
        if (bombs[i].y < 0) {
            explodeBomb(bombs[i].x + bombSize/2, bombs[i].y + bombSize/2);
            bombs.splice(i, 1);
        }
    }

    // Появление врагов
    if (timestamp - lastSpawn > spawnInterval) {
        spawnEnemy(timestamp);
    }

    // Враги
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        enemy.y += enemySpeed;
        enemy.x += enemy.vx * 0.5; 
        if (enemy.x < 0 || enemy.x > canvas.width - enemy.width) {
            enemy.vx = -enemy.vx;
        }

        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) {
                gameOver = true;
            }
        }
    }

    // Столкновения пуль с врагами
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                createExplosion(enemies[j].x + enemyWidth/2, enemies[j].y + enemyHeight/2);
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score++;
                break;
            }
        }
    }

    // Столкновения бомб с врагами
    for (let i = bombs.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bombs[i], enemies[j])) {
                explodeBomb(bombs[i].x + bombSize/2, bombs[i].y + bombSize/2);
                bombs.splice(i, 1);
                break;
            }
        }
    }

    // Взрывы – без анимации кадров (один кадр)
    // В текущей логике взрывы остаются постоянно.
    // При желании можно добавить таймер и удалять взрывы через некоторое время.
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Самолет
    if (planeLoaded) {
        ctx.drawImage(planeImg, planeX, planeY, planeWidth, planeHeight);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(planeX, planeY, planeWidth, planeHeight);
    }

    // Пули (желтые прямоугольники)
    ctx.fillStyle = "yellow";
    for (let b of bullets) {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // Бомбы (синие круги)
    for (let bomb of bombs) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(bomb.x + bomb.size/2, bomb.y + bomb.size/2, bomb.size/2, 0, Math.PI*2);
        ctx.fill();
    }

    // Враги
    for (let e of enemies) {
        if (enemyLoaded) {
            ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
        } else {
            ctx.fillStyle = "green";
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    }

    // Взрывы – один кадр
    for (let exp of explosions) {
        let frameIndex = Math.floor(exp.frame); // frame = 0
        if (explosionLoaded) {
            ctx.drawImage(explosionImg,
                frameIndex * explosionFrameWidth, 0, explosionFrameWidth, explosionFrameHeight,
                exp.x - explosionFrameWidth/2, exp.y - explosionFrameHeight/2, explosionFrameWidth, explosionFrameHeight
            );
        } else {
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, 20, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // Счет и жизни
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Счёт: " + score, 10, 20);
    ctx.fillText("Жизни: " + lives, 10, 40);

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
