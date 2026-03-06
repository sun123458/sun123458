/**
 * 预约管理模块
 * 使用 FullCalendar 实现预约的创建、编辑和删除
 */

// 示例预约数据
const sampleAppointments = [
    {
        id: '1',
        title: '张伟 - 高血压复查',
        start: new Date().toISOString().split('T')[0] + 'T09:00:00',
        end: new Date().toISOString().split('T')[0] + 'T09:30:00',
        patientId: '1',
        type: 'followup',
        notes: '测量血压，检查药物效果'
    },
    {
        id: '2',
        title: '李娜 - 糖尿病咨询',
        start: new Date().toISOString().split('T')[0] + 'T10:00:00',
        end: new Date().toISOString().split('T')[0] + 'T10:30:00',
        patientId: '2',
        type: 'consultation',
        notes: '调整胰岛素剂量'
    },
    {
        id: '3',
        title: '王明 - 心脏体检',
        start: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T14:00:00',
        end: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T14:45:00',
        patientId: '3',
        type: 'checkup',
        notes: '心脏超声检查'
    }
];

// LocalStorage 键
const APPOINTMENTS_STORAGE_KEY = 'medical_appointments';

// 日历实例
let calendar = null;

// 获取所有预约
function getAppointments() {
    const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(sampleAppointments));
    return sampleAppointments;
}

// 保存预约数据
function saveAppointments(appointments) {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
}

// 根据 ID 获取预约
function getAppointmentById(id) {
    const appointments = getAppointments();
    return appointments.find(a => a.id === id);
}

// 添加预约
function addAppointment(appointmentData) {
    const appointments = getAppointments();
    const newAppointment = {
        id: generateId(),
        ...appointmentData
    };
    appointments.push(newAppointment);
    saveAppointments(appointments);
    return newAppointment;
}

// 更新预约
function updateAppointment(id, appointmentData) {
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
        appointments[index] = {
            ...appointments[index],
            ...appointmentData,
            id
        };
        saveAppointments(appointments);
        return appointments[index];
    }
    return null;
}

// 删除预约
function deleteAppointment(id) {
    const appointments = getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    saveAppointments(filtered);
    return filtered.length < appointments.length;
}

// 获取预约类型颜色
function getAppointmentColor(type) {
    const colors = {
        consultation: '#2563eb',    // 蓝色
        checkup: '#10b981',          // 绿色
        followup: '#f59e0b',         // 橙色
        emergency: '#ef4444'         // 红色
    };
    return colors[type] || '#64748b';
}

// 获取预约类型名称
function getAppointmentTypeName(type) {
    const names = {
        consultation: '咨询',
        checkup: '体检',
        followup: '复查',
        emergency: '急诊'
    };
    return names[type] || '其他';
}

// 初始化日历
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'zh-cn',
        buttonText: {
            today: '今天',
            month: '月',
            week: '周',
            day: '日'
        },
        events: function(info, successCallback, failureCallback) {
            const appointments = getAppointments();
            const events = appointments.map(apt => ({
                id: apt.id,
                title: apt.title,
                start: apt.start,
                end: apt.end,
                backgroundColor: getAppointmentColor(apt.type),
                borderColor: getAppointmentColor(apt.type),
                extendedProps: {
                    patientId: apt.patientId,
                    type: apt.type,
                    notes: apt.notes
                }
            }));
            successCallback(events);
        },
        eventClick: function(info) {
            editAppointmentModal(info.event);
        },
        dateClick: function(info) {
            createAppointmentModal(info.dateStr);
        },
        selectable: true,
        select: function(info) {
            createAppointmentModal(info.startStr, info.endStr);
        },
        editable: true,
        eventDrop: function(info) {
            updateAppointmentTime(info.event);
        },
        eventResize: function(info) {
            updateAppointmentTime(info.event);
        },
        height: 'auto',
        dayMaxEvents: true,
        navLinks: true,
        nowIndicator: true
    });

    calendar.render();
}

// 刷新日历
function refreshCalendar() {
    if (calendar) {
        calendar.refetchEvents();
    }
}

// 更新预约时间（拖拽或调整大小后）
function updateAppointmentTime(event) {
    const appointment = getAppointmentById(event.id);
    if (appointment) {
        updateAppointment(event.id, {
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : event.start.toISOString()
        });
        showToast('预约时间已更新', 'success');
        updateDashboard();
    }
}

// 创建预约模态框
function createAppointmentModal(startDate, endDate) {
    const form = document.getElementById('appointment-form');
    form.reset();
    document.getElementById('appointment-form-title').textContent = '新建预约';
    document.getElementById('appointment-id').value = '';
    document.querySelector('.delete-appointment-btn').style.display = 'none';

    // 设置日期时间
    if (startDate) {
        const startDateTime = new Date(startDate);
        document.getElementById('appointment-start').value =
            formatDateTimeForInput(startDateTime);

        if (endDate) {
            const endDateTime = new Date(endDate);
            document.getElementById('appointment-end').value =
                formatDateTimeForInput(endDateTime);
        } else {
            // 默认30分钟
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
            document.getElementById('appointment-end').value =
                formatDateTimeForInput(endDateTime);
        }
    } else {
        // 默认为当前时间
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        document.getElementById('appointment-start').value = formatDateTimeForInput(now);

        const end = new Date(now.getTime() + 30 * 60000);
        document.getElementById('appointment-end').value = formatDateTimeForInput(end);
    }

    // 填充患者选择列表
    populatePatientSelect('appointment-patient');

    openModal('appointment-modal');
}

// 编辑预约模态框
function editAppointmentModal(event) {
    const appointment = getAppointmentById(event.id);
    if (!appointment) return;

    const form = document.getElementById('appointment-form');
    document.getElementById('appointment-form-title').textContent = '编辑预约';
    document.getElementById('appointment-id').value = appointment.id;
    document.querySelector('.delete-appointment-btn').style.display = 'block';

    // 填充表单
    populatePatientSelect('appointment-patient');
    document.getElementById('appointment-patient').value = appointment.patientId;
    document.getElementById('appointment-title').value = appointment.title;
    document.getElementById('appointment-start').value =
        formatDateTimeForInput(new Date(appointment.start));
    document.getElementById('appointment-end').value =
        formatDateTimeForInput(new Date(appointment.end));
    document.getElementById('appointment-type').value = appointment.type || 'consultation';
    document.getElementById('appointment-notes').value = appointment.notes || '';

    openModal('appointment-modal');
}

// 格式化日期时间为 input datetime-local 格式
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 填充患者选择列表
function populatePatientSelect(selectId) {
    const select = document.getElementById(selectId);
    const patients = getPatients();

    // 清除现有选项（保留第一个）
    select.innerHTML = '<option value="">请选择患者</option>';

    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.name} (${patient.age}岁)`;
        select.appendChild(option);
    });
}

// 预约表单提交
document.getElementById('appointment-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const patientId = document.getElementById('appointment-patient').value;
    const patient = getPatientById(patientId);

    const formData = {
        patientId,
        title: `${patient.name} - ${document.getElementById('appointment-title').value}`,
        start: document.getElementById('appointment-start').value,
        end: document.getElementById('appointment-end').value,
        type: document.getElementById('appointment-type').value,
        notes: document.getElementById('appointment-notes').value
    };

    const id = document.getElementById('appointment-id').value;

    if (id) {
        // 编辑模式
        updateAppointment(id, formData);
        showToast('预约已更新', 'success');
    } else {
        // 添加模式
        addAppointment(formData);
        showToast('预约已创建', 'success');
    }

    closeModal('appointment-modal');
    refreshCalendar();
    updateDashboard();
});

// 删除预约
document.querySelector('.delete-appointment-btn').addEventListener('click', () => {
    const id = document.getElementById('appointment-id').value;
    if (confirm('确定要删除这个预约吗？')) {
        deleteAppointment(id);
        showToast('预约已删除', 'success');
        closeModal('appointment-modal');
        refreshCalendar();
        updateDashboard();
    }
});

// 新建预约按钮
document.getElementById('add-appointment-btn').addEventListener('click', () => {
    createAppointmentModal();
});

// 页面加载时初始化日历（延迟以确保 FullCalendar 已加载）
document.addEventListener('DOMContentLoaded', () => {
    // 等待 FullCalendar 加载完成
    const checkCalendar = setInterval(() => {
        if (typeof FullCalendar !== 'undefined') {
            clearInterval(checkCalendar);
            setTimeout(initializeCalendar, 100);
        }
    }, 100);

    // 3秒后停止检查
    setTimeout(() => clearInterval(checkCalendar), 3000);
});
