/* ============================================
   AR 虚拟展厅 - AR展示逻辑
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // Exhibit Data
  // ============================================
  var exhibits = [
    {
      id: 'globe',
      name: '旋转地球仪',
      era: '2024',
      desc: '动态旋转的地球模型，展示全球地理信息。蓝色海洋与绿色大陆交织，展现我们赖以生存的美丽星球。',
      color: '#4FC3F7'
    },
    {
      id: 'crystal',
      name: '水晶矩阵',
      era: '当代艺术',
      desc: '半透明水晶立方体阵列，折射出璀璨光芒。每个水晶体拥有独特的角度与透明度，共同构成 harmony 的视觉诗篇。',
      color: '#CE93D8'
    },
    {
      id: 'temple',
      name: '古代神殿',
      era: '公元前500年',
      desc: '古希腊风格神殿复原模型。多立克柱式支撑的三角楣，见证了古典建筑的永恒之美。',
      color: '#FFCC80'
    },
    {
      id: 'dna',
      name: 'DNA双螺旋',
      era: '生命科学',
      desc: '脱氧核糖核酸三维结构展示。两条互补的核苷酸链以优雅的螺旋结构缠绕，承载着生命的遗传密码。',
      color: '#80CBC4'
    }
  ];

  var currentExhibit = 'globe';
  var isInfoPanelVisible = false;

  // ============================================
  // Three.js helpers via A-Frame
  // ============================================

  /**
   * Create crystal matrix exhibit
   * Generates an array of translucent cubes
   */
  function createCrystalMatrix(scene) {
    // Clear previous content
    while (scene.firstChild) {
      scene.removeChild(scene.firstChild);
    }

    var matrixSize = 3;
    var spacing = 0.35;
    var offset = (matrixSize - 1) * spacing / 2;

    for (var x = 0; x < matrixSize; x++) {
      for (var y = 0; y < matrixSize; y++) {
        for (var z = 0; z < matrixSize; z++) {
          var cube = document.createElement('a-box');
          var posX = x * spacing - offset;
          var posY = y * spacing + 0.3;
          var posZ = z * spacing - offset;

          cube.setAttribute('position', posX + ' ' + posY + ' ' + posZ);
          cube.setAttribute('width', '0.2');
          cube.setAttribute('height', '0.2');
          cube.setAttribute('depth', '0.2');

          var opacity = 0.3 + Math.random() * 0.4;
          var hue = 270 + (x + y + z) * 10;
          cube.setAttribute('material', 'color: hsl(' + hue + ', 70%, 70%); opacity: ' + opacity + '; transparent: true; side: double');

          // Floating animation
          var delay = (x + y + z) * 100;
          cube.setAttribute('animation', 'property: position; to: ' + posX + ' ' + (posY + 0.1) + ' ' + posZ + '; dir: alternate; loop: true; dur: ' + (1500 + delay) + '; easing: easeInOutSine');

          // Rotation
          cube.setAttribute('animation__rot', 'property: rotation; to: ' + (x * 45) + ' ' + (y * 60) + ' ' + (z * 30) + '; loop: true; dur: ' + (3000 + delay) + '; easing: linear');

          scene.appendChild(cube);
        }
      }
    }

    // Wireframe outer box
    var wireBox = document.createElement('a-box');
    wireBox.setAttribute('position', '0 0.5 0');
    wireBox.setAttribute('width', String(matrixSize * spacing + 0.1));
    wireBox.setAttribute('height', String(matrixSize * spacing + 0.1));
    wireBox.setAttribute('depth', String(matrixSize * spacing + 0.1));
    wireBox.setAttribute('material', 'color: #CE93D8; opacity: 0.1; wireframe: true');
    scene.appendChild(wireBox);

    // Lights
    var ambient = document.createElement('a-light');
    ambient.setAttribute('type', 'ambient');
    ambient.setAttribute('color', '#ffffff');
    ambient.setAttribute('intensity', '0.6');
    scene.appendChild(ambient);

    var point = document.createElement('a-light');
    point.setAttribute('type', 'point');
    point.setAttribute('color', '#CE93D8');
    point.setAttribute('intensity', '0.8');
    point.setAttribute('position', '1 2 1');
    scene.appendChild(point);
  }

  /**
   * Create temple exhibit
   * Greek-style temple with columns and pediment
   */
  function createTemple(scene) {
    while (scene.firstChild) {
      scene.removeChild(scene.firstChild);
    }

    var columnRadius = 0.04;
    var columnHeight = 0.6;
    var spacing = 0.2;
    var columns = 6;
    var startX = -(columns - 1) * spacing / 2;

    // Platform
    var platform = document.createElement('a-box');
    platform.setAttribute('position', '0 0.05 0');
    platform.setAttribute('width', '1.4');
    platform.setAttribute('height', '0.1');
    platform.setAttribute('depth', '0.8');
    platform.setAttribute('material', 'color: #D7CCC8; roughness: 0.9');
    scene.appendChild(platform);

    // Steps
    for (var s = 0; s < 3; s++) {
      var step = document.createElement('a-box');
      step.setAttribute('position', '0 ' + (-0.02 - s * 0.03) + ' ' + (0.5 + s * 0.06));
      step.setAttribute('width', String(1.4 + s * 0.1));
      step.setAttribute('height', '0.03');
      step.setAttribute('depth', '0.1');
      step.setAttribute('material', 'color: #BCAAA4; roughness: 0.9');
      scene.appendChild(step);
    }

    // Front and back columns
    for (var row = 0; row < 2; row++) {
      var zPos = row === 0 ? -0.3 : 0.3;
      for (var i = 0; i < columns; i++) {
        var col = document.createElement('a-cylinder');
        col.setAttribute('position', (startX + i * spacing) + ' ' + (0.1 + columnHeight / 2) + ' ' + zPos);
        col.setAttribute('radius', columnRadius);
        col.setAttribute('height', columnHeight);
        col.setAttribute('material', 'color: #EFEBE9; roughness: 0.7; metalness: 0.1');
        scene.appendChild(col);

        // Column capital
        var cap = document.createElement('a-cylinder');
        cap.setAttribute('position', (startX + i * spacing) + ' ' + (0.1 + columnHeight + 0.02) + ' ' + zPos);
        cap.setAttribute('radius', String(columnRadius * 1.5));
        cap.setAttribute('height', '0.04');
        cap.setAttribute('material', 'color: #D7CCC8; roughness: 0.7');
        scene.appendChild(cap);
      }
    }

    // Roof (entablature + pediment)
    var entab = document.createElement('a-box');
    entab.setAttribute('position', '0 ' + (0.1 + columnHeight + 0.06) + ' 0');
    entab.setAttribute('width', '1.2');
    entab.setAttribute('height', '0.06');
    entab.setAttribute('depth', '0.8');
    entab.setAttribute('material', 'color: #D7CCC8; roughness: 0.8');
    scene.appendChild(entab);

    // Triangular pediment (front) - using a transformed box
    var pediment = document.createElement('a-entity');
    pediment.setAttribute('position', '0 ' + (0.1 + columnHeight + 0.15) + ' 0');

    var left = document.createElement('a-box');
    left.setAttribute('position', '-0.4 0 -0.4');
    left.setAttribute('width', '0.56');
    left.setAttribute('height', '0.04');
    left.setAttribute('depth', '0.01');
    left.setAttribute('rotation', '0 0 30');
    left.setAttribute('material', 'color: #FFCC80; roughness: 0.8');
    pediment.appendChild(left);

    var right = document.createElement('a-box');
    right.setAttribute('position', '0.4 0 -0.4');
    right.setAttribute('width', '0.56');
    right.setAttribute('height', '0.04');
    right.setAttribute('depth', '0.01');
    right.setAttribute('rotation', '0 0 -30');
    right.setAttribute('material', 'color: #FFCC80; roughness: 0.8');
    pediment.appendChild(right);

    var top = document.createElement('a-box');
    top.setAttribute('position', '0 0.15 -0.4');
    top.setAttribute('width', '0.5');
    top.setAttribute('height', '0.04');
    top.setAttribute('depth', '0.01');
    top.setAttribute('material', 'color: #FFCC80; roughness: 0.8');
    pediment.appendChild(top);

    scene.appendChild(pediment);

    // Lights
    var ambient = document.createElement('a-light');
    ambient.setAttribute('type', 'ambient');
    ambient.setAttribute('color', '#ffffff');
    ambient.setAttribute('intensity', '0.7');
    scene.appendChild(ambient);

    var sun = document.createElement('a-light');
    sun.setAttribute('type', 'directional');
    sun.setAttribute('color', '#FFF8E1');
    sun.setAttribute('intensity', '0.8');
    sun.setAttribute('position', '2 3 1');
    scene.appendChild(sun);
  }

  /**
   * Create DNA double helix exhibit
   * Two intertwining spirals with connecting rungs
   */
  function createDNAHelix(scene) {
    while (scene.firstChild) {
      scene.removeChild(scene.firstChild);
    }

    var steps = 20;
    var radius = 0.2;
    var heightPerStep = 0.06;
    var totalHeight = steps * heightPerStep;
    var spheresPerStrand = steps;
    var rungsInterval = 3;

    var strand1Group = document.createElement('a-entity');
    strand1Group.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear');

    var strand2Group = document.createElement('a-entity');
    strand2Group.setAttribute('animation', 'property: rotation; to: 0 -360 0; loop: true; dur: 8000; easing: linear');

    // Create backbone spheres for strand 1
    for (var i = 0; i < spheresPerStrand; i++) {
      var angle = (i / spheresPerStrand) * Math.PI * 4; // 2 full turns
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;
      var y = -totalHeight / 2 + i * heightPerStep;

      var sphere = document.createElement('a-sphere');
      sphere.setAttribute('position', x + ' ' + (y + 0.8) + ' ' + z);
      sphere.setAttribute('radius', '0.04');
      sphere.setAttribute('material', 'color: #4FC3F7; metalness: 0.3; roughness: 0.5');
      strand1Group.appendChild(sphere);

      // Backbone connectors
      if (i > 0) {
        var prevAngle = ((i - 1) / spheresPerStrand) * Math.PI * 4;
        var px = Math.cos(prevAngle) * radius;
        var pz = Math.sin(prevAngle) * radius;
        var py = -totalHeight / 2 + (i - 1) * heightPerStep;

        var dx = x - px;
        var dy = y - py;
        var dz = z - pz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        var connector = document.createElement('a-cylinder');
        connector.setAttribute('position', (px + x) / 2 + ' ' + ((py + y) / 2 + 0.8) + ' ' + ((pz + z) / 2));
        connector.setAttribute('radius', '0.015');
        connector.setAttribute('height', dist);
        // Point from dx,dz direction
        connector.setAttribute('material', 'color: #29B6F6; opacity: 0.7');
        connector.setAttribute('rotation', '90 0 0');
        strand1Group.appendChild(connector);
      }

      // Strand 2 (opposite phase)
      var angle2 = angle + Math.PI;
      var x2 = Math.cos(angle2) * radius;
      var z2 = Math.sin(angle2) * radius;

      var sphere2 = document.createElement('a-sphere');
      sphere2.setAttribute('position', x2 + ' ' + (y + 0.8) + ' ' + z2);
      sphere2.setAttribute('radius', '0.04');
      sphere2.setAttribute('material', 'color: #80CBC4; metalness: 0.3; roughness: 0.5');
      strand2Group.appendChild(sphere2);

      // Connecting rungs (base pairs)
      if (i % rungsInterval === 0) {
        var rung = document.createElement('a-box');
        rung.setAttribute('position', (x + x2) / 2 + ' ' + (y + 0.8) + ' ' + (z + z2) / 2);
        var rungLen = Math.sqrt((x - x2) * (x - x2) + (z - z2) * (z - z2));
        rung.setAttribute('width', String(rungLen));
        rung.setAttribute('height', '0.02');
        rung.setAttribute('depth', '0.02');

        var colors = ['#EF5350', '#FF7043', '#FFCA28', '#66BB6A', '#42A5F5'];
        rung.setAttribute('material', 'color: ' + colors[i % colors.length] + '; opacity: 0.8');
        rung.setAttribute('rotation', '0 ' + (-angle * 180 / Math.PI) + ' 0');
        scene.appendChild(rung);
      }
    }

    scene.appendChild(strand1Group);
    scene.appendChild(strand2Group);

    // Lights
    var ambient = document.createElement('a-light');
    ambient.setAttribute('type', 'ambient');
    ambient.setAttribute('color', '#ffffff');
    ambient.setAttribute('intensity', '0.6');
    scene.appendChild(ambient);

    var point = document.createElement('a-light');
    point.setAttribute('type', 'point');
    point.setAttribute('color', '#80CBC4');
    point.setAttribute('intensity', '0.5');
    point.setAttribute('position', '1 2 1');
    scene.appendChild(point);
  }

  // ============================================
  // Exhibit Switching
  // ============================================
  function getContainer() {
    return document.getElementById('exhibit-container');
  }

  function clearContainer(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function switchExhibitContent(exhibitId) {
    var container = getContainer();
    if (!container) return;
    clearContainer(container);

    switch (exhibitId) {
      case 'globe':
        buildGlobe(container);
        break;
      case 'crystal':
        buildCrystal(container);
        break;
      case 'temple':
        buildTemple(container);
        break;
      case 'dna':
        buildDNA(container);
        break;
    }
  }

  function buildGlobe(container) {
    container.setAttribute('position', '0 0.5 0');
    container.setAttribute('scale', '0.6 0.6 0.6');
    container.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear');

    // Earth
    var sphere = document.createElement('a-sphere');
    sphere.setAttribute('position', '0 0 0');
    sphere.setAttribute('radius', '0.5');
    sphere.setAttribute('material', 'color: #1565C0; metalness: 0.3; roughness: 0.7; opacity: 0.95');
    container.appendChild(sphere);

    // Continents
    var contPositions = [
      [0.1, 0.1, 0.35, 0.15],
      [-0.15, -0.05, 0.3, 0.12],
      [0.25, -0.1, 0.15, 0.1],
      [-0.3, 0.15, 0.1, 0.18],
      [-0.15, 0.2, -0.2, 0.14],
      [0.2, -0.25, -0.15, 0.11]
    ];
    contPositions.forEach(function (p) {
      var c = document.createElement('a-sphere');
      c.setAttribute('position', p[0] + ' ' + p[1] + ' ' + p[2]);
      c.setAttribute('radius', String(p[3]));
      c.setAttribute('material', 'color: #2E7D32; opacity: 0.8');
      container.appendChild(c);
    });

    // Atmosphere
    var atmo = document.createElement('a-sphere');
    atmo.setAttribute('position', '0 0 0');
    atmo.setAttribute('radius', '0.55');
    atmo.setAttribute('material', 'color: #42A5F5; opacity: 0.15; side: double');
    container.appendChild(atmo);

    // Base
    var base = document.createElement('a-cylinder');
    base.setAttribute('position', '0 -0.65 0');
    base.setAttribute('radius', '0.15');
    base.setAttribute('height', '0.1');
    base.setAttribute('material', 'color: #37474F; metalness: 0.6; roughness: 0.3');
    container.appendChild(base);

    var stand = document.createElement('a-cylinder');
    stand.setAttribute('position', '0 -0.55 0');
    stand.setAttribute('radius', '0.03');
    stand.setAttribute('height', '0.15');
    stand.setAttribute('material', 'color: #546E7A; metalness: 0.7; roughness: 0.2');
    container.appendChild(stand);

    addLights(container);
  }

  function buildCrystal(container) {
    container.setAttribute('position', '0 0.5 0');
    container.setAttribute('scale', '0.6 0.6 0.6');
    container.removeAttribute('animation');
    createCrystalMatrix(container);
  }

  function buildTemple(container) {
    container.setAttribute('position', '0 0 0');
    container.setAttribute('scale', '0.7 0.7 0.7');
    container.removeAttribute('animation');
    createTemple(container);
  }

  function buildDNA(container) {
    container.setAttribute('position', '0 0 0');
    container.setAttribute('scale', '0.7 0.7 0.7');
    container.removeAttribute('animation');
    createDNAHelix(container);
  }

  function addLights(parent) {
    var ambient = document.createElement('a-light');
    ambient.setAttribute('type', 'ambient');
    ambient.setAttribute('color', '#ffffff');
    ambient.setAttribute('intensity', '0.6');
    parent.appendChild(ambient);

    var point = document.createElement('a-light');
    point.setAttribute('type', 'point');
    point.setAttribute('color', '#6366f1');
    point.setAttribute('intensity', '0.4');
    point.setAttribute('position', '1 2 1');
    parent.appendChild(point);
  }

  // ============================================
  // Info Panel
  // ============================================
  function showInfoPanel(exhibitId) {
    var exhibit = exhibits.find(function (e) { return e.id === exhibitId; });
    if (!exhibit) return;

    var panel = document.getElementById('infoPanel');
    var title = document.getElementById('infoPanelTitle');
    var era = document.getElementById('infoPanelEra');
    var desc = document.getElementById('infoPanelDesc');

    title.textContent = exhibit.name;
    era.textContent = exhibit.era;
    desc.textContent = exhibit.desc;

    panel.classList.add('show');
    isInfoPanelVisible = true;
  }

  function hideInfoPanel() {
    var panel = document.getElementById('infoPanel');
    panel.classList.remove('show');
    isInfoPanelVisible = false;
  }

  // Make global
  window.switchExhibit = function (exhibitId) {
    currentExhibit = exhibitId;

    // Update nav items
    var navItems = document.querySelectorAll('.ar-nav-item');
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.exhibit === exhibitId);
    });

    // Switch exhibit content
    switchExhibitContent(exhibitId);

    // Show info panel
    showInfoPanel(exhibitId);
  };

  window.hideInfoPanel = hideInfoPanel;

  // ============================================
  // AR Status & Scanner Frame
  // ============================================
  function initARStatus() {
    var markerHiro = document.getElementById('marker-hiro');
    var status = document.getElementById('arStatus');
    var scannerFrame = document.getElementById('scannerFrame');
    var loading = document.getElementById('arLoading');

    if (!markerHiro) return;

    markerHiro.addEventListener('markerFound', function () {
      if (status) {
        status.innerHTML = '<i class="fas fa-circle" style="font-size: 6px; color: #4CAF50;"></i> 标记已识别';
      }
      if (scannerFrame) {
        scannerFrame.classList.add('found');
      }
      if (loading && !loading.classList.contains('hidden')) {
        loading.classList.add('hidden');
      }
    });

    markerHiro.addEventListener('markerLost', function () {
      if (status) {
        status.innerHTML = '<i class="fas fa-circle" style="font-size: 6px; color: #f44336;"></i> 等待扫描';
      }
      if (scannerFrame) {
        scannerFrame.classList.remove('found');
      }
    });

    // Click on exhibit entity to show info
    markerHiro.addEventListener('click', function () {
      if (!isInfoPanelVisible) {
        showInfoPanel(currentExhibit);
      } else {
        hideInfoPanel();
      }
    });
  }

  // ============================================
  // Loading handling
  // ============================================
  function initLoading() {
    var loading = document.getElementById('arLoading');
    var loadingText = document.getElementById('loadingText');

    var messages = [
      '正在加载AR场景...',
      '初始化摄像头...',
      '准备标记检测...',
      '即将就绪...'
    ];

    var msgIndex = 0;
    var msgInterval = setInterval(function () {
      msgIndex++;
      if (msgIndex < messages.length && loadingText) {
        loadingText.textContent = messages[msgIndex];
      }
    }, 2000);

    // Auto-hide after scene is ready
    function checkReady() {
      var scene = document.querySelector('a-scene');
      if (scene && scene.hasLoaded) {
        clearInterval(msgInterval);
        setTimeout(function () {
          if (loading) {
            loading.classList.add('hidden');
          }
          // Activate scanning animation
          var scannerFrame = document.getElementById('scannerFrame');
          if (scannerFrame) {
            scannerFrame.classList.add('scanning');
          }
        }, 1000);
      } else {
        setTimeout(checkReady, 500);
      }
    }

    setTimeout(checkReady, 1000);
  }

  // ============================================
  // Initialize everything
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    initLoading();
    initARStatus();

    // Build initial exhibit (globe)
    switchExhibitContent('globe');

    // Initially show info panel for globe
    setTimeout(function () {
      showInfoPanel('globe');
    }, 3000);
  });
})();
