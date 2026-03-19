// Share functionality for FitTrack Pro

import { formatDate } from './charts.js';

async function generateShareCard(workout) {
  const card = document.createElement('div');
  card.id = 'share-card';
  card.style.cssText = `
    width: 400px;
    padding: 32px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  `;

  const bgDecoration = document.createElement('div');
  bgDecoration.style.cssText = `
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 255, 136, 0.08) 0%, transparent 50%);
    pointer-events: none;
  `;
  card.appendChild(bgDecoration);

  const content = document.createElement('div');
  content.style.cssText = 'position: relative; z-index: 1;';

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;';
  header.innerHTML = `
    <div style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 16px; color: #00ff88;">FitTrack Pro</div>
    <div style="font-size: 12px; color: #888888;">${formatDate(workout.date)}</div>
  `;
  content.appendChild(header);

  const iconColors = {
    running: { bg: 'rgba(0, 255, 136, 0.15)', color: '#00ff88' },
    cycling: { bg: 'rgba(0, 204, 255, 0.15)', color: '#00ccff' },
    swimming: { bg: 'rgba(138, 43, 226, 0.15)', color: '#8a2be2' },
    weightlifting: { bg: 'rgba(255, 107, 53, 0.15)', color: '#ff6b35' },
    yoga: { bg: 'rgba(255, 182, 193, 0.15)', color: '#ffb6c1' },
    custom: { bg: 'rgba(255, 215, 0, 0.15)', color: '#ffd700' }
  };

  const iconInfo = iconColors[workout.type] || iconColors.custom;
  const iconSvg = getWorkoutIconSVG(workout.type);

  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: ${iconInfo.bg};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  `;
  iconContainer.innerHTML = `<div style="color: ${iconInfo.color};">${iconSvg}</div>`;
  content.appendChild(iconContainer);

  const title = document.createElement('div');
  title.style.cssText = `
    font-family: 'Outfit', sans-serif;
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 24px;
    text-transform: capitalize;
  `;
  title.textContent = workout.type === 'weightlifting' ? '力量训练' : getWorkoutTypeName(workout.type);
  content.appendChild(title);

  const statsGrid = document.createElement('div');
  statsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;';

  const stats = [];
  if (workout.duration) {
    stats.push({ label: '时长', value: `${workout.duration}`, unit: '分钟' });
  }
  if (workout.distance) {
    stats.push({ label: '距离', value: workout.distance, unit: '公里' });
  }
  if (workout.weight) {
    stats.push({ label: '重量', value: workout.weight, unit: 'kg' });
  }
  if (workout.calories) {
    stats.push({ label: '卡路里', value: workout.calories, unit: '千卡' });
  }
  if (workout.sets && workout.reps) {
    stats.push({ label: '训练量', value: `${workout.sets}×${workout.reps}`, unit: '组×次' });
  }

  stats.slice(0, 3).forEach(stat => {
    const statEl = document.createElement('div');
    statEl.style.cssText = 'text-align: center;';
    statEl.innerHTML = `
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600; color: #00ff88;">${stat.value}</div>
      <div style="font-size: 11px; color: #888888; margin-top: 4px;">${stat.label} (${stat.unit})</div>
    `;
    statsGrid.appendChild(statEl);
  });

  content.appendChild(statsGrid);

  const footer = document.createElement('div');
  footer.style.cssText = 'text-align: center; font-size: 11px; color: #666666;';
  footer.textContent = '由 FitTrack Pro 生成';
  content.appendChild(footer);

  card.appendChild(content);

  return card;
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

function getWorkoutIconSVG(type) {
  const icons = {
    running: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="4" r="2"/><path d="m15 22-3-8-4 4-3-3"/><path d="M22 12h-4l-3 4 2 5-5-3z"/></svg>`,
    cycling: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/><path d="m12 17.5 2-5.5h4l1 4"/><path d="m8 14 2.5-5.5a2 2 0 0 1 2.9-.4l1.1.7a2 2 0 0 0 1.5.3L18 8"/></svg>`,
    swimming: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20c.9-.5 1.8-1 2.7-1 1.8 0 1.6 1.2 3.3 1.2s1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2c.9 0 1.8.5 2.7 1"/><path d="M2 16c.9-.5 1.8-1 2.7-1 1.8 0 1.6 1.2 3.3 1.2s1.6-1.2 3.3-1.2 1.6 1.2 3.3 1.2 1.6-1.2 3.3-1.2c.9 0 1.8.5 2.7 1"/><path d="m12 6-2-4 2.5-.5L12 2l-.5.5L12 6z"/><path d="M5.2 8.8c-.7.2-1.2.7-1.2 1.2 0 1.4 1.5 2.5 3.3 2.5h1.3"/></svg>`,
    weightlifting: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
    yoga: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 22v-8"/><path d="m6.5 8-1.5 6h4L6 22"/><path d="m17.5 8 1.5 6h-4l1.5-6"/><path d="M6.5 14h11"/></svg>`,
    custom: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="m11 3 8 6-8 6-8-6 8-6"/><path d="m2 9 10 4 10-4"/></svg>`
  };
  return icons[type] || icons.custom;
}

async function shareAsImage(workout) {
  const card = await generateShareCard(workout);
  document.body.appendChild(card);

  try {
    if (typeof html2canvas !== 'undefined') {
      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        logging: false
      });

      canvas.toBlob(async (blob) => {
        try {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'workout.png', { type: 'image/png' })] })) {
            await navigator.share({
              files: [new File([blob], 'workout.png', { type: 'image/png' })],
              title: '我的锻炼记录',
              text: `完成了${getWorkoutTypeName(workout.type)}，时长${workout.duration}分钟`
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workout-${workout.id}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error('Share error:', err);
          showToast('分享失败', 'error');
        }
      }, 'image/png');
    } else {
      shareAsHTML(workout);
    }
  } finally {
    document.body.removeChild(card);
  }
}

function shareAsHTML(workout) {
  const html = `
    <div style="width: 400px; padding: 32px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; font-family: Inter, sans-serif; color: white; text-align: center;">
      <div style="font-weight: 700; color: #00ff88; margin-bottom: 8px;">FitTrack Pro</div>
      <div style="font-size: 24px; font-weight: 700; margin: 16px 0; text-transform: capitalize;">${getWorkoutTypeName(workout.type)}</div>
      <div style="display: flex; justify-content: center; gap: 24px; margin: 20px 0;">
        ${workout.duration ? `<div><div style="font-size: 20px; font-weight: 600; color: #00ff88;">${workout.duration}</div><div style="font-size: 12px; color: #888;">分钟</div></div>` : ''}
        ${workout.distance ? `<div><div style="font-size: 20px; font-weight: 600; color: #00ff88;">${workout.distance}</div><div style="font-size: 12px; color: #888;">公里</div></div>` : ''}
        ${workout.calories ? `<div><div style="font-size: 20px; font-weight: 600; color: #00ff88;">${workout.calories}</div><div style="font-size: 12px; color: #888;">千卡</div></div>` : ''}
      </div>
      <div style="font-size: 11px; color: #666;">${formatDate(workout.date)} | FitTrack Pro</div>
    </div>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const clipboardItem = new ClipboardItem({ 'text/html': blob });

  navigator.clipboard.write([clipboardItem]).then(() => {
    showToast('已复制到剪贴板', 'success');
  }).catch(() => {
    showToast('复制失败，请手动复制', 'error');
  });
}

function showToast(message, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

export {
  generateShareCard,
  shareAsImage,
  shareAsHTML,
  showToast
};
