// Timeline WebGL Scene — Concentric Ring Tunnel
export function initTimelineScene() {
  const container = document.querySelector('.timeline-canvas-wrapper');
  const canvas = document.getElementById('timeline-canvas');
  if (!container || !canvas) return null;

  let width = container.clientWidth;
  let height = container.clientHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.035);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 2); // Initial camera position

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1.0, 30);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  // 1. Generate Tunnel Rings
  const ringCount = 25;
  const ringSpacing = 2.0;
  const rings = [];
  const totalLength = ringCount * ringSpacing;

  const ringGeo = new THREE.TorusGeometry(3.0, 0.03, 4, 32);

  for (let i = 0; i < ringCount; i++) {
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15
    });
    const ring = new THREE.LineSegments(new THREE.WireframeGeometry(ringGeo), ringMat);
    ring.position.z = -i * ringSpacing;
    scene.add(ring);
    rings.push({
      mesh: ring,
      material: ringMat,
      initialZ: ring.position.z
    });
  }

  // 2. Define 3D coordinates for the HTML Milestone Cards
  const milestoneElements = document.querySelectorAll('.milestone-card');
  const milestones = [];

  milestoneElements.forEach((el, idx) => {
    // Distribute milestones along Z axis
    // Milestones will range from z = -1.5 down to z = -38
    const zPos = -1.5 - idx * 3.1;
    
    // Alternate left and right placement
    const isLeft = idx % 2 === 0;
    const xPos = isLeft ? -2.2 : 2.2;
    const yPos = isLeft ? 0.3 : -0.3; // subtle height variation

    milestones.push({
      element: el,
      position: new THREE.Vector3(xPos, yPos, zPos),
      idx: idx
    });
  });

  // Track scroll progress
  let scrollProgress = 0;
  
  // Resize Handler
  const onResize = () => {
    width = container.clientWidth;
    height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  };
  window.addEventListener('resize', onResize);

  // Visibility flag
  let isVisible = true;
  const clock = new THREE.Clock();

  // Project HTML elements to screen coordinates
  const updateMilestoneHTML = () => {
    const tempV = new THREE.Vector3();

    milestones.forEach((ms) => {
      tempV.copy(ms.position);
      
      // Calculate distance to camera along Z axis
      const distZ = camera.position.z - ms.position.z;

      // Project 3D coordinate to normalized device coordinates (NDC)
      tempV.project(camera);

      // Check if coordinate is behind camera or too far
      if (distZ < 0.2 || distZ > 16.0) {
        ms.element.style.opacity = 0;
        ms.element.style.visibility = 'hidden';
        ms.element.style.pointerEvents = 'none';
        return;
      }

      // Map NDC (-1 to 1) to CSS pixels (0 to width/height)
      const x = (tempV.x * 0.5 + 0.5) * width;
      const y = (tempV.y * -0.5 + 0.5) * height;

      // Calculate scale and opacity based on Z-distance
      // Max opacity at distance ~4 units, fades out when closer than 1 or further than 12
      let opacity = 0;
      if (distZ > 1.0 && distZ < 14.0) {
        if (distZ > 10.0) {
          // Fade in as it approaches from distance
          opacity = (14.0 - distZ) / 4.0;
        } else if (distZ < 3.0) {
          // Fade out as it passes camera
          opacity = (distZ - 1.0) / 2.0;
        } else {
          opacity = 1.0;
        }
      }

      const scale = THREE.MathUtils.mapLinear(distZ, 1.0, 14.0, 1.1, 0.7);

      // Update card style
      ms.element.style.opacity = opacity;
      ms.element.style.visibility = opacity > 0.01 ? 'visible' : 'hidden';
      ms.element.style.pointerEvents = opacity > 0.2 ? 'all' : 'none';
      
      // Apply transform relative to the center of the card
      ms.element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
    });
  };

  // Main Render Loop
  const animate = () => {
    if (!isVisible) return;
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 1. Move camera forward based on scroll progress
    // Z moves from 2 down to -totalLength + 4
    const targetZ = 2.0 - scrollProgress * (totalLength - 2.0);
    camera.position.z += (targetZ - camera.position.z) * 0.08; // smooth camera fly

    // 2. Light follows camera
    pointLight.position.z = camera.position.z - 2;

    // 3. Rotate rings for organic motion effect
    rings.forEach((ring, idx) => {
      // Rotation speed depends on distance
      ring.mesh.rotation.z = time * 0.06 + Math.sin(time * 0.2 + idx) * 0.1;
      
      // Calculate distance to camera to adjust ring opacity dynamically
      const dist = Math.abs(camera.position.z - ring.mesh.position.z);
      
      let opacity = 0.15;
      if (dist > 15.0) {
        opacity = Math.max(0.02, 0.15 - (dist - 15.0) * 0.02);
      } else if (dist < 3.0) {
        opacity = Math.max(0.01, dist * 0.05);
      }
      
      ring.material.opacity = opacity;
    });

    // 4. Update milestone overlays
    updateMilestoneHTML();

    renderer.render(scene, camera);
  };

  animate();

  // Return controllers
  return {
    setVisible: (visible) => {
      const wasVisible = isVisible;
      isVisible = visible;
      if (!wasVisible && isVisible) {
        animate();
      }
    },
    updateScroll: (progress) => {
      scrollProgress = progress; // Bind to GSAP ScrollTrigger
    },
    destroy: () => {
      isVisible = false;
      window.removeEventListener('resize', onResize);
      container.innerHTML = '';
      scene.clear();
      renderer.dispose();
      // Remove inline positions from milestones
      milestoneElements.forEach(el => {
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.transform = '';
      });
    }
  };
}
