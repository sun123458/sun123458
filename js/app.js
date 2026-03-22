// app.js - Main application controller
(function() {
  let scene, camera, renderer, controls, clothSim, mannequin, garmentFactory;
  let wireframeMode = false;
  let autoRotating = false;

  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 6, 12);

    // Camera
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.8, 3);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.target.set(0, 0.4, 0);
    controls.minDistance = 1.5;
    controls.maxDistance = 5;

    // Lighting
    _setupLighting();

    // Floor
    _setupFloor();

    // Mannequin
    mannequin = new Mannequin(scene);

    // Cloth simulation
    clothSim = new ClothSimulation(scene);

    // Garment factory
    garmentFactory = new GarmentFactory(clothSim, mannequin);

    // Build UI
    _buildGarmentUI();

    // Event listeners
    _setupEvents();

    // Default garment
    setTimeout(() => {
      garmentFactory.createGarment('tshirt', 0);
      _updateUI('tshirt', 0);
      _hideLoading();
    }, 500);

    // Start animation loop
    animate();
  }

  function _setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffeedd, 0.3);
    scene.add(ambient);

    // Main key light
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    keyLight.position.set(3, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xc0d0ff, 0.3);
    fillLight.position.set(-2, 3, -2);
    scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffd0a0, 0.4);
    rimLight.position.set(-1, 2, -3);
    scene.add(rimLight);

    // Spot for dramatic effect
    const spot = new THREE.SpotLight(0xffeedd, 0.5, 8, Math.PI / 6, 0.5);
    spot.position.set(0, 4, 1);
    spot.target.position.set(0, 0.5, 0);
    scene.add(spot);
    scene.add(spot.target);
  }

  function _setupFloor() {
    // Circular platform
    const floorGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.06, 64);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a22,
      roughness: 0.2,
      metalness: 0.3,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.93;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ring glow
    const ringGeo = new THREE.TorusGeometry(1.25, 0.005, 8, 128);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.90;
    scene.add(ring);

    // Grid
    const gridHelper = new THREE.GridHelper(6, 30, 0x151520, 0x151520);
    gridHelper.position.y = -0.93;
    scene.add(gridHelper);
  }

  function _buildGarmentUI() {
    const grid = document.getElementById('garmentGrid');
    grid.innerHTML = '';

    const types = ['tshirt', 'jacket', 'dress', 'suit', 'skirt'];
    for (const type of types) {
      const g = garmentFactory.garments[type];
      const card = document.createElement('div');
      card.className = 'garment-card';
      card.dataset.type = type;
      card.innerHTML = `
        <div class="garment-icon" style="background:${g.iconBg}">${g.icon}</div>
        <div class="garment-info">
          <div class="garment-name">${g.name}</div>
          <div class="garment-desc">${g.desc}</div>
          <span class="garment-tag">${g.tag}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        const colorIdx = _getActiveColorIndex();
        garmentFactory.createGarment(type, colorIdx);
        _updateUI(type, colorIdx);
        _showToast(`已试穿: ${g.name}`);
      });
      grid.appendChild(card);
    }
  }

  function _updateUI(activeType, colorIndex) {
    // Update garment cards
    document.querySelectorAll('.garment-card').forEach(card => {
      card.classList.toggle('active', card.dataset.type === activeType);
    });

    // Update color swatches
    const section = document.getElementById('colorSection');
    const garment = garmentFactory.garments[activeType];
    if (garment) {
      section.style.display = 'block';
      const swatches = document.getElementById('colorSwatches');
      swatches.innerHTML = '';
      garment.colors.forEach((c, i) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch' + (i === colorIndex ? ' active' : '');
        swatch.style.background = c.hex;
        swatch.title = c.name;
        swatch.addEventListener('click', () => {
          garmentFactory.changeColor(i);
          document.querySelectorAll('.color-swatch').forEach((s, j) => {
            s.classList.toggle('active', j === i);
          });
        });
        swatches.appendChild(swatch);
      });
    }

    // Size selector
    const sizeSection = document.getElementById('sizeSection');
    if (sizeSection) {
      sizeSection.style.display = 'block';
      const sizeOptions = document.getElementById('sizeOptions');
      sizeOptions.innerHTML = '';
      ['S', 'M', 'L', 'XL'].forEach((size, i) => {
        const btn = document.createElement('div');
        btn.className = 'size-btn' + (i === 1 ? ' active' : '');
        btn.textContent = size;
        btn.addEventListener('click', () => {
          const scaleFactor = { S: 0.92, M: 1.0, L: 1.08, XL: 1.15 }[size];
          mannequin.setScale(scaleFactor);
          document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          // Recreate garment with new scale
          if (garmentFactory.currentType) {
            const ci = _getActiveColorIndex();
            garmentFactory.createGarment(garmentFactory.currentType, ci);
          }
        });
        sizeOptions.appendChild(btn);
      });
    }
  }

  function _getActiveColorIndex() {
    const active = document.querySelector('.color-swatch.active');
    if (!active) return 0;
    const swatches = Array.from(document.querySelectorAll('.color-swatch'));
    return swatches.indexOf(active);
  }

  function _setupEvents() {
    // Auto rotate
    document.getElementById('btnAutoRotate').addEventListener('click', function() {
      autoRotating = !autoRotating;
      controls.autoRotate = autoRotating;
      this.classList.toggle('active', autoRotating);
    });

    // Reset
    document.getElementById('btnReset').addEventListener('click', () => {
      controls.reset(3, 0, Math.PI / 2.5);
      _showToast('视角已重置');
    });

    // Wireframe
    document.getElementById('btnWireframe').addEventListener('click', function() {
      wireframeMode = !wireframeMode;
      mannequin.toggleWireframe(wireframeMode);
      garmentFactory.toggleWireframe(wireframeMode);
      this.classList.toggle('active', wireframeMode);
    });

    // Screenshot
    document.getElementById('btnScreenshot').addEventListener('click', () => {
      renderer.render(scene, camera);
      const link = document.createElement('a');
      link.download = 'virtual-fitting-' + Date.now() + '.png';
      link.href = renderer.domElement.toDataURL('image/png');
      link.click();
      _showToast('截图已保存');
    });

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Subtle wind effect on mouse
    let mouseX = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      switch(e.key) {
        case '1': _triggerGarment('tshirt'); break;
        case '2': _triggerGarment('jacket'); break;
        case '3': _triggerGarment('dress'); break;
        case '4': _triggerGarment('suit'); break;
        case '5': _triggerGarment('skirt'); break;
        case 'r': document.getElementById('btnAutoRotate').click(); break;
        case 'w': document.getElementById('btnWireframe').click(); break;
      }
    });
  }

  function _triggerGarment(type) {
    const ci = _getActiveColorIndex();
    garmentFactory.createGarment(type, ci);
    _updateUI(type, ci);
    _showToast(`已试穿: ${garmentFactory.garments[type].name}`);
  }

  function _showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function _hideLoading() {
    setTimeout(() => {
      document.getElementById('loading').classList.add('hidden');
    }, 300);
  }

  let frameCount = 0;
  function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    // Wind follows mouse subtly
    const windStrength = 0.0003 + Math.sin(frameCount * 0.01) * 0.0001;
    const windX = Math.sin(frameCount * 0.005) * windStrength;
    clothSim.setWind(new THREE.Vector3(windX, 0, windStrength * 0.5), windStrength * 2);

    // Simulate cloth
    clothSim.simulate(mannequin.bodySpheres);

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
