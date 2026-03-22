// OrbitControls - extracted for Three.js r128
(function() {
  class OrbitControls {
    constructor(camera, domElement) {
      this.camera = camera;
      this.domElement = domElement;
      this.target = new THREE.Vector3();
      this.enableDamping = true;
      this.dampingFactor = 0.08;
      this.rotateSpeed = 0.6;
      this.zoomSpeed = 1.0;
      this.panSpeed = 0.5;
      this.minDistance = 1.5;
      this.maxDistance = 8;
      this.minPolarAngle = 0.2;
      this.maxPolarAngle = Math.PI - 0.1;
      this.autoRotate = false;
      this.autoRotateSpeed = 1.5;
      this.enablePan = true;
      this.enableZoom = true;
      this.enableRotate = true;

      this._spherical = new THREE.Spherical();
      this._sphericalDelta = new THREE.Spherical();
      this._panOffset = new THREE.Vector3();
      this._rotateStart = new THREE.Vector2();
      this._rotateEnd = new THREE.Vector2();
      this._panStart = new THREE.Vector2();
      this._panEnd = new THREE.Vector2();
      this._state = null;
      this._autoRotateAngle = 0;

      this._offset = new THREE.Vector3();
      this._quat = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
      this._quatInverse = this._quat.clone().invert();

      this._bindEvents();
      this.update();
    }

    _bindEvents() {
      this.domElement.addEventListener('pointerdown', e => this._onPointerDown(e));
      this.domElement.addEventListener('pointermove', e => this._onPointerMove(e));
      this.domElement.addEventListener('pointerup', e => this._onPointerUp(e));
      this.domElement.addEventListener('wheel', e => this._onWheel(e), { passive: false });
      this.domElement.addEventListener('contextmenu', e => e.preventDefault());
    }

    _onPointerDown(e) {
      if (e.button === 0 && e.shiftKey) {
        this._state = 'pan';
        this._panStart.set(e.clientX, e.clientY);
      } else if (e.button === 0) {
        this._state = 'rotate';
        this._rotateStart.set(e.clientX, e.clientY);
      } else if (e.button === 2) {
        this._state = 'pan';
        this._panStart.set(e.clientX, e.clientY);
      }
    }

    _onPointerMove(e) {
      if (this._state === 'rotate') {
        this._rotateEnd.set(e.clientX, e.clientY);
        const dx = (this._rotateEnd.x - this._rotateStart.x) * this.rotateSpeed * 0.01;
        const dy = (this._rotateEnd.y - this._rotateStart.y) * this.rotateSpeed * 0.01;
        this._sphericalDelta.theta -= dx;
        this._sphericalDelta.phi -= dy;
        this._rotateStart.copy(this._rotateEnd);
      } else if (this._state === 'pan') {
        this._panEnd.set(e.clientX, e.clientY);
        const dx = (this._panEnd.x - this._panStart.x) * this.panSpeed * 0.002;
        const dy = (this._panEnd.y - this._panStart.y) * this.panSpeed * 0.002;
        const offset = new THREE.Vector3();
        offset.copy(this.camera.position).sub(this.target);
        const targetDistance = offset.length();
        const fov = this.camera.fov * Math.PI / 180;
        const panY = 2 * dx * targetDistance * Math.tan(fov / 2);
        const panX = 2 * dy * targetDistance * Math.tan(fov / 2);
        const v = new THREE.Vector3();
        v.setFromMatrixColumn(this.camera.matrix, 0);
        this._panOffset.addScaledVector(v, -panY);
        v.setFromMatrixColumn(this.camera.matrix, 1);
        this._panOffset.addScaledVector(v, panX);
        this._panStart.copy(this._panEnd);
      }
    }

    _onPointerUp() {
      this._state = null;
    }

    _onWheel(e) {
      e.preventDefault();
      if (!this.enableZoom) return;
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      this._sphericalDelta.radius *= factor;
    }

    update() {
      this._offset.copy(this.camera.position).sub(this.target);
      this._offset.applyQuaternion(this._quat);
      this._spherical.setFromVector3(this._offset);

      if (this.autoRotate) {
        this._autoRotateAngle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
        this._sphericalDelta.theta -= this._autoRotateAngle;
      }

      this._spherical.theta += this._sphericalDelta.theta;
      this._spherical.phi += this._sphericalDelta.phi;
      this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
      this._spherical.makeSafe();

      if (this._sphericalDelta.radius !== 0) {
        this._spherical.radius *= (1 / (1 + (1 - this._sphericalDelta.radius) * 0.3));
      }
      this._spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical.radius));
      this._sphericalDelta.radius = 1;

      this.target.add(this._panOffset);

      this._offset.setFromSpherical(this._spherical);
      this._offset.applyQuaternion(this._quatInverse);
      this.camera.position.copy(this.target).add(this._offset);
      this.camera.lookAt(this.target);

      if (this.enableDamping) {
        this._sphericalDelta.theta *= (1 - this.dampingFactor);
        this._sphericalDelta.phi *= (1 - this.dampingFactor);
        this._panOffset.multiplyScalar(1 - this.dampingFactor);
      } else {
        this._sphericalDelta.set(1, 0, 0);
        this._panOffset.set(0, 0, 0);
      }
    }

    reset(radius, theta, phi) {
      this._spherical.radius = radius;
      this._spherical.theta = theta;
      this._spherical.phi = phi;
      this.target.set(0, 0.8, 0);
      this.camera.position.setFromSpherical(this._spherical).add(this.target);
    }
  }
  window.OrbitControls = OrbitControls;
})();
