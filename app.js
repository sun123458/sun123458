// ===== 应用状态管理 =====
const AppState = {
    isRecording: false,
    isSharing: false,
    currentTool: 'pen',
    currentColor: '#000000',
    brushSize: 3,
    whiteboardHistory: [],
    historyIndex: -1,
    messages: [],
    drawingInProgress: false,
    lastX: 0,
    lastY: 0
};

// ===== 白板功能 =====
class Whiteboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvasContainer');

        this.initCanvas();
        this.bindEvents();
        this.saveState();
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // 保存当前画布内容
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 恢复画布内容（如果需要）
        // this.ctx.putImageData(imageData, 0, 0);
    }

    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // 触摸事件（移动端）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing(touch);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw(touch);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // 工具栏事件
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            AppState.currentColor = e.target.value;
        });

        document.getElementById('brushSize').addEventListener('input', (e) => {
            AppState.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeLabel').textContent = e.target.value + 'px';
        });

        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
    }

    getCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
        const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    startDrawing(event) {
        AppState.drawingInProgress = true;
        const coords = this.getCoordinates(event);
        AppState.lastX = coords.x;
        AppState.lastY = coords.y;

        if (AppState.currentTool === 'pen' || AppState.currentTool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(coords.x, coords.y);
        }
    }

    draw(event) {
        if (!AppState.drawingInProgress) return;

        const coords = this.getCoordinates(event);

        this.ctx.lineWidth = AppState.brushSize;

        if (AppState.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.strokeStyle = AppState.currentColor;
            this.ctx.globalCompositeOperation = 'source-over';
        }

        if (AppState.currentTool === 'pen' || AppState.currentTool === 'eraser') {
            this.ctx.lineTo(coords.x, coords.y);
            this.ctx.stroke();
        }

        AppState.lastX = coords.x;
        AppState.lastY = coords.y;
    }

    stopDrawing() {
        if (AppState.drawingInProgress) {
            AppState.drawingInProgress = false;
            this.ctx.globalCompositeOperation = 'source-over';
            this.saveState();
        }
    }

    selectTool(tool) {
        AppState.currentTool = tool;

        // 更新UI
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });

        // 更新光标
        if (tool === 'eraser') {
            this.container.style.cursor = 'cell';
        } else {
            this.container.style.cursor = 'crosshair';
        }
    }

    saveState() {
        // 移除当前索引之后的所有状态
        AppState.whiteboardHistory = AppState.whiteboardHistory.slice(0, AppState.historyIndex + 1);

        // 保存当前状态
        const imageData = this.canvas.toDataURL();
        AppState.whiteboardHistory.push(imageData);
        AppState.historyIndex++;

        // 限制历史记录数量
        if (AppState.whiteboardHistory.length > 50) {
            AppState.whiteboardHistory.shift();
            AppState.historyIndex--;
        }
    }

    undo() {
        if (AppState.historyIndex > 0) {
            AppState.historyIndex--;
            this.loadState(AppState.whiteboardHistory[AppState.historyIndex]);
        }
    }

    redo() {
        if (AppState.historyIndex < AppState.whiteboardHistory.length - 1) {
            AppState.historyIndex++;
            this.loadState(AppState.whiteboardHistory[AppState.historyIndex]);
        }
    }

    loadState(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }
}

// ===== 聊天功能 =====
class Chat {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');

        this.bindEvents();
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // 表情选择
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.input.value += btn.dataset.emoji;
                this.input.focus();
            });
        });
    }

    sendMessage() {
        const content = this.input.value.trim();
        if (!content) return;

        const message = {
            author: '老师',
            content: content,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            isOwn: true
        };

        this.addMessage(message);
        this.input.value = '';
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // 模拟回复
        if (Math.random() > 0.7) {
            setTimeout(() => this.simulateReply(), 2000);
        }
    }

    addMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message' + (message.isOwn ? ' own' : '');

        messageEl.innerHTML = `
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        `;

        this.messagesContainer.appendChild(messageEl);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    simulateReply() {
        const responses = [
            { author: '小明', content: '好的，明白了！👍' },
            { author: '小红', content: '非常有意思！✨' },
            { author: '小华', content: '我有个问题...🤔' },
            { author: '小明', content: '记下来了 📝' },
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        response.time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        response.isOwn = false;

        this.addMessage(response);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===== 屏幕共享模拟 =====
class ScreenShare {
    constructor() {
        this.container = document.getElementById('shareContainer');
        this.shareBtn = document.getElementById('shareScreenBtn');
        this.selectionBox = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.bindEvents();
    }

    bindEvents() {
        this.shareBtn.addEventListener('click', () => this.startSharing());
    }

    startSharing() {
        if (AppState.isSharing) return;

        AppState.isSharing = true;
        this.shareBtn.textContent = '正在共享...';
        this.shareBtn.disabled = true;

        // 创建共享选中框
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'share-selection';
        this.selectionBox.innerHTML = `
            <div class="share-selection-header">
                <span>📺 共享区域</span>
                <button class="btn-stop-share">停止</button>
            </div>
            <div class="selection-content">
                拖动调整区域位置
            </div>
        `;

        // 绑定拖动事件
        this.selectionBox.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('btn-stop-share')) {
                this.stopSharing();
                return;
            }
            this.isDragging = true;
            const rect = this.selectionBox.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.selectionBox.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const containerRect = this.container.getBoundingClientRect();
            const x = e.clientX - containerRect.left - this.dragOffset.x;
            const y = e.clientY - containerRect.top - this.dragOffset.y;

            // 限制在容器内
            const maxX = containerRect.width - this.selectionBox.offsetWidth;
            const maxY = containerRect.height - this.selectionBox.offsetHeight;

            this.selectionBox.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            this.selectionBox.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            if (this.selectionBox) {
                this.selectionBox.style.cursor = 'move';
            }
        });

        this.container.innerHTML = '';
        this.container.appendChild(this.selectionBox);
    }

    stopSharing() {
        AppState.isSharing = false;
        this.shareBtn.textContent = '选择区域';
        this.shareBtn.disabled = false;

        this.container.innerHTML = `
            <div class="share-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <p>点击"选择区域"开始共享</p>
            </div>
        `;
        this.selectionBox = null;
    }
}

// ===== 录制功能 =====
class Recorder {
    constructor() {
        this.recordBtn = document.getElementById('recordBtn');
        this.indicator = document.getElementById('recordingIndicator');

        this.bindEvents();
    }

    bindEvents() {
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
    }

    toggleRecording() {
        AppState.isRecording = !AppState.isRecording;

        this.recordBtn.classList.toggle('recording', AppState.isRecording);
        this.indicator.classList.toggle('hidden', !AppState.isRecording);

        if (AppState.isRecording) {
            console.log('开始录制 (模拟)');
            // 这里可以添加实际的录制逻辑
        } else {
            console.log('停止录制 (模拟)');
            // 这里可以添加保存录制的逻辑
        }
    }
}

// ===== 初始化应用 =====
document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    const whiteboard = new Whiteboard('whiteboard');
    const chat = new Chat();
    const screenShare = new ScreenShare();
    const recorder = new Recorder();

    // 响应式菜单切换（移动端）
    let participantsOpen = false;
    let chatOpen = false;

    // 这里可以添加移动端菜单切换逻辑
    console.log('虚拟教室平台已初始化');

    // 设置初始工具状态
    document.querySelector('[data-tool="pen"]').classList.add('active');
});

// ===== 工具函数 =====
function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== 导出模块（用于调试） =====
window.VirtualClassroom = {
    whiteboard: null,
    chat: null,
    screenShare: null,
    recorder: null,
    state: AppState
};
