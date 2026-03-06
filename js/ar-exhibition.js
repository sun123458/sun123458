// AR展厅主应用逻辑
class ARExhibition {
    constructor() {
        this.scene = null;
        this.marker = null;
        this.mainGroup = null;
        this.isLoading = true;
        this.controlsEnabled = true;
        this.exhibits = [];

        this.init();
    }

    init() {
        console.log('初始化AR展厅...');

        // 等待页面完全加载
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.initializeScene();
            this.setupExhibits();
            this.hideLoader();
        });
    }

    setupEventListeners() {
        // 获取UI元素
        const toggleBtn = document.getElementById('toggle-controls');
        const resetBtn = document.getElementById('reset-view');
        const infoBtn = document.getElementById('info-toggle');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleControls());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetView());
        }

        if (infoBtn) {
            infoBtn.addEventListener('click', () => this.showInfoPanel());
        }

        // 监听标记发现/丢失事件
        document.addEventListener('markerFound', () => this.onMarkerFound());
        document.addEventListener('markerLost', () => this.onMarkerLost());
    }

    initializeScene() {
        console.log('初始化AR场景...');

        // 获取AR元素
        this.marker = document.querySelector('#main-marker');
        this.mainGroup = document.querySelector('#exhibit-group');

        if (!this.marker) {
            console.error('未找到AR标记元素');
            return;
        }

        if (!this.mainGroup) {
            console.error('未找到主要场景组');
            return;
        }

        console.log('AR场景初始化完成');
    }

    setupExhibits() {
        // 展品信息数据
        const exhibitData = {
            'exhibit-1': {
                title: '几何立方体',
                description: '这是最基本的几何形状之一，代表立体空间的构成元素。',
                details: {
                    '形状': '立方体',
                    '尺寸': '0.8 × 0.8 × 0.8',
                    '材质': '金属质感',
                    '动画': '360度旋转'
                }
            },
            'exhibit-2': {
                title: '完美球体',
                description: '球体是最完美的几何形状，象征着和谐与完整。在AR空间中，它展现了平滑曲面的光影效果。',
                details: {
                    '形状': '球体',
                    '半径': '0.5',
                    '材质': '高光金属',
                    '动画': '上下浮动'
                }
            },
            'exhibit-3': {
                title: '圆锥体',
                description: '圆锥体展现了从一点发散的空间概念，在古代建筑中常被用来象征向上的力量。',
                details: {
                    '形状': '圆锥',
                    '底面半径': '0.5',
                    '高度': '1.0',
                    '动画': '360度旋转'
                }
            },
            'exhibit-4': {
                title: '神秘圆环',
                description: '圆环体的弯曲表面创造了独特的光影效果，在现代设计中经常被使用。',
                details: {
                    '形状': '圆环',
                    '主半径': '0.4',
                    '管半径': '0.1',
                    '动画': '三维旋转'
                }
            },
            'exhibit-5': {
                title: '十二面宝石',
                description: '十二面体是柏拉图立体之一，古人认为它代表宇宙的结构。此展品展示了复杂的多面体美感。',
                details: {
                    '形状': '十二面体',
                    '半径': '0.3',
                    '面数': '12',
                    '动画': '缩放脉动'
                }
            }
        };

        // 存储展品信息
        this.exhibitData = exhibitData;

        // 为每个展品添加点击事件
        Object.keys(exhibitData).forEach(exhibitId => {
            const exhibitElement = document.querySelector(`#${exhibitId}`);
            if (exhibitElement) {
                exhibitElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showExhibitInfo(exhibitId);
                });

                // 添加鼠标悬停效果
                exhibitElement.addEventListener('mouseenter', () => {
                    this.highlightExhibit(exhibitElement);
                });

                exhibitElement.addEventListener('mouseleave', () => {
                    this.unhighlightExhibit(exhibitElement);
                });
            }
        });
    }

    onMarkerFound() {
        console.log('标记已发现！AR展品已显示。');
        this.showToast('AR展品已显示，可以开始交互！');
    }

    onMarkerLost() {
        console.log('标记已丢失。');
        this.showToast('标记已丢失，请重新对准Hiro标记');
    }

    toggleControls() {
        this.controlsEnabled = !this.controlsEnabled;
        const btn = document.getElementById('toggle-controls');

        if (this.controlsEnabled) {
            btn.textContent = '交互模式: 开启';
            btn.classList.add('active');
            this.showToast('交互模式已开启，可以触摸操作');
        } else {
            btn.textContent = '交互模式: 关闭';
            btn.classList.remove('active');
            this.showToast('交互模式已关闭');
        }

        // 触发自定义事件通知交互模块
        window.dispatchEvent(new CustomEvent('controlsToggled', {
            detail: { enabled: this.controlsEnabled }
        }));
    }

    resetView() {
        if (this.mainGroup) {
            // 重置位置、旋转和缩放
            this.mainGroup.setAttribute('position', '0 0.5 0');
            this.mainGroup.setAttribute('rotation', '0 0 0');
            this.mainGroup.setAttribute('scale', '1 1 1');

            this.showToast('视角已重置');
        }
    }

    showInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.classList.remove('hidden');

            // 显示展厅总体信息
            document.getElementById('exhibit-title').textContent = 'AR数字展厅';
            document.getElementById('exhibit-description').textContent =
                '欢迎来到AR增强现实展厅。这里有5件精美的3D艺术品供您观赏。' +
                '点击任意展品可查看详细信息，使用手势可以旋转和缩放整个展品组。';

            // 展厅统计数据
            document.getElementById('exhibit-details').innerHTML = `
                <p><strong>展品数量:</strong> 5件</p>
                <p><strong>交互方式:</strong> 触摸旋转/缩放</p>
                <p><strong>使用的标记:</strong> Hiro预设图案</p>
                <p><strong>技术栈:</strong> A-Frame + AR.js</p>
            `;
        }
    }

    showExhibitInfo(exhibitId) {
        const info = this.exhibitData[exhibitId];
        if (!info) return;

        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.classList.remove('hidden');

            // 更新信息内容
            document.getElementById('exhibit-title').textContent = info.title;
            document.getElementById('exhibit-description').textContent = info.description;

            // 更新详细信息
            let detailsHTML = '';
            Object.entries(info.details).forEach(([key, value]) => {
                detailsHTML += `<p><strong>${key}:</strong> ${value}</p>`;
            });
            document.getElementById('exhibit-details').innerHTML = detailsHTML;
        }
    }

    highlightExhibit(element) {
        const originalColor = element.getAttribute('color');
        element.setAttribute('color', '#f39c12');
        element.setAttribute('original-color', originalColor);
        element.setAttribute('scale', '1.2 1.2 1.2');
    }

    unhighlightExhibit(element) {
        const originalColor = element.getAttribute('original-color');
        if (originalColor) {
            element.setAttribute('color', originalColor);
        }
        element.setAttribute('scale', '1 1 1');
    }

    showToast(message) {
        // 移除已存在的提示
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新的提示
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 3000;
            font-size: 14px;
            animation: fadeInOut 3s ease forwards;
        `;

        document.body.appendChild(toast);

        // 3秒后移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    hideLoader() {
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.classList.add('hidden');
            }
            this.isLoading = false;
        }, 1500);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        10% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        90% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
const arExhibition = new ARExhibition();

// 导出全局函数供HTML使用
window.closeInfoPanel = function() {
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
        infoPanel.classList.add('hidden');
    }
};
