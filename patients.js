/**
 * 患者管理模块
 * 负责患者数据的 CRUD 操作和显示
 */

// 示例患者数据
const samplePatients = [
    {
        id: '1',
        name: '张伟',
        age: 45,
        gender: 'male',
        phone: '138-0000-1111',
        email: 'zhangwei@example.com',
        address: '北京市朝阳区建国路88号',
        diagnosis: '高血压',
        allergies: '青霉素',
        notes: '需要定期监测血压',
        vitalSigns: {
            bloodPressure: [
                { date: '2025-01-15', systolic: 140, diastolic: 90 },
                { date: '2025-02-01', systolic: 135, diastolic: 85 },
                { date: '2025-02-15', systolic: 130, diastolic: 82 },
                { date: '2025-03-01', systolic: 128, diastolic: 80 },
            ],
            heartRate: [
                { date: '2025-01-15', value: 78 },
                { date: '2025-02-01', value: 75 },
                { date: '2025-02-15', value: 72 },
                { date: '2025-03-01', value: 70 },
            ]
        },
        createdAt: new Date('2025-01-01').toISOString()
    },
    {
        id: '2',
        name: '李娜',
        age: 32,
        gender: 'female',
        phone: '138-0000-2222',
        email: 'lina@example.com',
        address: '上海市浦东新区世纪大道100号',
        diagnosis: '糖尿病',
        allergies: '无',
        notes: '需要控制饮食',
        vitalSigns: {
            bloodPressure: [
                { date: '2025-01-10', systolic: 125, diastolic: 82 },
                { date: '2025-02-01', systolic: 122, diastolic: 80 },
                { date: '2025-02-20', systolic: 120, diastolic: 78 },
            ],
            heartRate: [
                { date: '2025-01-10', value: 72 },
                { date: '2025-02-01', value: 70 },
                { date: '2025-02-20', value: 68 },
            ]
        },
        createdAt: new Date('2025-02-01').toISOString()
    },
    {
        id: '3',
        name: '王明',
        age: 58,
        gender: 'male',
        phone: '138-0000-3333',
        email: 'wangming@example.com',
        address: '广州市天河区珠江新城',
        diagnosis: '心脏病',
        allergies: '阿司匹林',
        notes: '术后恢复中',
        vitalSigns: {
            bloodPressure: [
                { date: '2025-01-20', systolic: 150, diastolic: 95 },
                { date: '2025-02-05', systolic: 145, diastolic: 92 },
                { date: '2025-02-25', systolic: 140, diastolic: 88 },
                { date: '2025-03-05', systolic: 135, diastolic: 85 },
            ],
            heartRate: [
                { date: '2025-01-20', value: 85 },
                { date: '2025-02-05', value: 82 },
                { date: '2025-02-25', value: 78 },
                { date: '2025-03-05', value: 75 },
            ]
        },
        createdAt: new Date('2025-01-20').toISOString()
    }
];

// LocalStorage 键
const PATIENTS_STORAGE_KEY = 'medical_patients';

// 获取所有患者
function getPatients() {
    const stored = localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // 如果没有存储的数据，初始化示例数据
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(samplePatients));
    return samplePatients;
}

// 保存患者数据
function savePatients(patients) {
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
}

// 根据 ID 获取患者
function getPatientById(id) {
    const patients = getPatients();
    return patients.find(p => p.id === id);
}

// 添加患者
function addPatient(patientData) {
    const patients = getPatients();
    const newPatient = {
        id: generateId(),
        ...patientData,
        vitalSigns: {
            bloodPressure: [],
            heartRate: []
        },
        createdAt: new Date().toISOString()
    };
    patients.push(newPatient);
    savePatients(patients);
    return newPatient;
}

// 更新患者
function updatePatient(id, patientData) {
    const patients = getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index !== -1) {
        const preservedVitalSigns = patients[index].vitalSigns;
        patients[index] = {
            ...patients[index],
            ...patientData,
            id,
            vitalSigns: patientData.vitalSigns || preservedVitalSigns
        };
        savePatients(patients);
        return patients[index];
    }
    return null;
}

// 删除患者
function deletePatient(id) {
    const patients = getPatients();
    const filtered = patients.filter(p => p.id !== id);
    savePatients(filtered);
    return filtered.length < patients.length;
}

// 渲染患者列表
function renderPatientsList() {
    const patients = getFilteredPatients();
    const container = document.getElementById('patients-list');

    if (patients.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>暂无患者记录</p>
                <p style="font-size: 14px;">点击"添加患者"按钮创建新的患者档案</p>
            </div>
        `;
        return;
    }

    container.innerHTML = patients.map(patient => `
        <div class="patient-card" tabindex="0" data-patient-id="${patient.id}"
             onkeydown="if(event.key==='Enter') viewPatientDetails('${patient.id}')">
            <div class="patient-card-header">
                <h3 class="patient-name">${escapeHtml(patient.name)}</h3>
                <span style="font-size: 12px; color: var(--text-muted);">
                    ID: ${patient.id.substring(0, 8)}
                </span>
            </div>
            <div class="patient-info">
                <div class="patient-info-item">
                    <i class="fas fa-user"></i>
                    <span>${patient.age}岁 · ${patient.gender === 'male' ? '男' : '女'}</span>
                </div>
                ${patient.phone ? `
                <div class="patient-info-item">
                    <i class="fas fa-phone"></i>
                    <span>${escapeHtml(patient.phone)}</span>
                </div>
                ` : ''}
                ${patient.diagnosis ? `
                <div class="patient-info-item">
                    <i class="fas fa-diagnoses"></i>
                    <span>${escapeHtml(patient.diagnosis)}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // 添加点击事件
    container.querySelectorAll('.patient-card').forEach(card => {
        card.addEventListener('click', () => {
            const patientId = card.dataset.patientId;
            viewPatientDetails(patientId);
        });
    });
}

// 查看患者详情
function viewPatientDetails(id) {
    const patient = getPatientById(id);
    if (!patient) {
        showToast('患者不存在', 'error');
        return;
    }

    const modal = document.getElementById('patient-modal');
    const detailsContainer = document.getElementById('patient-details');

    detailsContainer.innerHTML = `
        <div class="patient-detail-section">
            <h3>基本信息</h3>
            <div class="patient-detail-grid">
                <div class="patient-detail-item">
                    <span class="patient-detail-label">姓名</span>
                    <span class="patient-detail-value">${escapeHtml(patient.name)}</span>
                </div>
                <div class="patient-detail-item">
                    <span class="patient-detail-label">年龄</span>
                    <span class="patient-detail-value">${patient.age}岁</span>
                </div>
                <div class="patient-detail-item">
                    <span class="patient-detail-label">性别</span>
                    <span class="patient-detail-value">${patient.gender === 'male' ? '男' : '女'}</span>
                </div>
                <div class="patient-detail-item">
                    <span class="patient-detail-label">电话</span>
                    <span class="patient-detail-value">${escapeHtml(patient.phone || '未填写')}</span>
                </div>
                <div class="patient-detail-item">
                    <span class="patient-detail-label">邮箱</span>
                    <span class="patient-detail-value">${escapeHtml(patient.email || '未填写')}</span>
                </div>
                <div class="patient-detail-item">
                    <span class="patient-detail-label">地址</span>
                    <span class="patient-detail-value">${escapeHtml(patient.address || '未填写')}</span>
                </div>
            </div>
        </div>

        <div class="patient-detail-section">
            <h3>医疗信息</h3>
            <div class="patient-detail-grid">
                <div class="patient-detail-item">
                    <span class="patient-detail-label">诊断</span>
                    <span class="patient-detail-value">${escapeHtml(patient.diagnosis || '未填写')}</span>
                </div>
                <div class="patient-detail-item">
                    <span class="patient-detail-label">过敏史</span>
                    <span class="patient-detail-value">${escapeHtml(patient.allergies || '无')}</span>
                </div>
            </div>
        </div>

        <div class="patient-detail-section">
            <h3>备注</h3>
            <p style="color: var(--text-secondary); line-height: 1.6;">
                ${escapeHtml(patient.notes || '无备注')}
            </p>
        </div>

        ${patient.vitalSigns && patient.vitalSigns.bloodPressure && patient.vitalSigns.bloodPressure.length > 0 ? `
        <div class="patient-detail-section">
            <h3>血压趋势</h3>
            <div class="chart-container">
                <canvas id="bp-chart"></canvas>
            </div>
        </div>
        ` : ''}

        <div style="display: flex; gap: 12px; margin-top: 30px;">
            <button type="button" class="btn btn-primary" onclick="editPatient('${patient.id}')">
                <i class="fas fa-edit"></i> 编辑
            </button>
            <button type="button" class="btn btn-danger" onclick="confirmDeletePatient('${patient.id}')">
                <i class="fas fa-trash"></i> 删除
            </button>
        </div>
    `;

    openModal('patient-modal');

    // 如果有数据，渲染血压图表
    if (patient.vitalSigns && patient.vitalSigns.bloodPressure && patient.vitalSigns.bloodPressure.length > 0) {
        setTimeout(() => {
            renderVitalSignsChart(patient);
        }, 100);
    }
}

// 编辑患者
function editPatient(id) {
    const patient = getPatientById(id);
    if (!patient) return;

    // 关闭详情模态框
    closeModal('patient-modal');

    // 填充表单
    document.getElementById('patient-form-title').textContent = '编辑患者';
    document.getElementById('patient-id').value = patient.id;
    document.getElementById('patient-name').value = patient.name;
    document.getElementById('patient-age').value = patient.age;
    document.getElementById('patient-gender').value = patient.gender;
    document.getElementById('patient-phone').value = patient.phone || '';
    document.getElementById('patient-email').value = patient.email || '';
    document.getElementById('patient-address').value = patient.address || '';
    document.getElementById('patient-diagnosis').value = patient.diagnosis || '';
    document.getElementById('patient-allergies').value = patient.allergies || '';
    document.getElementById('patient-notes').value = patient.notes || '';

    openModal('patient-form-modal');
}

// 确认删除患者
function confirmDeletePatient(id) {
    if (confirm('确定要删除这位患者的记录吗？此操作不可撤销。')) {
        const success = deletePatient(id);
        if (success) {
            showToast('患者已删除', 'success');
            closeModal('patient-modal');
            renderPatientsList();
            updateDashboard();
        } else {
            showToast('删除失败', 'error');
        }
    }
}

// 获取筛选后的患者
function getFilteredPatients() {
    let patients = getPatients();

    // 搜索过滤
    const searchTerm = document.getElementById('patient-search').value.toLowerCase();
    if (searchTerm) {
        patients = patients.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.id.includes(searchTerm) ||
            (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm))
        );
    }

    // 年龄过滤
    const ageFilter = document.getElementById('filter-age').value;
    if (ageFilter) {
        patients = patients.filter(p => {
            const age = p.age;
            if (ageFilter === '0-18') return age <= 18;
            if (ageFilter === '19-40') return age >= 19 && age <= 40;
            if (ageFilter === '41-60') return age >= 41 && age <= 60;
            if (ageFilter === '60+') return age > 60;
            return true;
        });
    }

    // 性别过滤
    const genderFilter = document.getElementById('filter-gender').value;
    if (genderFilter) {
        patients = patients.filter(p => p.gender === genderFilter);
    }

    // 诊断过滤
    const diagnosisFilter = document.getElementById('filter-diagnosis').value;
    if (diagnosisFilter) {
        patients = patients.filter(p =>
            p.diagnosis && p.diagnosis.includes(diagnosisFilter)
        );
    }

    return patients;
}

// 清除筛选
function clearFilters() {
    document.getElementById('patient-search').value = '';
    document.getElementById('filter-age').value = '';
    document.getElementById('filter-gender').value = '';
    document.getElementById('filter-diagnosis').value = '';
    renderPatientsList();
}

// 患者表单提交
document.getElementById('add-patient-btn').addEventListener('click', () => {
    document.getElementById('patient-form-title').textContent = '添加患者';
    document.getElementById('patient-form').reset();
    document.getElementById('patient-id').value = '';
    openModal('patient-form-modal');
});

document.getElementById('patient-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('patient-name').value,
        age: parseInt(document.getElementById('patient-age').value),
        gender: document.getElementById('patient-gender').value,
        phone: document.getElementById('patient-phone').value,
        email: document.getElementById('patient-email').value,
        address: document.getElementById('patient-address').value,
        diagnosis: document.getElementById('patient-diagnosis').value,
        allergies: document.getElementById('patient-allergies').value,
        notes: document.getElementById('patient-notes').value
    };

    const id = document.getElementById('patient-id').value;

    if (id) {
        // 编辑模式
        updatePatient(id, formData);
        showToast('患者信息已更新', 'success');
    } else {
        // 添加模式
        addPatient(formData);
        showToast('患者已添加', 'success');
    }

    closeModal('patient-form-modal');
    renderPatientsList();
    updateDashboard();
});

// 搜索和筛选事件监听
document.getElementById('patient-search').addEventListener('input', renderPatientsList);
document.getElementById('filter-age').addEventListener('change', renderPatientsList);
document.getElementById('filter-gender').addEventListener('change', renderPatientsList);
document.getElementById('filter-diagnosis').addEventListener('change', renderPatientsList);
document.getElementById('clear-filters').addEventListener('click', clearFilters);

// 初始化
function initPatientsModule() {
    const patients = getPatients();
    if (patients.length === 0) {
        savePatients(samplePatients);
    }
}

// 到达 DOM 加载后初始化
initPatientsModule();
