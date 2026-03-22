// ===== 商品数据 =====
const product = {
  basePrice: 299,
  originalPrice: 599,
  specs: {
    colors: [
      { name: '米白色', price: 0 },
      { name: '黑色', price: 0 },
      { name: '雾霾蓝', price: 20 },
      { name: '焦糖色', price: 10 },
    ],
    sizes: [
      { name: 'S', price: 0 },
      { name: 'M', price: 0 },
      { name: 'L', price: 20 },
      { name: 'XL', price: 30 },
      { name: 'XXL', price: 50 },
    ],
  },
  maxQty: 99,
};

// ===== 状态 =====
let selectedColor = 0;
let selectedSize = 0;
let quantity = 1;
let currentSlide = 0;

// ===== 轮播 =====
const track = document.getElementById('carouselTrack');
const dotsContainer = document.getElementById('carouselDots');
const slides = track.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;

// 生成指示点
for (let i = 0; i < totalSlides; i++) {
  const dot = document.createElement('span');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
}

function goToSlide(index) {
  currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  updateDots();
}

function prevSlide() { goToSlide(currentSlide - 1); }
function nextSlide() { goToSlide(currentSlide + 1); }

function updateDots() {
  const dots = dotsContainer.querySelectorAll('.dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

// 触摸滑动支持
let touchStartX = 0;
track.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
track.addEventListener('touchend', (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) {
    diff > 0 ? nextSlide() : prevSlide();
  }
});

// ===== 规格渲染 =====
function renderSpecs() {
  const colorContainer = document.getElementById('colorOptions');
  const sizeContainer = document.getElementById('sizeOptions');

  product.specs.colors.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'spec-btn' + (i === selectedColor ? ' active' : '');
    btn.textContent = c.price ? `${c.name} (+¥${c.price})` : c.name;
    btn.addEventListener('click', () => selectColor(i));
    colorContainer.appendChild(btn);
  });

  product.specs.sizes.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'spec-btn' + (i === selectedSize ? ' active' : '');
    btn.textContent = s.price ? `${s.name} (+¥${s.price})` : s.name;
    btn.addEventListener('click', () => selectSize(i));
    sizeContainer.appendChild(btn);
  });
}

function selectColor(index) {
  selectedColor = index;
  refreshSpecUI();
  updatePrice();
}

function selectSize(index) {
  selectedSize = index;
  refreshSpecUI();
  updatePrice();
}

function refreshSpecUI() {
  document.querySelectorAll('#colorOptions .spec-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === selectedColor);
  });
  document.querySelectorAll('#sizeOptions .spec-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === selectedSize);
  });
}

// ===== 数量 & 价格 =====
function getUnitPrice() {
  const colorExtra = product.specs.colors[selectedColor].price;
  const sizeExtra = product.specs.sizes[selectedSize].price;
  return product.basePrice + colorExtra + sizeExtra;
}

function updatePrice() {
  const unit = getUnitPrice();
  const total = unit * quantity;
  const discount = Math.round((unit / product.originalPrice) * 10);

  document.getElementById('priceValue').textContent = unit;
  document.getElementById('totalPrice').textContent = total;
  document.getElementById('discountTag').textContent = discount + '折';

  document.getElementById('btnMinus').disabled = quantity <= 1;
}

function changeQty(delta) {
  const next = quantity + delta;
  if (next < 1 || next > product.maxQty) return;
  quantity = next;
  document.getElementById('qtyValue').textContent = quantity;
  updatePrice();
}

// ===== 操作 =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
}

function addToCart() {
  const color = product.specs.colors[selectedColor].name;
  const size = product.specs.sizes[selectedSize].name;
  const total = getUnitPrice() * quantity;
  showToast(`已加入购物车: ${color} / ${size} × ${quantity}  ¥${total}`);
}

function buyNow() {
  const color = product.specs.colors[selectedColor].name;
  const size = product.specs.sizes[selectedSize].name;
  const total = getUnitPrice() * quantity;
  showToast(`立即购买: ${color} / ${size} × ${quantity}  ¥${total}`);
}

// ===== 初始化 =====
renderSpecs();
updatePrice();

// 自动轮播（可选，每 4 秒切换）
let autoplay = setInterval(nextSlide, 4000);
document.getElementById('carousel').addEventListener('mouseenter', () => clearInterval(autoplay));
document.getElementById('carousel').addEventListener('mouseleave', () => {
  autoplay = setInterval(nextSlide, 4000);
});
