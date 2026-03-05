// 虚拟教室平台主脚本

class VirtualClassroom {
    constructor() {
        this.initializeWhiteboard();
        this.initializeChat();
        this.initializeControls();
        this.initializeScreenShare();
        this.initializeRecording();
        this.initializeParticipants();
        this.setupEventListeners();
        this.setupTouchSupport();
    }

    // 白板初始化
    initializeWhiteboard() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.brushSize = 3;
        this.drawings = []; // 存储绘图历史

        // 调整画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 白板工具事件
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToolClick(e));
        });

        // 颜色选择器
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });

        // 画笔大小
        const brushSize = document.getElementById('brushSize');
        brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });
    }

    // 调整画布大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // 保存当前画布内容
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.width = rect.width - 2; // 减去边框
        this.canvas.height = rect.height - 68; // 减去头部高度

        // 恢复画布内容
        this.ctx.putImageData(imageData, 0, 0);

        // 重新设置画笔样式
        this.updateBrushStyle();
    }

    // 更新画笔样式
    updateBrushStyle() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
    }

    // 处理工具点击
    handleToolClick(e) {
        const tool = e.target.closest('.tool-btn').dataset.tool;

        // 移除所有活动状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 添加活动状态
        e.target.closest('.tool-btn').classList.add('active');

        if (tool === 'clear') {
            this.clearCanvas();
        } else {
            this.currentTool = tool;
        }
    }

    // 清空画布
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawings = [];
        this.updateBrushStyle();
    }

    // 获取画布坐标
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // 开始绘图
    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getCanvasCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;

        // 如果是点按，绘制一个点
        if (this.currentTool === 'pen') {
            this.ctx.beginPath();
            this.ctx.arc(this.lastX, this.lastY, this.brushSize / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fill();
        }
    }

    // 绘图
    draw(e) {
        if (!this.isDrawing) return;

        const coords = this.getCanvasCoordinates(e);

        this.updateBrushStyle();

        if (this.currentTool === 'pen') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.brushSize * 3;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();

        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    // 停止绘图
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.globalCompositeOperation = 'source-over';

        // 保存当前状态
        this.saveCanvasState();
    }

    // 保存画布状态
    saveCanvasState() {
        const imageData = this.canvas.toDataURL();
        this.drawings.push(imageData);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    }

    // 触摸支持
    setupTouchSupport() {
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startDrawing(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.draw(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
    }

    // 聊天功能
    initializeChat() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.messages = [];

        // 发送按钮
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // 回车发送
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 表情符号按钮
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.chatInput.value += btn.textContent;
                this.chatInput.focus();
            });
        });
    }

    // 发送消息
    sendMessage() {
        const content = this.chatInput.value.trim();
        if (!content) return;

        const message = {
            sender: '我',
            content: content,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };

        this.messages.push(message);
        this.displayMessage(message);
        this.chatInput.value = '';
    }

    // 显示消息
    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <span class="message-sender">${message.sender}:</span>
            <span class="message-content">${message.content}</span>
            <span class="message-time">${message.time}</span>
        `;

        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // 初始化控制功能
    initializeControls() {
        // 这里可以添加更多控制功能
    }

    // 屏幕共享功能
    initializeScreenShare() {
        this.shareBtn = document.getElementById('shareBtn');
        this.shareAreaSelector = document.getElementById('shareAreaSelector');
        this.cancelShare = document.getElementById('cancelShare');
        this.confirmShare = document.getElementById('confirmShare');
        this.isSharing = false;

        this.shareBtn.addEventListener('click', () => this.startScreenShare());
        this.cancelShare.addEventListener('click', () => this.cancelScreenShare());
        this.confirmShare.addEventListener('click', () => this.confirmScreenShare());
    }

    // 开始屏幕共享
    startScreenShare() {
        if (this.isSharing) {
            this.stopScreenShare();
            return;
        }

        this.shareAreaSelector.classList.add('active');
        this.shareBtn.textContent = '📤 选择共享区域';
    }

    // 取消屏幕共享
    cancelScreenShare() {
        this.shareAreaSelector.classList.remove('active');
        this.shareBtn.textContent = '📤 屏幕共享';
    }

    // 确认屏幕共享
    confirmScreenShare() {
        this.shareAreaSelector.classList.remove('active');
        this.isSharing = true;

        // 添加共享区域高亮效果
        const whiteboardSection = document.querySelector('.whiteboard-section');
        whiteboardSection.classList.add('shared-area');

        this.shareBtn.textContent = '📥 停止共享';
        this.shareBtn.style.background = '#ff6b6b';

        // 添加系统消息
        this.addSystemMessage('屏幕共享已开始');
    }

    // 停止屏幕共享
    stopScreenShare() {
        this.isSharing = false;

        // 移除共享区域高亮效果
        const whiteboardSection = document.querySelector('.whiteboard-section');
        whiteboardSection.classList.remove('shared-area');

        this.shareBtn.textContent = '📤 屏幕共享';
        this.shareBtn.style.background = '#4ecdc4';

        // 添加系统消息
        this.addSystemMessage('屏幕共享已结束');
    }

    // 添加系统消息
    addSystemMessage(content) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        messageElement.innerHTML = `
            <span class="message-content">${content}</span>
            <span class="message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        `;

        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // 录制功能
    initializeRecording() {
        this.recordBtn = document.getElementById('recordBtn');
        this.recordIndicator = document.getElementById('recordIndicator');
        this.isRecording = false;

        this.recordBtn.addEventListener('click', () => this.toggleRecording());
    }

    // 切换录制状态
    toggleRecording() {
        this.isRecording = !this.isRecording;

        if (this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    // 开始录制
    startRecording() {
        this.recordBtn.textContent = '⏹️ 停止录制';
        this.recordBtn.classList.add('recording');
        this.recordIndicator.classList.remove('hidden');

        // 添加系统消息
        this.addSystemMessage('录制已开始');
    }

    // 停止录制
    stopRecording() {
        this.recordBtn.textContent = '🔴 开始录制';
        this.recordBtn.classList.remove('recording');
        this.recordIndicator.classList.add('hidden');

        // 添加系统消息
        this.addSystemMessage('录制已结束');
    }

    // 参与者功能
    initializeParticipants() {
        this.participantsList = document.getElementById('participantsList');
        this.participantCount = document.getElementById('participantCount');
        this.participants = [
            { name: '张老师', role: '主持人', avatar: '👨‍🏫', online: true },
            { name: '李明', role: '学生', avatar: '👨‍🎓', online: true },
            { name: '王芳', role: '学生', avatar: '👩‍🎓', online: false },
            { name: '赵伟', role: '学生', avatar: '👨‍🎓', online: true }
        ];

        this.updateParticipantCount();
    }

    // 更新参与者数量
    updateParticipantCount() {
        const onlineCount = this.participants.filter(p => p.online).length;
        this.participantCount.textContent = onlineCount;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.virtualClassroom = new VirtualClassroom();
});