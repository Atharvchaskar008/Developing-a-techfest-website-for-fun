// Registration WebGL Scene — Orbiting Particle Ring
export function initRegisterScene() {
  const container = document.getElementById('register-canvas-container');
  if (!container) return null;

  let width = container.clientWidth;
  let height = container.clientHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 15;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050505, 0); // Transparent so page background handles it
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(0, 5, 10);
  scene.add(dirLight);

  // 1. Generate Particle Ring (2000 particles)
  const particleCount = window.innerWidth < 768 ? 800 : 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const randomSpeeds = new Float32Array(particleCount);
  const initialAngles = new Float32Array(particleCount);
  const heights = new Float32Array(particleCount);

  // Define base ring radius in Three.js coordinates
  // Fits nicely around the 240px CTA button on center of screen
  const baseRadius = window.innerWidth < 768 ? 3.0 : 4.5;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    initialAngles[i] = angle;
    
    // Add thickness/spread along radius
    const spread = (Math.random() - 0.5) * 0.4;
    const r = baseRadius + spread;
    
    // Orbit height offset
    const yOffset = (Math.random() - 0.5) * 1.5;
    heights[i] = yOffset;

    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = yOffset;
    positions[i * 3 + 2] = Math.sin(angle) * r;

    randomSpeeds[i] = 0.5 + Math.random() * 1.0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Circular texture canvas helper
  const createCircleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  };

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.7,
    map: createCircleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // Animation variables
  const clock = new THREE.Clock();
  const state = {
    explosionProgress: 0.0,
    orbitSpeedMultiplier: 1.0
  };

  let mouseX = 0, mouseY = 0;
  const onMouseMove = (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  };
  window.addEventListener('mousemove', onMouseMove);

  // Resize Handler
  const onResize = () => {
    width = container.clientWidth;
    height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  };
  window.addEventListener('resize', onResize);

  // Visibility Check flag
  let isVisible = true;

  // Main Render Loop
  const animate = () => {
    if (!isVisible) return;
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    const posAttr = particleSystem.geometry.attributes.position;
    const posArr = posAttr.array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const angle = initialAngles[i];
      const speed = randomSpeeds[i];
      
      // Calculate current angle based on elapsed time and orbit speed multiplier
      const currentAngle = angle + time * 0.12 * speed * state.orbitSpeedMultiplier;

      // Base radius with spread
      const spread = (i % 5) * 0.08 - 0.2;
      let r = baseRadius + spread;

      // Add explosive expansion factor
      // Particles blow outward radially on hover
      r += state.explosionProgress * 8.0;

      // Orbit coords
      posArr[idx] = Math.cos(currentAngle) * r;
      posArr[idx + 1] = heights[i] + Math.sin(time * 0.5 + angle) * 0.15; // wavy height bobbing
      posArr[idx + 2] = Math.sin(currentAngle) * r;
    }
    posAttr.needsUpdate = true;

    // Subtle camera parallax
    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  animate();

  // Return controllers
  return {
    triggerHoverEnter: () => {
      // Fast explosion outward
      gsap.to(state, {
        explosionProgress: 1.0,
        orbitSpeedMultiplier: 4.0,
        duration: 0.35,
        ease: "power2.out"
      });
      // Brighten particles
      gsap.to(material, { size: 0.16, opacity: 0.9, duration: 0.3 });
    },
    triggerHoverLeave: () => {
      // Elastic spring back to center
      gsap.to(state, {
        explosionProgress: 0.0,
        orbitSpeedMultiplier: 1.0,
        duration: 1.5,
        ease: "elastic.out(1, 0.45)"
      });
      // Return size
      gsap.to(material, { size: 0.1, opacity: 0.7, duration: 0.8 });
    },
    triggerClickExplosion: () => {
      // Blast particles screen-wide
      gsap.to(state, {
        explosionProgress: 4.0,
        orbitSpeedMultiplier: 8.0,
        duration: 0.8,
        ease: "power3.out"
      });
      gsap.to(material, {
        opacity: 0,
        size: 0.02,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
          // Reset after modal opens
          state.explosionProgress = 0;
          state.orbitSpeedMultiplier = 1;
          material.size = 0.1;
          gsap.to(material, { opacity: 0.7, duration: 0.5, delay: 0.5 });
        }
      });
    },
    setVisible: (visible) => {
      const wasVisible = isVisible;
      isVisible = visible;
      if (!wasVisible && isVisible) {
        animate();
      }
    },
    destroy: () => {
      isVisible = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      container.innerHTML = '';
      scene.clear();
      renderer.dispose();
    }
  };
}
