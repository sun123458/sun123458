// 游戏配置
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TILE_SIZE: 32,
    PLAYER_SPEED: 3,
    BUG_SIZE: 16,
    BUG_SPAWN_INTERVAL: 3000, // 3秒生成一个虫子
    MAX_BUGS: 10,
    INTERACTION_DISTANCE: 40,
    NET_REACH: 50
};

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    keys: {},
    player: null,
    obstacles: [],
    npcs: [],
    bugs: [],
    bugCount: 0,
    lastBugSpawn: 0,
    activeDialog: null,
    isDialogOpen: false,
    netAnimation: {
        active: false,
        x: 0,
        y: 0,
        frame: 0
    }
};

// 玩家类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.direction = 'down'; // 'up', 'down', 'left', 'right'
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationSpeed = 8;
        this.frameCount = 0;
    }

    update(obstacles, npcs) {
        this.isMoving = false;
        let newX = this.x;
        let newY = this.y;

        // 移动逻辑
        if (game.keys['ArrowUp'] || game.keys['KeyW']) {
            newY -= CONFIG.PLAYER_SPEED;
            this.direction = 'up';
            this.isMoving = true;
        }
        if (game.keys['ArrowDown'] || game.keys['KeyS']) {
            newY += CONFIG.PLAYER_SPEED;
            this.direction = 'down';
            this.isMoving = true;
        }
        if (game.keys['ArrowLeft'] || game.keys['KeyA']) {
            newX -= CONFIG.PLAYER_SPEED;
            this.direction = 'left';
            this.isMoving = true;
        }
        if (game.keys['ArrowRight'] || game.keys['KeyD']) {
            newX += CONFIG.PLAYER_SPEED;
            this.direction = 'right';
            this.isMoving = true;
        }

        // 动画帧更新
        if (this.isMoving) {
            this.frameCount++;
            if (this.frameCount >= this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.frameCount = 0;
            }
        } else {
            this.animationFrame = 0;
        }

        // 碰撞检测
        if (!this.checkCollision(newX, this.y, obstacles, npcs)) {
            this.x = Math.max(0, Math.min(newX, CONFIG.CANVAS_WIDTH - this.width));
        }
        if (!this.checkCollision(this.x, newY, obstacles, npcs)) {
            this.y = Math.max(0, Math.min(newY, CONFIG.CANVAS_HEIGHT - this.height));
        }
    }

    checkCollision(x, y, obstacles, npcs) {
        const playerRect = {
            x: x + 4,
            y: y + 8,
            width: this.width - 8,
            height: this.height - 12
        };

        // 检查障碍物碰撞
        for (const obstacle of obstacles) {
            if (this.rectIntersect(playerRect, obstacle)) {
                return true;
            }
        }

        // 检查NPC碰撞
        for (const npc of npcs) {
            if (this.rectIntersect(playerRect, npc)) {
                return true;
            }
        }

        return false;
    }

    rectIntersect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // 根据方向绘制角色
        const frameOffset = this.animationFrame * 2;

        // 身体
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-10, -12, 20, 24);

        // 头
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-8, -14, 16, 14);

        // 眼睛
        ctx.fillStyle = '#2c3e50';
        if (this.direction === 'up') {
            // 背面没有眼睛
        } else if (this.direction === 'down' || this.direction === 'left' || this.direction === 'right') {
            ctx.fillRect(-5, -10, 2, 3);
            ctx.fillRect(3, -10, 2, 3);
        }

        // 腿部动画
        ctx.fillStyle = '#34495e';
        const legOffset = Math.sin(frameOffset * 0.3) * 3;
        ctx.fillRect(-8 + legOffset, 12, 4, 6);
        ctx.fillRect(4 - legOffset, 12, 4, 6);

        // 手持捕虫网
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(12, 0, 6, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.restore();
    }
}

// NPC类
class NPC {
    constructor(x, y, name, dialog) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.name = name;
        this.dialog = dialog;
        this.color = this.getRandomColor();
        this.frameCount = 0;
    }

    getRandomColor() {
        const colors = ['#9b59b6', '#1abc9c', '#e67e22', '#16a085', '#d35400'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.frameCount++;
    }

    draw(ctx) {
        const bobOffset = Math.sin(this.frameCount * 0.05) * 2;

        // 身体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 4, this.y + 6, 20, 22);

        // 头
        ctx.fillStyle = '#f5deb3';
        ctx.fillRect(this.x + 6, this.y, 16, 14);

        // 眼睛
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 10, this.y + 4, 3, 3);
        ctx.fillRect(this.x + 15, this.y + 4, 3, 3);

        // 叹号标记（可以互动）
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 12, this.y - 12, 4, 8);
        ctx.fillRect(this.x + 11, this.y - 4, 6, 2);
    }

    getDistanceToPlayer(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const npcCenterX = this.x + this.width / 2;
        const npcCenterY = this.y + this.height / 2;

        return Math.sqrt(
            Math.pow(playerCenterX - npcCenterX, 2) +
            Math.pow(playerCenterY - npcCenterY, 2)
        );
    }
}

// 虫子类
class Bug {
    constructor() {
        this.x = Math.random() * (CONFIG.CANVAS_WIDTH - 40) + 20;
        this.y = Math.random() * (CONFIG.CANVAS_HEIGHT - 40) + 20;
        this.size = CONFIG.BUG_SIZE;
        this.type = this.getRandomBugType();
        this.direction = Math.random() * Math.PI * 2;
        this.speed = 1 + Math.random();
        this.changeDirectionTimer = 0;
        this.frameCount = 0;
        this.alive = true;
        this.alpha = 1;
        this.scale = 0;
        this.spawning = true;
    }

    getRandomBugType() {
        const types = ['butterfly', 'beetle', 'dragonfly'];
        return types[Math.floor(Math.random() * types.length)];
    }

    spawnAnimation() {
        if (this.spawning) {
            this.scale += 0.1;
            if (this.scale >= 1) {
                this.scale = 1;
                this.spawning = false;
            }
        }
    }

    update() {
        if (!this.alive) {
            return;
        }

        this.spawnAnimation();
        this.frameCount++;

        // 随机改变方向
        this.changeDirectionTimer++;
        if (this.changeDirectionTimer > 60) {
            this.direction += (Math.random() - 0.5) * 0.5;
            this.changeDirectionTimer = 0;
        }

        // 移动
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // 边界检测
        if (this.x < 20) this.x = 20;
        if (this.x > CONFIG.CANVAS_WIDTH - 20) this.x = CONFIG.CANVAS_WIDTH - 20;
        if (this.y < 20) this.y = 20;
        if (this.y > CONFIG.CANVAS_HEIGHT - 20) this.y = CONFIG.CANVAS_HEIGHT - 20;

        // 保持在屏幕内
        this.x = Math.max(20, Math.min(this.x, CONFIG.CANVAS_WIDTH - 20));
        this.y = Math.max(20, Math.min(this.y, CONFIG.CANVAS_HEIGHT - 20));
    }

    draw(ctx) {
        if (!this.alive) {
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // 虫子飞行时的轻微抖动
        if (!this.spawning) {
            ctx.translate(Math.sin(this.frameCount * 0.2) * 1, Math.cos(this.frameCount * 0.15) * 1);
        }
        ctx.scale(this.scale, this.scale);

        if (this.type === 'butterfly') {
            // 蝴蝶
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.ellipse(-6, 0, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(6, 0, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // 翅膀动画
            const wingAngle = Math.sin(this.frameCount * 0.3) * 0.3;
            ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
            ctx.save();
            ctx.rotate(wingAngle);
            ctx.fillRect(-8, -8, 4, 12);
            ctx.fillRect(4, -8, 4, 12);
            ctx.restore();

        } else if (this.type === 'beetle') {
            // 甲虫
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(-5, -3, 10, 6);
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-3, -5, 6, 4);
            ctx.fillRect(-3, 1, 6, 4);

            // 腿
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(-8, -2);
            ctx.moveTo(-4, 0);
            ctx.lineTo(-8, 2);
            ctx.moveTo(4, 0);
            ctx.lineTo(8, -2);
            ctx.moveTo(4, 0);
            ctx.lineTo(8, 2);
            ctx.stroke();

        } else if (this.type === 'dragonfly') {
            // 蜻蜓
            ctx.fillStyle = '#3498db';
            ctx.fillRect(-1, -3, 2, 6);

            // 翅膀（快速振动）
            ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(0, -2 + i * 2);
                ctx.lineTo(8 + Math.sin(this.frameCount * 0.8 + i) * 2, -2 + i * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -2 + i * 2);
                ctx.lineTo(-8 - Math.sin(this.frameCount * 0.8 + i) * 2, -2 + i * 2);
                ctx.stroke();
            }

            // 大眼睛
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-2, -3, 2, 0, Math.PI * 2);
            ctx.arc(2, -3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 发光效果
        ctx.shadowColor = this.type === 'dragonfly' ? '#3498db' :
                          this.type === 'butterfly' ? '#f39c12' : '#c0392b';
        ctx.shadowBlur = 8;
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// 障碍物类
class Obstacle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        // 石头/障碍物
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 添加纹理
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, 4);
        ctx.fillRect(this.x + 4, this.y + this.height - 8, this.width - 8, 4);

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + this.width, this.y + 4, 4, this.height);
    }
}

// 初始化游戏
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // 创建玩家
    game.player = new Player(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);

    // 创建障碍物
    game.obstacles = [
        new Obstacle(100, 100, 64, 64),
        new Obstacle(300, 200, 96, 64),
        new Obstacle(600, 150, 64, 96),
        new Obstacle(150, 400, 128, 64),
        new Obstacle(500, 350, 96, 96),
        new Obstacle(650, 450, 64, 64),
    ];

    // 创建NPC
    game.npcs = [
        new NPC(50, 50, '老爷爷', '年轻人，你好！这片草地有很多稀有的虫子。用空格键可以捕捉它们。'),
        new NPC(700, 50, '小女孩', '我最喜欢蝴蝶了！它们的翅膀好漂亮啊！'),
        new NPC(700, 500, '昆虫学家', '注意观察不同种类的虫子，它们的飞行模式各不相同。好好研究它们吧！')
    ];

    // 初始生成一些虫子
    for (let i = 0; i < 5; i++) {
        const bug = new Bug();
        bug.scale = 1;
        bug.spawning = false;
        game.bugs.push(bug);
    }

    // 键盘事件监听
    setupEventListeners();

    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 设置事件监听器
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        game.keys[e.code] = true;

        // E键交互
        if (e.code === 'KeyE') {
            handleInteraction();
        }

        // 空格键捕虫
        if (e.code === 'Space') {
            e.preventDefault();
            handleBugCatching();
        }

        // ESC关闭对话框
        if (e.code === 'Escape' && game.isDialogOpen) {
            closeDialog();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.code] = false;
    });
}

// 处理交互
function handleInteraction() {
    if (game.isDialogOpen) {
        closeDialog();
        return;
    }

    for (const npc of game.npcs) {
        if (npc.getDistanceToPlayer(game.player) < CONFIG.INTERACTION_DISTANCE) {
            showDialog(npc);
            break;
        }
    }
}

// 显示对话框
function showDialog(npc) {
    game.isDialogOpen = true;
    game.activeDialog = npc;

    const dialogBox = document.getElementById('dialogBox');
    const dialogTitle = document.getElementById('dialogTitle');
    const dialogText = document.getElementById('dialogText');

    dialogTitle.textContent = npc.name;
    dialogText.textContent = npc.dialog;
    dialogBox.classList.add('active');
}

// 关闭对话框
function closeDialog() {
    game.isDialogOpen = false;
    game.activeDialog = null;
    document.getElementById('dialogBox').classList.remove('active');
}

// 处理捕虫
function handleBugCatching() {
    if (game.isDialogOpen || game.netAnimation.active) {
        return;
    }

    // 计算捕虫网位置
    let netX = game.player.x + game.player.width / 2;
    let netY = game.player.y + game.player.height / 2;

    if (game.player.direction === 'up') {
        netY -= CONFIG.NET_REACH;
    } else if (game.player.direction === 'down') {
        netY += CONFIG.NET_REACH;
    } else if (game.player.direction === 'left') {
        netX -= CONFIG.NET_REACH;
    } else if (game.player.direction === 'right') {
        netX += CONFIG.NET_REACH;
    }

    // 开始捕虫动画
    game.netAnimation.active = true;
    game.netAnimation.x = netX;
    game.netAnimation.y = netY;
    game.netAnimation.frame = 0;

    // 检测是否捕捉到虫子
    setTimeout(() => {
        for (let i = game.bugs.length - 1; i >= 0; i--) {
            const bug = game.bugs[i];
            if (!bug.alive || bug.spawning) continue;

            const distance = Math.sqrt(
                Math.pow(netX - bug.x, 2) +
                Math.pow(netY - bug.y, 2)
            );

            if (distance < 30) {
                bug.alive = false;
                game.bugCount++;
                updateBugCount();
                game.bugs.splice(i, 1);

                // 捕捉特效
                createCatchEffect(bug.x, bug.y);
                break;
            }
        }
    }, 100);
}

// 创建捕捉特效
function createCatchEffect(x, y) {
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = (x + game.canvas.offsetLeft) + 'px';
    effect.style.top = (y + game.canvas.offsetTop) + 'px';
    effect.style.color = '#f1c40f';
    effect.style.fontSize = '24px';
    effect.style.fontWeight = 'bold';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '1000';
    effect.textContent = '+1 🦋';
    document.body.appendChild(effect);

    setTimeout(() => {
        document.body.removeChild(effect);
    }, 500);
}

// 更新捕虫计数
function updateBugCount() {
    document.getElementById('bugCount').textContent = game.bugCount;
}

// 生成虫子
function spawnBug() {
    const now = Date.now();
    if (now - game.lastBugSpawn > CONFIG.BUG_SPAWN_INTERVAL &&
        game.bugs.length < CONFIG.MAX_BUGS) {
        game.bugs.push(new Bug());
        game.lastBugSpawn = now;
    }
}

// 绘制背景
function drawBackground(ctx) {
    // 草地背景
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 草地纹理
    for (let i = 0; i < 200; i++) {
        const x = (i * 47) % CONFIG.CANVAS_WIDTH;
        const y = (i * 31) % CONFIG.CANVAS_HEIGHT;
        ctx.fillStyle = `rgba(39, 174, 96, ${0.3 + Math.sin(i * 0.5) * 0.1})`;
        ctx.fillRect(x, y, 3, 3);
    }

    // 装饰性花朵
    for (let i = 0; i < 30; i++) {
        const x = (i * 73) % CONFIG.CANVAS_WIDTH;
        const y = (i * 51) % CONFIG.CANVAS_HEIGHT;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制捕虫网动画
function drawNetAnimation(ctx) {
    if (!game.netAnimation.active) {
        return;
    }

    game.netAnimation.frame++;
    if (game.netAnimation.frame > 15) {
        game.netAnimation.active = false;
        return;
    }

    const progress = game.netAnimation.frame / 15;
    const scale = Math.sin(progress * Math.PI);

    ctx.save();
    ctx.translate(game.netAnimation.x, game.netAnimation.y);
    ctx.scale(scale, scale);

    // 网圈
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();

    // 网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
        ctx.stroke();
    }

    ctx.restore();
}

// 游戏主循环
function gameLoop() {
    // 清空画布
    game.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 绘制背景
    drawBackground(game.ctx);

    // 更新和绘制障碍物
    for (const obstacle of game.obstacles) {
        obstacle.draw(game.ctx);
    }

    // 更新和绘制NPC
    for (const npc of game.npcs) {
        npc.update();
        npc.draw(game.ctx);
    }

    // 更新和绘制虫子
    for (const bug of game.bugs) {
        bug.update();
        bug.draw(game.ctx);
    }

    // 更新玩家（如果对话框未打开）
    if (!game.isDialogOpen) {
        game.player.update(game.obstacles, game.npcs);
    }
    game.player.draw(game.ctx);

    // 绘制捕虫网动画
    drawNetAnimation(game.ctx);

    // 生成新虫子
    spawnBug();

    // 下一帧
    requestAnimationFrame(gameLoop);
}

// 启动游戏
window.onload = init;
