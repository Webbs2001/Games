const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスのリサイズ関数
function resizeCanvas() {
    const deviceWidth = window.innerWidth;
    const deviceHeight = window.innerHeight;

    if (deviceWidth < 800) {
        canvas.width = deviceWidth - 20;
        canvas.height = deviceHeight - 120; // ヘッダーと余白を考慮
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// プレイヤーの設定
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

// unkoの設定
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
    { src: unkoImgs[5], points: 500, speed: 6, zigzag: true },
];

let unkos = [];

// 画面のスコアとタイマー
let score = 0;
let gameTime = 60;
let unkoSpawnRate = 1500;
let mobSpawnRate = 3000;
let lastUnkoSpawnTime = Date.now();
let lastMobSpawnTime = Date.now();
let gameOver = false;

// スマホ用ボタンの設定
document.getElementById('leftBtn').addEventListener('touchstart', () => {
    player.moveLeft = true;
    player.direction = 'left';
});

document.getElementById('rightBtn').addEventListener('touchstart', () => {
    player.moveRight = true;
    player.direction = 'right';
});

document.getElementById('jumpBtn').addEventListener('touchstart', () => {
    if (!player.isJumping) {
        player.isJumping = true;
        player.velocityY = -player.jumpPower;
    }
});

// ボタンを離したときに移動停止するように設定
document.getElementById('leftBtn').addEventListener('touchend', () => {
    player.moveLeft = false;
});

document.getElementById('rightBtn').addEventListener('touchend', () => {
    player.moveRight = false;
});

// プレイヤーの描画
function drawPlayer() {
    const playerImg = player.direction === 'right' ? playerImgRight : playerImgLeft;
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

// プレイヤーの移動
function movePlayer() {
    if (player.moveLeft && player.x > 0) player.x -= player.speed;
    if (player.moveRight && player.x < canvas.width - player.width) player.x += player.speed;

    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;

        if (player.y >= canvas.height - 80) {
            player.y = canvas.height - 80;
            player.isJumping = false;
            player.velocityY = 0;
        }
    }
}

// unkoの生成
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

// unkoの描画
function drawUnkos() {
    unkos.forEach((unko) => {
        ctx.drawImage(unko.img, unko.x, unko.y, unko.width, unko.height);
    });
}

// unkoの移動
function moveUnkos() {
    unkos.forEach((unko, index) => {
        if (unko.zigzag) {
            unko.x += unko.direction * 3;
            if (unko.x <= 0 || unko.x >= canvas.width - unko.width) unko.direction *= -1;
        }
        unko.y += unko.speed;

        // プレイヤーとの衝突判定
        if (
            unko.y + unko.height >= player.y &&
            unko.x < player.x + player.width &&
            unko.x + unko.width > player.x) {
            score += unko.points;
            unkos.splice(index, 1);
        }

        // 画面外に出たら削除
        if (unko.y > canvas.height) {
            unkos.splice(index, 1);
        }
    });
}

// スコアとタイマーの描画
function drawUI() {
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Time: ${Math.max(0, Math.floor(gameTime))}`, canvas.width - 120, 30);
}

// ゲームオーバー画面
function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('Game over', canvas.width / 2 - 120, canvas.height / 2);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 140, canvas.height / 2 + 60);
}

// 暴徒の生成
let mobs = [];
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

// 暴徒の描画
function drawMobs() {
    mobs.forEach((mob) => {
        ctx.drawImage(mob.img, mob.x, mob.y, mob.width, mob.height);
    });
}

// 暴徒の移動
function moveMobs() {
    mobs.forEach((mob, index) => {
        mob.x += mob.direction === 'right' ? mob.speed : -mob.speed;

        // 画面外に出たら削除
        if (mob.x < -50 || mob.x > canvas.width) {
            mobs.splice(index, 1);
        }

        // プレイヤーとの衝突判定
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

// ゲームループ
function gameLoop() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ゲーム時間の更新
    if (gameTime > 0) {
        gameTime -= 0.016;
    } else {
        gameOver = true;
    }

    // プレイヤー、unko、暴徒の描画
    movePlayer();
    drawPlayer();
    moveUnkos();
    drawUnkos();
    moveMobs();
    drawMobs();
    drawUI();

    // unkoと暴徒の生成
    if (Date.now() - lastUnkoSpawnTime > unkoSpawnRate) {
        createUnko();
        lastUnkoSpawnTime = Date.now();
        if (unkoSpawnRate > 500) unkoSpawnRate -= 100; // 最低500msに
    }

    if (Date.now() - lastMobSpawnTime > mobSpawnRate) {
        createMob();
        lastMobSpawnTime = Date.now();
        if (mobSpawnRate > 1500) mobSpawnRate -= 100; // 最低1500msに
    }

    requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();
