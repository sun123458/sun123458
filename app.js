/**
 * 医疗管理系统 - 主应用文件
 * 负责导航页面切换和初始化各个模块
 */

// 应用状态
const AppState = {
    currentPage: 'dashboard',
    currentFontSize: 16,
    highContrast: false
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    updateDashboard();
});

// 导航功能
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('href').substring(1);
            navigateToPage(targetPage);
        });

        // 键盘导航支持
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const targetPage = link.getAttribute('href').substring(1);
                navigateToPage(targetPage);
            }
        });
    });
}

function navigateToPage(pageName) {
    // 更新当前页面
    AppState.currentPage = pageName;

    // 更新导航链接
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[href="#${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // 更新页面显示
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 根据页面执行特定初始化
    if (pageName === 'dashboard') {
        updateDashboard();
    } else if (pageName === 'patients') {
        renderPatientsList();
    } else if (pageName === 'appointments') {
        if (typeof refreshCalendar === 'function') {
            refreshCalendar();
        }
    } else if (pageName === 'reminders') {
        updateRemindersPage();
    }
}

// 更新仪表板统计
function updateDashboard() {
    const patients = getPatients();
    const appointments = getAppointments();
    const reminders = getReminders();

    // 更新患者计数
    document.getElementById('total-patients').textContent = patients.length;

    // 更新今日预约计数
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(apt =>
        new Date(apt.start).toDateString() === today
    ).length;
    document.getElementById('today-appointments').textContent = todayAppointments;

    // 更新活跃提醒计数
    document.getElementById('active-reminders').textContent = reminders.length;
}

// Modal 功能
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // 聚焦到模态框的第一个输入元素
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        // 禁用背景滚动
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 为所有关闭按钮添加事件监听
document.addEventListener('click', (e) => {
    // 关闭按钮
    if (e.target.classList.contains('close-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            closeModal(modal.id);
        }
    }

    // 取消按钮
    if (e.target.classList.contains('cancel-btn')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            closeModal(modal.id);
        }
    }

    // 点击模态框外部关闭
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// ESC 键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// 生成唯一 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 格式化日期时间
function formatDateTime(date) {
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示通知 toast
function showToast(message, type = 'info') {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 添加样式
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: ${type === 'success' ? 'var(--success-color)' :
                         type === 'error' ? 'var(--danger-color)' :
                         type === 'warning' ? 'var(--warning-color)' : 'var(--info-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;

    // 添加动画样式
    if (!document.querySelector('#toast-animation')) {
        const style = document.createElement('style');
        style.id = 'toast-animation';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 3秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
