// About WebGL Scene — Rotating Globe
export function initAboutScene() {
  const container = document.getElementById('about-canvas-container');
  if (!container) return null;

  let width = container.clientWidth;
  let height = container.clientHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  // Ambient fog matches the charcoal background of about section (#121212)
  scene.fog = new THREE.FogExp2(0x121212, 0.025);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 12;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x121212, 0); // Transparent background to allow gradient overlays
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight1.position.set(5, 5, 5);
  scene.add(dirLight1);

  // 1. Globe Wireframe (Lat/Long grid representation)
  const sphereRadius = window.innerWidth < 768 ? 2.5 : 3.8;
  const sphereGeo = new THREE.SphereGeometry(sphereRadius, 24, 24);
  const sphereWire = new THREE.WireframeGeometry(sphereGeo);
  const globeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.07,
    linewidth: 1
  });
  const globe = new THREE.LineSegments(sphereWire, globeMaterial);
  scene.add(globe);

  // Add a slightly smaller inner wireframe sphere for visual depth
  const innerSphereGeo = new THREE.SphereGeometry(sphereRadius * 0.97, 12, 12);
  const innerSphereWire = new THREE.WireframeGeometry(innerSphereGeo);
  const innerGlobeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.03
  });
  const innerGlobe = new THREE.LineSegments(innerSphereWire, innerGlobeMaterial);
  globe.add(innerGlobe);

  // 2. Orbiting Satellite Rings
  const ringCount = 2;
  const rings = [];
  
  for (let r = 0; r < ringCount; r++) {
    const ringRadius = sphereRadius * (1.2 + r * 0.25);
    const ringGeo = new THREE.RingGeometry(ringRadius, ringRadius + 0.02, 64);
    // Convert to wireframe lines
    const ringWire = new THREE.WireframeGeometry(ringGeo);
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04
    });
    const ring = new THREE.LineSegments(ringWire, ringMaterial);
    
    // Random angle
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    scene.add(ring);
    rings.push({
      mesh: ring,
      speedX: 0.05 * (r + 1),
      speedY: 0.03 * (r + 1)
    });
  }

  // 3. Floating Satellites (small points orbiting the globe)
  const satelliteCount = 8;
  const satellites = [];
  
  for (let i = 0; i < satelliteCount; i++) {
    const size = 0.05 + Math.random() * 0.05;
    const satGeo = new THREE.SphereGeometry(size, 8, 8);
    const satMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    });
    const sat = new THREE.Mesh(satGeo, satMat);
    
    // Orbital parameters
    satellites.push({
      mesh: sat,
      orbitRadius: sphereRadius * (1.1 + Math.random() * 0.3),
      speed: 0.2 + Math.random() * 0.4,
      angle: Math.random() * Math.PI * 2,
      planeRotX: Math.random() * Math.PI,
      planeRotY: Math.random() * Math.PI
    });
    scene.add(sat);
  }

  // Mouse interactivity variables
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
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

  // Visibility Check (IntersectionObserver toggle)
  let isVisible = true;
  const clock = new THREE.Clock();

  // Animation Loop
  const animate = () => {
    if (!isVisible) return;
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Rotate globe slowly
    globe.rotation.y = time * 0.05;
    
    // Interactive mouse rotation overlay
    targetX = mouseX * 0.3;
    targetY = mouseY * 0.3;
    globe.rotation.y += (targetX - globe.rotation.y) * 0.05;
    globe.rotation.x += (targetY - globe.rotation.x) * 0.05;

    // Rotate rings
    rings.forEach(ring => {
      ring.mesh.rotation.x += 0.002;
      ring.mesh.rotation.y += 0.001;
    });

    // Orbit satellites
    satellites.forEach(sat => {
      sat.angle += sat.speed * 0.02;
      
      // Calculate 3D orbital position on tilted planes
      const localX = Math.cos(sat.angle) * sat.orbitRadius;
      const localZ = Math.sin(sat.angle) * sat.orbitRadius;
      
      const pos = new THREE.Vector3(localX, 0, localZ);
      // Apply plane rotations
      pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), sat.planeRotX);
      pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), sat.planeRotY);
      
      sat.mesh.position.copy(pos);
      
      // subtle scale pulsation
      const pulse = 1.0 + Math.sin(time * 3 + sat.angle) * 0.2;
      sat.mesh.scale.set(pulse, pulse, pulse);
    });

    // Subtly shift camera based on mouse for parallax
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;

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
      // Scale or move globe along with ScrollTrigger progress
      // e.g. zoom in as we scroll into the section, then zoom out/rotate on exit
      globe.scale.set(1 + progress * 0.2, 1 + progress * 0.2, 1 + progress * 0.2);
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
