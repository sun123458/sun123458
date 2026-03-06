/**
 * 图表模块
 * 使用 Chart.js 显示生命体征图表
 */

// 存储图表实例以便销毁和重新创建
const chartInstances = {};

// 渲染患者生命体征图表
function renderVitalSignsChart(patient) {
    const canvas = document.getElementById('bp-chart');
    if (!canvas) return;

    // 如果已存在图表实例，先销毁
    if (chartInstances['bp-chart']) {
        chartInstances['bp-chart'].destroy();
    }

    const vitalSigns = patient.vitalSigns;
    const isHighContrast = document.body.classList.contains('high-contrast');

    const ctx = canvas.getContext('2d');

    // 获取当前 CSS 变量值
    const styles = getComputedStyle(document.body);
    const primaryColor = isHighContrast ? '#0000FF' : styles.getPropertyValue('--primary-color').trim();
    const successColor = isHighContrast ? '#008000' : styles.getPropertyValue('--success-color').trim();
    const textColor = isHighContrast ? '#000000' : styles.getPropertyValue('--text-primary').trim();
    const gridColor = isHighContrast ? '#000000' : styles.getPropertyValue('--border-color').trim();

    // 准备数据和标签
    const labels = vitalSigns.bloodPressure.map(bp => bp.date);
    const systolicData = vitalSigns.bloodPressure.map(bp => bp.systolic);
    const diastolicData = vitalSigns.bloodPressure.map(bp => bp.diastolic);

    // 创建图表
    chartInstances['bp-chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '收缩压',
                    data: systolicData,
                    borderColor: primaryColor,
                    backgroundColor: primaryColor + '20',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: '舒张压',
                    data: diastolicData,
                    borderColor: successColor,
                    backgroundColor: successColor + '20',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: successColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        },
                        color: textColor,
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: isHighContrast ? '#000000' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: isHighContrast ? '#ffffff' : '#ffffff',
                    bodyColor: isHighContrast ? '#ffffff' : '#ffffff',
                    borderColor: isHighContrast ? '#ffffff' : 'transparent',
                    borderWidth: isHighContrast ? 2 : 0,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' mmHg';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日期',
                        color: textColor,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: true
                    }
                },
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 180,
                    title: {
                        display: true,
                        text: '血压 (mmHg)',
                        color: textColor,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 12
                        },
                        stepSize: 20
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: true
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// 渲染心率图表
function renderHeartRateChart(patient) {
    const canvas = document.getElementById('hr-chart');
    if (!canvas) return;

    if (chartInstances['hr-chart']) {
        chartInstances['hr-chart'].destroy();
    }

    const vitalSigns = patient.vitalSigns;
    const isHighContrast = document.body.classList.contains('high-contrast');

    const ctx = canvas.getContext('2d');

    // 获取当前 CSS 变量值
    const styles = getComputedStyle(document.body);
    const warningColor = isHighContrast ? '#FF0000' : styles.getPropertyValue('--warning-color').trim();
    const textColor = isHighContrast ? '#000000' : styles.getPropertyValue('--text-primary').trim();
    const gridColor = isHighContrast ? '#000000' : styles.getPropertyValue('--border-color').trim();

    const labels = vitalSigns.heartRate.map(hr => hr.date);
    const heartRateData = vitalSigns.heartRate.map(hr => hr.value);

    chartInstances['hr-chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '心率',
                data: heartRateData,
                borderColor: warningColor,
                backgroundColor: warningColor + '20',
                borderWidth: 2,
                pointRadius: 5,
                pointBackgroundColor: warningColor,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        },
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: isHighContrast ? '#000000' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: isHighContrast ? '#ffffff' : 'transparent',
                    borderWidth: isHighContrast ? 2 : 0,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' bpm';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日期',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    beginAtZero: false,
                    min: 40,
                    max: 120,
                    title: {
                        display: true,
                        text: '心率 (bpm)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor,
                        stepSize: 10
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// 创建仪表板概览图表
function createDashboardChart() {
    const canvas = document.getElementById('dashboard-chart');
    if (!canvas) return;

    if (chartInstances['dashboard-chart']) {
        chartInstances['dashboard-chart'].destroy();
    }

    const patients = getPatients();
    const diagnoses = {};

    // 统计诊断分布
    patients.forEach(patient => {
        if (patient.diagnosis) {
            diagnoses[patient.diagnosis] = (diagnoses[patient.diagnosis] || 0) + 1;
        }
    });

    const ctx = canvas.getContext('2d');
    const isHighContrast = document.body.classList.contains('high-contrast');
    const styles = getComputedStyle(document.body);

    const colors = [
        isHighContrast ? '#0000FF' : styles.getPropertyValue('--primary-color').trim(),
        isHighContrast ? '#008000' : styles.getPropertyValue('--success-color').trim(),
        isHighContrast ? '#FF0000' : styles.getPropertyValue('--danger-color').trim(),
        isHighContrast ? '#FF8C00' : styles.getPropertyValue('--warning-color').trim(),
        isHighContrast ? '#800080' : styles.getPropertyValue('--info-color').trim()
    ];

    chartInstances['dashboard-chart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(diagnoses),
            datasets: [{
                data: Object.values(diagnoses),
                backgroundColor: colors.slice(0, Object.keys(diagnoses).length),
                borderWidth: isHighContrast ? 2 : 0,
                borderColor: isHighContrast ? '#000000' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        font: {
                            size: 14
                        },
                        color: isHighContrast ? '#000000' : styles.getPropertyValue('--text-primary').trim(),
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: isHighContrast ? '#000000' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: isHighContrast ? '#ffffff' : 'transparent',
                    borderWidth: isHighContrast ? 2 : 0
                }
            }
        }
    });
}

// 更新所有图表（当切换高对比度模式时）
function updateAllCharts() {
    // 重新渲染当前显示的图表
    const activeModal = document.querySelector('.modal.active');
    if (activeModal && activeModal.id === 'patient-modal') {
        const bpChartCanvas = document.getElementById('bp-chart');
        if (bpChartCanvas) {
            // 需要重新获取患者数据
            const patientId = activeModal.querySelector('[onclick^="editPatient"]')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (patientId) {
                const patient = getPatientById(patientId);
                if (patient) {
                    renderVitalSignsChart(patient);
                }
            }
        }
    }
}

// 高对比度模式切换时更新图表
document.addEventListener('highContrastToggled', () => {
    updateAllCharts();
});
