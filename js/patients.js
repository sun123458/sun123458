/**
 * Patients Module
 * Handles patient management, CRUD operations, and search/filtering
 */

const Patients = {
    currentPatient: null,
    currentTab: 'info',
    searchHistory: [],

    /**
     * Initialize the patients module
     */
    init() {
        this.bindEvents();
        this.renderPatientsList();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add patient buttons
        document.getElementById('add-patient-btn').addEventListener('click', () => this.openPatientModal());
        document.getElementById('add-patient-btn-2')?.addEventListener('click', () => this.openPatientModal());

        // Patient form
        const patientForm = document.getElementById('patient-form');
        patientForm.addEventListener('submit', (e) => this.handlePatientSubmit(e));

        // Patient modal close buttons
        document.querySelectorAll('#patient-modal .close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closePatientModal());
        });

        // Patient detail modal
        document.querySelectorAll('#patient-detail-modal .close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closePatientDetailModal());
        });

        // Search functionality
        const searchInput = document.getElementById('patient-search');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Advanced search toggle
        const advSearchToggle = document.getElementById('advanced-search-toggle');
        advSearchToggle?.addEventListener('click', () => this.toggleAdvancedSearch());

        // Apply and clear filters
        document.getElementById('apply-filters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clear-filters')?.addEventListener('click', () => this.clearFilters());

        // Avatar upload
        document.getElementById('avatar-input')?.addEventListener('change', (e) => this.handleAvatarUpload(e));

        // Patient detail tabs
        document.getElementById('patient-detail-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Edit patient button
        document.getElementById('edit-patient-btn')?.addEventListener('click', () => this.editCurrentPatient());

        // Delete patient button
        document.getElementById('delete-patient-btn')?.addEventListener('click', () => this.deleteCurrentPatient());

        // Vitals modal
        const vitalsForm = document.getElementById('vitals-form');
        vitalsForm?.addEventListener('submit', (e) => this.handleVitalsSubmit(e));

        // Add vitals button (will be added dynamically)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-vitals-btn') {
                this.openVitalsModal(e.target.dataset.patientId);
            }
        });

        // Medication modal
        const medicationForm = document.getElementById('medication-form');
        medicationForm?.addEventListener('submit', (e) => this.handleMedicationSubmit(e));

        // Add medication button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-medication-btn') {
                this.openMedicationModal(e.target.dataset.patientId);
            }
        });

        // Add medication time
        document.getElementById('add-medication-time')?.addEventListener('click', () => this.addMedicationTimeField());

        // Delete vitals/medication
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-vitals')) {
                this.deleteVitals(e.target.dataset.id);
            }
            if (e.target.classList.contains('delete-medication')) {
                this.deleteMedication(e.target.dataset.id);
            }
        });

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePatientModal();
                this.closePatientDetailModal();
                document.getElementById('vitals-modal')?.classList.remove('active');
                document.getElementById('medication-modal')?.classList.remove('active');
            }
        });
    },

    /**
     * Render patients list
     */
    renderPatientsList(patients = null) {
        const container = document.getElementById('patients-list');
        if (!container) return;

        const allPatients = patients || Storage.getPatients();

        if (allPatients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>暂无患者记录</p>
                    <p style="font-size: 0.875rem;">点击上方"添加患者"按钮创建新患者</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allPatients.map(patient => {
            const age = this.calculateAge(patient.dateOfBirth);
            const hasAllergies = patient.allergies && patient.allergies.length > 0;

            return `
                <div class="patient-card"
                     role="listitem"
                     tabindex="0"
                     data-patient-id="${patient.id}"
                     style="cursor: pointer;"
                     onclick="Patients.openPatientDetail('${patient.id}')"
                     onkeydown="if(event.key === 'Enter') Patients.openPatientDetail('${patient.id}')">
                    <div class="patient-card-header">
                        <div class="patient-avatar-small">
                            ${patient.avatar ?
                                `<img src="${patient.avatar}" alt="${patient.name}的头像">` :
                                '<span aria-hidden="true">👤</span>'
                            }
                        </div>
                        <div class="patient-info">
                            <h3 class="patient-name">${this.escapeHtml(patient.name)}</h3>
                            <p class="patient-id">ID: ${patient.id}</p>
                        </div>
                    </div>
                    <div class="patient-details">
                        <div class="patient-detail-item">
                            <span aria-hidden="true">🎂</span>
                            <span>${age} 岁</span>
                        </div>
                        <div class="patient-detail-item">
                            <span aria-hidden="true">📞</span>
                            <span>${this.escapeHtml(patient.phone)}</span>
                        </div>
                        <div class="patient-detail-item">
                            <span aria-hidden="true">📋</span>
                            <span>${this.getPatientVitalsCount(patient.id)} 条记录</span>
                        </div>
                    </div>
                    ${hasAllergies ? `
                        <div class="allergy-badge" role="alert">
                            过敏: ${this.escapeHtml(patient.allergies.join(', '))}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    /**
     * Open patient add/edit modal
     */
    openPatientModal(patientId = null) {
        const modal = document.getElementById('patient-modal');
        const form = document.getElementById('patient-form');
        const title = document.getElementById('patient-modal-title');

        form.reset();
        document.getElementById('patient-id').value = '';
        document.getElementById('avatar-preview').innerHTML = '<span class="avatar-placeholder" aria-hidden="true">👤</span>';

        if (patientId) {
            const patient = Storage.getPatients().find(p => p.id === patientId);
            if (patient) {
                title.textContent = '编辑患者';
                this.fillPatientForm(patient);
            }
        } else {
            title.textContent = '添加患者';
        }

        modal.classList.add('active');
        modal.querySelector('input')?.focus();
    },

    /**
     * Close patient modal
     */
    closePatientModal() {
        document.getElementById('patient-modal').classList.remove('active');
    },

    /**
     * Fill patient form with existing data
     */
    fillPatientForm(patient) {
        document.getElementById('patient-id').value = patient.id;
        document.getElementById('patient-name').value = patient.name;
        document.getElementById('patient-dob').value = patient.dateOfBirth;
        document.getElementById('patient-phone').value = patient.phone;
        document.getElementById('patient-email').value = patient.email || '';
        document.getElementById('patient-address').value = patient.address || '';
        document.getElementById('patient-allergies').value = patient.allergies ? patient.allergies.join(', ') : '';
        document.getElementById('patient-conditions').value = patient.conditions || '';

        if (patient.emergencyContact) {
            document.getElementById('emergency-name').value = patient.emergencyContact.name || '';
            document.getElementById('emergency-relation').value = patient.emergencyContact.relationship || '';
            document.getElementById('emergency-phone').value = patient.emergencyContact.phone || '';
        }

        if (patient.avatar) {
            document.getElementById('avatar-preview').innerHTML = `
                <img src="${patient.avatar}" alt="${patient.name}的头像">
            `;
        }
    },

    /**
     * Handle patient form submission
     */
    handlePatientSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('patient-id').value || this.generateId();
        const avatarPreview = document.getElementById('avatar-preview').querySelector('img');
        const allergiesText = document.getElementById('patient-allergies').value.trim();

        const patientData = {
            id,
            name: document.getElementById('patient-name').value.trim(),
            dateOfBirth: document.getElementById('patient-dob').value,
            phone: document.getElementById('patient-phone').value.trim(),
            email: document.getElementById('patient-email').value.trim() || null,
            address: document.getElementById('patient-address').value.trim() || null,
            allergies: allergiesText ? allergiesText.split(',').map(a => a.trim()).filter(a => a) : [],
            conditions: document.getElementById('patient-conditions').value.trim() || null,
            emergencyContact: {
                name: document.getElementById('emergency-name').value.trim() || null,
                relationship: document.getElementById('emergency-relation').value.trim() || null,
                phone: document.getElementById('emergency-phone').value.trim() || null
            },
            avatar: avatarPreview ? avatarPreview.src.replace(/^data:image\/[^;]+;base64,/, '') : null,
            updatedAt: new Date().toISOString()
        };

        const patients = Storage.getPatients();
        const existingIndex = patients.findIndex(p => p.id === id);

        if (existingIndex !== -1) {
            patients[existingIndex] = { ...patients[existingIndex], ...patientData };
            UI.showToast('患者信息已更新', 'success');
        } else {
            patientData.createdAt = new Date().toISOString();
            patients.push(patientData);
            UI.showToast('患者已添加', 'success');
        }

        Storage.savePatients(patients);
        this.renderPatientsList();
        this.closePatientModal();
        this.updateDashboardStats();
    },

    /**
     * Open patient detail modal
     */
    openPatientDetail(patientId) {
        const patient = Storage.getPatients().find(p => p.id === patientId);
        if (!patient) return;

        this.currentPatient = patient;
        this.currentTab = 'info';

        const modal = document.getElementById('patient-detail-modal');
        const title = document.getElementById('patient-detail-title');

        title.textContent = `患者详情 - ${patient.name}`;
        this.renderPatientDetailContent(patient);
        document.querySelectorAll('#patient-detail-modal .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === 'info');
        });

        modal.classList.add('active');
    },

    /**
     * Close patient detail modal
     */
    closePatientDetailModal() {
        document.getElementById('patient-detail-modal').classList.remove('active');
        this.currentPatient = null;
    },

    /**
     * Switch between patient detail tabs
     */
    switchTab(tabName) {
        if (!this.currentPatient) return;

        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('#patient-detail-modal .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        this.renderPatientDetailContent(this.currentPatient);
    },

    /**
     * Render patient detail content based on active tab
     */
    renderPatientDetailContent(patient) {
        const container = document.getElementById('patient-detail-content');

        switch (this.currentTab) {
            case 'info':
                this.renderPatientInfo(patient, container);
                break;
            case 'vitals':
                this.renderPatientVitals(patient, container);
                break;
            case 'medications':
                this.renderPatientMedications(patient, container);
                break;
            case 'history':
                this.renderPatientHistory(patient, container);
                break;
        }
    },

    /**
     * Render patient basic info tab
     */
    renderPatientInfo(patient, container) {
        const age = this.calculateAge(patient.dateOfBirth);

        container.innerHTML = `
            <div class="detail-section">
                <h3>基本信息</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">患者ID</span>
                        <span class="value">${patient.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">姓名</span>
                        <span class="value">${this.escapeHtml(patient.name)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">年龄</span>
                        <span class="value">${age} 岁</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">出生日期</span>
                        <span class="value">${patient.dateOfBirth}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">电话</span>
                        <span class="value">${this.escapeHtml(patient.phone)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">邮箱</span>
                        <span class="value">${this.escapeHtml(patient.email || '未提供')}</span>
                    </div>
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <span class="label">地址</span>
                        <span class="value">${this.escapeHtml(patient.address || '未提供')}</span>
                    </div>
                </div>
            </div>

            ${patient.allergies && patient.allergies.length > 0 ? `
                <div class="detail-section">
                    <h3>过敏史</h3>
                    <div class="allergy-badge" style="font-size: 1rem; padding: 0.5rem 1rem;">
                        ${this.escapeHtml(patient.allergies.join(', '))}
                    </div>
                </div>
            ` : ''}

            ${patient.conditions ? `
                <div class="detail-section">
                    <h3>既往病史</h3>
                    <p>${this.escapeHtml(patient.conditions)}</p>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3>紧急联系人</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">姓名</span>
                        <span class="value">${this.escapeHtml(patient.emergencyContact?.name || '未提供')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">关系</span>
                        <span class="value">${this.escapeHtml(patient.emergencyContact?.relationship || '未提供')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">电话</span>
                        <span class="value">${this.escapeHtml(patient.emergencyContact?.phone || '未提供')}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <p style="color: var(--text-muted); font-size: 0.875rem;">
                    创建于: ${new Date(patient.createdAt).toLocaleString('zh-CN')}
                    ${patient.updatedAt && patient.updatedAt !== patient.createdAt ?
                    `<br>更新于: ${new Date(patient.updatedAt).toLocaleString('zh-CN')}` : ''}
                </p>
            </div>
        `;
    },

    /**
     * Render patient vital signs tab
     */
    renderPatientVitals(patient, container) {
        const allVitals = Storage.getVitals().filter(v => v.patientId === patient.id);

        if (allVitals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>暂无生命体征记录</p>
                    <button id="add-vitals-btn" class="primary-btn" data-patient-id="${patient.id}">
                        + 添加记录
                    </button>
                </div>
            `;
            return;
        }

        const sortedVitals = [...allVitals].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>生命体征记录</h3>
                <button id="add-vitals-btn" class="primary-btn small" data-patient-id="${patient.id}">
                    + 添加记录
                </button>
            </div>

            <div class="chart-container" id="vitals-chart-container">
                <canvas id="bp-chart"></canvas>
            </div>

            <div style="margin-top: 2rem;">
                <h4>详细记录</h4>
                <table class="vitals-table">
                    <thead>
                        <tr>
                            <th>日期时间</th>
                            <th>血压</th>
                            <th>心率</th>
                            <th>体温</th>
                            <th>血糖</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedVitals.map(v => `
                            <tr>
                                <td>${new Date(v.date).toLocaleString('zh-CN')}</td>
                                <td>${v.bloodPressure ? `${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}` : '-'}</td>
                                <td>${v.heartRate || '-'}</td>
                                <td>${v.temperature || '-'}</td>
                                <td>${v.bloodSugar || '-'}</td>
                                <td class="action-cell">
                                    <button class="danger-btn small delete-vitals" data-id="${v.id}" aria-label="删除记录">
                                        删除
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Create BP chart
        setTimeout(() => {
            Charts.createBloodPressureChart('bp-chart', allVitals, patient.name);
        }, 100);
    },

    /**
     * Render patient medications tab
     */
    renderPatientMedications(patient, container) {
        const medications = Notifications.getPatientReminders(patient.id);

        if (medications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💊</div>
                    <p>暂无用药提醒</p>
                    <button id="add-medication-btn" class="primary-btn" data-patient-id="${patient.id}">
                        + 添加提醒
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>用药提醒</h3>
                <button id="add-medication-btn" class="primary-btn small" data-patient-id="${patient.id}">
                    + 添加提醒
                </button>
            </div>

            <div>
                ${medications.map(med => `
                    <div class="medication-item">
                        <h4>${this.escapeHtml(med.medicationName)} - ${this.escapeHtml(med.dosage)}</h4>
                        <div class="medication-details">
                            <span>频率: ${this.getFrequencyLabel(med.frequency)}</span>
                        </div>
                        <div class="medication-times">
                            ${med.times.map(time => `
                                <span class="time-badge">${Notifications.formatTime(time)}</span>
                            `).join('')}
                        </div>
                        ${med.notes ? `<p style="margin-top: 0.5rem; font-size: 0.875rem;">备注: ${this.escapeHtml(med.notes)}</p>` : ''}
                        <div style="margin-top: 0.5rem;">
                            <button class="danger-btn small delete-medication" data-id="${med.id}">
                                删除提醒
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render patient appointment history tab
     */
    renderPatientHistory(patient, container) {
        const appointments = Storage.getAppointments()
            .filter(a => a.patientId === patient.id)
            .sort((a, b) => new Date(b.start) - new Date(a.start));

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>暂无预约历史</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h3>预约历史</h3>
            <table class="vitals-table">
                <thead>
                    <tr>
                        <th>日期时间</th>
                        <th>类型</th>
                        <th>标题</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    ${appointments.map(apt => `
                        <tr>
                            <td>${new Date(apt.start).toLocaleString('zh-CN')}</td>
                            <td>${this.getAppointmentTypeLabel(apt.type)}</td>
                            <td>${this.escapeHtml(apt.title)}</td>
                            <td>${new Date(apt.end) > new Date() ? '即将进行' : '已完成'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Edit current patient from detail modal
     */
    editCurrentPatient() {
        if (!this.currentPatient) return;
        this.closePatientDetailModal();
        this.openPatientModal(this.currentPatient.id);
    },

    /**
     * Delete current patient
     */
    deleteCurrentPatient() {
        if (!this.currentPatient) return;

        UI.showConfirm(
            `确定要删除患者"${this.currentPatient.name}"吗？此操作不可撤销。`,
            () => {
                const patients = Storage.getPatients().filter(p => p.id !== this.currentPatient.id);
                Storage.savePatients(patients);

                // Also delete related vitals and medications
                const vitals = Storage.getVitals().filter(v => v.patientId !== this.currentPatient.id);
                Storage.saveVitals(vitals);

                const medications = Storage.getMedications().filter(m => m.patientId !== this.currentPatient.id);
                Storage.saveMedications(medications);

                this.closePatientDetailModal();
                this.renderPatientsList();
                this.updateDashboardStats();
                UI.showToast('患者已删除', 'success');
            }
        );
    },

    /**
     * Handle patient search
     */
    handleSearch(query) {
        query = query.toLowerCase().trim();

        if (!query) {
            this.renderPatientsList();
            return;
        }

        // Add to search history
        if (query && !this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            if (this.searchHistory.length > 10) this.searchHistory.pop();
        }

        const patients = Storage.getPatients().filter(p => {
            return p.name.toLowerCase().includes(query) ||
                   p.id.toLowerCase().includes(query) ||
                   p.phone.includes(query);
        });

        this.renderPatientsList(patients);
    },

    /**
     * Toggle advanced search panel
     */
    toggleAdvancedSearch() {
        const panel = document.getElementById('advanced-search-panel');
        const toggle = document.getElementById('advanced-search-toggle');
        const isExpanded = panel.classList.toggle('hidden');

        toggle.setAttribute('aria-expanded', !isExpanded);
    },

    /**
     * Apply advanced filters
     */
    applyFilters() {
        const ageMin = parseInt(document.getElementById('age-min').value) || 0;
        const ageMax = parseInt(document.getElementById('age-max').value) || 150;
        const allergyFilter = document.getElementById('allergy-filter').value.toLowerCase().trim();
        const medicationFilter = document.getElementById('medication-filter').value;

        const patients = Storage.getPatients().filter(p => {
            const age = this.calculateAge(p.dateOfBirth);

            // Age range filter
            if (age < ageMin || age > ageMax) return false;

            // Allergy filter
            if (allergyFilter && (!p.allergies || !p.allergies.some(a => a.toLowerCase().includes(allergyFilter)))) {
                return false;
            }

            // Medication filter
            if (medicationFilter === 'active') {
                const hasMeds = Notifications.getPatientReminders(p.id).length > 0;
                if (!hasMeds) return false;
            } else if (medicationFilter === 'inactive') {
                const hasMeds = Notifications.getPatientReminders(p.id).length > 0;
                if (hasMeds) return false;
            }

            return true;
        });

        this.renderPatientsList(patients);
        UI.showToast(`找到 ${patients.length} 位患者`, 'info');
    },

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('age-min').value = '';
        document.getElementById('age-max').value = '';
        document.getElementById('allergy-filter').value = '';
        document.getElementById('medication-filter').value = '';

        this.renderPatientsList();
    },

    /**
     * Handle avatar upload
     */
    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            UI.showToast('图片大小不能超过 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            document.getElementById('avatar-preview').innerHTML = `
                <img src="${base64}" alt="预览头像">
            `;
        };
        reader.onerror = () => {
            UI.showToast('图片加载失败', 'error');
        };
        reader.readAsDataURL(file);
    },

    /**
     * Open vitals modal
     */
    openVitalsModal(patientId) {
        const modal = document.getElementById('vitals-modal');
        const form = document.getElementById('vitals-form');

        form.reset();
        document.getElementById('vitals-patient-id').value = patientId;

        // Set default date to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('vitals-date').value = now.toISOString().slice(0, 16);

        modal.classList.add('active');
        document.getElementById('vitals-systolic').focus();
    },

    /**
     * Handle vitals form submission
     */
    handleVitalsSubmit(e) {
        e.preventDefault();

        const patientId = document.getElementById('vitals-patient-id').value;
        const systolic = parseInt(document.getElementById('vitals-systolic').value) || null;
        const diastolic = parseInt(document.getElementById('vitals-diastolic').value) || null;

        const vitalData = {
            id: 'V' + Date.now(),
            patientId,
            date: document.getElementById('vitals-date').value,
            bloodPressure: (systolic || diastolic) ? {
                systolic,
                diastolic
            } : null,
            heartRate: parseInt(document.getElementById('vitals-heartrate').value) || null,
            temperature: parseFloat(document.getElementById('vitals-temp').value) || null,
            bloodSugar: parseFloat(document.getElementById('vitals-sugar').value) || null,
            notes: document.getElementById('vitals-notes').value.trim() || null
        };

        const vitals = Storage.getVitals();
        vitals.push(vitalData);
        Storage.saveVitals(vitals);

        document.getElementById('vitals-modal').classList.remove('active');

        // If patient detail is open, refresh it
        if (this.currentPatient && this.currentPatient.id === patientId && this.currentTab === 'vitals') {
            this.renderPatientVitals(this.currentPatient, document.getElementById('patient-detail-content'));
        }

        UI.showToast('生命体征记录已添加', 'success');
    },

    /**
     * Delete vitals record
     */
    deleteVitals(vitalsId) {
        UI.showConfirm(
            '确定要删除这条生命体征记录吗？',
            () => {
                const vitals = Storage.getVitals().filter(v => v.id !== vitalsId);
                Storage.saveVitals(vitals);

                if (this.currentPatient) {
                    this.renderPatientVitals(this.currentPatient, document.getElementById('patient-detail-content'));
                }

                UI.showToast('记录已删除', 'success');
            }
        );
    },

    /**
     * Open medication modal
     */
    openMedicationModal(patientId) {
        const modal = document.getElementById('medication-modal');
        const form = document.getElementById('medication-form');
        const container = document.getElementById('medication-times-container');

        form.reset();
        document.getElementById('medication-patient-id').value = patientId;

        // Reset time inputs to just one
        container.innerHTML = `
            <input type="time" class="medication-time" required aria-required="true">
        `;

        modal.classList.add('active');
        document.getElementById('medication-name').focus();
    },

    /**
     * Add another time field to medication form
     */
    addMedicationTimeField() {
        const container = document.getElementById('medication-times-container');
        const count = container.querySelectorAll('.medication-time').length;

        if (count >= 6) {
            UI.showToast('最多只能添加 6 个服药时间', 'warning');
            return;
        }

        const input = document.createElement('input');
        input.type = 'time';
        input.className = 'medication-time';
        input.required = true;
        input.setAttribute('aria-required', 'true');
        container.appendChild(input);
        input.focus();
    },

    /**
     * Handle medication form submission
     */
    handleMedicationSubmit(e) {
        e.preventDefault();

        const patientId = document.getElementById('medication-patient-id').value;
        const times = Array.from(document.querySelectorAll('.medication-time'))
            .map(input => input.value)
            .filter(time => time)
            .sort();

        const medicationData = {
            patientId,
            medicationName: document.getElementById('medication-name').value,
            dosage: document.getElementById('medication-dosage').value,
            frequency: document.getElementById('medication-frequency').value,
            times,
            notes: document.getElementById('medication-notes').value.trim() || null
        };

        Notifications.createReminder(medicationData);

        document.getElementById('medication-modal').classList.remove('active');

        // If patient detail is open, refresh it
        if (this.currentPatient && this.currentPatient.id === patientId && this.currentTab === 'medications') {
            this.renderPatientMedications(this.currentPatient, document.getElementById('patient-detail-content'));
        }

        this.updateDashboardStats();
        UI.showToast('用药提醒已设置', 'success');
    },

    /**
     * Delete medication reminder
     */
    deleteMedication(medicationId) {
        UI.showConfirm(
            '确定要删除这个用药提醒吗？',
            () => {
                const patientId = Notifications.getPatientReminders(this.currentPatient?.id)
                    .find(m => m.id === medicationId)?.patientId;

                Notifications.deleteReminder(medicationId);

                if (this.currentPatient) {
                    this.renderPatientMedications(this.currentPatient, document.getElementById('patient-detail-content'));
                }

                this.updateDashboardStats();
                UI.showToast('提醒已删除', 'success');
            }
        );
    },

    /**
     * Get patient vitals count
     */
    getPatientVitalsCount(patientId) {
        return Storage.getVitals().filter(v => v.patientId === patientId).length;
    },

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const patients = Storage.getPatients();
        const appointments = Storage.getAppointments();
        const medications = Storage.getMedications();

        const today = new Date().toDateString();
        const todayApps = appointments.filter(a =>
            new Date(a.start).toDateString() === today
        ).length;

        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekApps = appointments.filter(a => {
            const date = new Date(a.start);
            return date >= new Date() && date <= weekEnd;
        }).length;

        document.getElementById('total-patients').textContent = patients.length;
        document.getElementById('today-appointments').textContent = todayApps;
        document.getElementById('pending-reminders').textContent = medications.length;
        document.getElementById('week-appointments').textContent = weekApps;
    },

    /**
     * Helper: Calculate age from date of birth
     */
    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },

    /**
     * Helper: Generate unique ID
     */
    generateId() {
        return 'P' + Date.now().toString().slice(-8);
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
     * Helper: Get frequency label
     */
    getFrequencyLabel(freq) {
        const labels = {
            daily: '每日一次',
            bid: '每日两次',
            tid: '每日三次',
            qid: '每日四次',
            prn: '按需服用',
            custom: '自定义'
        };
        return labels[freq] || freq;
    },

    /**
     * Helper: Get appointment type label
     */
    getAppointmentTypeLabel(type) {
        const labels = {
            checkup: '常规检查',
            followup: '复查',
            emergency: '急诊',
            consultation: '咨询'
        };
        return labels[type] || type;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Patients.init();
});
