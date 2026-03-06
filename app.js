// 虚拟教室应用 - 主应用逻辑
class VirtualClassroom {
    constructor() {
        this.initializeCanvas();
        this.initializeWhiteboard();
        this.initializeChat();
        this.initializeScreenShare();
        this.initializeRecording();
        this.handleResize();
    }

    // ==================== 初始化画布 ====================
    initializeCanvas() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.canvasContainer = document.getElementById('canvasContainer');

        // 画布状态
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // 工具设置
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.brushSize = 3;

        // 绘图历史（用于撤销功能）
        this.drawingHistory = [];
        this.currentPath = [];

        this.resizeCanvas();
        this.setupCanvasEvents();
    }

    resizeCanvas() {
        const container = this.canvasContainer;
        const rect = container.getBoundingClientRect();

        // 保存当前画布内容
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // 调整画布大小
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // 恢复画布内容
        this.ctx.putImageData(imageData, 0, 0);

        // 更新画布信息显示
        document.getElementById('canvasSize').textContent = `${Math.round(rect.width)} x ${Math.round(rect.height)} px`;
    }

    // ==================== 白板功能 ====================
    initializeWhiteboard() {
        // 工具按钮
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                document.getElementById('currentTool').textContent = `当前工具: ${this.getToolName(this.currentTool)}`;
            });
        });

        // 颜色选择器
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        // 笔刷大小
        const brushSize = document.getElementById('brushSize');
        brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        // 清空按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('确定要清空白板吗？')) {
                this.clearCanvas();
            }
        });
    }

    getToolName(tool) {
        const names = {
            'pen': '画笔',
            'eraser': '橡皮擦',
            'line': '直线',
            'rectangle': '矩形',
            'circle': '圆形'
        };
        return names[tool] || tool;
    }

    // ==================== 画布事件处理 ====================
    setupCanvasEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // 触摸事件（移动设备支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;

        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this.currentPath = [{ x: coords.x, y: coords.y }];
        }

        // 保存当前状态用于形状绘制
        this.startX = coords.x;
        this.startY = coords.y;
        this.canvasSnapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const coords = this.getCanvasCoordinates(e);

        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        switch (this.currentTool) {
            case 'pen':
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(coords.x, coords.y);
                this.ctx.stroke();
                this.currentPath.push({ x: coords.x, y: coords.y });
                break;

            case 'eraser':
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(coords.x, coords.y);
                this.ctx.stroke();
                break;

            case 'line':
                this.ctx.putImageData(this.canvasSnapshot, 0, 0);
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(coords.x, coords.y);
                this.ctx.stroke();
                break;

            case 'rectangle':
                this.ctx.putImageData(this.canvasSnapshot, 0, 0);
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.strokeRect(
                    this.startX,
                    this.startY,
                    coords.x - this.startX,
                    coords.y - this.startY
                );
                break;

            case 'circle':
                this.ctx.putImageData(this.canvasSnapshot, 0, 0);
                this.ctx.strokeStyle = this.currentColor;
                const radius = Math.sqrt(
                    Math.pow(coords.x - this.startX, 2) +
                    Math.pow(coords.y - this.startY, 2)
                );
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
        }

        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;

            // 保存绘图历史
            if (this.currentPath.length > 0) {
                this.drawingHistory.push({
                    tool: this.currentTool,
                    color: this.currentColor,
                    size: this.brushSize,
                    path: [...this.currentPath]
                });
                this.currentPath = [];
            }
        }
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawingHistory = [];
    }

    // ==================== 聊天功能 ====================
    initializeChat() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        this.emojiToggle = document.getElementById('emojiToggle');

        // 发送按钮
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // 回车发送
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 表情面板切换
        this.emojiToggle.addEventListener('click', () => {
            this.emojiPanel.classList.toggle('show');
        });

        // 表情按钮
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.chatInput.value += btn.textContent;
                this.chatInput.focus();
            });
        });

        // 清空聊天
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            if (confirm('确定要清空聊天记录吗？')) {
                this.chatMessages.innerHTML = '';
            }
        });

        // 添加一些模拟消息
        this.addSimulatedMessages();
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addChatMessage(message, true);
        this.chatInput.value = '';
        this.emojiPanel.classList.remove('show');

        // 模拟其他用户回复
        this.simulateReply();
    }

    addChatMessage(content, isSelf = false, sender = '', isSystem = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isSelf ? 'self' : ''} ${isSystem ? 'system' : ''}`;

        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (isSystem) {
            messageDiv.innerHTML = `
                <span class="message-content">${content}</span>
                <span class="message-time">${time}</span>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${isSelf ? '我' : sender}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${this.escapeHtml(content)}</div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // 保存到本地状态
        this.saveMessageToLocal(content, isSelf, sender, isSystem);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    addSimulatedMessages() {
        const simulatedMessages = [
            { content: '李明 加入了课堂', isSystem: true },
            { content: '大家好！', sender: '李明', isSelf: false },
            { content: '欢迎李明同学 👋', sender: '张老师', isSelf: false },
            { content: '今天我们学习白板的使用', sender: '张老师', isSelf: false },
            { content: '好的，老师！', sender: '王芳', isSelf: false }
        ];

        simulatedMessages.forEach((msg, index) => {
            setTimeout(() => {
                if (msg.isSystem) {
                    this.addChatMessage(msg.content, false, '', true);
                } else {
                    this.addChatMessage(msg.content, msg.isSelf, msg.sender);
                }
            }, index * 1000);
        });
    }

    simulateReply() {
        const replies = [
            { sender: '张老师', content: '很好！继续加油 💪' },
            { sender: '王芳', content: '学到了！👍' },
            { sender: '李明', content: '明白了！✨' }
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        setTimeout(() => {
            this.addChatMessage(randomReply.content, false, randomReply.sender);
        }, 1000 + Math.random() * 2000);
    }

    // 本地存储聊天消息
    saveMessageToLocal(content, isSelf, sender, isSystem) {
        let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        messages.push({
            content,
            isSelf,
            sender,
            isSystem,
            timestamp: Date.now()
        });
        // 只保留最近100条消息
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }

    // ==================== 屏幕共享 ====================
    initializeScreenShare() {
        this.screenShareBtn = document.getElementById('screenShareBtn');
        this.shareModeOverlay = document.getElementById('shareModeOverlay');
        this.shareSelection = document.getElementById('shareSelection');
        this.cancelShareBtn = document.getElementById('cancelShareBtn');
        this.confirmShareBtn = document.getElementById('confirmShareBtn');
        this.selectionBorder = this.shareSelection.querySelector('.selection-border');

        this.isSharingScreen = false;
        this.isSelectingArea = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };

        this.screenShareBtn.addEventListener('click', () => this.toggleScreenShare());
        this.cancelShareBtn.addEventListener('click', () => this.cancelScreenShare());
        this.confirmShareBtn.addEventListener('click', () => this.confirmScreenShare());

        // 区域选择事件
        this.canvasContainer.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvasContainer.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.canvasContainer.addEventListener('mouseup', () => this.endSelection());
    }

    toggleScreenShare() {
        if (this.isSharingScreen) {
            this.stopScreenShare();
        } else {
            this.startScreenShareMode();
        }
    }

    startScreenShareMode() {
        this.isSelectingArea = true;
        this.shareModeOverlay.classList.add('show');
        this.canvasContainer.style.cursor = 'crosshair';
    }

    cancelScreenShare() {
        this.isSelectingArea = false;
        this.shareModeOverlay.classList.remove('show');
        this.shareSelection.classList.remove('active');
        this.selectionBorder.style.display = 'none';
        this.canvasContainer.style.cursor = '';
    }

    startSelection(e) {
        if (!this.isSelectingArea) return;

        const rect = this.canvasContainer.getBoundingClientRect();
        this.selectionStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.selectionEnd = { ...this.selectionStart };
    }

    updateSelection(e) {
        if (!this.isSelectingArea) return;

        const rect = this.canvasContainer.getBoundingClientRect();
        this.selectionEnd = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.updateSelectionBorder();
    }

    endSelection() {
        if (!this.isSelectingArea) return;
        this.updateSelectionBorder();
    }

    updateSelectionBorder() {
        const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

        if (width > 10 && height > 10) {
            this.selectionBorder.style.left = left + 'px';
            this.selectionBorder.style.top = top + 'px';
            this.selectionBorder.style.width = width + 'px';
            this.selectionBorder.style.height = height + 'px';
            this.selectionBorder.style.display = 'block';
            this.shareSelection.classList.add('active');
        }
    }

    confirmScreenShare() {
        this.isSelectingArea = false;
        this.isSharingScreen = true;
        this.shareModeOverlay.classList.remove('show');

        // 更新按钮状态
        this.screenShareBtn.innerHTML = '<span class="icon">⏹</span><span class="btn-text">停止共享</span>';
        this.screenShareBtn.classList.add('btn-record');

        this.addChatMessage('开始屏幕共享 📺', false, '系统', true);
    }

    stopScreenShare() {
        this.isSharingScreen = false;
        this.shareSelection.classList.remove('active');
        this.selectionBorder.style.display = 'none';

        // 恢复按钮状态
        this.screenShareBtn.innerHTML = '<span class="icon">📺</span><span class="btn-text">屏幕共享</span>';
        this.screenShareBtn.classList.remove('btn-record');

        this.addChatMessage('屏幕共享已结束', false, '系统', true);
    }

    // ==================== 录制功能 ====================
    initializeRecording() {
        this.recordBtn = document.getElementById('recordBtn');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.isRecording = false;
        this.recordingStartTime = null;

        this.recordBtn.addEventListener('click', () => this.toggleRecording());
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.isRecording = true;
        this.recordingStartTime = Date.now();

        this.recordBtn.classList.add('recording');
        this.recordingIndicator.classList.add('show');

        this.addChatMessage('开始录制课程 ⏺', false, '系统', true);
    }

    stopRecording() {
        this.isRecording = false;
        const duration = Date.now() - this.recordingStartTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        this.recordBtn.classList.remove('recording');
        this.recordingIndicator.classList.remove('show');

        this.addChatMessage(`录制已结束，时长: ${minutes}:${seconds.toString().padStart(2, '0')}`, false, '系统', true);
    }

    // ==================== 响应式处理 ====================
    handleResize() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.virtualClassroom = new VirtualClassroom();

    // 欢迎提示
    setTimeout(() => {
        console.log('🎓 虚拟教室平台已启动');
        console.log('功能：');
        console.log('- 白板绘图（支持触摸）');
        console.log('- 实时聊天（支持表情）');
        console.log('- 屏幕共享模拟');
        console.log('- 录制功能模拟');
    }, 500);
});
