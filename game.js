const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// デバイスに応じてキャンバスのサイズを設定
function resizeCanvas() {
    if (window.innerWidth < 800) {
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight - 20 > 400 ? 400 : window.innerHeight - 20;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// プレイヤーとモブの画像
const playerImgRight = new Image();
playerImgRight.src = '../games/img/playerRight.png';
const playerImgLeft = new Image();
playerImgLeft.src = '../games/img/playerLeft.png';

const mobImgRight = new Image();
mobImgRight.src = '../games/img/angryRight.png';
const mobImgLeft = new Image();
mobImgLeft.src = '../games/img/angryLeft.png';
const mobAngryImg = new Image();
mobAngryImg.src = '../games/img/veryAngry.png';

const unkoImgs = [
    '../games/img/unko1.png',
    '../games/img/unko2.png',
    '../games/img/unko3.png',
    '../games/img/unko4.png',
    '../games/img/unko5.png',
    '../games/img/unko6.png'
];

const unkoTypes = [
    { src: unkoImgs[0], points: -20, speed: 2, zigzag: false },
    { src: unkoImgs[1], points: 10, speed: 2, zigzag: false },
    { src: unkoImgs[2], points: 50, speed: 3, zigzag: false },
    { src: unkoImgs[3], points: 100, speed: 4, zigzag: false },
    { src: unkoImgs[4], points: 200, speed: 5, zigzag: false },
    { src: unkoImgs[5], points: 500, speed: 6, zigzag: true }
];

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 7,
    moveLeft: false,
    moveRight: false,
    isJumping: false,
    jumpPower: 15,
    velocityY: 0,
    gravity: 0.8,
    direction: 'right'
};

let mobs = [];
let unkos = [];
let score = 0;
let gameTime = 60;
let unkoSpawnRate = 1500;
let mobSpawnRate = 3000;
let lastUnkoSpawnTime = Date.now();
let lastMobSpawnTime = Date.now();
let gameOver = false;
let gameStarted = false;

// キーボード入力の処理
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        if (!gameStarted) {
            gameStarted = true;
            gameLoop();
        }
    }
    if (e.key === 'ArrowLeft') {
        player.moveLeft = true;
        player.direction = 'left';
    }
    if (e.key === 'ArrowRight') {
        player.moveRight = true;
        player.direction = 'right';
    }
    if (e.key === 'ArrowUp' && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -player.jumpPower;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
});

// スマホ向けのタッチイベント
canvas.addEventListener('touchstart', handleTouch);
function handleTouch(event) {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;

    if (touchY < canvas.height / 3 && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -player.jumpPower;
    } else if (touchX < canvas.width / 2) {
        player.moveLeft = true;
        player.direction = 'left';
    } else {
        player.moveRight = true;
        player.direction = 'right';
    }
}

canvas.addEventListener('touchend', () => {
    player.moveLeft = false;
    player.moveRight = false;
});

// 暴徒の生成関数（常に画面の端から出現）
function createMob() {
    const angry = Math.random() > 0.7;
    const startX = Math.random() < 0.5 ? 0 : canvas.width - 50;
    const mob = {
        x: startX,
        y: canvas.height - 80,
        width: 50,
        height: 50,
        speed: angry ? 8 : 3 + Math.random() * 3,
        direction: startX === 0 ? 'right' : 'left',
        angry: angry,
        img: angry ? mobAngryImg : (startX === 0 ? mobImgRight : mobImgLeft)
    };
    mobs.push(mob);
}

// 初期画面の表示
function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.font = '36px Arial';
    ctx.fillText('Press SPACE to Start', canvas.width / 2 - 150, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Use Arrow keys to move and jump', canvas.width / 2 - 200, canvas.height / 2 + 50);
    ctx.fillText('Catch the good items, avoid the bad ones!', canvas.width / 2 - 220, canvas.height / 2 + 90);
}

// ゲームループ
function gameLoop() {
    if (!gameStarted) return;

    if (gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 140, canvas.height / 2 + 60);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    moveMobs();
    drawPlayer();
    drawMobs();

    requestAnimationFrame(gameLoop);
}

// 初期画面の描画
if (!gameStarted) drawStartScreen();
