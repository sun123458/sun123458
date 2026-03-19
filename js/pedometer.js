// Pedometer integration for FitTrack Pro

let pedometerWatch = null;
let stepCallback = null;

async function checkPedometerSupport() {
  return 'onclick' in Navigator.prototype || 'DeviceMotionEvent' in window;
}

async function requestPedometerPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Pedometer permission error:', err);
      return false;
    }
  }
  return true;
}

function startStepCounting(callback) {
  stepCallback = callback;

  if (!('DeviceMotionEvent' in window)) {
    console.log('DeviceMotion not supported');
    if (callback) callback({ steps: 0, supported: false });
    return;
  }

  let lastX, lastY, lastZ;
  let lastTime = Date.now();
  let stepCount = 0;
  const threshold = 12;

  function onDeviceMotion(event) {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const x = acceleration.x;
    const y = acceleration.y;
    const z = acceleration.z;
    const currentTime = Date.now();

    if (lastX !== undefined && lastY !== undefined && lastZ !== undefined) {
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > threshold && currentTime - lastTime > 250) {
        stepCount++;
        lastTime = currentTime;

        if (stepCallback) {
          stepCallback({ steps: stepCount, supported: true });
        }
      }
    }

    lastX = x;
    lastY = y;
    lastZ = z;
  }

  window.addEventListener('devicemotion', onDeviceMotion);

  return () => {
    window.removeEventListener('devicemotion', onDeviceMotion);
  };
}

function usePedometerAPI() {
  if ('onclick' in Navigator.prototype) {
    return true;
  }
  return false;
}

export {
  checkPedometerSupport,
  requestPedometerPermission,
  startStepCounting,
  usePedometerAPI
};
