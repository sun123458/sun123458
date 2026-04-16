import { switchGarment, toggleAutoRotate, resetCamera } from './app.js';

function initUI() {
  const garmentButtons = document.querySelectorAll('#garment-bar button');
  garmentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.garment;
      switchGarment(g);
      garmentButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  if (garmentButtons.length) garmentButtons[0].classList.add('active');

  const btnAuto = document.getElementById('btn-autorotate');
  btnAuto.addEventListener('click', () => {
    const on = toggleAutoRotate();
    btnAuto.textContent = `自动旋转: ${on ? '开' : '关'}`;
  });

  const btnReset = document.getElementById('btn-reset');
  btnReset.addEventListener('click', resetCamera);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}
