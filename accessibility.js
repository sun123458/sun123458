/**
 * 无障碍功能模块
 * 提供高对比度模式、字体大小调整等无障碍功能
 */

// 状态管理
const AccessibilityState = {
    currentFontSize: 16,
    highContrast: false
};

// 初始化无障碍功能
function initializeAccessibility() {
    // 从 localStorage 恢复设置
    const savedFontSize = localStorage.getItem('accessibility_font_size');
    const savedContrast = localStorage.getItem('accessibility_high_contrast');

    if (savedFontSize) {
        AccessibilityState.currentFontSize = parseInt(savedFontSize);
        applyFontSize(AccessibilityState.currentFontSize);
    }

    if (savedContrast === 'true') {
        AccessibilityState.highContrast = true;
        document.body.classList.add('high-contrast');
        updateContrastButton(true);
    }

    // 绑定事件监听器
    bindAccessibilityEvents();
}

// 绑定无障碍功能事件
function bindAccessibilityEvents() {
    // 高对比度切换
    document.getElementById('toggle-contrast').addEventListener('click', toggleHighContrast);

    // 字体大小调整
    document.getElementById('increase-font').addEventListener('click', () => adjustFontSize(2));
    document.getElementById('decrease-font').addEventListener('click', () => adjustFontSize(-2));

    // 重置按钮
    document.getElementById('reset-accessibility').addEventListener('click', resetAccessibility);

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 切换高对比度模式
function toggleHighContrast() {
    AccessibilityState.highContrast = !AccessibilityState.highContrast;

    if (AccessibilityState.highContrast) {
        document.body.classList.add('high-contrast');
        updateContrastButton(true);
        showToast('高对比度模式已启用', 'info');
    } else {
        document.body.classList.remove('high-contrast');
        updateContrastButton(false);
        showToast('已切换到标准模式', 'info');
    }

    // 保存设置
    localStorage.setItem('accessibility_high_contrast', AccessibilityState.highContrast);

    // 触发自定义事件以通知图表模块更新
    const event = new CustomEvent('highContrastToggled', {
        detail: { highContrast: AccessibilityState.highContrast }
    });
    document.dispatchEvent(event);
}

// 更新高对比度按钮状态
function updateContrastButton(isActive) {
    const btn = document.getElementById('toggle-contrast');
    if (isActive) {
        btn.style.backgroundColor = 'var(--text-primary)';
        btn.style.color = 'var(--bg-primary)';
        btn.style.borderColor = 'var(--text-primary)';
        btn.innerHTML = '<i class="fas fa-check"></i> 高对比度';
    } else {
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.innerHTML = '<i class="fas fa-adjust"></i> 高对比度';
    }
}

// 调整字体大小
function adjustFontSize(delta) {
    const newSize = AccessibilityState.currentFontSize + delta;

    // 限制字体大小范围
    if (newSize < 12 || newSize > 24) {
        if (newSize < 12) {
            showToast('已达到最小字体大小', 'warning');
        } else {
            showToast('已达到最大字体大小', 'warning');
        }
        return;
    }

    AccessibilityState.currentFontSize = newSize;
    applyFontSize(AccessibilityState.currentFontSize);

    // 保存设置
    localStorage.setItem('accessibility_font_size', AccessibilityState.currentFontSize);

    showToast(`字体大小: ${AccessibilityState.currentFontSize}px`, 'info');
}

// 应用字体大小
function applyFontSize(size) {
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
    document.body.style.fontSize = size + 'px';
}

// 重置所有无障碍设置
function resetAccessibility() {
    // 重置字体大小
    AccessibilityState.currentFontSize = 16;
    applyFontSize(16);
    localStorage.removeItem('accessibility_font_size');

    // 重置高对比度
    AccessibilityState.highContrast = false;
    document.body.classList.remove('high-contrast');
    updateContrastButton(false);
    localStorage.removeItem('accessibility_high_contrast');

    showToast('无障碍设置已重置', 'success');

    // 触发图表更新
    const event = new CustomEvent('highContrastToggled', {
        detail: { highContrast: false }
    });
    document.dispatchEvent(event);
}

// 键盘快捷键
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + C: 切换高对比度
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        toggleHighContrast();
    }

    // Ctrl/Cmd + Plus: 增大字体
    if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        adjustFontSize(2);
    }

    // Ctrl/Cmd + Minus: 减小字体
    if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        adjustFontSize(-2);
    }

    // Ctrl/Cmd + 0: 重置
    if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        resetAccessibility();
    }
}

// 为所有可聚焦元素增强无障碍性
function enhanceAccessibility() {
    // 为所有按钮添加 aria-label
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
        const text = button.textContent.trim();
        const icon = button.querySelector('i');
        if (icon && text) {
            // 如果有图标和文本，使用文本作为 label
            button.setAttribute('aria-label', text);
        }
    });

    // 为模态框添加 aria 属性
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        const title = modal.querySelector('.modal-header h2');
        if (title) {
            const labelId = title.id || title.textContent.replace(/\s+/g, '-').toLowerCase();
            title.id = labelId;
            modal.setAttribute('aria-labelledby', labelId);
        }
    });

    // 为表单添加更好的标签关联
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!input.getAttribute('aria-label') && !input.getAttribute('aria-describedby')) {
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    // 标签已经通过 for 属性关联
                    input.setAttribute('aria-labelledby', label.id || input.id + '-label');
                }
            }
        });
    });

    // 为数据卡片添加可聚焦性
    const cards = document.querySelectorAll('.patient-card, .stat-card');
    cards.forEach(card => {
        if (!card.hasAttribute('tabindex')) {
            card.setAttribute('tabindex', '0');
        }
        if (!card.hasAttribute('role')) {
            card.setAttribute('role', 'button');
        }
    });
}

// 屏幕阅读器公告
function announceToScreenReader(message) {
    // 创建或更新屏幕阅读器专用区域
    let announcer = document.getElementById('sr-announcer');

    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'sr-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(announcer);
    }

    // 清除并设置新消息
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);
}

// 跳过导航链接（为键盘用户提供快速跳转）
function createSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = '跳转到主内容';
    skipLink.setAttribute('aria-label', '跳转到主内容');
    skipLink.style.cssText = `
        position: fixed;
        top: -40px;
        left: 0;
        background: var(--primary-color);
        color: white;
        padding: 8px 16px;
        z-index: 10000;
        text-decoration: none;
        transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '50px';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    // 为 main 内容添加 ID
    const main = document.querySelector('.main-content');
    if (main) {
        main.id = 'main-content';
        main.tabIndex = -1;
    }

    document.body.insertBefore(skipLink, document.body.firstChild);
}

// 焦点陷阱（用于模态框）
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    });
}

// 自定义 showToast 函数以包含屏幕阅读器支持
const originalShowToast = typeof showToast !== 'undefined' ? showToast : function() {};

function showToast(message, type = 'info') {
    // 调用原始函数
    if (typeof originalShowToast === 'function') {
        originalShowToast(message, type);
    }

    // 向屏幕阅读器公告
    announceToScreenReader(message);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeAccessibility();
    enhanceAccessibility();
    createSkipLink();

    // 为模态框添加焦点陷阱
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('modal') && node.classList.contains('active')) {
                    trapFocus(node);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// 导出函数供其他模块使用
window.Accessibility = {
    toggleHighContrast,
    adjustFontSize,
    resetAccessibility,
    announce: announceToScreenReader
};
