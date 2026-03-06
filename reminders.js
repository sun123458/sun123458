/**
 * 用药提醒模块
 * 使用浏览器通知 API 发送用药提醒
 */

// 示例提醒数据
const sampleReminders = [
    {
        id: '1',
        patientId: '1',
        patientName: '张伟',
        medication: '降压药',
        dosage: '5mg',
        time: '09:00',
        frequency: 'daily',
        notes: '饭后服用',
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        patientId: '2',
        patientName: '李娜',
        medication: '胰岛素',
        dosage: '10单位',
        time: '08:00',
        frequency: 'daily',
        notes: '餐前注射',
        active: true,
        createdAt: new Date().toISOString()
    }
];

// LocalStorage 键
const REMINDERS_STORAGE_KEY = 'medical_reminders';
const NOTIFICATION_PERMISSION_KEY = 'notification_permission';

// 定时器引用
let reminderCheckInterval = null;

// 获取所有提醒
function getReminders() {
    const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(sampleReminders));
    return sampleReminders;
}

// 保存提醒数据
function saveReminders(reminders) {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
}

// 根据 ID 获取提醒
function getReminderById(id) {
    const reminders = getReminders();
    return reminders.find(r => r.id === id);
}

// 添加提醒
function addReminder(reminderData) {
    const reminders = getReminders();
    const newReminder = {
        id: generateId(),
        ...reminderData,
        active: true,
        createdAt: new Date().toISOString()
    };
    reminders.push(newReminder);
    saveReminders(reminders);
    return newReminder;
}

// 更新提醒
function updateReminder(id, reminderData) {
    const reminders = getReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
        reminders[index] = {
            ...reminders[index],
            ...reminderData,
            id
        };
        saveReminders(reminders);
        return reminders[index];
    }
    return null;
}

// 删除提醒
function deleteReminder(id) {
    const reminders = getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    saveReminders(filtered);
    return filtered.length < reminders.length;
}

// 请求通知权限
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('您的浏览器不支持通知功能', 'error');
        return false;
    }

    if (Notification.permission === 'granted') {
        showToast('通知已启用', 'success');
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
            showToast('通知已启用', 'success');
            startReminderChecker();
            return true;
        }
    }

    showToast('通知已被拒绝，请在浏览器设置中允许通知', 'warning');
    return false;
}

// 发送通知
function sendNotification(title, options = {}) {
    if (!('Notification' in window)) {
        console.log('浏览器不支持通知');
        return;
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
            requireInteraction: true,
            ...options
        });

        // 点击通知时关闭
        notification.onclick = function() {
            window.focus();
            notification.close();
        };

        // 自动关闭（60秒后）
        setTimeout(() => {
            notification.close();
        }, 60000);
    }
}

// 检查提醒并发送通知
function checkReminders() {
    const reminders = getReminders().filter(r => r.active);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    reminders.forEach(reminder => {
        if (reminder.time === currentTime) {
            // 检查今天是否已经发送过通知
            const lastNotificationKey = `reminder_${reminder.id}_${now.toDateString()}`;
            const lastNotification = localStorage.getItem(lastNotificationKey);

            if (!lastNotification) {
                // 发送通知
                const patient = getPatientById(reminder.patientId);
                sendNotification(`💊 用药提醒 - ${patient ? patient.name : reminder.patientName}`, {
                    body: `${reminder.medication} ${reminder.dosage}\n${reminder.notes || '请按时服药'}`,
                    tag: reminder.id
                });

                // 播放提示音
                playReminderSound();

                // 标记今天已发送通知
                localStorage.setItem(lastNotificationKey, 'sent');
            }
        }
    });
}

// 播放提醒声音
function playReminderSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// 启动提醒检查器
function startReminderChecker() {
    if (reminderCheckInterval) {
        clearInterval(reminderCheckInterval);
    }

    // 每分钟检查一次
    reminderCheckInterval = setInterval(checkReminders, 60000);

    // 立即检查一次
    checkReminders();
}

// 停止提醒检查器
function stopReminderChecker() {
    if (reminderCheckInterval) {
        clearInterval(reminderCheckInterval);
        reminderCheckInterval = null;
    }
}

// 更新提醒页面
function updateRemindersPage() {
    const reminders = getReminders();
    const container = document.getElementById('reminders-list');

    if (reminders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>暂无用药提醒</p>
                <p style="font-size: 14px;">使用上方表单添加新的用药提醒</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reminders.map(reminder => `
        <div class="reminder-item">
            <div class="reminder-header">
                <div>
                    <div class="reminder-medication">${escapeHtml(reminder.medication)} - ${escapeHtml(reminder.dosage)}</div>
                    <div class="reminder-patient">
                        <i class="fas fa-user"></i> ${escapeHtml(reminder.patientName)}
                    </div>
                </div>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                    <input
                        type="checkbox"
                        ${reminder.active ? 'checked' : ''}
                        onchange="toggleReminder('${reminder.id}', this.checked)"
                        aria-label="激活提醒"
                    >
                    <span>活跃</span>
                </label>
            </div>
            <div class="reminder-details">
                <div class="reminder-details-item">
                    <i class="fas fa-clock"></i>
                    <span><strong>时间:</strong> ${reminder.time}</span>
                </div>
                <div class="reminder-details-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span><strong>频率:</strong> ${getFrequencyText(reminder.frequency)}</span>
                </div>
                ${reminder.notes ? `
                <div class="reminder-details-item">
                    <i class="fas fa-sticky-note"></i>
                    <span><strong>备注:</strong> ${escapeHtml(reminder.notes)}</span>
                </div>
                ` : ''}
            </div>
            <div class="reminder-actions">
                <button type="button" class="btn btn-secondary" onclick="editReminder('${reminder.id}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button type="button" class="btn btn-danger" onclick="removeReminder('${reminder.id}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');

    populatePatientSelect('reminder-patient');
}

// 获取频率文本
function getFrequencyText(frequency) {
    const texts = {
        once: '一次',
        daily: '每日',
        weekly: '每周'
    };
    return texts[frequency] || frequency;
}

// 切换提醒状态
function toggleReminder(id, active) {
    updateReminder(id, { active });
    if (active) {
        showToast('提醒已激活', 'success');
    } else {
        showToast('提醒已关闭', 'info');
    }
}

// 编辑提醒
function editReminder(id) {
    const reminder = getReminderById(id);
    if (!reminder) return;

    document.getElementById('reminder-form').dataset.mode = 'edit';
    document.getElementById('reminder-form').dataset.reminderId = id;

    populatePatientSelect('reminder-patient');
    document.getElementById('reminder-patient').value = reminder.patientId;
    document.getElementById('reminder-medication').value = reminder.medication;
    document.getElementById('reminder-dosage').value = reminder.dosage;
    document.getElementById('reminder-time').value = reminder.time;
    document.getElementById('reminder-frequency').value = reminder.frequency;
    document.getElementById('reminder-notes').value = reminder.notes || '';

    // 修改按钮文本
    const submitBtn = document.querySelector('#reminder-form button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> 保存更改';

    showToast('请在上方表单中编辑提醒信息', 'info');
}

// 删除提醒
function removeReminder(id) {
    if (confirm('确定要删除这个提醒吗？')) {
        deleteReminder(id);
        showToast('提醒已删除', 'success');
        updateRemindersPage();
        updateDashboard();
    }
}

// 提醒表单提交
document.getElementById('reminder-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
        patientId: document.getElementById('reminder-patient').value,
        medication: document.getElementById('reminder-medication').value,
        dosage: document.getElementById('reminder-dosage').value,
        time: document.getElementById('reminder-time').value,
        frequency: document.getElementById('reminder-frequency').value,
        notes: document.getElementById('reminder-notes').value
    };

    // 获取患者名称
    const patient = getPatientById(formData.patientId);
    formData.patientName = patient.name;

    const form = e.target;
    const mode = form.dataset.mode;
    const reminderId = form.dataset.reminderId;

    if (mode === 'edit' && reminderId) {
        // 编辑模式
        updateReminder(reminderId, formData);
        showToast('提醒已更新', 'success');
        // 重置表单状态
        delete form.dataset.mode;
        delete form.dataset.reminderId;
    } else {
        // 添加模式
        addReminder(formData);
        showToast('提醒已添加', 'success');
    }

    form.reset();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> 添加提醒';

    updateRemindersPage();
    updateDashboard();
});

// 请求通知权限按钮
document.getElementById('request-notification-btn').addEventListener('click', requestNotificationPermission);

// 检查通知权限状态
function checkNotificationPermission() {
    if (Notification.permission === 'granted') {
        const btn = document.getElementById('request-notification-btn');
        btn.innerHTML = '<i class="fas fa-check"></i> 通知已启用';
        btn.disabled = true;
        startReminderChecker();
    } else if (Notification.permission === 'denied') {
        const btn = document.getElementById('request-notification-btn');
        btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 通知被禁用';
        btn.classList.add('btn-warning');
    }
}

// 页面加载时检查通知权限
document.addEventListener('DOMContentLoaded', () => {
    checkNotificationPermission();

    // 如果已有权限，启动提醒检查器
    if (Notification.permission === 'granted') {
        startReminderChecker();
    }
});

// 页面卸载时停止检查器
window.addEventListener('beforeunload', stopReminderChecker);
