const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// resize canvas size depending of device width
if (window.innerWidth < 800) {
    canvas.width = window.innerWidth - 20;
    canvas.height = 400;
}

// player img
const playerImgRight = new Image();
playerImgRight.src = '../games/img/playerRight.png';
const playerImgLeft = new Image();
playerImgLeft.src = '../games/img/playerLeft.png';

// mob img
const mobImgRight = new Image();
mobImgRight.src = '../games/img/angryRight.png';
const mobImgLeft = new Image();
mobImgLeft.src = '../games/img/angryLeft.png';
const mobAngryImg = new Image();
mobAngryImg.src = '../games/img/veryAngry.png';


// unko img
const unkoImgs = [
    '../games/img/unko1.png',
    '../games/img/unko2.png',
    '../games/img/unko3.png',
    '../games/img/unko4.png',
    '../games/img/unko5.png',
    '../games/img/unko6.png'
]

const unkoTypes = [
    { src: unkoImgs[0], points: -20, speed: 2, zigzag: false },
    { src: unkoImgs[1], points: 10, speed: 2, zigzag: false },
    { src: unkoImgs[2], points: 50, speed: 3, zigzag: false },
    { src: unkoImgs[3], points: 100, speed: 4, zigzag: false },
    { src: unkoImgs[4], points: 200, speed: 5, zigzag: false },
    { src: unkoImgs[5], points: 500, speed: 6, zigzag: true },
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

// handle keyboard input
document.addEventListener('keydown', (e) => {
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

// for smartphone
canvas.addEventListener('touchstart', handleTouch);
function handleTouch(event) {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;

    if (touchY < canvas.height / 2 && !player.isJumping) {
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

// generate mob
function createMob() {
    const angry = Math.random() > 0.7;
    const mob = {
        x: angry ? (Math.random() < 0.5 ? 0 : canvas.width - 50) : Math.random() * canvas.width,
        y: canvas.height - 80,
        width: 50,
        height: 50,
        speed: angry ? 8 : 3 + Math.random() * 3,
        direction: angry ? (Math.random() < 0.5 ? 'left': 'right') : (Math.random() < 0.5 ? 'left' : 'right'),
        angry: angry,
        img: angry ? mobAngryImg : (Math.random() < 0.5 ? mobImgRight : mobImgLeft)
    };
    mobs.push(mob);
}

// generate unko
function createUnko() {
    const type = unkoTypes[Math.floor(Math.random() * unkoTypes.length)];
    const img = new Image();
    img.src = type.src;
    const unko = {
        img: img,
        x: Math.random() * (canvas.width - 30),
        y: 0,
        width: 40,
        height: 40,
        speed: type.speed,
        points: type.points,
        zigzag: type.zigzag,
        direction: Math.random() < 0.5 ? -1 : 1
    };
    unkos.push(unko);
}

// draw player
function drawPlayer() {
    const playerImg = player.direction === 'right' ? playerImgRight : playerImgLeft;
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

// draw unko
function drawUnkos() {
    unkos.forEach((unko) => {
        ctx.drawImage(unko.img, unko.x, unko.y, unko.width, unko.height);
    });
}

// draw mob
function drawMobs() {
    mobs.forEach((mob) => {
        ctx.drawImage(mob.img, mob.x, mob.y, mob.width, mob.height);
    });
}

// move player
function movePlayer() {
    if (player.moveLeft && player.x > 0) player.x -= player.speed;
    if (player.moveRight && player.x < canvas.width - player.width) player.x += player.speed;

    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;

        // finish jump when reached ground
        if (player.y >= canvas.height - 80) {
            player.y = canvas.height - 80;
            player.isJumping = false;
            player.velocityY = 0;
        }
    }
}

// move mobs
function moveMobs() {
    mobs.forEach((mob, index) => {
        mob.x += mob.direction === 'right' ? mob.speed : -mob.speed;

        // erase if out of screen
        if (mob.x < -50 || mob.x > canvas.width) {
            mobs.splice(index, 1);
        }

        // collision detection with player
        if (
            player.x < mob.x + mob.width &&
            player.x + player.width > mob.x &&
            player.y < mob.y + mob.height &&
            player.y + player.height > mob.y
        ) {
            gameOver = true;
            score = 0;
        }
    });
}

// move unko
function moveUnkos() {
    unkos.forEach((unko, index) => {
        if (unko.zigzag) {
            unko.x += unko.direction * 3;
            if (unko.x <= 0 || unko.x >= canvas.width - unko.width) unko.direction *= -1;
        }
        unko.y += unko.speed;

        // if collided with player, add points and erase
        if (
            unko.y + unko.height >= player.y &&
            unko.x < player.x + player.width &&
            unko.x + unko.width > player.x) {
            score += unko.points;
            unkos.splice(index, 1);
        }

        // erase if out of canvas
        if (unko.y > canvas.height) {
            unkos.splice(index, 1);
        }
    });
}

// show score and timer
function drawUI() {
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Time: ${Math.max(0, Math.floor(gameTime))}`, canvas.width - 120, 30);
}

// game loop
function gameLoop() {
    if (gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '48px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Game over', canvas.width / 2 - 120, canvas.height / 2);
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 140, canvas.height / 2 + 60);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    movePlayer();
    moveMobs();
    moveUnkos();
    drawPlayer();
    drawMobs();
    drawUnkos();
    drawUI();

    // generate unkos (gain speeds along time passing)
    if (Date.now() - lastUnkoSpawnTime > unkoSpawnRate) {
        createUnko();
        lastUnkoSpawnTime = Date.now();
        unkoSpawnRate *= 0.98;
    }

    // generate mobs
    if (Date.now() - lastMobSpawnTime > mobSpawnRate) {
        createMob();
        lastMobSpawnTime = Date.now();
    }

    // renew timer
    gameTime -= 0.016;
    if (gameTime <= 0) {
        gameOver = true;
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();