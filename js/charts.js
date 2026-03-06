/**
 * Charts Module
 * Handles Chart.js visualizations for vital signs and medical data
 */

const Charts = {
    charts: {},

    /**
     * Initialize chart defaults
     */
    init() {
        // Set default chart options
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        Chart.defaults.color = '#64748b';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
    },

    /**
     * Create blood pressure chart
     */
    createBloodPressureChart(canvasId, vitals, patientName = '') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        // Destroy existing chart if present
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Sort vitals by date
        const sortedVitals = [...vitals].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        ).slice(-14); // Last 14 entries

        const labels = sortedVitals.map(v => {
            const date = new Date(v.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const systolicData = sortedVitals.map(v => v.bloodPressure?.systolic || null);
        const diastolicData = sortedVitals.map(v => v.bloodPressure?.diastolic || null);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '收缩压 (高)',
                        data: systolicData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: '舒张压 (低)',
                        data: diastolicData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `血压趋势 - ${patientName}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} mmHg`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 40,
                        max: 180,
                        title: {
                            display: true,
                            text: '血压 (mmHg)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Create heart rate chart
     */
    createHeartRateChart(canvasId, vitals, patientName = '') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const sortedVitals = [...vitals].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        ).slice(-14);

        const labels = sortedVitals.map(v => {
            const date = new Date(v.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const heartRateData = sortedVitals.map(v => v.heartRate || null);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '心率',
                    data: heartRateData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `心率趋势 - ${patientName}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `心率: ${context.parsed.y} bpm`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 40,
                        max: 140,
                        title: {
                            display: true,
                            text: '心率 (bpm)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Create temperature chart
     */
    createTemperatureChart(canvasId, vitals, patientName = '') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const sortedVitals = [...vitals].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        ).slice(-14);

        const labels = sortedVitals.map(v => {
            const date = new Date(v.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const tempData = sortedVitals.map(v => v.temperature || null);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '体温',
                    data: tempData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `体温趋势 - ${patientName}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `体温: ${context.parsed.y} °C`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            normal: {
                                type: 'line',
                                yMin: 36.5,
                                yMax: 36.5,
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    display: true,
                                    content: '正常体温',
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 35,
                        max: 42,
                        title: {
                            display: true,
                            text: '体温 (°C)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Create blood sugar chart
     */
    createBloodSugarChart(canvasId, vitals, patientName = '') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const sortedVitals = [...vitals].filter(v => v.bloodSugar).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        ).slice(-14);

        const labels = sortedVitals.map(v => {
            const date = new Date(v.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const sugarData = sortedVitals.map(v => v.bloodSugar);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '血糖',
                    data: sugarData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `血糖趋势 - ${patientName}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `血糖: ${context.parsed.y} mmol/L`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 2,
                        max: 15,
                        title: {
                            display: true,
                            text: '血糖 (mmol/L)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Create comparison chart for multiple patients
     */
    createComparisonChart(canvasId, data, type = 'bloodPressure') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Data structure: { patientName: [vitals], ... }
        const colors = [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];

        const datasets = Object.entries(data).map(([patientName, vitals], index) => {
            const sortedVitals = [...vitals].sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            ).slice(-7);

            let chartData;
            let label;

            if (type === 'bloodPressure') {
                chartData = sortedVitals.map(v => v.bloodPressure?.systolic || null);
                label = `${patientName} (收缩压)`;
            } else if (type === 'heartRate') {
                chartData = sortedVitals.map(v => v.heartRate || null);
                label = `${patientName} (心率)`;
            } else if (type === 'bloodSugar') {
                chartData = sortedVitals.filter(v => v.bloodSugar).slice(-7).map(v => v.bloodSugar);
                label = `${patientName} (血糖)`;
            }

            return {
                label,
                data: chartData,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.3,
                pointRadius: 3
            };
        });

        // Get labels from first dataset
        const firstPatient = Object.values(data)[0];
        const labels = [...firstPatient]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-7)
            .map(v => {
                const date = new Date(v.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            });

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: '患者对比',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: type === 'bloodPressure' ? '血压 (mmHg)' :
                                  type === 'heartRate' ? '心率 (bpm)' :
                                  '血糖 (mmol/L)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chart;
        return chart;
    },

    /**
     * Destroy a specific chart
     */
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    },

    /**
     * Destroy all charts
     */
    destroyAll() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    },

    /**
     * Get vital signs statistics
     */
    getVitalStatistics(vitals, type) {
        const validData = vitals
            .map(v => type === 'bloodPressure' ? v.bloodPressure?.systolic : v[type])
            .filter(v => v !== null && v !== undefined);

        if (validData.length === 0) {
            return { avg: null, min: null, max: null };
        }

        return {
            avg: (validData.reduce((a, b) => a + b, 0) / validData.length).toFixed(1),
            min: Math.min(...validData),
            max: Math.max(...validData),
            count: validData.length
        };
    },

    /**
     * Export chart as image
     */
    exportChart(canvasId, filename = 'chart.png') {
        const chart = this.charts[canvasId];
        if (!chart) return false;

        const link = document.createElement('a');
        link.download = filename;
        link.href = chart.toBase64Image();
        link.click();

        return true;
    },

    /**
     * Update chart with new data
     */
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) return false;

        chart.data = newData;
        chart.update();

        return true;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Charts.init();
});
