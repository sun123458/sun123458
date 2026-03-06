/**
 * Calendar Module
 * Handles FullCalendar integration and appointment management
 */

const Calendar = {
    calendar: null,
    currentEvent: null,

    /**
     * Initialize the calendar
     */
    init() {
        this.renderCalendar();
        this.bindEvents();
        this.populatePatientSelect();
    },

    /**
     * Render FullCalendar
     */
    renderCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-cn',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today: '今天',
                month: '月',
                week: '周',
                day: '日'
            },
            firstDay: 1, // Monday
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            navLinks: true,
            nowIndicator: true,
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            events: this.getCalendarEvents(),
            select: (info) => this.handleDateSelect(info),
            eventClick: (info) => this.handleEventClick(info),
            eventDrop: (info) => this.handleEventDrop(info),
            eventResize: (info) => this.handleEventResize(info),
            dateClick: (info) => this.handleDateClick(info)
        });

        this.calendar.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add appointment button from dashboard
        document.getElementById('add-appointment-btn')?.addEventListener('click', () => {
            this.openAppointmentModal();
        });

        // Appointment form submission
        const appointmentForm = document.getElementById('appointment-form');
        appointmentForm?.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));

        // Close buttons
        document.querySelectorAll('#appointment-modal .close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAppointmentModal());
        });

        // Delete appointment button
        document.getElementById('delete-appointment')?.addEventListener('click', () => {
            this.deleteCurrentAppointment();
        });

        // Click on date to add appointment (shortcut)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAppointmentModal();
            }
        });
    },

    /**
     * Get events from storage for FullCalendar
     */
    getCalendarEvents() {
        const appointments = Storage.getAppointments();

        return appointments.map(apt => ({
            id: apt.id,
            title: apt.title,
            start: apt.start,
            end: apt.end,
            backgroundColor: this.getTypeColor(apt.type),
            borderColor: this.getTypeColor(apt.type),
            extendedProps: {
                patientId: apt.patientId,
                type: apt.type,
                notes: apt.notes
            },
            classNames: [`fc-event-${apt.type}`]
        }));
    },

    /**
     * Get color for appointment type
     */
    getTypeColor(type) {
        const colors = {
            checkup: '#2563eb',
            followup: '#10b981',
            emergency: '#ef4444',
            consultation: '#06b6d4'
        };
        return colors[type] || '#64748b';
    },

    /**
     * Populate patient select dropdown
     */
    populatePatientSelect() {
        const select = document.getElementById('appointment-patient');
        if (!select) return;

        const patients = Storage.getPatients();
        const currentValue = select.value;

        select.innerHTML = '<option value="">选择患者...</option>' +
            patients.map(p =>
                `<option value="${p.id}">${this.escapeHtml(p.name)} (${p.id})</option>`
            ).join('');

        select.value = currentValue;
    },

    /**
     * Handle date/time selection on calendar
     */
    handleDateSelect(info) {
        this.openAppointmentModal(null, {
            start: info.start,
            end: info.end
        });
        this.calendar.unselect();
    },

    /**
     * Handle date click
     */
    handleDateClick(info) {
        const start = new Date(info.date);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        this.openAppointmentModal(null, { start, end });
    },

    /**
     * Handle event click
     */
    handleEventClick(info) {
        const event = info.event;
        this.currentEvent = event;

        this.openAppointmentModal(event.id, {
            readOnly: false
        });
    },

    /**
     * Handle event drop (drag and drop)
     */
    handleEventDrop(info) {
        const event = info.event;
        this.updateAppointmentTime(
            event.id,
            event.start.toISOString(),
            event.end.toISOString()
        );
    },

    /**
     * Handle event resize
     */
    handleEventResize(info) {
        const event = info.event;
        this.updateAppointmentTime(
            event.id,
            event.start.toISOString(),
            event.end.toISOString()
        );
    },

    /**
     * Open appointment modal
     */
    openAppointmentModal(appointmentId = null, options = {}) {
        const modal = document.getElementById('appointment-modal');
        const form = document.getElementById('appointment-form');
        const title = document.getElementById('appointment-modal-title');
        const deleteBtn = document.getElementById('delete-appointment');

        form.reset();
        this.populatePatientSelect();

        // Set default times
        if (options.start && options.end) {
            const start = new Date(options.start);
            const end = new Date(options.end);

            document.getElementById('appointment-start').value = this.toLocalDateTime(start);
            document.getElementById('appointment-end').value = this.toLocalDateTime(end);
        } else {
            // Default to next hour
            const now = new Date();
            const start = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
            const end = new Date(start);
            end.setHours(end.getHours() + 1);

            document.getElementById('appointment-start').value = this.toLocalDateTime(start);
            document.getElementById('appointment-end').value = this.toLocalDateTime(end);
        }

        if (appointmentId) {
            const appointment = Storage.getAppointments().find(a => a.id === appointmentId);
            if (appointment) {
                title.textContent = '编辑预约';
                this.fillAppointmentForm(appointment);
                deleteBtn?.classList.remove('hidden');
            }
        } else {
            title.textContent = '新建预约';
            document.getElementById('appointment-id').value = '';
            deleteBtn?.classList.add('hidden');
        }

        modal.classList.add('active');
        document.getElementById('appointment-patient')?.focus();
    },

    /**
     * Close appointment modal
     */
    closeAppointmentModal() {
        document.getElementById('appointment-modal').classList.remove('active');
        this.currentEvent = null;
    },

    /**
     * Fill appointment form with existing data
     */
    fillAppointmentForm(appointment) {
        document.getElementById('appointment-id').value = appointment.id;
        document.getElementById('appointment-patient').value = appointment.patientId || '';
        document.getElementById('appointment-title').value = appointment.title;
        document.getElementById('appointment-start').value = this.toLocalDateTime(new Date(appointment.start));
        document.getElementById('appointment-end').value = this.toLocalDateTime(new Date(appointment.end));
        document.getElementById('appointment-type').value = appointment.type;
        document.getElementById('appointment-notes').value = appointment.notes || '';
    },

    /**
     * Handle appointment form submission
     */
    handleAppointmentSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('appointment-id').value || this.generateId();
        const patientId = document.getElementById('appointment-patient').value;
        const start = document.getElementById('appointment-start').value;
        const end = document.getElementById('appointment-end').value;
        const title = document.getElementById('appointment-title').value.trim();

        // Validate
        if (new Date(start) >= new Date(end)) {
            UI.showToast('结束时间必须晚于开始时间', 'error');
            return;
        }

        const appointmentData = {
            id,
            patientId: patientId || null,
            title,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            type: document.getElementById('appointment-type').value,
            notes: document.getElementById('appointment-notes').value.trim() || null
        };

        const appointments = Storage.getAppointments();
        const existingIndex = appointments.findIndex(a => a.id === id);

        if (existingIndex !== -1) {
            appointments[existingIndex] = { ...appointments[existingIndex], ...appointmentData };
            UI.showToast('预约已更新', 'success');
        } else {
            appointments.push(appointmentData);
            UI.showToast('预约已创建', 'success');
        }

        Storage.saveAppointments(appointments);
        this.refreshCalendar();
        this.closeAppointmentModal();
        this.updateDashboardStats();
    },

    /**
     * Update appointment time after drag/resize
     */
    updateAppointmentTime(appointmentId, start, end) {
        const appointments = Storage.getAppointments();
        const index = appointments.findIndex(a => a.id === appointmentId);

        if (index !== -1) {
            appointments[index].start = start;
            appointments[index].end = end;
            Storage.saveAppointments(appointments);
            UI.showToast('预约时间已更新', 'success');
            this.updateDashboardStats();
        }
    },

    /**
     * Delete current appointment
     */
    deleteCurrentAppointment() {
        if (!this.currentEvent) {
            // Also check if we have an ID in the form
            const formId = document.getElementById('appointment-id').value;
            if (!formId) return;
        }

        const eventId = this.currentEvent?.id || document.getElementById('appointment-id').value;
        const eventTitle = this.currentEvent?.title || document.getElementById('appointment-title').value;

        UI.showConfirm(
            `确定要删除预约"${eventTitle}"吗？`,
            () => {
                const appointments = Storage.getAppointments().filter(a => a.id !== eventId);
                Storage.saveAppointments(appointments);

                this.refreshCalendar();
                this.closeAppointmentModal();
                this.updateDashboardStats();
                UI.showToast('预约已删除', 'success');
            }
        );
    },

    /**
     * Refresh calendar events
     */
    refreshCalendar() {
        if (!this.calendar) return;

        const appointments = Storage.getAppointments();

        // Remove all existing events and add new ones
        this.calendar.removeAllEvents();
        appointments.forEach(apt => {
            this.calendar.addEvent({
                id: apt.id,
                title: apt.title,
                start: apt.start,
                end: apt.end,
                backgroundColor: this.getTypeColor(apt.type),
                borderColor: this.getTypeColor(apt.type),
                extendedProps: {
                    patientId: apt.patientId,
                    type: apt.type,
                    notes: apt.notes
                }
            });
        });
    },

    /**
     * Get appointment for a specific patient
     */
    getAppointmentsForPatient(patientId) {
        return Storage.getAppointments().filter(a => a.patientId === patientId);
    },

    /**
     * Get today's appointments
     */
    getTodayAppointments() {
        const today = new Date().toDateString();
        return Storage.getAppointments().filter(a =>
            new Date(a.start).toDateString() === today
        );
    },

    /**
     * Get upcoming appointments (within specified days)
     */
    getUpcomingAppointments(days = 7) {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);

        return Storage.getAppointments().filter(a => {
            const date = new Date(a.start);
            return date >= now && date <= future;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
    },

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const today = new Date().toDateString();
        const todayApps = Storage.getAppointments().filter(a =>
            new Date(a.start).toDateString() === today
        ).length;

        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekApps = Storage.getAppointments().filter(a => {
            const date = new Date(a.start);
            return date >= new Date() && date <= weekEnd;
        }).length;

        document.getElementById('today-appointments').textContent = todayApps;
        document.getElementById('week-appointments').textContent = weekApps;
    },

    /**
     * Convert Date to datetime-local input format
     */
    toLocalDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    /**
     * Generate unique appointment ID
     */
    generateId() {
        return 'A' + Date.now().toString().slice(-8);
    },

    /**
     * Helper: Escape HTML
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Helper: Get appointment type label
     */
    getTypeLabel(type) {
        const labels = {
            checkup: '常规检查',
            followup: '复查',
            emergency: '急诊',
            consultation: '咨询'
        };
        return labels[type] || type;
    },

    /**
     * Check for scheduling conflicts
     */
    hasConflict(start, end, excludeId = null) {
        const appointments = Storage.getAppointments().filter(a => a.id !== excludeId);
        const newStart = new Date(start);
        const newEnd = new Date(end);

        return appointments.some(apt => {
            const aptStart = new Date(apt.start);
            const aptEnd = new Date(apt.end);

            return (newStart < aptEnd && newEnd > aptStart);
        });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Calendar.init();
});
