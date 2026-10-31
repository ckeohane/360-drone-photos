// Full-screen photo viewers. Each function fills `container` and returns a
// function that cleans up. `onError` is called if the photo cannot be shown.

// 360 photo: Photo Sphere Viewer handles drag, pinch and zoom.
export async function showPanorama(container, url, onError) {
  const { Viewer } = await import('@photo-sphere-viewer/core');
  const viewer = new Viewer({
    container,
    panorama: url,
    navbar: ['zoom', 'fullscreen'],
    loadingTxt: 'Loading photo',
    defaultYaw: 0,
    touchmoveTwoFingers: false,
    mousewheelCtrlKey: false,
  });
  viewer.addEventListener('panorama-error', () => onError());
  return () => viewer.destroy();
}

// Flat photo: drag to move, pinch or scroll to zoom, double-tap to reset.
export function showFlat(container, url, onError) {
  const MAX_SCALE = 6;
  const stage = document.createElement('div');
  stage.className = 'flat';
  const img = document.createElement('img');
  img.className = 'flat__img';
  img.alt = '';
  img.draggable = false;
  stage.append(img);
  container.replaceChildren(stage);

  let scale = 1;
  let x = 0;
  let y = 0;
  const pointers = new Map();
  let lastDistance = 0;

  const apply = () => {
    // Keep the image from being dragged completely off screen.
    const maxX = (stage.clientWidth * (scale - 1)) / 2 + (img.clientWidth * scale) / 2 - 40;
    const maxY = (stage.clientHeight * (scale - 1)) / 2 + (img.clientHeight * scale) / 2 - 40;
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const zoomBy = (factor) => {
    scale = Math.max(1, Math.min(MAX_SCALE, scale * factor));
    if (scale === 1) { x = 0; y = 0; }
    apply();
  };

  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.15 : 1 / 1.15);
  }, { passive: false });

  stage.addEventListener('pointerdown', (event) => {
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    lastDistance = 0;
  });

  stage.addEventListener('pointermove', (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      x += event.clientX - previous.x;
      y += event.clientY - previous.y;
      apply();
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastDistance) zoomBy(distance / lastDistance);
      lastDistance = distance;
    }
  });

  const release = (event) => {
    pointers.delete(event.pointerId);
    lastDistance = 0;
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  stage.addEventListener('dblclick', () => {
    scale = 1; x = 0; y = 0;
    apply();
  });

  img.addEventListener('error', () => onError());
  img.src = url;
  return () => stage.remove();
}
