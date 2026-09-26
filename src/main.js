import './style.css';

const TOTAL_FRAMES = 180;
const FRAME_PATH_PREFIX = '/frames/ezgif-frame-';
const FRAME_PATH_SUFFIX = '.jpg';

const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');
const scrollTrack = document.getElementById('scroll-track');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const frames = [];
let loadedCount = 0;
let currentFrame = 1;
let targetFrame = 1;
let renderedFrameIndex = -1;

function getFrameUrl(index) {
  const paddedIndex = String(index).padStart(3, '0');
  return `${FRAME_PATH_PREFIX}${paddedIndex}${FRAME_PATH_SUFFIX}`;
}

// 1. Preload 1080p HD images with progress tracking
function preloadFrames() {
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const url = getFrameUrl(i);

      img.onload = () => {
        loadedCount++;
        onProgress();
        if (loadedCount === TOTAL_FRAMES) resolve();
      };

      img.onerror = () => {
        console.warn(`Frame ${i} failed to load from ${url}`);
        loadedCount++;
        onProgress();
        if (loadedCount === TOTAL_FRAMES) resolve();
      };

      img.src = url;
      frames[i] = img;
    }
  });
}

function onProgress() {
  const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  if (loaderBar) loaderBar.style.width = `${percent}%`;
  if (loaderText) loaderText.innerText = `Loading Full HD... ${percent}%`;
  
  if (loadedCount === 1 || (frames[1] && frames[1].complete)) {
    renderFrame(1);
  }
}

function hideLoader() {
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}

// 2. High-DPI 1080p Responsive Canvas Resize
function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  renderFrame(Math.round(currentFrame), true);
}

// 3. Render Canvas Frame (Full HD Edge-to-Edge COVER fit)
function renderFrame(frameIndex, force = false) {
  const clampedIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameIndex)));
  if (!force && clampedIndex === renderedFrameIndex) return;

  const img = frames[clampedIndex];
  if (!img || !img.complete) return;

  renderedFrameIndex = clampedIndex;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth || img.width || 1920;
  const ih = img.naturalHeight || img.height || 1080;

  ctx.clearRect(0, 0, cw, ch);

  // Cover scaling: Fills 100% of browser window with zero black borders
  const scale = Math.max(cw / iw, ch / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;
  const drawX = (cw - drawW) / 2;
  const drawY = (ch - drawH) / 2;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

// 4. Calculate target frame & heading fade from scroll position
function updateScroll() {
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const trackHeight = scrollTrack ? scrollTrack.offsetHeight : 0;
  const viewportHeight = window.innerHeight;
  const maxScroll = trackHeight - viewportHeight;

  if (maxScroll <= 0) return;

  const fraction = Math.max(0, Math.min(1, scrollY / maxScroll));
  targetFrame = 1 + fraction * (TOTAL_FRAMES - 1);

  // Smoothly fade out heading overlay at 30% scroll progress (fraction = 0.3)
  const heroHeadingContainer = document.getElementById('hero-heading-container');
  if (heroHeadingContainer) {
    const fadeThreshold = 0.30;
    if (fraction <= fadeThreshold) {
      const progress = fraction / fadeThreshold; // 0 to 1
      const opacity = 1 - progress;
      const translateY = -40 * progress; // Upward float
      heroHeadingContainer.style.opacity = opacity.toFixed(3);
      heroHeadingContainer.style.transform = `translateY(${translateY}px)`;
    } else {
      heroHeadingContainer.style.opacity = '0';
      heroHeadingContainer.style.transform = 'translateY(-40px)';
    }
  }
}

// 5. Smooth animation loop
function animate() {
  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) > 0.01) {
    currentFrame += diff * 0.25;
  } else {
    currentFrame = targetFrame;
  }

  renderFrame(currentFrame);
  requestAnimationFrame(animate);
}

// 6. Native Fullscreen API Helper
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }
}

// 7. Boot Application
async function init() {
  preloadFrames().then(() => {
    hideLoader();
  });

  updateScroll();
  currentFrame = targetFrame;

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('wheel', updateScroll, { passive: true });
  window.addEventListener('touchmove', updateScroll, { passive: true });

  // Double click anywhere to toggle native browser fullscreen
  window.addEventListener('dblclick', toggleFullscreen);

  // Press 'F' key to toggle fullscreen
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });

  resizeCanvas();
  animate();
}

init();
