// FitTrack Pro - Main Application

import {
  openDB,
  addWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkouts,
  addGoal,
  updateGoal,
  deleteGoal,
  getGoals,
  getActiveGoals,
  addWeightEntry,
  getWeightEntries,
  addStepsEntry,
  getStepsByDate,
  estimateCalories
} from './db.js';

import {
  initCharts,
  renderWeightChart,
  renderVolumeChart,
  renderWeeklyTrendChart,
  renderCaloriesChart,
  renderProgressRing,
  formatDate
} from './charts.js';

import { shareAsImage, shareAsHTML, showToast } from './share.js';
import { checkPedometerSupport, requestPedometerPermission, startStepCounting } from './pedometer.js';

let workouts = [];
let goals = [];
let weightEntries = [];
let currentPage = 'dashboard';
let selectedWorkoutType = 'running';
let editingWorkout = null;
let selectedTimeRange = 'week';
let deferredPrompt = null;

// DOM Elements
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const fabButton = document.querySelector('.fab');
const modalOverlay = document.getElementById('modal-overlay');
const installBanner = document.getElementById('install-banner');
const offlineIndicator = document.querySelector('.offline-indicator');

// Initialize app
async function init() {
  await openDB();
  initCharts();

  await loadData();
  setupEventListeners();
  setupNavigation();
  setupPWA();
  renderCurrentPage();

  console.log('FitTrack Pro initialized');
}

async function loadData() {
  try {
    workouts = await getWorkouts();
    goals = await getGoals();
    weightEntries = await getWeightEntries();
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

function setupEventListeners() {
  // FAB button
  fabButton?.addEventListener('click', () => openWorkoutModal());

  // Modal close
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Workout form
  const workoutForm = document.getElementById('workout-form');
  workoutForm?.addEventListener('submit', handleWorkoutSubmit);

  // Type selector
  document.querySelectorAll('.type-option').forEach(option => {
    option.addEventListener('click', () => selectWorkoutType(option.dataset.type));
  });

  // Time range toggle
  document.querySelectorAll('.chart-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTimeRange = btn.dataset.range;
      document.querySelectorAll('.chart-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCharts();
    });
  });

  // Goal form
  const goalForm = document.getElementById('goal-form');
  goalForm?.addEventListener('submit', handleGoalSubmit);

  // Weight form
  const weightForm = document.getElementById('weight-form');
  weightForm?.addEventListener('submit', handleWeightSubmit);

  // Share button
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.share-btn')) {
      const workoutId = e.target.closest('.share-btn').dataset.id;
      const workout = workouts.find(w => w.id === workoutId);
      if (workout) {
        await shareAsImage(workout);
      }
    }
  });

  // Delete workout
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-btn')) {
      const workoutId = e.target.closest('.delete-btn').dataset.id;
      if (confirm('确定要删除这条记录吗？')) {
        await deleteWorkout(workoutId);
        await loadData();
        renderCurrentPage();
        showToast('已删除');
      }
    }
  });

  // Edit workout
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-btn')) {
      const workoutId = e.target.closest('.edit-btn').dataset.id;
      const workout = workouts.find(w => w.id === workoutId);
      if (workout) {
        editingWorkout = workout;
        openWorkoutModal(workout);
      }
    }
  });

  // Install PWA
  installBanner?.querySelector('.install-banner-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') {
        installBanner.style.display = 'none';
      }
    }
  });

  installBanner?.querySelector('.install-banner-close')?.addEventListener('click', () => {
    installBanner.style.display = 'none';
  });

  // Offline/Online detection
  window.addEventListener('online', () => {
    offlineIndicator?.classList.remove('show');
  });

  window.addEventListener('offline', () => {
    offlineIndicator?.classList.add('show');
  });

  if (!navigator.onLine) {
    offlineIndicator?.classList.add('show');
  }
}

function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      switchPage(page);
    });
  });
}

function switchPage(page) {
  currentPage = page;

  pages.forEach(p => p.classList.remove('active'));
  document.getElementById(`${page}-page`)?.classList.add('active');

  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  renderCurrentPage();
}

function renderCurrentPage() {
  switch (currentPage) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'workouts':
      renderWorkoutsPage();
      break;
    case 'progress':
      renderProgressPage();
      break;
    case 'goals':
      renderGoalsPage();
      break;
  }
}

// Dashboard
function renderDashboard() {
  renderTodayStats();
  renderRecentWorkouts();
  renderSteps();
}

function renderTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  const todayWorkouts = workouts.filter(w => w.date.startsWith(today));

  const totalDuration = todayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const totalCalories = todayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  const activeDays = new Set(workouts.map(w => w.date.split('T')[0])).size;

  document.getElementById('stat-steps')?.setAttribute('data-value', '0');
  document.getElementById('stat-duration')?.setAttribute('data-value', totalDuration);
  document.getElementById('stat-calories')?.setAttribute('data-value', totalCalories);
  document.getElementById('stat-days')?.setAttribute('data-value', activeDays);

  // Animate numbers
  animateValue('stat-steps', 0, 0, 1000);
  animateValue('stat-duration', 0, totalDuration, 500);
  animateValue('stat-calories', 0, totalCalories, 500);
  animateValue('stat-days', 0, activeDays, 500);
}

function animateValue(id, start, end, duration) {
  const el = document.getElementById(id)?.querySelector('.stat-card-value');
  if (!el) return;

  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    el.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);
}

function renderRecentWorkouts() {
  const container = document.getElementById('recent-workouts');
  if (!container) return;

  const recentWorkouts = workouts.slice(0, 3);

  if (recentWorkouts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6.5 6.5 11 11M17.5 17.5 22 22M2 12h4l3-9 6 18 3-9h4"/>
        </svg>
        <div class="empty-state-title">暂无锻炼记录</div>
        <div class="empty-state-text">点击下方按钮开始记录你的第一次锻炼</div>
      </div>
    `;
    return;
  }

  container.innerHTML = recentWorkouts.map(workout => createWorkoutItemHTML(workout)).join('');

  // Render mini chart
  const chartContainer = document.getElementById('weekly-chart-container');
  if (chartContainer && Chart) {
    renderWeeklyTrendChart('weekly-chart', workouts);
  }
}

function createWorkoutItemHTML(workout) {
  const icons = {
    running: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="4" r="2"/><path d="m15 22-3-8-4 4-3-3"/><path d="M22 12h-4l-3 4 2 5-5-3z"/></svg>`,
    cycling: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/><path d="m12 17.5 2-5.5h4l1 4"/><path d="m8 14 2.5-5.5a2 2 0 0 1 2.9-.4l1.1.7a2 2 0 0 0 1.5.3L18 8"/></svg>`,
    swimming: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20c.9-.5 1.8-1 2.7-1 1.8 0 1.6 1.2 3.3 1.2s1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2c.9 0 1.8.5 2.7 1"/><path d="M2 16c.9-.5 1.8-1 2.7-1 1.8 0 1.6 1.2 3.3 1.2s1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2c.9 0 1.8.5 2.7 1"/></svg>`,
    weightlifting: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
    yoga: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><path d="M12 22v-8"/><path d="m6.5 8-1.5 6h4L6 22"/><path d="m17.5 8 1.5 6h-4l1.5-6"/><path d="M6.5 14h11"/></svg>`,
    custom: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="m11 3 8 6-8 6-8-6 8-6"/><path d="m2 9 10 4 10-4"/></svg>`
  };

  const typeNames = {
    running: '跑步',
    cycling: '骑行',
    swimming: '游泳',
    weightlifting: '举重',
    yoga: '瑜伽',
    custom: '自定义'
  };

  return `
    <div class="workout-item">
      <div class="workout-icon ${workout.type}">
        ${icons[workout.type] || icons.custom}
      </div>
      <div class="workout-info">
        <div class="workout-type">${typeNames[workout.type] || workout.type}</div>
        <div class="workout-details">
          ${workout.duration ? `<span>${workout.duration}分钟</span>` : ''}
          ${workout.distance ? `<span>${workout.distance}km</span>` : ''}
          ${workout.calories ? `<span>${workout.calories}千卡</span>` : ''}
        </div>
      </div>
      <div class="workout-date">${formatDate(workout.date)}</div>
    </div>
  `;
}

function renderSteps() {
  const container = document.getElementById('steps-container');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];

  checkPedometerSupport().then(supported => {
    if (supported) {
      startStepCounting(({ steps, supported: motionSupported }) => {
        if (motionSupported) {
          container.innerHTML = `
            <div class="steps-card">
              <svg class="steps-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" x2="4" y1="22" y2="15"/>
              </svg>
              <div class="steps-value">${steps.toLocaleString()}</div>
              <div class="steps-label">今日步数</div>
            </div>
          `;

          // Save steps
          addStepsEntry({ date: today, steps });
        }
      });
    } else {
      container.innerHTML = `
        <div class="steps-unavailable">
          <p>计步器功能在您的设备上不可用</p>
        </div>
      `;
    }
  });
}

// Workouts Page
function renderWorkoutsPage() {
  const container = document.getElementById('workouts-list');
  if (!container) return;

  if (workouts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6.5 6.5 11 11M17.5 17.5 22 22M2 12h4l3-9 6 18 3-9h4"/>
        </svg>
        <div class="empty-state-title">还没有锻炼记录</div>
        <div class="empty-state-text">开始记录你的锻炼历程吧</div>
        <button class="btn btn-primary" onclick="document.querySelector('.fab').click()">添加记录</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="workout-list">
      ${workouts.map(workout => `
        <div class="workout-item">
          <div class="workout-icon ${workout.type}">
            ${getWorkoutIconSVG(workout.type)}
          </div>
          <div class="workout-info">
            <div class="workout-type">${getWorkoutTypeName(workout.type)}</div>
            <div class="workout-details">
              ${workout.duration ? `<span>${workout.duration}分钟</span>` : ''}
              ${workout.distance ? `<span>${workout.distance}km</span>` : ''}
              ${workout.weight ? `<span>${workout.weight}kg</span>` : ''}
              ${workout.sets ? `<span>${workout.sets}组</span>` : ''}
              ${workout.reps ? `<span>${workout.reps}次</span>` : ''}
              ${workout.calories ? `<span>${workout.calories}千卡</span>` : ''}
            </div>
          </div>
          <div class="workout-date">${formatDate(workout.date)}</div>
          <div class="workout-actions">
            <button class="edit-btn" data-id="${workout.id}" title="编辑">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </button>
            <button class="share-btn" data-id="${workout.id}" title="分享">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
              </svg>
            </button>
            <button class="delete-btn" data-id="${workout.id}" title="删除">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getWorkoutIconSVG(type) {
  const icons = {
    running: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="4" r="2"/><path d="m15 22-3-8-4 4-3-3"/><path d="M22 12h-4l-3 4 2 5-5-3z"/></svg>`,
    cycling: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/><path d="m12 17.5 2-5.5h4l1 4"/><path d="m8 14 2.5-5.5a2 2 0 0 1 2.9-.4l1.1.7a2 2 0 0 0 1.5.3L18 8"/></svg>`,
    swimming: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20c.9-.5 1.8-1 2.7-1 1.8 0 1.6 1.2 3.3 1.2s1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2c.9 0 1.8.5 2.7 1"/><path d="M2 16c.9-.5 1.8-1 2.7-1 1.8 0 1.6 1.2 3.3 1.2s1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2c.9 0 1.8.5 2.7 1"/></svg>`,
    weightlifting: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
    yoga: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><path d="M12 22v-8"/><path d="m6.5 8-1.5 6h4L6 22"/><path d="m17.5 8 1.5 6h-4l1.5-6"/><path d="M6.5 14h11"/></svg>`,
    custom: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>`
  };
  return icons[type] || icons.custom;
}

function getWorkoutTypeName(type) {
  const names = {
    running: '跑步',
    cycling: '骑行',
    swimming: '游泳',
    weightlifting: '举重',
    yoga: '瑜伽',
    custom: '自定义'
  };
  return names[type] || type;
}

// Progress Page
function renderProgressPage() {
  renderCharts();
}

function renderCharts() {
  // Weekly trend
  const weeklyChart = document.getElementById('weekly-trend-chart');
  if (weeklyChart) {
    renderWeeklyTrendChart('weekly-trend-chart', workouts);
  }

  // Volume chart
  const volumeChart = document.getElementById('volume-chart');
  if (volumeChart) {
    renderVolumeChart('volume-chart', workouts, selectedTimeRange);
  }

  // Calories chart
  const caloriesChart = document.getElementById('calories-chart');
  if (caloriesChart) {
    renderCaloriesChart('calories-chart', workouts);
  }

  // Weight chart
  const weightChart = document.getElementById('weight-chart');
  if (weightChart && weightEntries.length > 0) {
    const weightGoal = goals.find(g => g.type === 'weight' && !g.completed);
    renderWeightChart('weight-chart', weightEntries, weightGoal?.targetValue || null);
  }
}

// Goals Page
function renderGoalsPage() {
  renderGoalsList();
  renderWeightGoalForm();
}

function renderGoalsList() {
  const container = document.getElementById('goals-list');
  if (!container) return;

  const activeGoals = goals.filter(g => !g.completed);

  if (activeGoals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
        </svg>
        <div class="empty-state-title">还没有设定目标</div>
        <div class="empty-state-text">设定一个目标，开始你的健身之旅吧</div>
      </div>
    `;
    return;
  }

  container.innerHTML = activeGoals.map(goal => createGoalCardHTML(goal)).join('');
}

function createGoalCardHTML(goal) {
  const icons = {
    weight: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 16h14"/></svg>`,
    frequency: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5 11 11M17.5 17.5 22 22M2 12h4l3-9 6 18 3-9h4"/></svg>`,
    distance: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    strength: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`
  };

  const titles = {
    weight: '体重目标',
    frequency: '锻炼频次',
    distance: '距离目标',
    strength: '力量目标'
  };

  const colors = {
    weight: 'blue',
    frequency: 'green',
    distance: 'orange',
    strength: 'purple'
  };

  const progress = calculateGoalProgress(goal);

  return `
    <div class="goal-card" data-goal-id="${goal.id}">
      <div class="goal-header">
        <div class="goal-type">
          <div class="goal-type-icon ${goal.type}">${icons[goal.type]}</div>
          <div>
            <div class="goal-title">${titles[goal.type] || goal.type}</div>
            <div class="goal-deadline">截止: ${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '未设置'}</div>
          </div>
        </div>
        <button class="btn btn-ghost delete-goal-btn" data-id="${goal.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <div class="goal-progress">
        <div class="goal-progress-bar">
          <div class="goal-progress-fill ${colors[goal.type]}" style="width: ${progress * 100}%"></div>
        </div>
      </div>
      <div class="goal-stats">
        <span class="goal-current">${formatGoalValue(goal)}</span>
        <span class="goal-target">目标: ${goal.targetValue}</span>
      </div>
    </div>
  `;
}

function calculateGoalProgress(goal) {
  switch (goal.type) {
    case 'weight':
      const latestWeight = weightEntries[0]?.weight || goal.startValue;
      if (goal.targetValue < goal.startValue) {
        return Math.min(1, (goal.startValue - latestWeight) / (goal.startValue - goal.targetValue));
      } else {
        return Math.min(1, (latestWeight - goal.startValue) / (goal.targetValue - goal.startValue));
      }
    case 'frequency':
      const workoutsThisWeek = workouts.filter(w => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(w.date) >= weekAgo;
      }).length;
      return Math.min(1, workoutsThisWeek / goal.targetValue);
    case 'distance':
      const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
      return Math.min(1, totalDistance / goal.targetValue);
    case 'strength':
      return Math.min(1, goal.currentValue / goal.targetValue);
    default:
      return 0;
  }
}

function formatGoalValue(goal) {
  switch (goal.type) {
    case 'weight':
      return `${weightEntries[0]?.weight || goal.startValue} kg`;
    case 'frequency':
      const workoutsThisWeek = workouts.filter(w => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(w.date) >= weekAgo;
      }).length;
      return `${workoutsThisWeek} 次/周`;
    case 'distance':
      const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);
      return `${totalDistance.toFixed(1)} km`;
    case 'strength':
      return `${goal.currentValue || goal.startValue} kg`;
    default:
      return goal.currentValue || goal.startValue;
  }
}

function renderWeightGoalForm() {
  const container = document.getElementById('weight-form-container');
  if (!container) return;

  const weightGoal = goals.find(g => g.type === 'weight' && !g.completed);

  if (weightGoal) {
    const progress = calculateGoalProgress(weightGoal);
    renderProgressRing('weight-progress-ring', progress, '#00ccff', 120);
  } else {
    document.getElementById('weight-progress-ring')!.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="color: var(--text-secondary); margin-bottom: 12px;">设置体重目标来追踪你的进展</p>
      </div>
    `;
  }
}

// Modals
function openWorkoutModal(workout = null) {
  const modal = document.getElementById('workout-modal');
  if (!modal) return;

  editingWorkout = workout;

  // Reset form
  document.getElementById('workout-form')?.reset();

  // Set modal title
  document.querySelector('#workout-modal .modal-header h2').textContent =
    workout ? '编辑锻炼' : '添加锻炼';

  if (workout) {
    // Populate form
    selectWorkoutType(workout.type);
    document.getElementById('workout-duration').value = workout.duration || '';
    document.getElementById('workout-distance').value = workout.distance || '';
    document.getElementById('workout-weight').value = workout.weight || '';
    document.getElementById('workout-sets').value = workout.sets || '';
    document.getElementById('workout-reps').value = workout.reps || '';
    document.getElementById('workout-notes').value = workout.notes || '';
  } else {
    selectWorkoutType('running');
  }

  modal.classList.add('active');
}

function closeModal() {
  modalOverlay?.classList.remove('active');
  editingWorkout = null;
}

function selectWorkoutType(type) {
  selectedWorkoutType = type;

  document.querySelectorAll('.type-option').forEach(option => {
    option.classList.toggle('selected', option.dataset.type === type);
  });

  // Show/hide type-specific fields
  const distanceFields = document.getElementById('distance-fields');
  const weightFields = document.getElementById('weight-fields');

  if (distanceFields) {
    distanceFields.style.display = ['running', 'cycling', 'swimming'].includes(type) ? 'grid' : 'none';
  }
  if (weightFields) {
    weightFields.style.display = type === 'weightlifting' ? 'grid' : 'none';
  }
}

async function handleWorkoutSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const duration = parseInt(document.getElementById('workout-duration')?.value) || 0;
  const distance = parseFloat(document.getElementById('workout-distance')?.value) || 0;
  const weight = parseFloat(document.getElementById('workout-weight')?.value) || 0;
  const sets = parseInt(document.getElementById('workout-sets')?.value) || 0;
  const reps = parseInt(document.getElementById('workout-reps')?.value) || 0;
  const notes = document.getElementById('workout-notes')?.value || '';

  const workoutData = {
    type: selectedWorkoutType,
    date: new Date().toISOString(),
    duration,
    distance,
    weight,
    sets,
    reps,
    notes,
    calories: estimateCalories(selectedWorkoutType, duration, distance, weight)
  };

  try {
    if (editingWorkout) {
      await updateWorkout({ ...editingWorkout, ...workoutData });
      showToast('已更新');
    } else {
      await addWorkout(workoutData);
      showToast('已添加');
    }

    await loadData();
    closeModal();
    renderCurrentPage();
  } catch (err) {
    console.error('Error saving workout:', err);
    showToast('保存失败', 'error');
  }
}

async function handleGoalSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('goal-type')?.value;
  const targetValue = parseFloat(document.getElementById('goal-target')?.value) || 0;
  const deadline = document.getElementById('goal-deadline')?.value;

  if (!type || !targetValue) {
    showToast('请填写完整信息', 'error');
    return;
  }

  const goalData = {
    type,
    targetValue,
    startValue: type === 'weight' ? (weightEntries[0]?.weight || 70) : 0,
    currentValue: type === 'weight' ? (weightEntries[0]?.weight || 70) : 0,
    deadline: deadline || null,
    completed: false
  };

  try {
    await addGoal(goalData);
    await loadData();
    renderCurrentPage();
    showToast('目标已设置');

    // Close modal if exists
    const modal = document.getElementById('goal-modal');
    if (modal) modal.classList.remove('active');
  } catch (err) {
    console.error('Error saving goal:', err);
    showToast('保存失败', 'error');
  }
}

async function handleWeightSubmit(e) {
  e.preventDefault();

  const weight = parseFloat(document.getElementById('weight-input')?.value);
  if (!weight) {
    showToast('请输入体重', 'error');
    return;
  }

  try {
    await addWeightEntry({
      date: new Date().toISOString().split('T')[0],
      weight
    });
    await loadData();
    renderCurrentPage();
    showToast('体重已记录');
  } catch (err) {
    console.error('Error saving weight:', err);
    showToast('保存失败', 'error');
  }
}

function setupPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW registration failed:', err));
    });
  }

  // Handle install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) {
      installBanner.style.display = 'flex';
    }
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBanner) {
      installBanner.style.display = 'none';
    }
  });
}

// Delete goal handler
document.addEventListener('click', async (e) => {
  if (e.target.closest('.delete-goal-btn')) {
    const goalId = e.target.closest('.delete-goal-btn').dataset.id;
    if (confirm('确定要删除这个目标吗？')) {
      await deleteGoal(goalId);
      await loadData();
      renderCurrentPage();
      showToast('目标已删除');
    }
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Open goal modal
window.openGoalModal = function() {
  const modal = document.getElementById('goal-modal');
  if (modal) modal.classList.add('active');
};

// Open weight modal
window.openWeightModal = function() {
  const modal = document.getElementById('weight-modal');
  if (modal) modal.classList.add('active');
};
