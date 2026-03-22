// GarmentFactory.js - Creates 5 garment types fitted to the mannequin
class GarmentFactory {
  constructor(clothSim, mannequin) {
    this.clothSim = clothSim;
    this.mannequin = mannequin;
    this.currentGarment = null;
    this.currentType = null;

    this.garments = {
      tshirt: {
        name: '经典T恤',
        desc: '纯棉圆领短袖T恤',
        tag: '休闲',
        iconBg: 'linear-gradient(135deg, #4a90d9, #357abd)',
        icon: '👕',
        colors: [
          { name: '白色', hex: '#f0f0f0' },
          { name: '深蓝', hex: '#1a3a5c' },
          { name: '黑色', hex: '#1a1a1a' },
          { name: '灰色', hex: '#6b6b6b' },
          { name: '红色', hex: '#c0392b' },
        ]
      },
      jacket: {
        name: '休闲夹克',
        desc: '修身拉链休闲夹克',
        tag: '外套',
        iconBg: 'linear-gradient(135deg, #2c3e50, #1a252f)',
        icon: '🧥',
        colors: [
          { name: '深灰', hex: '#2c3e50' },
          { name: '棕色', hex: '#6b4c3b' },
          { name: '黑色', hex: '#111111' },
          { name: '藏蓝', hex: '#1a1a3a' },
          { name: '军绿', hex: '#3d5c3a' },
        ]
      },
      dress: {
        name: '连衣裙',
        desc: '优雅A字修身连衣裙',
        tag: '裙装',
        iconBg: 'linear-gradient(135deg, #e74c8b, #c0392b)',
        icon: '👗',
        colors: [
          { name: '红色', hex: '#c0392b' },
          { name: '黑色', hex: '#1a1a1a' },
          { name: '蓝色', hex: '#2e4a8a' },
          { name: '绿色', hex: '#1a6b4a' },
          { name: '紫色', hex: '#5b2c6f' },
        ]
      },
      suit: {
        name: '西装外套',
        desc: '修身商务休闲西装',
        tag: '正装',
        iconBg: 'linear-gradient(135deg, #2c3e50, #34495e)',
        icon: '🤵',
        colors: [
          { name: '藏青', hex: '#1a2a4a' },
          { name: '黑色', hex: '#0a0a0a' },
          { name: '灰色', hex: '#4a4a4a' },
          { name: '驼色', hex: '#8b7355' },
          { name: '棕色', hex: '#5c3d2e' },
        ]
      },
      skirt: {
        name: '半身短裙',
        desc: '高腰A字修身短裙',
        tag: '下装',
        iconBg: 'linear-gradient(135deg, #8e44ad, #6c3483)',
        icon: '👢',
        colors: [
          { name: '黑色', hex: '#1a1a1a' },
          { name: '卡其', hex: '#c4a882' },
          { name: '白色', hex: '#f0ece4' },
          { name: '酒红', hex: '#722f37' },
          { name: '牛仔蓝', hex: '#3b5998' },
        ]
      }
    };
  }

  createGarment(type, colorIndex = 0) {
    // Remove current garment
    if (this.currentGarment) {
      this.clothSim.removeCloth(this.currentGarment);
      this.clothSim.particles = this.clothSim.particles.filter(p => p !== this.currentGarment);
    }

    const garment = this.garments[type];
    if (!garment) return null;

    const colorHex = garment.colors[colorIndex].hex;
    const color = new THREE.Color(colorHex);

    let clothData;
    switch(type) {
      case 'tshirt':
        clothData = this._createTShirt(color);
        break;
      case 'jacket':
        clothData = this._createJacket(color);
        break;
      case 'dress':
        clothData = this._createDress(color);
        break;
      case 'suit':
        clothData = this._createSuit(color);
        break;
      case 'skirt':
        clothData = this._createSkirt(color);
        break;
    }

    this.currentGarment = clothData;
    this.currentType = type;

    // Let physics settle
    for (let i = 0; i < 60; i++) {
      this.clothSim.simulate(this.mannequin.bodySpheres);
    }

    return clothData;
  }

  changeColor(colorIndex) {
    if (!this.currentType) return;
    const garment = this.garments[this.currentType];
    const color = new THREE.Color(garment.colors[colorIndex].hex);
    this.currentGarment._color = new THREE.Vector3(color.r, color.g, color.b);
  }

  _wrapSelf(clothData, bodySpheres, iterations = 30) {
    for (let i = 0; i < iterations; i++) {
      for (const p of clothData.particles) {
        for (const sphere of bodySpheres) {
          const diff = p.position.clone().sub(sphere.center);
          const dist = diff.length();
          if (dist < sphere.radius + 0.006) {
            diff.normalize().multiplyScalar(sphere.radius + 0.006);
            p.position.copy(sphere.center.clone().add(diff));
            p.previous.copy(p.position);
          }
        }
      }
    }
  }

  _createTShirt(color) {
    const cloth = this.clothSim.createCloth(
      1.6, 0.75, 20, 12,
      {
        position: new THREE.Vector3(0, 0.88, 0),
        rotation: new THREE.Quaternion(),
        scale: 1
      }
    );
    cloth._color = new THREE.Vector3(color.r, color.g, color.b);

    // Pin top row (around neck/shoulders)
    const segW = 20;
    for (let i = 0; i <= segW; i++) {
      cloth.particles[i].pinned = true;
    }

    this._wrapSelf(cloth, this.mannequin.bodySpheres);
    return cloth;
  }

  _createJacket(color) {
    const cloth = this.clothSim.createCloth(
      1.8, 0.85, 24, 14,
      {
        position: new THREE.Vector3(0, 0.88, 0),
        rotation: new THREE.Quaternion(),
        scale: 1
      }
    );
    cloth._color = new THREE.Vector3(color.r, color.g, color.b);

    const segW = 24;
    for (let i = 0; i <= segW; i++) {
      cloth.particles[i].pinned = true;
    }

    // Make jacket slightly stiffer
    for (const c of cloth.constraints) {
      c.stiffness = Math.min(1.0, c.stiffness * 1.1);
    }

    this._wrapSelf(cloth, this.mannequin.bodySpheres);
    return cloth;
  }

  _createDress(color) {
    const cloth = this.clothSim.createCloth(
      1.4, 1.5, 18, 22,
      {
        position: new THREE.Vector3(0, 0.92, 0),
        rotation: new THREE.Quaternion(),
        scale: 1
      }
    );
    cloth._color = new THREE.Vector3(color.r, color.g, color.b);

    const segW = 18;
    for (let i = 0; i <= segW; i++) {
      cloth.particles[i].pinned = true;
    }

    // Lower part of dress - looser constraints for flow
    for (const c of cloth.constraints) {
      const p1 = cloth.particles[c.p1];
      const p2 = cloth.particles[c.p2];
      if (p1.position.y < 0.2 && p2.position.y < 0.2) {
        c.stiffness *= 0.7; // Lower part flows more
      }
    }

    this._wrapSelf(cloth, this.mannequin.bodySpheres);
    return cloth;
  }

  _createSuit(color) {
    const cloth = this.clothSim.createCloth(
      1.9, 0.90, 26, 15,
      {
        position: new THREE.Vector3(0, 0.88, 0),
        rotation: new THREE.Quaternion(),
        scale: 1
      }
    );
    cloth._color = new THREE.Vector3(color.r, color.g, color.b);

    const segW = 26;
    for (let i = 0; i <= segW; i++) {
      cloth.particles[i].pinned = true;
    }

    // Suit is stiffer, structured
    for (const c of cloth.constraints) {
      c.stiffness = Math.min(1.0, c.stiffness * 1.2);
    }

    this._wrapSelf(cloth, this.mannequin.bodySpheres);
    return cloth;
  }

  _createSkirt(color) {
    const cloth = this.clothSim.createCloth(
      1.2, 0.65, 16, 14,
      {
        position: new THREE.Vector3(0, 0.18, 0),
        rotation: new THREE.Quaternion(),
        scale: 1
      }
    );
    cloth._color = new THREE.Vector3(color.r, color.g, color.b);

    const segW = 16;
    // Pin the top row (waist)
    for (let i = 0; i <= segW; i++) {
      cloth.particles[i].pinned = true;
    }

    // Wrap around lower torso
    const lowerSpheres = this.mannequin.bodySpheres.filter(s =>
      s.center.y < 0.3 && s.center.y > -0.4
    );
    this._wrapSelf(cloth, lowerSpheres);
    return cloth;
  }

  toggleWireframe(show) {
    if (this.currentGarment && this.currentGarment.mesh) {
      this.currentGarment.mesh.material.wireframe = show;
    }
  }
}
