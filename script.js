// 用户数据
const users = [
    {
        id: 1,
        name: '小雨',
        age: 23,
        location: '上海',
        avatar: 'https://i.pravatar.cc/400?img=1',
        photos: [
            'https://i.pravatar.cc/400?img=1',
            'https://i.pravatar.cc/400?img=2',
            'https://i.pravatar.cc/400?img=3'
        ],
        bio: '热爱旅行和摄影 📸 寻找一起探索世界的伙伴～ 喜欢尝试新的咖啡馆，周末会去爬山 🏔️',
        tags: ['旅行', '摄影', '咖啡', '爬山', '音乐'],
        online: true,
        isNew: true,
        verified: true
    },
    {
        id: 2,
        name: 'Luna',
        age: 25,
        location: '北京',
        avatar: 'https://i.pravatar.cc/400?img=5',
        photos: [
            'https://i.pravatar.cc/400?img=5',
            'https://i.pravatar.cc/400?img=6',
            'https://i.pravatar.cc/400?img=7'
        ],
        bio: '设计师 👩‍🎨 平时喜欢画画和看展，周末会去健身房 💪 希望找到有共同兴趣的朋友',
        tags: ['设计', '艺术', '健身', '电影'],
        online: true,
        isNew: false,
        verified: true
    },
    {
        id: 3,
        name: '子涵',
        age: 24,
        location: '深圳',
        avatar: 'https://i.pravatar.cc/400?img=9',
        photos: [
            'https://i.pravatar.cc/400?img=9',
            'https://i.pravatar.cc/400?img=10',
            'https://i.pravatar.cc/400?img=11'
        ],
        bio: '程序员 👨‍💻 业余时间喜欢打游戏和看科幻小说。INFJ，希望找到一个懂我的人 🌟',
        tags: ['编程', '游戏', '科幻', '音乐', '电影'],
        online: false,
        isNew: true,
        verified: false
    },
    {
        id: 4,
        name: 'Mia',
        age: 22,
        location: '杭州',
        avatar: 'https://i.pravatar.cc/400?img=16',
        photos: [
            'https://i.pravatar.cc/400?img=16',
            'https://i.pravatar.cc/400?img=17',
            'https://i.pravatar.cc/400?img=18'
        ],
        bio: '大学生 🎮 喜欢逛街和美食，喜欢尝试各种新奇的菜系！希望能遇到有趣的灵魂 🌸',
        tags: ['美食', '购物', '旅行', '音乐'],
        online: true,
        isNew: false,
        verified: true
    },
    {
        id: 5,
        name: '梓晨',
        age: 26,
        location: '成都',
        avatar: 'https://i.pravatar.cc/400?img=20',
        photos: [
            'https://i.pravatar.cc/400?img=20',
            'https://i.pravatar.cc/400?img=21',
            'https://i.pravatar.cc/400?img=22'
        ],
        bio: '创业者 🚀 喜欢户外运动和钓鱼，希望找到能够一起成长的人 🎣',
        tags: ['创业', '户外', '钓鱼', '阅读'],
        online: false,
        isNew: true,
        verified: true
    }
];

// 当前索引
let currentIndex = 0;
let currentCard = null;
let isAnimating = false;

// DOM 元素
const cardStack = document.getElementById('cardStack');
const noCards = document.getElementById('noCards');
const profileModal = document.getElementById('profileModal');
const profileContent = document.getElementById('profileContent');
const closeProfileModal = document.getElementById('closeProfileModal');
const matchOverlay = document.getElementById('matchOverlay');
const matchAvatars = document.getElementById('matchAvatars');

// 初始化
function init() {
    renderCards();
    setupEventListeners();
}

// 渲染卡片
function renderCards() {
    cardStack.innerHTML = '';

    const remainingUsers = users.slice(currentIndex);

    if (remainingUsers.length === 0) {
        noCards.style.display = 'block';
        return;
    }

    noCards.style.display = 'none';

    // 只渲染前两张卡片
    remainingUsers.slice(0, 2).reverse().forEach((user, index) => {
        const card = createCard(user);
        const actualIndex = remainingUsers.length - 1 - index;

        // 第二张卡片放在后面
        if (index === 0 && remainingUsers.length > 1) {
            card.style.zIndex = '1';
            card.style.transform = 'scale(0.95) translateY(10px)';
        } else {
            card.style.zIndex = '2';
            card.style.transform = 'scale(1) translateY(0)';
            currentCard = card;
        }

        card.dataset.index = actualIndex;
        cardStack.appendChild(card);
    });

    // 为第一张卡片添加手势
    if (currentCard) {
        setupCardGestures(currentCard);
    }
}

// 创建卡片元素
function createCard(user) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.userId = user.id;

    card.innerHTML = `
        <img class="card-image" src="${user.photos[0]}" alt="${user.name}">
        <div class="card-gradient"></div>
        <div class="card-info">
            <div class="card-name">
                ${user.name}
                <span class="card-age">${user.age}</span>
                ${user.verified ? `
                <svg class="card-verified" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                ` : ''}
            </div>
            <div class="card-location">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                ${user.location}
            </div>
            <div class="card-badges">
                ${user.online ? '<span class="badge badge-online">在线</span>' : ''}
                ${user.isNew ? '<span class="badge badge-new">新用户</span>' : ''}
            </div>
        </div>
        <div class="swipe-indicator like-indicator">LIKE</div>
        <div class="swipe-indicator dislike-indicator">NOPE</div>
        <div class="swipe-indicator super-like-indicator">SUPER LIKE</div>
    `;

    return card;
}

// 设置卡片手势
function setupCardGestures(card) {
    let startX, startY;
    let isDragging = false;
    let currentX, currentY;

    const likeIndicator = card.querySelector('.like-indicator');
    const dislikeIndicator = card.querySelector('.dislike-indicator');
    const superLikeIndicator = card.querySelector('.super-like-indicator');

    const onStart = (e) => {
        if (isAnimating) return;
        isDragging = true;

        const point = e.touches ? e.touches[0] : e;
        startX = point.clientX;
        startY = point.clientY;

        card.style.transition = 'none';
    };

    const onMove = (e) => {
        if (!isDragging || isAnimating) return;

        const point = e.touches ? e.touches[0] : e;
        currentX = point.clientX - startX;
        currentY = point.clientY - startY;

        // 限制Y轴移动
        currentY = currentY * 0.5;

        // 计算旋转角度
        const rotation = currentX * 0.05;
        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;

        // 显示滑动指示器
        const progress = Math.min(Math.abs(currentX) / 150, 1);

        if (currentX > 0) {
            // 向右滑动
            likeIndicator.style.opacity = progress;
            likeIndicator.style.transform = `scale(${0.8 + progress * 0.4})`;
            dislikeIndicator.style.opacity = '0';
            superLikeIndicator.style.opacity = '0';
        } else {
            // 向左滑动
            dislikeIndicator.style.opacity = progress;
            dislikeIndicator.style.transform = `scale(${0.8 + progress * 0.4})`;
            likeIndicator.style.opacity = '0';
            superLikeIndicator.style.opacity = '0';
        }

        // 向上滑动超喜欢
        if (currentY < -100) {
            const superProgress = Math.min(Math.abs(currentY - 100) / 100, 1);
            superLikeIndicator.style.opacity = superProgress;
            superLikeIndicator.style.transform = `translate(-50%, -50%) scale(${0.8 + superProgress * 0.4})`;
        }
    };

    const onEnd = () => {
        if (!isDragging || isAnimating) return;
        isDragging = false;

        const threshold = 100;

        if (currentX > threshold) {
            // 向右滑动 - 喜欢
            swipeCard('right');
        } else if (currentX < -threshold) {
            // 向左滑动 - 跳过
            swipeCard('left');
        } else if (currentY < -150) {
            // 向上滑动 - 超喜欢
            swipeCard('super');
        } else {
            // 回弹
            card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.transform = 'translate(0, 0) rotate(0)';

            likeIndicator.style.opacity = '0';
            dislikeIndicator.style.opacity = '0';
            superLikeIndicator.style.opacity = '0';
        }
    };

    // 鼠标事件
    card.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    // 触摸事件
    card.addEventListener('touchstart', onStart, { passive: true });
    card.addEventListener('touchmove', onMove, { passive: true });
    card.addEventListener('touchend', onEnd);
}

// 滑动卡片
function swipeCard(direction) {
    if (!currentCard || isAnimating) return;
    isAnimating = true;

    const user = users[currentIndex];
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let translateX, translateY, rotation;

    switch (direction) {
        case 'right':
            translateX = screenWidth;
            translateY = 100;
            rotation = 30;
            break;
        case 'left':
            translateX = -screenWidth;
            translateY = 100;
            rotation = -30;
            break;
        case 'super':
            translateX = 0;
            translateY = -screenHeight;
            rotation = 0;
            break;
    }

    currentCard.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    currentCard.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`;

    // 随机触发匹配成功（30%概率）
    const shouldMatch = direction !== 'left' && Math.random() < 0.3;

    setTimeout(() => {
        currentCard.remove();
        currentIndex++;

        if (shouldMatch) {
            showMatch(user);
        }

        renderCards();
        isAnimating = false;
    }, 500);
}

// 显示匹配成功
function showMatch(user) {
    const myAvatar = 'https://i.pravatar.cc/400?img=33'; // 当前用户头像

    matchAvatars.innerHTML = `
        <img class="match-avatar" src="${myAvatar}" alt="My avatar">
        <img class="match-avatar" src="${user.avatar}" alt="${user.name}">
    `;

    matchOverlay.classList.add('active');

    // 触发简单的庆祝效果
    createConfetti();
}

// 创建简单的庆祝效果
function createConfetti() {
    const colors = ['#FF6B9D', '#7B68EE', '#4ADE80', '#FFD93D', '#FF6B6B'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -10px;
                z-index: 300;
                pointer-events: none;
                animation: fall ${2 + Math.random() * 2}s linear forwards;
            `;

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }

    // 添加fall动画
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 显示用户简介
function showProfile(user) {
    if (!currentCard) return;

    profileContent.innerHTML = `
        <div class="profile-header">
            <img class="profile-avatar" src="${user.avatar}" alt="${user.name}">
            <h2 class="profile-name">${user.name} <span class="profile-age">${user.age}</span></h2>
        </div>
        <div class="profile-bio">${user.bio}</div>
        <div class="profile-section">
            <div class="profile-section-title">兴趣爱好</div>
            <div class="profile-tags">
                ${user.tags.map(tag => `<span class="profile-tag">${tag}</span>`).join('')}
            </div>
        </div>
        <div class="profile-section">
            <div class="profile-section-title">更多照片</div>
            <div class="profile-photos">
                ${user.photos.map(photo => `<img class="profile-photo" src="${photo}" alt="Photo">`).join('')}
            </div>
        </div>
        <div class="profile-actions">
            <button class="profile-action-btn profile-dislike" id="profileDislike">跳过</button>
            <button class="profile-action-btn profile-like" id="profileLike">喜欢</button>
        </div>
    `;

    profileModal.classList.add('active');

    // 绑定按钮事件
    document.getElementById('profileDislike').addEventListener('click', () => {
        profileModal.classList.remove('active');
        swipeCard('left');
    });

    document.getElementById('profileLike').addEventListener('click', () => {
        profileModal.classList.remove('active');
        swipeCard('right');
    });
}

// 设置事件监听
function setupEventListeners() {
    // 底部操作按钮
    document.getElementById('likeBtn').addEventListener('click', () => swipeCard('right'));
    document.getElementById('dislikeBtn').addEventListener('click', () => swipeCard('left'));
    document.getElementById('superLikeBtn').addEventListener('click', () => swipeCard('super'));

    // 查看详情
    document.getElementById('infoBtn').addEventListener('click', () => {
        if (currentIndex < users.length) {
            showProfile(users[currentIndex]);
        }
    });

    // 关闭简介弹窗
    closeProfileModal.addEventListener('click', () => {
        profileModal.classList.remove('active');
    });

    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.classList.remove('active');
        }
    });

    // 匹配成功弹窗
    document.getElementById('continueMatching').addEventListener('click', () => {
        matchOverlay.classList.remove('active');
    });

    document.getElementById('sendMessage').addEventListener('click', () => {
        alert('消息功能开发中...');
        matchOverlay.classList.remove('active');
    });

    // 刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', () => {
        currentIndex = 0;
        renderCards();
    });
}

// 启动应用
init();
