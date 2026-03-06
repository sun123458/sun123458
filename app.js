// ===== 应用状态管理 =====
class AppState {
    constructor() {
        this.isRecording = false;
        this.sharedArea = null;
        this.currentTool = 'pen';
        this.strokeColor = '#000000';
        this.brushSize = 3;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.drawHistory = [];
        this.currentPath = [];

        // 参与者数据
        this.participants = [
            { id: 1, name: '老师', avatar: '老', status: 'host', muted: false, speaking: false },
            { id: 2, name: '小明', avatar: '明', status: 'online', muted: true, speaking: false },
            { id: 3, name: '小红', avatar: '红', status: 'online', muted: false, speaking: true },
            { id: 4, name: '小刚', avatar: '刚', status: 'online', muted: false, speaking: false }
        ];

        // 聊天消息
        this.messages = [
            { id: 1, userId: 1, userName: '老师', content: '欢迎大家来到今天的课程！', time: '14:00', isSelf: false },
            { id: 2, userId: 2, userName: '小明', content: '老师好！', time: '14:01', isSelf: false },
            { id: 3, userId: 3, userName: '小红', content: '很高兴参加', time: '14:02', isSelf: true }
        ];

        // 当前用户
        this.currentUser = { id: 3, name: '小红', avatar: '红' };

        // 表情列表
        this.emojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '👏', '🙏', '💯', '❤️', '🎉', '✨', '📚', '✏️', '🖐️', '👋'];
    }

    // 添加聊天消息
    addMessage(content) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const message = {
            id: this.messages.length + 1,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            content: content,
            time: time,
            isSelf: true
        };
        this.messages.push(message);
        return message;
    }

    // 切换录制状态
    toggleRecording() {
        this.isRecording = !this.isRecording;
        return this.isRecording;
    }

    // 设置共享区域
    setSharedArea(area) {
        this.sharedArea = area;
        return area;
    }

    // 保存绘图路径
    savePath(path) {
        this.drawHistory.push([...path]);
    }

    // 撤销
    undo() {
        return this.drawHistory.pop();
    }
}

// 初始化应用状态
const state = new AppState();

// ===== 白板功能 =====
class Whiteboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.setupEventListeners();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // 设置实际画布大小（考虑高DPI屏幕）
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // 缩放上下文
        this.ctx.scale(dpr, dpr);

        // 设置显示大小
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // 设置线条样式
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 重绘历史
        this.redrawHistory();
    }

    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing(touch);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw(touch);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // 窗口大小改变
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resizeCanvas(), 250);
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / (rect.width * (window.devicePixelRatio || 1));
        const scaleY = this.canvas.height / (rect.height * (window.devicePixelRatio || 1));
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        state.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        state.lastX = coords.x;
        state.lastY = coords.y;
        state.currentPath = [{ x: coords.x, y: coords.y, color: state.strokeColor, size: state.brushSize, tool: state.currentTool }];
    }

    draw(e) {
        if (!state.isDrawing) return;

        const coords = this.getCanvasCoordinates(e);

        this.ctx.beginPath();
        this.ctx.moveTo(state.lastX, state.lastY);
        this.ctx.lineTo(coords.x, coords.y);

        if (state.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = state.brushSize * 5;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = state.strokeColor;
            this.ctx.lineWidth = state.brushSize;
        }

        this.ctx.stroke();

        // 保存路径点
        state.currentPath.push({ x: coords.x, y: coords.y });

        state.lastX = coords.x;
        state.lastY = coords.y;
    }

    stopDrawing() {
        if (state.isDrawing && state.currentPath.length > 0) {
            state.savePath(state.currentPath);
        }
        state.isDrawing = false;
        state.currentPath = [];
        this.ctx.globalCompositeOperation = 'source-over';
    }

    clear() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        state.drawHistory = [];
    }

    undo() {
        if (state.drawHistory.length > 0) {
            state.drawHistory.pop();
            this.redrawHistory();
        }
    }

    redrawHistory() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);

        state.drawHistory.forEach(path => {
            if (path.length < 2) return;

            this.ctx.beginPath();
            this.ctx.moveTo(path[0].x, path[0].y);

            for (let i = 1; i < path.length; i++) {
                this.ctx.lineTo(path[i].x, path[i].y);
            }

            if (path[0].tool === 'eraser') {
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = path[0].size * 5;
            } else {
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = path[0].color;
                this.ctx.lineWidth = path[0].size;
            }

            this.ctx.stroke();
        });

        this.ctx.globalCompositeOperation = 'source-over';
    }

    setColor(color) {
        state.strokeColor = color;
    }

    setSize(size) {
        state.brushSize = size;
    }

    setTool(tool) {
        state.currentTool = tool;
    }
}

// ===== 聊天功能 =====
class Chat {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPicker = document.getElementById('emojiPicker');

        this.setupEventListeners();
        this.renderMessages();
        this.renderEmojis();
    }

    setupEventListeners() {
        // 发送消息
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // 回车发送
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 表情选择器切换
        this.emojiBtn.addEventListener('click', () => {
            this.emojiPicker.classList.toggle('active');
            this.emojiBtn.classList.toggle('active');
        });
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';

        state.messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            this.messagesContainer.appendChild(messageEl);
        });

        this.scrollToBottom();
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `chat-message${message.isSelf ? ' self' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = 'chat-message-avatar';
        avatar.textContent = message.isSelf ? state.currentUser.avatar : message.userName.charAt(0);

        const content = document.createElement('div');
        content.className = 'chat-message-content';

        const name = document.createElement('div');
        name.className = 'chat-message-name';
        name.textContent = message.userName + (message.isSelf ? ' (我)' : '');

        const bubble = document.createElement('div');
        bubble.className = 'chat-message-bubble';
        bubble.textContent = message.content;

        const time = document.createElement('div');
        time.className = 'chat-message-time';
        time.textContent = message.time;

        content.appendChild(name);
        content.appendChild(bubble);
        content.appendChild(time);

        div.appendChild(avatar);
        div.appendChild(content);

        return div;
    }

    renderEmojis() {
        const grid = this.emojiPicker.querySelector('.emoji-grid');
        grid.innerHTML = '';

        state.emojis.forEach(emoji => {
            const emojiEl = document.createElement('div');
            emojiEl.className = 'emoji-item';
            emojiEl.textContent = emoji;
            emojiEl.addEventListener('click', () => this.insertEmoji(emoji));
            grid.appendChild(emojiEl);
        });
    }

    insertEmoji(emoji) {
        this.messageInput.value += emoji;
        this.messageInput.focus();
    }

    sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;

        const message = state.addMessage(content);
        const messageEl = this.createMessageElement(message);
        this.messagesContainer.appendChild(messageEl);

        this.messageInput.value = '';
        this.scrollToBottom();

        // 模拟自动回复
        setTimeout(() => this.simulateReply(), 1000 + Math.random() * 2000);
    }

    simulateReply() {
        const replies = [
            '好的，明白了！',
            '谢谢分享 😊',
            '这个观点很有意思',
            '我也这么想',
            '学到了！',
            '👍',
            '继续加油！'
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const randomUser = state.participants[Math.floor(Math.random() * (state.participants.length - 1))];

        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const message = {
            id: state.messages.length + 1,
            userId: randomUser.id,
            userName: randomUser.name,
            content: randomReply,
            time: time,
            isSelf: false
        };

        state.messages.push(message);
        const messageEl = this.createMessageElement(message);
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// ===== 参与者列表 =====
class Participants {
    constructor() {
        this.container = document.getElementById('participantsList');
        this.countEl = document.getElementById('participantCount');

        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.countEl.textContent = state.participants.length;

        state.participants.forEach(participant => {
            const el = this.createParticipantElement(participant);
            this.container.appendChild(el);
        });
    }

    createParticipantElement(participant) {
        const div = document.createElement('div');
        div.className = `participant-item${participant.speaking ? ' speaking' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = `participant-avatar${participant.muted ? ' muted' : ''}`;
        avatar.textContent = participant.avatar;

        const info = document.createElement('div');
        info.className = 'participant-info';

        const name = document.createElement('div');
        name.className = 'participant-name';
        name.textContent = participant.name + (participant.status === 'host' ? ' (老师)' : '');

        const status = document.createElement('div');
        status.className = `participant-status ${participant.status}`;
        status.textContent = participant.status === 'host' ? '主持人' : '在线';

        info.appendChild(name);
        info.appendChild(status);

        div.appendChild(avatar);
        div.appendChild(info);

        return div;
    }
}

// ===== 屏幕共享模拟 =====
class ScreenShare {
    constructor() {
        this.modal = document.getElementById('shareAreaModal');
        this.selectBtn = document.getElementById('selectShareAreaBtn');
        this.closeBtn = document.getElementById('closeModal');
        this.shareBorder = document.getElementById('shareBorder');
        this.areaBtns = this.modal.querySelectorAll('.area-btn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.selectBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());

        this.areaBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectArea(btn.dataset.area));
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.add('active');
    }

    closeModal() {
        this.modal.classList.remove('active');
    }

    selectArea(area) {
        state.setSharedArea(area);
        this.closeModal();

        // 高亮显示共享区域
        if (area === 'whiteboard') {
            this.highlightWhiteboard();
        } else if (area === 'screen') {
            this.highlightScreen();
        }

        // 更新按钮状态
        this.selectBtn.textContent = '正在共享: ' + (area === 'whiteboard' ? '白板' : '屏幕');
        this.selectBtn.classList.add('sharing');
    }

    highlightWhiteboard() {
        const whiteboard = document.querySelector('.whiteboard-container');
        whiteboard.style.outline = '3px solid #10b981';
        whiteboard.style.outlineOffset = '2px';

        setTimeout(() => {
            whiteboard.style.outline = 'none';
        }, 5000);
    }

    highlightScreen() {
        const screenArea = document.querySelector('.screen-share-area');
        this.shareBorder.classList.add('active');

        setTimeout(() => {
            this.shareBorder.classList.remove('active');
        }, 5000);
    }
}

// ===== 录制功能 =====
class Recorder {
    constructor() {
        this.btn = document.getElementById('recordBtn');
        this.indicator = document.getElementById('recordingIndicator');

        this.btn.addEventListener('click', () => this.toggle());
    }

    toggle() {
        const isRecording = state.toggleRecording();

        if (isRecording) {
            this.btn.classList.add('active');
            this.indicator.classList.add('active');
        } else {
            this.btn.classList.remove('active');
            this.indicator.classList.remove('active');
        }
    }
}

// ===== 白板工具栏 =====
class Toolbar {
    constructor(whiteboard) {
        this.whiteboard = whiteboard;
        this.toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
        this.colorPicker = document.getElementById('colorPicker');
        this.brushSize = document.getElementById('brushSize');
        this.clearBtn = document.getElementById('clearBtn');
        this.undoBtn = document.getElementById('undoBtn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 工具切换
        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.whiteboard.setTool(btn.dataset.tool);
            });
        });

        // 颜色选择
        this.colorPicker.addEventListener('input', (e) => {
            this.whiteboard.setColor(e.target.value);
        });

        // 笔刷大小
        this.brushSize.addEventListener('input', (e) => {
            this.whiteboard.setSize(parseInt(e.target.value));
        });

        // 清空
        this.clearBtn.addEventListener('click', () => {
            this.whiteboard.clear();
        });

        // 撤销
        this.undoBtn.addEventListener('click', () => {
            this.whiteboard.undo();
        });
    }
}

// ===== 响应式处理 =====
class ResponsiveHandler {
    constructor() {
        this.chatToggle = document.getElementById('toggleChat');
        this.chatSidebar = document.getElementById('chatSidebar');

        this.chatToggle.addEventListener('click', () => {
            this.chatSidebar.classList.toggle('active');
        });

        // 监听屏幕大小变化
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    handleResize() {
        const width = window.innerWidth;
        if (width <= 768) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
            this.chatSidebar.classList.remove('active');
        }
    }
}

// ===== 初始化应用 =====
document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    const whiteboard = new Whiteboard('whiteboard');
    const chat = new Chat();
    const participants = new Participants();
    const screenShare = new ScreenShare();
    const recorder = new Recorder();
    const toolbar = new Toolbar(whiteboard);
    const responsive = new ResponsiveHandler();

    // 欢迎消息
    console.log('虚拟教室平台已启动');

    // 模拟参与者状态变化
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * state.participants.length);
        state.participants.forEach((p, i) => {
            p.speaking = i === randomIndex && Math.random() > 0.5;
        });
        participants.render();
    }, 5000);
});
