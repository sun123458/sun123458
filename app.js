// ========== 用户数据 ==========
const USERS = [
  {
    id: 1, name: '小雨', age: 23,
    location: '北京 · 朝阳区',
    img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&crop=face',
    bio: '喜欢摄影和旅行，周末经常在咖啡馆看书。希望你也是一个热爱生活的人~',
    tags: ['摄影', '咖啡控', '旅行'],
    photos: 8, distance: 3, mutual: 5
  },
  {
    id: 2, name: '思远', age: 26,
    location: '上海 · 静安区',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&crop=face',
    bio: '互联网产品经理，喜欢探索新事物。工作之余会打篮球和弹吉他。',
    tags: ['运动', '音乐', '互联网'],
    photos: 12, distance: 5, mutual: 3
  },
  {
    id: 3, name: '暖暖', age: 24,
    location: '杭州 · 西湖区',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&crop=face',
    bio: '设计师一枚，对美的东西没有抵抗力。养了一只叫年糕的猫🐱',
    tags: ['设计', '撸猫', '美食'],
    photos: 15, distance: 2, mutual: 8
  },
  {
    id: 4, name: '阿泽', age: 28,
    location: '深圳 · 南山区',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face',
    bio: '健身教练，自律让我快乐。喜欢户外徒步，想找一个一起看日出的人。',
    tags: ['健身', '徒步', '自律'],
    photos: 6, distance: 8, mutual: 2
  },
  {
    id: 5, name: '诗涵', age: 22,
    location: '成都 · 锦江区',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face',
    bio: '音乐学院学生，会弹钢琴和古筝。喜欢在雨天听音乐，晴天看展。',
    tags: ['音乐', '文艺', '看展'],
    photos: 10, distance: 4, mutual: 6
  },
  {
    id: 6, name: '子涵', age: 25,
    location: '广州 · 天河区',
    img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=face',
    bio: '美食博主，带你吃遍大街小巷。会做甜品，可以一起下厨哦~',
    tags: ['美食', '烘焙', '探店'],
    photos: 20, distance: 6, mutual: 4
  },
  {
    id: 7, name: '浩然', age: 27,
    location: '南京 · 鼓楼区',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=face',
    bio: '建筑设计师，喜欢老房子和有故事的地方。偶尔画画水彩。',
    tags: ['建筑', '艺术', '水彩'],
    photos: 9, distance: 7, mutual: 1
  },
  {
    id: 8, name: '悠悠', age: 21,
    location: '武汉 · 武昌区',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&crop=face',
    bio: '大学生一枚，喜欢追剧和打switch。梦想是环游世界！',
    tags: ['追剧', '游戏', '旅行'],
    photos: 7, distance: 1, mutual: 9
  }
];

// 会匹配的用户 ID
const MATCH_IDS = [3, 5, 8];

// ========== 状态 ==========
let cardQueue = [];
let currentIndex = 0;
let topCard = null;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let isDragging = false;
let isAnimating = false;

// ========== DOM ==========
const cardArea = document.getElementById('cardArea');
const emptyState = document.getElementById('emptyState');
const btnLike = document.getElementById('btnLike');
const btnSkip = document.getElementById('btnSkip');
const btnInfo = document.getElementById('btnInfo');
const btnRefresh = document.getElementById('btnRefresh');

// 简介
const profileOverlay = document.getElementById('profileOverlay');
const profileModal = document.getElementById('profileModal');
const modalClose = document.getElementById('modalClose');
const profileSkip = document.getElementById('profileSkip');
const profileLike = document.getElementById('profileLike');

// 匹配
const matchOverlay = document.getElementById('matchOverlay');
const matchAvatar = document.getElementById('matchAvatar');
const matchText = document.getElementById('matchText');
const matchChat = document.getElementById('matchChat');
const matchLater = document.getElementById('matchLater');
const confettiCanvas = document.getElementById('confettiCanvas');

// ========== 初始化 ==========
function init() {
  cardQueue = [...USERS];
  currentIndex = 0;
  emptyState.classList.remove('show');
  renderCards();
  bindEvents();
}

function renderCards() {
  // 清除旧卡片
  cardArea.querySelectorAll('.swipe-card').forEach(c => c.remove());

  const remaining = cardQueue.length - currentIndex;
  if (remaining <= 0) {
    emptyState.classList.add('show');
    topCard = null;
    return;
  }

  // 渲染最多3张（叠层效果）
  const count = Math.min(remaining, 3);
  for (let i = count - 1; i >= 0; i--) {
    const user = cardQueue[currentIndex + i];
    if (!user) continue;
    const card = createCardElement(user, i);
    cardArea.appendChild(card);
  }

  topCard = cardArea.querySelector('.swipe-card[data-index="0"]');
  if (topCard) updateCardStack();
}

function createCardElement(user, stackIndex) {
  const card = document.createElement('div');
  card.className = 'swipe-card';
  card.dataset.index = stackIndex;
  card.dataset.userId = user.id;

  card.innerHTML = `
    <div class="stamp stamp-like">LIKE</div>
    <div class="stamp stamp-skip">NOPE</div>
    <img class="card-img" src="${user.img}" alt="${user.name}" draggable="false">
    <div class="card-info">
      <div class="card-name">${user.name} <span>${user.age}</span></div>
      <div class="card-location">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
        </svg>
        ${user.location}
      </div>
      <div class="card-bio-preview">${user.bio}</div>
    </div>
  `;

  // 堆叠偏移和缩放
  const scale = 1 - stackIndex * 0.04;
  const translateY = stackIndex * 10;
  card.style.transform = `translateY(${translateY}px) scale(${scale})`;
  card.style.zIndex = 10 - stackIndex;
  card.style.opacity = stackIndex === 0 ? 1 : (0.7 - stackIndex * 0.15);

  if (stackIndex === 0) {
    card.style.boxShadow = 'var(--shadow-lg)';
    attachDragEvents(card);
  }

  return card;
}

function updateCardStack() {
  const cards = cardArea.querySelectorAll('.swipe-card');
  cards.forEach(card => {
    const idx = parseInt(card.dataset.index);
    const scale = 1 - idx * 0.04;
    const ty = idx * 10;
    card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    card.style.transform = `translateY(${ty}px) scale(${scale})`;
    card.style.zIndex = 10 - idx;
    card.style.opacity = idx === 0 ? 1 : (0.7 - idx * 0.15);
    card.style.boxShadow = idx === 0 ? 'var(--shadow-lg)' : 'var(--shadow-sm)';
  });
}

// ========== 拖拽 ==========
function attachDragEvents(card) {
  card.addEventListener('pointerdown', onPointerDown);
}

function onPointerDown(e) {
  if (isAnimating) return;
  const card = e.currentTarget;
  topCard = card;

  startX = e.clientX;
  startY = e.clientY;
  currentX = 0;
  currentY = 0;
  isDragging = false;

  card.style.transition = 'none';
  card.classList.remove('fly-right', 'fly-left');
  card.setPointerCapture(e.pointerId);

  card.addEventListener('pointermove', onPointerMove);
  card.addEventListener('pointerup', onPointerUp);
  card.addEventListener('pointercancel', onPointerUp);
}

function onPointerMove(e) {
  if (!topCard) return;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;

  if (!isDragging && Math.abs(currentX) > 5) {
    isDragging = true;
  }

  const rotate = currentX * 0.08;
  const maxOpacity = Math.min(Math.abs(currentX) / 120, 1);

  topCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

  // 水印和边框
  const stampLike = topCard.querySelector('.stamp-like');
  const stampSkip = topCard.querySelector('.stamp-skip');
  if (currentX > 0) {
    stampLike.style.opacity = maxOpacity;
    stampSkip.style.opacity = 0;
    topCard.classList.add('like-active');
    topCard.classList.remove('skip-active');
  } else {
    stampSkip.style.opacity = maxOpacity;
    stampLike.style.opacity = 0;
    topCard.classList.add('skip-active');
    topCard.classList.remove('like-active');
  }
}

function onPointerUp(e) {
  if (!topCard) return;
  topCard.removeEventListener('pointermove', onPointerMove);
  topCard.removeEventListener('pointerup', onPointerUp);
  topCard.removeEventListener('pointercancel', onPointerUp);

  const threshold = 100;

  if (currentX > threshold) {
    animateSwipe('right');
  } else if (currentX < -threshold) {
    animateSwipe('left');
  } else {
    bounceBack();
  }

  isDragging = false;
}

function bounceBack() {
  if (!topCard) return;
  topCard.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  topCard.style.transform = 'translateY(0) scale(1)';
  topCard.querySelector('.stamp-like').style.opacity = 0;
  topCard.querySelector('.stamp-skip').style.opacity = 0;
  topCard.classList.remove('like-active', 'skip-active');
}

function animateSwipe(direction) {
  if (!topCard || isAnimating) return;
  isAnimating = true;

  const rotate = currentX * 0.08;
  topCard.style.setProperty('--tx', `${currentX}px`);
  topCard.style.setProperty('--ty', `${currentY}px`);
  topCard.style.setProperty('--rot', `${rotate}deg`);
  topCard.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');

  const userId = parseInt(topCard.dataset.userId);
  const isLike = direction === 'right';

  topCard.addEventListener('animationend', () => {
    topCard.remove();
    currentIndex++;

    // 更新剩余卡片
    const remaining = cardArea.querySelectorAll('.swipe-card');
    remaining.forEach(c => {
      const idx = parseInt(c.dataset.index);
      c.dataset.index = idx - 1;
    });

    updateCardStack();
    topCard = cardArea.querySelector('.swipe-card[data-index="0"]');

    if (topCard) {
      topCard.style.boxShadow = 'var(--shadow-lg)';
      attachDragEvents(topCard);
    } else if (cardQueue.length - currentIndex <= 0) {
      emptyState.classList.add('show');
    }

    isAnimating = false;

    // 判断是否匹配
    if (isLike && MATCH_IDS.includes(userId)) {
      const matchedUser = USERS.find(u => u.id === userId);
      if (matchedUser) showMatch(matchedUser);
    }
  }, { once: true });
}

function triggerSwipe(direction) {
  if (isAnimating || !topCard) return;

  // 模拟拖拽位移
  currentX = direction === 'right' ? 200 : -200;
  currentY = 0;

  topCard.querySelector('.stamp-like').style.opacity = direction === 'right' ? 1 : 0;
  topCard.querySelector('.stamp-skip').style.opacity = direction === 'left' ? 1 : 0;

  // 按钮动画
  const btn = direction === 'right' ? btnLike : btnSkip;
  btn.classList.add('pulse');
  setTimeout(() => btn.classList.remove('pulse'), 300);

  animateSwipe(direction);
}

// ========== 用户简介 ========== =
function showProfile() {
  if (!topCard || isAnimating) return;
  const user = cardQueue[currentIndex];
  if (!user) return;

  document.getElementById('profileImg').src = user.img;
  document.getElementById('profileName').textContent = `${user.name}，${user.age}`;
  document.getElementById('profileAgeLoc').textContent = `${user.location}`;
  document.getElementById('profileBio').textContent = user.bio;
  document.getElementById('statPhotos').textContent = user.photos;
  document.getElementById('statDist').textContent = user.distance;
  document.getElementById('statMatches').textContent = user.mutual;

  const tagsEl = document.getElementById('profileTags');
  tagsEl.innerHTML = user.tags.map(t => `<span class="tag">${t}</span>`).join('');

  profileOverlay.classList.add('show');
}

function closeProfile() {
  profileOverlay.classList.remove('show');
}

// ========== 匹配弹窗 ========== =
let confettiAnimation = null;

function showMatch(user) {
  matchAvatar.src = user.img;
  matchText.textContent = `你和 ${user.name} 互相喜欢了对方！`;
  matchOverlay.classList.add('show');
  startConfetti();
}

function closeMatch() {
  matchOverlay.classList.remove('show');
  stopConfetti();
}

function startConfetti() {
  const canvas = confettiCanvas;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(2, 2);

  const w = rect.width;
  const h = rect.height;
  const particles = [];
  const colors = ['#FF6B6B', '#FFE66D', '#A29BFE', '#55E6C1', '#F8A5C2', '#FFA07A'];

  // 预生成
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h - h,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 1,
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    let alive = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.vy += 0.05;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      if (frame > 60) p.opacity -= 0.01;
      p.opacity = Math.max(0, p.opacity);

      if (p.opacity <= 0) return;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    frame++;
    if (alive && frame < 200) {
      confettiAnimation = requestAnimationFrame(draw);
    }
  }

  draw();
}

function stopConfetti() {
  if (confettiAnimation) {
    cancelAnimationFrame(confettiAnimation);
    confettiAnimation = null;
  }
}

// ========== 事件绑定 ==========
function bindEvents() {
  btnLike.addEventListener('click', () => triggerSwipe('right'));
  btnSkip.addEventListener('click', () => triggerSwipe('left'));
  btnInfo.addEventListener('click', showProfile);

  modalClose.addEventListener('click', closeProfile);
  profileOverlay.addEventListener('click', e => {
    if (e.target === profileOverlay) closeProfile();
  });

  profileSkip.addEventListener('click', () => { closeProfile(); triggerSwipe('left'); });
  profileLike.addEventListener('click', () => { closeProfile(); triggerSwipe('right'); });

  matchChat.addEventListener('click', () => {
    closeMatch();
    // Toast 提示
    showToast('💬 即将开启聊天功能...');
  });
  matchLater.addEventListener('click', closeMatch);

  btnRefresh.addEventListener('click', () => {
    // 打乱数组并重新渲染
    cardQueue = [...USERS].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    init();
  });

  btnBack.addEventListener('click', () => {
    showToast('🔙 当前已是首页');
  });

  btnSettings.addEventListener('click', () => {
    showToast('⚙️ 设置功能开发中...');
  });

  // 键盘操作
  document.addEventListener('keydown', e => {
    if (profileOverlay.classList.contains('show')) {
      if (e.key === 'Escape') closeProfile();
      return;
    }
    if (matchOverlay.classList.contains('show')) {
      if (e.key === 'Escape') closeMatch();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'l') triggerSwipe('right');
    if (e.key === 'ArrowLeft' || e.key === 's') triggerSwipe('left');
    if (e.key === 'ArrowUp' || e.key === 'i') showProfile();
    if (e.key === 'ArrowDown' || e.key === 'n') triggerSwipe('left');
  });
}

// ========== Toast ==========
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%) translateY(-20px)',
    background: 'rgba(45, 52, 54, 0.88)',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'inherit',
    zIndex: '999',
    opacity: '0',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ========== 启动 ==========
init();
