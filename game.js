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

// Взрывы (теперь только один кадр)
const explosionFrames = 1; // Было 5, теперь 1
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

const
