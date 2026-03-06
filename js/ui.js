/**
 * UI管理器
 * 处理用户界面的显示和交互
 */

class UIManager {
    constructor(config) {
        this.config = config;
        this.currentSection = 'home';
        this.isHelpModalOpen = false;

        this.setupNavigation();
        this.setupHelpModal();
        this.setupKeyboardShortcuts();
    }

    /**
     * 设置导航
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const section = button.getAttribute('data-section');
                this.navigateTo(section);
            });
        });
    }

    /**
     * 导航到指定部分
     */
    navigateTo(section) {
        // 更新按钮状态
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach((button) => {
            button.classList.toggle('active', button.getAttribute('data-section') === section);
        });

        this.currentSection = section;

        // 根据部分执行不同的操作
        switch (section) {
            case 'home':
                this.showHome();
                break;
            case 'exhibits':
                this.showExhibits();
                break;
            case 'about':
                this.showAbout();
                break;
        }
    }

    /**
     * 显示首页
     */
    showHome() {
        console.log('导航到首页');
        // 可以添加首页特定的逻辑
    }

    /**
     * 显示展品列表
     */
    showExhibits() {
        console.log('导航到展品列表');
        // 可以显示展品列表侧边栏等
    }

    /**
     * 显示关于页面
     */
    showAbout() {
        console.log('导航到关于页面');
        // 可以显示关于应用的模态框
    }

    /**
     * 设置帮助模态框
     */
    setupHelpModal() {
        const helpBtn = document.getElementById('btn-help');
        const helpModal = document.getElementById('help-modal');
        const closeBtn = helpModal?.querySelector('.close-modal');
        const downloadMarkerBtn = document.getElementById('btn-download-marker');

        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.openHelpModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeHelpModal());
        }

        if (helpModal) {
            helpModal.addEventListener('click', (event) => {
                if (event.target === helpModal) {
                    this.closeHelpModal();
                }
            });
        }

        if (downloadMarkerBtn) {
            downloadMarkerBtn.addEventListener('click', () => this.downloadMarker());
        }
    }

    /**
     * 打开帮助模态框
     */
    openHelpModal() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('visible');
            this.isHelpModalOpen = true;
        }
    }

    /**
     * 关闭帮助模态框
     */
    closeHelpModal() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.remove('visible');
            this.isHelpModalOpen = false;
        }
    }

    /**
     * 下载AR标记
     */
    downloadMarker() {
        // 创建一个Canvas绘制AR标记
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 绘制白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 512, 512);

        // 绘制黑色边框
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 40;
        ctx.strokeRect(20, 20, 472, 472);

        // 绘制简单的图案（模拟Hiro标记）
        ctx.fillStyle = 'black';
        const centerX = 256;
        const centerY = 256;
        const size = 300;

        // 绘制中心方块
        const squareSize = 160;
        ctx.fillRect(centerX - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);

        // 绘制四个角的方块
        const cornerSize = 80;
        const offset = 20;

        // 左上
        ctx.fillRect(offset, offset, cornerSize, cornerSize);
        // 右上
        ctx.fillRect(512 - offset - cornerSize, offset, cornerSize, cornerSize);
        // 左下
        ctx.fillRect(offset, 512 - offset - cornerSize, cornerSize, cornerSize);
        // 右下
        ctx.fillRect(512 - offset - cornerSize, 512 - offset - cornerSize, cornerSize, cornerSize);

        // 转换为图片并下载
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ar-marker.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        this.showMessage('AR标记已下载，请打印并使用');
    }

    /**
     * 显示消息
     */
    showMessage(message, duration = 3000) {
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.classList.add('visible');
        }, 10);

        setTimeout(() => {
            messageEl.classList.remove('visible');
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, duration);
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (event) => {
            // 如果在输入框中，不触发快捷键
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.key) {
                case 'F1':
                    event.preventDefault();
                    this.toggleHelp();
                    break;
                case '?':
                    if (event.shiftKey) {
                        this.toggleHelp();
                    }
                    break;
            }
        });
    }

    /**
     * 切换帮助面板
     */
    toggleHelp() {
        if (this.isHelpModalOpen) {
            this.closeHelpModal();
        } else {
            this.openHelpModal();
        }
    }

    /**
     * 更新状态栏
     */
    updateStatusBar(status) {
        if (status.camera) {
            const cameraStatus = document.getElementById('camera-status');
            if (cameraStatus) {
                cameraStatus.textContent = status.camera;
            }
        }

        if (status.marker) {
            const markerStatus = document.getElementById('marker-status');
            if (markerStatus) {
                markerStatus.textContent = status.marker;
            }
        }

        if (status.fps !== undefined) {
            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                fpsCounter.textContent = status.fps;
            }
        }

        if (status.objectCount !== undefined) {
            const objectCount = document.getElementById('object-count');
            if (objectCount) {
                objectCount.textContent = status.objectCount;
            }
        }
    }

    /**
     * 显示/隐藏加载屏幕
     */
    toggleLoadingScreen(show) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 显示错误信息
     */
    showError(message, details = '') {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-icon">⚠️</div>
                <h3>出错了</h3>
                <p>${message}</p>
                ${details ? `<p class="error-details">${details}</p>` : ''}
                <button onclick="location.reload()" class="retry-btn">重试</button>
            `;
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * 显示欢迎信息
     */
    showWelcome() {
        const welcomeInfo = {
            title: '欢迎来到AR展厅',
            message: '点击"帮助"按钮查看使用说明',
            duration: 5000,
        };

        this.showMessage(
            `${welcomeInfo.title}: ${welcomeInfo.message}`,
            welcomeInfo.duration
        );
    }

    /**
     * 创建展品列表项
     */
    createExhibitListItem(exhibit) {
        const item = document.createElement('div');
        item.className = 'exhibit-item';
        item.setAttribute('data-exhibit-id', exhibit.id);

        item.innerHTML = `
            <div class="exhibit-icon">
                ${this.getExhibitIcon(exhibit.type)}
            </div>
            <div class="exhibit-info">
                <h4>${exhibit.name}</h4>
                <p class="exhibit-type">${this.getTypeName(exhibit.type)}</p>
            </div>
            <button class="view-btn" data-exhibit-id="${exhibit.id}">查看</button>
        `;

        return item;
    }

    /**
     * 获取展品图标
     */
    getExhibitIcon(type) {
        const icons = {
            sculpture: '🎨',
            vase: '🏺',
            technology: '🚀',
            default: '📦',
        };
        return icons[type] || icons.default;
    }

    /**
     * 获取类型名称
     */
    getTypeName(type) {
        const typeNames = {
            sculpture: '雕塑',
            vase: '花瓶',
            technology: '科技',
            default: '其他',
        };
        return typeNames[type] || typeNames.default;
    }

    /**
     * 更新控制面板按钮状态
     */
    updateControlPanel_state(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.toggle('active', isActive);
        }
    }

    /**
     * 显示通知
     */
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="notification-close">×</button>
        `;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => notification.classList.add('visible'), 10);

        // 关闭按钮事件
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hideNotification(notification));

        // 自动关闭
        setTimeout(() => this.hideNotification(notification), 5000);
    }

    /**
     * 隐藏通知
     */
    hideNotification(notification) {
        notification.classList.remove('visible');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }

    /**
     * 获取通知图标
     */
    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
        };
        return icons[type] || icons.info;
    }

    /**
     * 切换全屏
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`无法进入全屏模式: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 检查设备兼容性
     */
    checkCompatibility() {
        const issues = [];

        // 检查WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            issues.push('您的浏览器不支持WebGL');
        }

        // 检查设备内存（如果可用）
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            issues.push('设备内存较低，可能会影响性能');
        }

        // 检查摄像头支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            issues.push('您的浏览器不支持摄像头访问');
        }

        if (issues.length > 0) {
            this.showNotification(
                '兼容性问题',
                issues.join('; '),
                'warning'
            );
        }

        return issues.length === 0;
    }
}

// 导出为全局变量以便其他脚本访问
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
