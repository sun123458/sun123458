/**
 * Notifications Module
 * Handles browser notifications and medication reminders
 */

const Notifications = {
    permission: 'default',
    checkInterval: null,
    reminderHistory: [],

    /**
     * Initialize the notification system
     */
    init() {
        this.permission = Notification.permission;
        this.loadReminderHistory();
        this.startReminderChecker();
    },

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            this.updatePermissionStatus();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    },

    /**
     * Update permission status display
     */
    updatePermissionStatus() {
        const statusElement = document.getElementById('notification-status');
        if (!statusElement) return;

        const messages = {
            granted: '✓ 已授权',
            denied: '✗ 已拒绝',
            default: '未设置'
        };

        statusElement.textContent = messages[this.permission] || '未知';
        statusElement.style.color = this.permission === 'granted' ? 'var(--success-color)' : 'var(--danger-color)';
    },

    /**
     * Show a notification
     */
    show(title, options = {}) {
        const defaultOptions = {
            icon: '🏥',
            badge: '🏥',
            tag: Date.now().toString(),
            requireInteraction: true,
            ...options
        };

        if (this.permission === 'granted') {
            try {
                const notification = new Notification(title, defaultOptions);

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Add to history
                this.addToHistory(title, options.body || '');

                return notification;
            } catch (error) {
                console.error('Error showing notification:', error);
                return null;
            }
        }

        // Fallback: Show toast notification
        UI.showToast(`${title}: ${options.body || ''}`, 'info');
        return null;
    },

    /**
     * Add notification to history
     */
    addToHistory(title, body) {
        this.reminderHistory.unshift({
            id: Date.now().toString(),
            title,
            body,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 notifications
        if (this.reminderHistory.length > 100) {
            this.reminderHistory = this.reminderHistory.slice(0, 100);
        }

        this.saveReminderHistory();
    },

    /**
     * Load reminder history from localStorage
     */
    loadReminderHistory() {
        try {
            const data = localStorage.getItem('clinic_notification_history');
            this.reminderHistory = data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading notification history:', error);
            this.reminderHistory = [];
        }
    },

    /**
     * Save reminder history to localStorage
     */
    saveReminderHistory() {
        try {
            localStorage.setItem('clinic_notification_history', JSON.stringify(this.reminderHistory));
        } catch (error) {
            console.error('Error saving notification history:', error);
        }
    },

    /**
     * Get reminder history
     */
    getHistory() {
        return this.reminderHistory;
    },

    /**
     * Clear reminder history
     */
    clearHistory() {
        this.reminderHistory = [];
        localStorage.removeItem('clinic_notification_history');
    },

    /**
     * Start the medication reminder checker
     */
    startReminderChecker() {
        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkMedicationReminders();
        }, 60000);

        // Also check immediately on load
        this.checkMedicationReminders();
    },

    /**
     * Stop the reminder checker
     */
    stopReminderChecker() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },

    /**
     * Check for medication reminders that need to be sent
     */
    checkMedicationReminders() {
        const medications = Storage.getMedications();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = now.toISOString().split('T')[0];

        medications.forEach(med => {
            // Check if this medication has reminders for today's times
            if (med.times && med.times.includes(currentTime)) {
                const lastNotified = med.lastNotified ? new Date(med.lastNotified) : null;
                const shouldNotify = !lastNotified ||
                    lastNotified.toDateString() !== now.toLocaleDateString('en-US', { timeZone: 'Asia/Shanghai' });

                if (shouldNotify) {
                    const patient = Storage.getPatients().find(p => p.id === med.patientId);
                    const patientName = patient ? patient.name : '患者';

                    this.show(
                        `💊 用药提醒 - ${patientName}`,
                        {
                            body: `${med.medicationName} (${med.dosage})\n时间: ${currentTime}`,
                            tag: `med-${med.id}-${currentTime}`,
                            requireInteraction: true
                        }
                    );

                    // Update last notified time
                    med.lastNotified = new Date().toISOString();
                    Storage.saveMedications(medications);
                }
            }
        });
    },

    /**
     * Create a new medication reminder
     */
    createReminder(medicationData) {
        const medications = Storage.getMedications();

        const newMedication = {
            id: 'M' + Date.now(),
            ...medicationData,
            createdAt: new Date().toISOString(),
            lastNotified: null
        };

        medications.push(newMedication);
        Storage.saveMedications(medications);

        return newMedication;
    },

    /**
     * Update a medication reminder
     */
    updateReminder(medicationId, updates) {
        const medications = Storage.getMedications();
        const index = medications.findIndex(m => m.id === medicationId);

        if (index !== -1) {
            medications[index] = { ...medications[index], ...updates };
            Storage.saveMedications(medications);
            return medications[index];
        }

        return null;
    },

    /**
     * Delete a medication reminder
     */
    deleteReminder(medicationId) {
        const medications = Storage.getMedications();
        const filtered = medications.filter(m => m.id !== medicationId);

        if (filtered.length !== medications.length) {
            Storage.saveMedications(filtered);
            return true;
        }

        return false;
    },

    /**
     * Get all reminders for a specific patient
     */
    getPatientReminders(patientId) {
        const medications = Storage.getMedications();
        return medications.filter(m => m.patientId === patientId);
    },

    /**
     * Show a test notification
     */
    test() {
        this.show(
            '测试通知',
            {
                body: '这是一个测试通知，用于验证通知系统是否正常工作。',
                tag: 'test-' + Date.now()
            }
        );
    },

    /**
     * Schedule a one-time reminder
     */
    scheduleReminder(title, message, scheduledTime) {
        const now = new Date();
        const scheduled = new Date(scheduledTime);

        if (scheduled <= now) {
            // If the time is in the past, show immediately
            this.show(title, { body: message });
            return false;
        }

        const delay = scheduled.getTime() - now.getTime();

        setTimeout(() => {
            this.show(title, { body: message });
        }, delay);

        return true;
    },

    /**
     * Get upcoming reminders (for dashboard display)
     */
    getUpcomingReminders(limit = 5) {
        const medications = Storage.getMedications();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const upcoming = [];

        medications.forEach(med => {
            if (med.times && med.times.length > 0) {
                med.times.forEach(time => {
                    const [hours, minutes] = time.split(':').map(Number);
                    const timeMinutes = hours * 60 + minutes;

                    // Include reminders for the next 12 hours
                    if (timeMinutes >= currentMinutes || timeMinutes < currentMinutes - 12 * 60) {
                        const patient = Storage.getPatients().find(p => p.id === med.patientId);
                        upcoming.push({
                            medication: med,
                            patient: patient || { name: '未知患者' },
                            time,
                            isToday: timeMinutes >= currentMinutes
                        });
                    }
                });
            }
        });

        // Sort by time and limit
        upcoming.sort((a, b) => {
            if (a.isToday !== b.isToday) return b.isToday - a.isToday;
            return a.time.localeCompare(b.time);
        });

        return upcoming.slice(0, limit);
    },

    /**
     * Format time display with AM/PM or 24-hour format
     */
    formatTime(time24) {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? '下午' : '上午';
        const hours12 = hours % 12 || 12;
        return `${period} ${hours12}:${String(minutes).padStart(2, '0')}`;
    },

    /**
     * Cleanup on page unload
     */
    destroy() {
        this.stopReminderChecker();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Notifications.destroy();
});
