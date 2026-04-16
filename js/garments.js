import * as THREE from 'three';
import { ClothSystem } from './physics.js';

export const GARMENTS = {
  tshirt: {
    build: () => {
      const pieces = [];
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(0, 1.48, 0),
        end: new THREE.Vector3(0, 1.0, 0),
        topRadius: 0.21, bottomRadius: 0.23,
        rows: 10, cols: 20,
        fixedRows: [0],
        color: 0xff6b6b,
        offset: 0.015
      }));
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(-0.21, 1.45, 0),
        end: new THREE.Vector3(-0.42, 1.28, 0),
        topRadius: 0.085, bottomRadius: 0.095,
        rows: 5, cols: 12,
        fixedRows: [0],
        color: 0xff6b6b,
        offset: 0.015
      }));
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(0.21, 1.45, 0),
        end: new THREE.Vector3(0.42, 1.28, 0),
        topRadius: 0.085, bottomRadius: 0.095,
        rows: 5, cols: 12,
        fixedRows: [0],
        color: 0xff6b6b,
        offset: 0.015
      }));
      return pieces;
    }
  },
  longshirt: {
    build: () => {
      const pieces = [];
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(0, 1.48, 0),
        end: new THREE.Vector3(0, 1.0, 0),
        topRadius: 0.21, bottomRadius: 0.23,
        rows: 10, cols: 20,
        fixedRows: [0],
        color: 0x4ecdc4,
        offset: 0.015
      }));
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(-0.21, 1.45, 0),
        end: new THREE.Vector3(-0.46, 0.95, 0),
        topRadius: 0.08, bottomRadius: 0.065,
        rows: 8, cols: 12,
        fixedRows: [0],
        color: 0x4ecdc4,
        offset: 0.015
      }));
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(0.21, 1.45, 0),
        end: new THREE.Vector3(0.46, 0.95, 0),
        topRadius: 0.08, bottomRadius: 0.065,
        rows: 8, cols: 12,
        fixedRows: [0],
        color: 0x4ecdc4,
        offset: 0.015
      }));
      return pieces;
    }
  },
  dress: {
    build: () => {
      const piece = createCylindricalPiece({
        start: new THREE.Vector3(0, 1.5, 0),
        end: new THREE.Vector3(0, 0.55, 0),
        topRadius: 0.21, bottomRadius: 0.48,
        rows: 20, cols: 24,
        fixedRows: [0],
        color: 0xff9ff3,
        offset: 0.015
      });
      return [piece];
    }
  },
  skirt: {
    build: () => {
      const piece = createCylindricalPiece({
        start: new THREE.Vector3(0, 1.02, 0),
        end: new THREE.Vector3(0, 0.5, 0),
        topRadius: 0.23, bottomRadius: 0.45,
        rows: 12, cols: 24,
        fixedRows: [0],
        color: 0xfeca57,
        offset: 0.015
      });
      return [piece];
    }
  },
  hoodie: {
    build: () => {
      const pieces = [];
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(0, 1.48, 0),
        end: new THREE.Vector3(0, 1.0, 0),
        topRadius: 0.24, bottomRadius: 0.26,
        rows: 10, cols: 22,
        fixedRows: [0],
        color: 0x54a0ff,
        offset: 0.02
      }));
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(-0.23, 1.45, 0),
        end: new THREE.Vector3(-0.48, 0.95, 0),
        topRadius: 0.085, bottomRadius: 0.07,
        rows: 8, cols: 12,
        fixedRows: [0],
        color: 0x54a0ff,
        offset: 0.02
      }));
      pieces.push(createCylindricalPiece({
        start: new THREE.Vector3(0.23, 1.45, 0),
        end: new THREE.Vector3(0.48, 0.95, 0),
        topRadius: 0.085, bottomRadius: 0.07,
        rows: 8, cols: 12,
        fixedRows: [0],
        color: 0x54a0ff,
        offset: 0.02
      }));
      pieces.push(createDomePiece({
        center: new THREE.Vector3(0, 1.62, 0),
        radius: 0.15,
        rows: 6, cols: 16,
        fixedRows: [5],
        color: 0x54a0ff,
        offset: 0.02
      }));
      return pieces;
    }
  }
};

function createCylindricalPiece({ start, end, topRadius, bottomRadius, rows, cols, fixedRows, color, offset }) {
  const sys = new ClothSystem(rows, cols, 0, color);
  const axis = end.clone().sub(start);
  const up = axis.clone().normalize();
  let right = new THREE.Vector3(1, 0, 0);
  if (Math.abs(up.x) > 0.9) right.set(0, 1, 0);
  const forward = new THREE.Vector3().crossVectors(up, right).normalize();
  right.crossVectors(forward, up).normalize();

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const y = start.clone().add(axis.clone().multiplyScalar(t));
    const radius = topRadius + (bottomRadius - topRadius) * t;
    for (let c = 0; c < cols; c++) {
      const angle = (c / cols) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const pos = y.clone().add(right.clone().multiplyScalar(x)).add(forward.clone().multiplyScalar(z));
      const pinned = fixedRows.includes(r);
      sys.addParticle(pos.x, pos.y, pos.z, pinned);
    }
  }
  sys.addConstraints();
  sys.buildMesh(true);
  sys.offset = offset;
  return sys;
}

function createDomePiece({ center, radius, rows, cols, fixedRows, color, offset }) {
  const sys = new ClothSystem(rows, cols, 0, color);
  for (let r = 0; r < rows; r++) {
    const theta = (r / (rows - 1)) * (Math.PI / 2);
    const y = Math.cos(theta) * radius;
    const ringRadius = Math.sin(theta) * radius;
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      const x = Math.cos(phi) * ringRadius;
      const z = Math.sin(phi) * ringRadius;
      const pos = new THREE.Vector3(center.x + x, center.y + y, center.z + z);
      const pinned = fixedRows.includes(r);
      sys.addParticle(pos.x, pos.y, pos.z, pinned);
    }
  }
  sys.addConstraints();
  sys.buildMesh(true);
  sys.offset = offset;
  return sys;
}
