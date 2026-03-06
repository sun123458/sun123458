/**
 * Main Application Module
 * Coordinates all modules and handles UI routing
 */

const App = {
    currentView: 'dashboard',

    /**
     * Initialize the application
     */
    init() {
        this.loadSettings();
        this.bindNavigation();
        this.bindSettingsEvents();
        this.initModalSystem();
        this.initKeyboardNavigation();
        this.updateDashboardStats();
    },

    /**
     * Load user settings
     */
    loadSettings() {
        const settings = Storage.getSettings();

        // Apply font size
        if (settings.fontSize) {
            document.body.classList.remove('font-size-large', 'font-size-extra-large');
            if (settings.fontSize === 'large') {
                document.body.classList.add('font-size-large');
            } else if (settings.fontSize === 'extra-large') {
                document.body.classList.add('font-size-extra-large');
            }
            document.getElementById('font-size-select').value = settings.fontSize;
        }

        // Apply high contrast mode
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
            document.getElementById('high-contrast-mode').checked = true;
        }
    },

    /**
     * Save settings
     */
    saveSettings(settings) {
        const currentSettings = Storage.getSettings();
        const newSettings = { ...currentSettings, ...settings };
        Storage.saveSettings(newSettings);
        return newSettings;
    },

    /**
     * Bind navigation events
     */
    bindNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.navigateTo(view);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.navigateTo(e.state.view, false);
            }
        });
    },

    /**
     * Navigate to a specific view
     */
    navigateTo(viewName, pushState = true) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
            btn.setAttribute('aria-current', btn.dataset.view === viewName ? 'page' : 'false');
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;

            // Update URL without reload
            if (pushState) {
                history.pushState({ view: viewName }, '', `#${viewName}`);
            }

            // View-specific initialization
            if (viewName === 'calendar') {
                setTimeout(() => Calendar?.calendar?.render(), 100);
            } else if (viewName === 'patients') {
                Patients?.renderPatientsList();
            } else if (viewName === 'dashboard') {
                this.updateDashboardStats();
            }

            // Announce to screen readers
            this.announceToScreenReader(`已切换到${this.getViewTitle(viewName)}视图`);
        }
    },

    /**
     * Get readable view title
     */
    getViewTitle(viewName) {
        const titles = {
            dashboard: '仪表盘',
            patients: '患者库',
            calendar: '预约',
            settings: '设置'
        };
        return titles[viewName] || viewName;
    },

    /**
     * Bind settings-related events
     */
    bindSettingsEvents() {
        // Font size toggle
        const fontToggle = document.getElementById('font-size-toggle');
        const fontSizeSelect = document.getElementById('font-size-select');

        fontToggle?.addEventListener('click', () => this.cycleFontSize());

        fontSizeSelect?.addEventListener('change', (e) => {
            const size = e.target.value;
            document.body.classList.remove('font-size-large', 'font-size-extra-large');

            if (size === 'large') {
                document.body.classList.add('font-size-large');
            } else if (size === 'extra-large') {
                document.body.classList.add('font-size-extra-large');
            }

            this.saveSettings({ fontSize: size });
            UI.showToast(`字体大小: ${this.getSizeLabel(size)}`, 'info');
        });

        // High contrast toggle
        const contrastToggle = document.getElementById('contrast-toggle');
        const highContrastCheckbox = document.getElementById('high-contrast-mode');

        const toggleHighContrast = (enabled) => {
            document.body.classList.toggle('high-contrast', enabled);
            this.saveSettings({ highContrast: enabled });
            UI.showToast(enabled ? '高对比度模式已启用' : '高对比度模式已关闭', 'info');
        };

        contrastToggle?.addEventListener('click', () => {
            const isEnabled = !document.body.classList.contains('high-contrast');
            toggleHighContrast(isEnabled);
            highContrastCheckbox.checked = isEnabled;
        });

        highContrastCheckbox?.addEventListener('change', (e) => {
            toggleHighContrast(e.target.checked);
        });

        // Notification permission
        document.getElementById('request-notification-permission')?.addEventListener('click', () => {
            Notifications.requestPermission();
        });

        // Export data
        document.getElementById('export-data')?.addEventListener('click', () => {
            if (Storage.exportAllData()) {
                UI.showToast('数据已导出', 'success');
            } else {
                UI.showToast('导出失败', 'error');
            }
        });

        // Import data
        const importInput = document.getElementById('import-data');
        importInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            UI.showConfirm(
                '导入数据将覆盖现有数据。确定要继续吗？',
                async () => {
                    try {
                        const result = await Storage.importAllData(file);
                        UI.showToast(
                            `导入成功: ${result.patients} 位患者, ${result.appointments} 个预约`,
                            'success'
                        );
                        this.refreshAllViews();
                    } catch (error) {
                        UI.showToast('导入失败: ' + error.message, 'error');
                    }
                    importInput.value = '';
                }
            );
        });

        // Clear all data
        document.getElementById('clear-all-data')?.addEventListener('click', () => {
            UI.showConfirm(
                '警告: 此操作将删除所有数据且不可恢复！确定要继续吗？',
                () => {
                    if (Storage.clearAllData()) {
                        UI.showToast('所有数据已清除', 'success');
                        this.refreshAllViews();
                    } else {
                        UI.showToast('清除数据失败', 'error');
                    }
                }
            );
        });

        // Test notification button
        document.getElementById('test-notification-btn')?.addEventListener('click', () => {
            Notifications.test();
        });
    },

    /**
     * Cycle through font sizes
     */
    cycleFontSize() {
        const current = document.getElementById('font-size-select').value;
        const sizes = ['normal', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(current);
        const nextIndex = (currentIndex + 1) % sizes.length;
        const nextSize = sizes[nextIndex];

        document.getElementById('font-size-select').value = nextSize;
        document.getElementById('font-size-select').dispatchEvent(new Event('change'));
    },

    /**
     * Get size label for toast
     */
    getSizeLabel(size) {
        const labels = {
            normal: '正常',
            large: '大',
            'extra-large': '超大'
        };
        return labels[size] || size;
    },

    /**
     * Initialize modal system
     */
    initModalSystem() {
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Trap focus in modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocus(e, modal);
                }
            });
        });
    },

    /**
     * Trap focus within modal for accessibility
     */
    trapFocus(e, modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    },

    /**
     * Initialize keyboard navigation
     */
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Alt + number keys for navigation
            if (e.altKey && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const views = ['dashboard', 'patients', 'calendar', 'settings'];
                const index = parseInt(e.key) - 1;
                this.navigateTo(views[index]);
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    },

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        Patients?.updateDashboardStats();
        Calendar?.updateDashboardStats();
    },

    /**
     * Refresh all views
     */
    refreshAllViews() {
        Patients?.renderPatientsList();
        Calendar?.refreshCalendar();
        Calendar?.populatePatientSelect();
        this.updateDashboardStats();
    },

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = message;
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },

    /**
     * Show help dialog
     */
    showHelp() {
        const shortcuts = [
            { key: 'Alt + 1-4', desc: '切换视图' },
            { key: 'Escape', desc: '关闭弹窗' },
            { key: 'Tab / Shift+Tab', desc: '在元素间导航' },
            { key: 'Enter', desc: '激活按钮或链接' }
        ];

        // Could show a modal with help info
        console.table(shortcuts);
    }
};

/**
 * UI Utilities
 */
const UI = {
    /**
     * Show a toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show confirmation dialog
     */
    showConfirm(message, onConfirm) {
        const dialog = document.getElementById('confirm-dialog');
        const messageEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        messageEl.textContent = message;
        dialog.classList.add('active');

        const close = () => {
            dialog.classList.remove('active');
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
        };

        const handleYes = () => {
            close();
            onConfirm();
        };

        const handleNo = () => {
            close();
        };

        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);

        yesBtn.focus();
    },

    /**
     * Show loading state
     */
    showLoading(element) {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = '<div class="spinner"></div>';
        loading.style.cssText = `
            position: absolute;
            inset: 0;
            background: rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        `;

        element.style.position = 'relative';
        element.appendChild(loading);

        return () => loading.remove();
    },

    /**
     * Format date for display
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Format date and time for display
     */
    formatDateTime(date) {
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format phone number
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

/**
 * Global error handler
 */
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    if (e.error) {
        UI.showToast('发生错误，请重试', 'error');
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    UI.showToast('操作失败，请重试', 'error');
});

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    App.init();

    // Check initial hash for navigation
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'patients', 'calendar', 'settings'].includes(hash)) {
        App.navigateTo(hash, false);
    }

    // Announce app is ready to screen readers
    App.announceToScreenReader('医疗管理系统已加载完成');

    // Update notification permission status
    Notifications.updatePermissionStatus();

    console.log('Medical Management System initialized');
});

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible again, refresh data
        App.updateDashboardStats();
    }
});

/**
 * Handle beforeunload for unsaved changes warning
 */
window.addEventListener('beforeunload', (e) => {
    // Could add logic here to check for unsaved changes
    // and warn user before navigating away
});
