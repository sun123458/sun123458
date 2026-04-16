// Sample user data
const users = [
    {
        id: 1,
        name: "小美",
        age: 23,
        location: "上海",
        bio: "热爱生活的独立女孩，喜欢咖啡、旅行和摄影。寻找有趣的灵魂一起探索世界~",
        tags: ["旅行", "摄影", "咖啡控", "文艺青年"],
        info: {
            height: "165cm",
            job: "设计师",
            education: "本科"
        },
        avatar: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
    },
    {
        id: 2,
        name: "阿杰",
        age: 26,
        location: "北京",
        bio: "程序猿一枚，平时喜欢健身和打游戏。不油腻，会做饭，期待遇到那个对的人。",
        tags: ["健身", "游戏", "做饭", "科技"],
        info: {
            height: "178cm",
            job: "程序员",
            education: "硕士"
        },
        avatar: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    },
    {
        id: 3,
        name: "雨桐",
        age: 24,
        location: "深圳",
        bio: "刚毕业的设计师，喜欢画画和撸猫。希望能认识志同道合的朋友~",
        tags: ["画画", "猫奴", "设计", "美食"],
        info: {
            height: "162cm",
            job: "UI设计师",
            education: "本科"
        },
        avatar: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    },
    {
        id: 4,
        name: "子轩",
        age: 25,
        location: "杭州",
        bio: "喜欢户外运动和美食探店。周末常去爬山骑行，希望能一起享受生活~",
        tags: ["户外", "美食", "骑行", "爬山"],
        info: {
            height: "175cm",
            job: "产品经理",
            education: "硕士"
        },
        avatar: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"
    },
    {
        id: 5,
        name: "思琪",
        age: 22,
        location: "成都",
        bio: "热爱美食和旅行的可爱女生，火锅是我的最爱！寻找能一起吃遍大街小巷的饭搭子~",
        tags: ["美食", "火锅", "旅行", "追剧"],
        info: {
            height: "160cm",
            job: "学生",
            education: "本科在读"
        },
        avatar: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)"
    }
];

// App state
let currentIndex = 0;
let matchCount = 0;
let currentCard = null;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// DOM elements
const cardContainer = document.getElementById('cardContainer');
const profileModal = document.getElementById('profileModal');
const matchBanner = document.getElementById('matchBanner');
const emptyState = document.getElementById('emptyState');
const matchCountEl = document.getElementById('matchCount');

// Initialize app
function init() {
    renderCards();
    setupEventListeners();
}

// Render cards
function renderCards() {
    cardContainer.innerHTML = '';

    // Show empty state if no users left
    if (currentIndex >= users.length) {
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    // Render remaining cards (stacked)
    const visibleUsers = users.slice(currentIndex);
    const maxVisible = Math.min(visibleUsers.length, 3);

    for (let i = maxVisible - 1; i >= 0; i--) {
        const user = visibleUsers[i];
        const card = createCard(user, i === 0);
        cardContainer.appendChild(card);

        if (i === 0) {
            currentCard = card;
        }
    }
}

// Create card element
function createCard(user, isTop = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.userId = user.id;

    if (!isTop) {
        card.style.transform = `scale(${1 - (users.length - 1 - currentIndex) * 0.05})`;
        card.style.zIndex = users.length - currentIndex;
    } else {
        card.style.zIndex = 100;
        card.style.animation = 'cardEnter 0.4s ease';
    }

    card.innerHTML = `
        <img class="card-image" src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}" alt="${user.name}" style="object-fit: cover;">
        <div class="card-info">
            <div>
                <span class="card-name">${user.name}</span>
                <span class="card-age">${user.age}</span>
            </div>
            <div class="card-location">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                ${user.location}
            </div>
            <div class="card-tags">
                ${user.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
        ${isTop ? `
            <div class="swipe-indicator like">喜欢</div>
            <div class="swipe-indicator skip">跳过</div>
        ` : ''}
    `;

    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Touch events for card swiping
    cardContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    cardContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    cardContainer.addEventListener('touchend', handleTouchEnd);

    // Mouse events for card swiping
    cardContainer.addEventListener('mousedown', handleMouseDown);

    // Action buttons
    document.getElementById('likeBtn').addEventListener('click', () => handleLike());
    document.getElementById('skipBtn').addEventListener('click', () => handleSkip());
    document.getElementById('infoBtn').addEventListener('click', () => showProfile());

    // Modal
    document.getElementById('modalClose').addEventListener('click', hideProfile);
    document.getElementById('modalLike').addEventListener('click', () => {
        hideProfile();
        setTimeout(handleLike, 300);
    });

    // Match banner
    document.getElementById('keepSwipingBtn').addEventListener('click', hideMatchBanner);
    document.getElementById('sendMessageBtn').addEventListener('click', () => {
        alert('聊天功能即将上线！');
        hideMatchBanner();
    });

    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', () => {
        currentIndex = 0;
        renderCards();
    });

    // Matches button
    document.getElementById('matchesBtn').addEventListener('click', () => {
        if (matchCount > 0) {
            alert(`你有 ${matchCount} 个新匹配！`);
        } else {
            alert('还没有匹配，继续滑动吧~');
        }
    });

    // Window events
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}

// Touch handlers
function handleTouchStart(e) {
    if (!currentCard) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging || !currentCard) return;
    e.preventDefault();

    const touch = e.touches[0];
    currentX = touch.clientX - startX;
    currentY = touch.clientY - startY;

    updateCardPosition();
}

function handleTouchEnd() {
    if (!isDragging || !currentCard) return;
    isDragging = false;
    handleSwipeEnd();
}

// Mouse handlers
function handleMouseDown(e) {
    if (!currentCard) return;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
}

function handleMouseMove(e) {
    if (!isDragging || !currentCard) return;

    currentX = e.clientX - startX;
    currentY = e.clientY - startY;

    updateCardPosition();
}

function handleMouseUp() {
    if (!isDragging || !currentCard) return;
    isDragging = false;
    handleSwipeEnd();
}

// Update card position during drag
function updateCardPosition() {
    if (!currentCard) return;

    const rotation = currentX * 0.1;
    currentCard.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg)`;

    // Update swipe indicators
    const likeIndicator = currentCard.querySelector('.swipe-indicator.like');
    const skipIndicator = currentCard.querySelector('.swipe-indicator.skip');

    if (likeIndicator && skipIndicator) {
        const opacity = Math.min(Math.abs(currentX) / 100, 1);

        if (currentX > 0) {
            likeIndicator.style.opacity = opacity;
            skipIndicator.style.opacity = 0;
        } else {
            likeIndicator.style.opacity = 0;
            skipIndicator.style.opacity = opacity;
        }
    }
}

// Handle swipe end
function handleSwipeEnd() {
    if (!currentCard) return;

    const threshold = 100;

    if (currentX > threshold) {
        // Swipe right - like
        animateCardOut('right');
        handleLikeAction();
    } else if (currentX < -threshold) {
        // Swipe left - skip
        animateCardOut('left');
        handleSkipAction();
    } else {
        // Spring back
        springBackCard();
    }
}

// Spring back animation
function springBackCard() {
    if (!currentCard) return;

    currentCard.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    currentCard.style.transform = 'translateX(0) translateY(0) rotate(0deg)';

    // Reset indicators
    const likeIndicator = currentCard.querySelector('.swipe-indicator.like');
    const skipIndicator = currentCard.querySelector('.swipe-indicator.skip');

    if (likeIndicator) likeIndicator.style.opacity = 0;
    if (skipIndicator) skipIndicator.style.opacity = 0;

    setTimeout(() => {
        if (currentCard) {
            currentCard.style.transition = '';
        }
    }, 300);
}

// Animate card out
function animateCardOut(direction) {
    if (!currentCard) return;

    const translateX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
    const rotation = direction === 'right' ? 30 : -30;

    currentCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    currentCard.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)`;
    currentCard.style.opacity = '0';

    setTimeout(() => {
        currentCard = null;
        currentX = 0;
        currentY = 0;
    }, 400);
}

// Handle like
function handleLike() {
    if (!currentCard) return;
    animateCardOut('right');
    handleLikeAction();
}

// Handle like action
function handleLikeAction() {
    const user = users[currentIndex];

    // Random match chance (30%)
    if (Math.random() < 0.3) {
        setTimeout(() => {
            showMatchBanner(user);
        }, 400);
    }

    setTimeout(() => {
        currentIndex++;
        renderCards();
    }, 400);
}

// Handle skip
function handleSkip() {
    if (!currentCard) return;
    animateCardOut('left');
    handleSkipAction();
}

// Handle skip action
function handleSkipAction() {
    setTimeout(() => {
        currentIndex++;
        renderCards();
    }, 400);
}

// Show profile modal
function showProfile() {
    const user = users[currentIndex];
    if (!user) return;

    document.getElementById('modalAvatar').style.background = user.avatar;
    document.getElementById('modalName').textContent = user.name;
    document.getElementById('modalAge').textContent = `${user.age}岁 · ${user.location}`;
    document.getElementById('modalBio').textContent = user.bio;

    // Tags
    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = user.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    // Info
    const infoContainer = document.getElementById('modalInfo');
    infoContainer.innerHTML = `
        <div class="info-item">
            <label>身高</label>
            <span>${user.info.height}</span>
        </div>
        <div class="info-item">
            <label>职业</label>
            <span>${user.info.job}</span>
        </div>
        <div class="info-item">
            <label>学历</label>
            <span>${user.info.education}</span>
        </div>
        <div class="info-item">
            <label>位置</label>
            <span>${user.location}</span>
        </div>
    `;

    profileModal.classList.add('show');
}

// Hide profile modal
function hideProfile() {
    profileModal.classList.remove('show');
}

// Show match banner
function showMatchBanner(user) {
    const matchAvatar = document.querySelector('.match-avatar');
    matchAvatar.style.background = user.avatar;
    matchBanner.classList.add('show');
    matchCount++;
    matchCountEl.textContent = matchCount;
}

// Hide match banner
function hideMatchBanner() {
    matchBanner.classList.remove('show');
}

// Initialize on load
init();
