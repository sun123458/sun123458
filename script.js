// ===== 倒计时功能 =====
class Countdown {
    constructor(endTime, containerId, options = {}) {
        this.endTime = new Date(endTime).getTime();
        this.container = document.getElementById(containerId);
        this.options = {
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds'),
            ...options
        };
        this.init();
    }

    init() {
        this.update();
        this.timer = setInterval(() => this.update(), 1000);
    }

    update() {
        const now = new Date().getTime();
        const distance = this.endTime - now;

        if (distance < 0) {
            this.stop();
            this.display(0, 0, 0);
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        this.display(hours, minutes, seconds);
    }

    display(hours, minutes, seconds) {
        if (this.options.hours) {
            this.options.hours.textContent = this.padZero(hours);
        }
        if (this.options.minutes) {
            this.options.minutes.textContent = this.padZero(minutes);
        }
        if (this.options.seconds) {
            this.options.seconds.textContent = this.padZero(seconds);
        }
        if (this.container) {
            this.container.textContent = `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
        }
    }

    padZero(num) {
        return num.toString().padStart(2, '0');
    }

    stop() {
        clearInterval(this.timer);
    }
}

// ===== 购物车管理 =====
class ShoppingCart {
    constructor() {
        this.items = [];
        this.count = 0;
        this.init();
    }

    init() {
        this.cartCountElements = document.querySelectorAll('.cart-count, .float-count');
        this.buyButtons = document.querySelectorAll('.buy-btn');
        this.bindEvents();
    }

    bindEvents() {
        this.buyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                this.addProduct(productCard);
            });
        });
    }

    addProduct(productCard) {
        const name = productCard.querySelector('.product-name').textContent;
        const price = productCard.querySelector('.price-value').textContent;

        this.items.push({ name, price });
        this.count++;

        this.updateCartDisplay();
        this.showCartToast();
        this.animateButton();
    }

    updateCartDisplay() {
        this.cartCountElements.forEach(el => {
            el.textContent = this.count;
        });
    }

    showCartToast() {
        const toast = document.getElementById('cartToast');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    animateButton() {
        const cartBtn = document.getElementById('cartFloat');
        cartBtn.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartBtn.style.transform = 'scale(1)';
        }, 200);
    }
}

// ===== 优惠券管理 =====
class CouponManager {
    constructor() {
        this.claimedCoupons = new Set();
        this.init();
    }

    init() {
        this.coupons = document.querySelectorAll('.coupon-item');
        this.bindEvents();
    }

    bindEvents() {
        this.coupons.forEach(coupon => {
            coupon.addEventListener('click', () => {
                this.claimCoupon(coupon);
            });
        });
    }

    claimCoupon(coupon) {
        const couponId = coupon.dataset.id;

        if (this.claimedCoupons.has(couponId)) {
            return;
        }

        this.claimedCoupons.add(couponId);
        coupon.classList.add('claimed');

        const btn = coupon.querySelector('.coupon-btn');
        btn.textContent = '已领取';
        btn.style.background = '#4CAF50';
        btn.style.color = 'white';

        this.showToast();
    }

    showToast() {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}

// ===== 滚动动画 =====
class ScrollAnimation {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupBackToTop();
    }

    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.product-card, .zone-item, .rule-item, .coupon-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            observer.observe(el);
        });
    }

    setupBackToTop() {
        const topBtn = document.getElementById('topFloat');
        const scrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                topBtn.classList.add('visible');
            } else {
                topBtn.classList.remove('visible');
            }
        });

        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ===== 进度条动态更新 =====
class ProgressUpdater {
    constructor() {
        this.init();
    }

    init() {
        this.progressBars = document.querySelectorAll('.progress-fill');
        this.startUpdating();
    }

    startUpdating() {
        setInterval(() => {
            this.progressBars.forEach(bar => {
                let currentWidth = parseFloat(bar.style.width);
                if (currentWidth < 98) {
                    bar.style.width = `${currentWidth + 0.5}%`;
                    const card = bar.closest('.product-card');
                    const text = card.querySelector('.progress-text');
                    text.textContent = `已抢${Math.round(currentWidth + 0.5)}%`;

                    if (currentWidth > 90) {
                        card.querySelector('.buy-btn').textContent = '即将售罄';
                        card.querySelector('.buy-btn').style.background = '#FF9800';
                    }
                }
            });
        }, 3000);
    }
}

// ===== 导航高亮 =====
class NavHighlighter {
    constructor() {
        this.init();
    }

    init() {
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => this.highlight());
    }

    highlight() {
        const scrollY = window.scrollY + 100;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// ===== 触摸滑动效果 =====
class SwipeCards {
    constructor() {
        this.init();
    }

    init() {
        this.setupSwipeEffect();
    }

    setupSwipeEffect() {
        const cards = document.querySelectorAll('.product-card');

        cards.forEach(card => {
            let startX = 0;
            let isDragging = false;

            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            });

            card.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const currentX = e.touches[0].clientX;
                const diff = startX - currentX;
                card.style.transform = `translateX(${-diff * 0.1}px)`;
            });

            card.addEventListener('touchend', () => {
                isDragging = false;
                card.style.transform = '';
            });
        });
    }
}

// ===== 分区活动倒计时 =====
class FlashSaleTimer {
    constructor() {
        this.init();
    }

    init() {
        // 设置2小时倒计时
        const endTime = new Date().getTime() + 2 * 60 * 60 * 1000;
        new Countdown(endTime, 'flashTimer');
    }
}

// ===== 添加CSS动画类 =====
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .product-card.animate-in:nth-child(1) { animation-delay: 0.1s; }
    .product-card.animate-in:nth-child(2) { animation-delay: 0.2s; }
    .product-card.animate-in:nth-child(3) { animation-delay: 0.3s; }
    .product-card.animate-in:nth-child(4) { animation-delay: 0.4s; }
    .product-card.animate-in:nth-child(5) { animation-delay: 0.5s; }
    .product-card.animate-in:nth-child(6) { animation-delay: 0.6s; }
    .product-card.animate-in:nth-child(7) { animation-delay: 0.7s; }
    .product-card.animate-in:nth-child(8) { animation-delay: 0.8s; }

    .zone-item.animate-in:nth-child(1) { animation-delay: 0.1s; }
    .zone-item.animate-in:nth-child(2) { animation-delay: 0.2s; }
    .zone-item.animate-in:nth-child(3) { animation-delay: 0.3s; }
    .zone-item.animate-in:nth-child(4) { animation-delay: 0.4s; }
`;
document.head.appendChild(styleSheet);

// ===== 初始化所有功能 =====
document.addEventListener('DOMContentLoaded', () => {
    // 设置活动结束时间（明天24:00）
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(24, 0, 0, 0);

    // 初始化主倒计时
    new Countdown(endTime, 'countdown', {
        hours: document.getElementById('hours'),
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds')
    });

    // 初始化其他功能
    const cart = new ShoppingCart();
    const coupon = new CouponManager();
    const scrollAnim = new ScrollAnimation();
    const progress = new ProgressUpdater();
    const navHighlight = new NavHighlighter();
    const swipeCards = new SwipeCards();
    const flashTimer = new FlashSaleTimer();

    // CTA按钮点击
    document.querySelector('.cta-btn').addEventListener('click', () => {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });

    // 分区点击效果
    document.querySelectorAll('.zone-item').forEach(zone => {
        zone.addEventListener('click', () => {
            showToast(`进入${zone.querySelector('.zone-label').textContent}`);
        });
    });

    // Toast提示函数
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.querySelector('.toast-text').textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    // 添加按钮点击动画
    document.querySelectorAll('.buy-btn, .coupon-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            ripple.style.width = ripple.style.height = '100px';
            ripple.style.marginLeft = ripple.style.marginTop = '-50px';
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // 添加波纹动画样式
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);
});

// ===== 页面加载动画 =====
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ===== 防止页面抖动 =====
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > lastScrollY ? 'down' : 'up';

    const header = document.querySelector('.header');
    if (direction === 'down' && currentScrollY > 200) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }

    lastScrollY = currentScrollY;
});
