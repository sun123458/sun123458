// ==================== 游戏设置 ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏常量
const TILE_SIZE = 40;
const PLAYER_SPEED = 3;
const BUG_SPAWN_INTERVAL = 3000; // 虫子生成间隔（毫秒）
const BUG_DESPAWN_TIME = 8000; // 虫子消失时间
const NET_RANGE = 60; // 捕虫网范围

// 游戏状态
let gameState = {
    bugCount: 0,
    isDialogOpen: false,
    currentNPC: null
};

// 输入状态
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    e: false, ' ': false
};

// ==================== 玩家类 ====================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.direction = 'down'; // 'up', 'down', 'left', 'right'
        this.isMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 100; // 毫秒
        this.lastAnimTime = 0;
        this.hasNet = false;
        this.netAnim = 0;
    }

    update(deltaTime) {
        let dx = 0, dy = 0;

        // 检测移动输入
        if (keys.w || keys.ArrowUp) { dy = -1; this.direction = 'up'; }
        if (keys.s || keys.ArrowDown) { dy = 1; this.direction = 'down'; }
        if (keys.a || keys.ArrowLeft) { dx = -1; this.direction = 'left'; }
        if (keys.d || keys.ArrowRight) { dx = 1; this.direction = 'right'; }

        this.isMoving = dx !== 0 || dy !== 0;

        // 移动玩家
        if (!gameState.isDialogOpen && this.isMoving) {
            const newX = this.x + dx * PLAYER_SPEED;
            const newY = this.y + dy * PLAYER_SPEED;

            // 边界检测
            if (newX >= 0 && newX <= canvas.width - this.width) {
                if (!this.checkCollision(newX, this.y)) {
                    this.x = newX;
                }
            }
            if (newY >= 0 && newY <= canvas.height - this.height) {
                if (!this.checkCollision(this.x, newY)) {
                    this.y = newY;
                }
            }
        }

        // 更新动画
        if (this.isMoving) {
            this.animTimer += deltaTime;
            if (this.animTimer >= this.animSpeed) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }

        // 捕虫网动画
        if (this.hasNet) {
            this.netAnim += deltaTime;
            if (this.netAnim > 200) {
                this.hasNet = false;
                this.netAnim = 0;
            }
        }
    }

    checkCollision(x, y) {
        // 检查与障碍物的碰撞
        for (let obstacle of obstacles) {
            if (this.rectIntersect(
                x, y, this.width, this.height,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                return true;
            }
        }
        return false;
    }

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    draw() {
        ctx.save();

        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 2, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 根据方向绘制玩家
        this.drawPlayerSprite();

        // 绘制捕虫网动画
        if (this.hasNet) {
            this.drawNet();
        }

        ctx.restore();
    }

    drawPlayerSprite() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // 身体
        ctx.fillStyle = '#3498db';
        ctx.fillRect(centerX - 10, centerY - 8, 20, 16);

        // 头部
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(centerX - 8, centerY - 14, 16, 12);

        // 眼睛
        ctx.fillStyle = '#2c3e50';
        if (this.direction === 'up') {
            // 背面 - 不画眼睛
        } else if (this.direction === 'down') {
            ctx.fillRect(centerX - 5, centerY - 10, 3, 3);
            ctx.fillRect(centerX + 2, centerY - 10, 3, 3);
        } else if (this.direction === 'left') {
            ctx.fillRect(centerX - 6, centerY - 10, 3, 3);
        } else if (this.direction === 'right') {
            ctx.fillRect(centerX + 3, centerY - 10, 3, 3);
        }

        // 腿部动画
        ctx.fillStyle = '#2c3e50';
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;

        if (this.isMoving) {
            ctx.fillRect(centerX - 8, centerY + 6, 5, 8 + legOffset);
            ctx.fillRect(centerX + 3, centerY + 6, 5, 8 - legOffset);
        } else {
            ctx.fillRect(centerX - 8, centerY + 6, 5, 8);
            ctx.fillRect(centerX + 3, centerY + 6, 5, 8);
        }
    }

    drawNet() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();

        let netX = centerX, netY = centerY;
        const reach = 25;

        switch (this.direction) {
            case 'up': netY -= reach; break;
            case 'down': netY += reach; break;
            case 'left': netX -= reach; break;
            case 'right': netX += reach; break;
        }

        ctx.moveTo(centerX, centerY);
        ctx.lineTo(netX, netY);
        ctx.stroke();

        // 网
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        const netSize = 15 + Math.sin(this.netAnim / 200 * Math.PI) * 3;
        ctx.beginPath();
        ctx.arc(netX, netY, netSize, 0, Math.PI * 2);
        ctx.stroke();

        // 网格
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(netX, netY);
            ctx.lineTo(
                netX + Math.cos(angle) * netSize,
                netY + Math.sin(angle) * netSize
            );
            ctx.stroke();
        }
    }
}

// ==================== NPC 类 ====================
class NPC {
    constructor(x, y, name, color, dialog) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.name = name;
        this.color = color;
        this.dialog = dialog;
        this.animFrame = 0;
        this.animTimer = 0;
        this.dialogIndex = 0;
    }

    update(deltaTime) {
        this.animTimer += deltaTime;
        if (this.animTimer >= 500) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }
    }

    draw() {
        ctx.save();

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 2, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // 身体
        ctx.fillStyle = this.color;
        ctx.fillRect(centerX - 10, centerY - 8, 20, 16);

        // 头部
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(centerX - 8, centerY - 14, 16, 12);

        // 眼睛
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(centerX - 5, centerY - 10, 3, 3);
        ctx.fillRect(centerX + 2, centerY - 10, 3, 3);

        // 呼吸动画
        const breathOffset = Math.sin(this.animFrame * Math.PI) * 1;
        ctx.fillRect(centerX - 8, centerY + 6 + breathOffset, 5, 8);
        ctx.fillRect(centerX + 3, centerY + 6 - breathOffset, 5, 8);

        // 对话提示
        if (this.isNearPlayer()) {
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('按 E 对话', centerX, this.y - 10);
        }

        ctx.restore();
    }

    isNearPlayer() {
        const dist = Math.hypot(
            player.x - this.x,
            player.y - this.y
        );
        return dist < 50;
    }

    getNextDialog() {
        const text = this.dialog[this.dialogIndex];
        this.dialogIndex = (this.dialogIndex + 1) % this.dialog.length;
        return text;
    }
}

// ==================== 虫子类 ====================
class Bug {
    constructor() {
        this.width = 16;
        this.height = 16;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = Math.random() * (canvas.height - this.height);
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        this.spawnTime = Date.now();
        this.isCaught = false;
        this.animOffset = Math.random() * 1000;
        this.type = Math.floor(Math.random() * 3);
    }

    update(time) {
        // 飞行动画
        this.animX = Math.sin(time / 200 + this.animOffset) * 5;
        this.animY = Math.cos(time / 150 + this.animOffset) * 3;

        // 检查是否应该消失
        if (Date.now() - this.spawnTime > BUG_DESPAWN_TIME) {
            return false;
        }
        return true;
    }

    draw(time) {
        ctx.save();

        const x = this.x + this.width / 2 + this.animX;
        const y = this.y + this.height / 2 + this.animY;

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 根据类型绘制不同的虫子
        if (this.type === 0) {
            // 蝴蝶
            ctx.fillStyle = this.color;
            const wingFlap = Math.sin(time / 100) * 5;
            ctx.beginPath();
            ctx.ellipse(x - 5, y, 4 + wingFlap / 2, 6, -0.3, 0, Math.PI * 2);
            ctx.ellipse(x + 5, y, 4 + wingFlap / 2, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // 身体
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(x - 1, y - 4, 3, 8);
        } else if (this.type === 1) {
            // 瓢虫
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            // 翅膀
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(x - 6, y, 1, 4);
            ctx.fillRect(x + 5, y, 1, 4);

            // 点
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(x - 3, y - 1, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 1, 1.5, 0, Math.PI * 2);
            ctx.arc(x, y + 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 蜜蜂
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.ellipse(x, y, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // 条纹
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(x - 3, y - 4, 6, 2);
            ctx.fillRect(x - 3, y, 6, 2);

            // 翅膀
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const wingFlap = Math.sin(time / 80) * 3;
            ctx.beginPath();
            ctx.ellipse(x - 4, y - 3, 3 + wingFlap / 2, 5, -0.5, 0, Math.PI * 2);
            ctx.ellipse(x + 4, y - 3, 3 + wingFlap / 2, 5, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isInRange(px, py) {
        const dist = Math.hypot(
            px - (this.x + this.width / 2),
            py - (this.y + this.height / 2)
        );
        return dist < NET_RANGE;
    }
}

// ==================== 障碍物 ====================
class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'tree', 'rock', 'bush'
    }

    draw() {
        ctx.save();

        if (this.type === 'tree') {
            // 树干
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(this.x + this.width / 2 - 8, this.y + this.height - 20, 16, 20);

            // 树冠
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 25, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 - 10, this.y + this.height / 2, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e8449';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 + 10, this.y + this.height / 2 + 5, 15, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'rock') {
            // 岩石
            ctx.fillStyle = '#7f8c8d';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.6);
            ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
            ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height * 0.6);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#95a5a6';
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.4, 5, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'bush') {
            // 灌木
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 - 12, this.y + this.height / 2 + 5, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e8449';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 + 12, this.y + this.height / 2 + 5, 10, 0, Math.PI * 2);
            ctx.fill();

            // 浆果
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 - 5, this.y + this.height / 2 + 8, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width / 2 + 5, this.y + this.height / 2 + 6, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==================== 游戏对象 ====================
let player = new Player(400, 300);
let obstacles = [];
let npcs = [];
let bugs = [];
let lastBugSpawn = 0;

// 初始化游戏对象
function initGame() {
    // 创建障碍物
    obstacles = [
        new Obstacle(100, 100, 50, 50, 'tree'),
        new Obstacle(200, 150, 40, 40, 'rock'),
        new Obstacle(600, 100, 50, 50, 'tree'),
        new Obstacle(700, 200, 40, 40, 'bush'),
        new Obstacle(150, 450, 50, 50, 'tree'),
        new Obstacle(650, 450, 40, 40, 'rock'),
        new Obstacle(350, 250, 40, 30, 'bush'),
        new Obstacle(500, 400, 40, 40, 'bush'),
        new Obstacle(80, 300, 40, 40, 'rock'),
        new Obstacle(720, 350, 50, 50, 'tree'),
    ];

    // 创建 NPCs
    npcs = [
        new NPC(100, 300, '老园丁', '#e67e22', [
            '欢迎来到捕虫花园！',
            '这里有很多稀有的虫子...',
            '用捕虫网（空格键）可以捕捉它们！',
            '祝你捕虫愉快！'
        ]),
        new NPC(650, 100, '昆虫学家', '#9b59b6', [
            '蝴蝶真是太美丽了！',
            '每只虫子都有独特的颜色...',
            '我研究了虫子20年了！',
            '你能帮我收集一些标本吗？'
        ]),
        new NPC(400, 500, '捕虫大师', '#1abc9c', [
            '年轻人，想学捕虫吗？',
            '时机很重要！要在虫子消失前抓住它。',
            '你目前捕到 ' + gameState.bugCount + ' 只虫子。',
            '继续努力，你将成为捕虫大师！'
        ])
    ];
}

// ==================== 游戏循环 ====================
let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime, timestamp);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime, time) {
    // 更新玩家
    player.update(deltaTime);

    // 更新 NPCs
    for (let npc of npcs) {
        npc.update(deltaTime);
    }

    // 生成虫子
    if (time - lastBugSpawn > BUG_SPAWN_INTERVAL && bugs.length < 8) {
        bugs.push(new Bug());
        lastBugSpawn = time;
    }

    // 更新虫子
    bugs = bugs.filter(bug => bug.update(time));

    // 清理过期的虫子
    const validBugs = [];
    for (let bug of bugs) {
        if (Date.now() - bug.spawnTime <= BUG_DESPAWN_TIME) {
            validBugs.push(bug);
        }
    }
    bugs = validBugs;
}

function draw() {
    // 清空画布
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制草地纹理
    ctx.fillStyle = '#6db348';
    for (let i = 0; i < 100; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 47) % canvas.height;
        ctx.fillRect(x, y, 3, 3);
    }

    // 绘制障碍物
    for (let obstacle of obstacles) {
        obstacle.draw();
    }

    // 绘制虫子
    for (let bug of bugs) {
        bug.draw(lastTime);
    }

    // 绘制 NPCs
    for (let npc of npcs) {
        npc.draw();
    }

    // 绘制玩家
    player.draw();
}

// ==================== 捕虫系统 ====================
function catchBug() {
    if (gameState.isDialogOpen) return;

    player.hasNet = true;

    for (let i = bugs.length - 1; i >= 0; i--) {
        const bug = bugs[i];

        // 计算捕虫网位置
        let netX = player.x + player.width / 2;
        let netY = player.y + player.height / 2;
        const reach = 25;

        switch (player.direction) {
            case 'up': netY -= reach; break;
            case 'down': netY += reach; break;
            case 'left': netX -= reach; break;
            case 'right': netX += reach; break;
        }

        const dist = Math.hypot(
            netX - (bug.x + bug.width / 2),
            netY - (bug.y + bug.height / 2)
        );

        if (dist < NET_RANGE) {
            bugs.splice(i, 1);
            gameState.bugCount++;
            updateBugCounter();
            return;
        }
    }
}

function updateBugCounter() {
    document.getElementById('bugCount').textContent = gameState.bugCount;
}

// ==================== 对话系统 ====================
function showDialog(npc) {
    gameState.isDialogOpen = true;
    gameState.currentNPC = npc;

    const dialogBox = document.getElementById('dialogBox');
    const dialogName = document.getElementById('dialogName');
    const dialogText = document.getElementById('dialogText');

    dialogName.textContent = npc.name;

    // 更新捕虫大师的对话以反映当前数量
    if (npc.name === '捕虫大师') {
        const dialogs = [
            '年轻人，想学捕虫吗？',
            '时机很重要！要在虫子消失前抓住它。',
            `你目前捕到 ${gameState.bugCount} 只虫子。`,
            '继续努力，你将成为捕虫大师！'
        ];
        dialogText.textContent = dialogs[npc.dialogIndex];
        npc.dialogIndex = (npc.dialogIndex + 1) % dialogs.length;
    } else {
        dialogText.textContent = npc.getNextDialog();
    }

    dialogBox.classList.add('show');
}

function hideDialog() {
    gameState.isDialogOpen = false;
    gameState.currentNPC = null;
    document.getElementById('dialogBox').classList.remove('show');
}

function tryInteract() {
    if (gameState.isDialogOpen) {
        hideDialog();
        return;
    }

    for (let npc of npcs) {
        if (npc.isNearPlayer()) {
            showDialog(npc);
            return;
        }
    }
}

// ==================== 输入处理 ====================
document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault();
    }

    if (e.key === 'e' || e.key === 'E') {
        tryInteract();
    }

    if (e.key === ' ') {
        catchBug();
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// ==================== 启动游戏 ====================
initGame();
requestAnimationFrame(gameLoop);
