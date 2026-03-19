// Charts module for FitTrack Pro

let weightChart = null;
let volumeChart = null;
let caloriesChart = null;

const chartColors = {
  primary: '#00ff88',
  secondary: '#00ccff',
  tertiary: '#ff6b35',
  purple: '#8a2be2',
  pink: '#ffb6c1',
  gold: '#ffd700',
  grid: '#333333',
  text: '#888888'
};

function initCharts() {
  Chart.defaults.color = chartColors.text;
  Chart.defaults.borderColor = chartColors.grid;
  Chart.defaults.font.family = "'Inter', sans-serif";
}

function renderWeightChart(canvasId, weightEntries, targetWeight) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (weightChart) {
    weightChart.destroy();
  }

  const sortedEntries = [...weightEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sortedEntries.map(e => formatDate(e.date));
  const data = sortedEntries.map(e => e.weight);

  const targetData = sortedEntries.map(() => targetWeight);

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '体重 (kg)',
          data,
          borderColor: chartColors.secondary,
          backgroundColor: 'rgba(0, 204, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: chartColors.secondary
        },
        {
          label: '目标',
          data: targetData,
          borderColor: chartColors.primary,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 12,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleColor: '#ffffff',
          bodyColor: '#888888',
          borderColor: '#333333',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y} kg`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: chartColors.grid
          },
          ticks: {
            callback: (value) => `${value} kg`
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

function renderVolumeChart(canvasId, workouts, timeRange) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (volumeChart) {
    volumeChart.destroy();
  }

  const { labels, data, colors } = aggregateWorkoutsByType(workouts, timeRange);

  volumeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '锻炼时长 (分钟)',
        data,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleColor: '#ffffff',
          bodyColor: '#888888',
          borderColor: '#333333',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => `${context.parsed.y} 分钟`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: chartColors.grid
          },
          ticks: {
            callback: (value) => `${value} 分钟`
          }
        }
      }
    }
  });
}

function renderWeeklyTrendChart(canvasId, workouts) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const days = [];
  const durations = [];
  const calories = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push(formatDayShort(dateStr));

    const dayWorkouts = workouts.filter(w => w.date.startsWith(dateStr));
    durations.push(dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0));
    calories.push(dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0));
  }

  if (volumeChart) {
    volumeChart.destroy();
  }

  volumeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: '时长',
          data: durations,
          borderColor: chartColors.primary,
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: '卡路里',
          data: calories,
          borderColor: chartColors.tertiary,
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          backgroundColor: '#1a1a1a',
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: chartColors.grid },
          ticks: { callback: v => `${v}分钟` }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { callback: v => `${v}卡` }
        }
      }
    }
  });
}

function renderCaloriesChart(canvasId, workouts) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (caloriesChart) {
    caloriesChart.destroy();
  }

  const days = [];
  const calories = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push(formatDayShort(dateStr));

    const dayWorkouts = workouts.filter(w => w.date.startsWith(dateStr));
    calories.push(dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0));
  }

  caloriesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: '卡路里消耗',
        data: calories,
        backgroundColor: chartColors.tertiary,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} 千卡`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: chartColors.grid },
          ticks: { callback: v => `${v}千卡` }
        }
      }
    }
  });
}

function aggregateWorkoutsByType(workouts, timeRange) {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  const filtered = workouts.filter(w => new Date(w.date) >= startDate);

  const typeMap = {
    running: { label: '跑步', color: chartColors.primary },
    cycling: { label: '骑行', color: chartColors.secondary },
    swimming: { label: '游泳', color: chartColors.purple },
    weightlifting: { label: '举重', color: chartColors.tertiary },
    yoga: { label: '瑜伽', color: chartColors.pink },
    custom: { label: '其他', color: chartColors.gold }
  };

  const aggregated = {};

  filtered.forEach(w => {
    if (!aggregated[w.type]) {
      aggregated[w.type] = 0;
    }
    aggregated[w.type] += w.duration || 0;
  });

  const labels = [];
  const data = [];
  const colors = [];

  Object.entries(aggregated).forEach(([type, duration]) => {
    const info = typeMap[type] || typeMap.custom;
    labels.push(info.label);
    data.push(duration);
    colors.push(info.color);
  });

  return { labels, data, colors };
}

function renderProgressRing(containerId, progress, color = '#00ff88', size = 120) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  container.innerHTML = `
    <svg class="progress-ring" width="${size}" height="${size}">
      <circle
        class="progress-ring-bg"
        stroke-width="${strokeWidth}"
        r="${radius}"
        cx="${size / 2}"
        cy="${size / 2}"
      />
      <circle
        class="progress-ring-fill"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        r="${radius}"
        cx="${size / 2}"
        cy="${size / 2}"
        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"
      />
    </svg>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700;">${Math.round(progress * 100)}%</div>
    </div>
  `;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDayShort(dateStr) {
  const date = new Date(dateStr);
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${days[date.getDay()]}`;
}

export {
  initCharts,
  renderWeightChart,
  renderVolumeChart,
  renderWeeklyTrendChart,
  renderCaloriesChart,
  renderProgressRing,
  formatDate
};
