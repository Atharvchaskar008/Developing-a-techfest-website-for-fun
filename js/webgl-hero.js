// Hero WebGL Scene
export function initHeroScene() {
  const container = document.getElementById('hero-canvas-container');
  if (!container) return null;

  let width = container.clientWidth;
  let height = container.clientHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.008);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 25;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050505, 1);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.45);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.25);
  dirLight2.position.set(-5, -10, -7);
  scene.add(dirLight2);

  // 1. Deep Space Particle System (8,000–12,000 particles)
  const particleCount = window.innerWidth < 768 ? 3000 : 10000;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3);
  const randomSpeeds = new Float32Array(particleCount);
  const randomPhases = new Float32Array(particleCount * 3);

  const sphereRadius = 80;
  for (let i = 0; i < particleCount; i++) {
    // Generate inside a sphere
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = sphereRadius * Math.cbrt(Math.random());

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    initialPositions[i * 3] = x;
    initialPositions[i * 3 + 1] = y;
    initialPositions[i * 3 + 2] = z;

    randomSpeeds[i] = 0.2 + Math.random() * 0.8;
    randomPhases[i * 3] = Math.random() * Math.PI * 2;
    randomPhases[i * 3 + 1] = Math.random() * Math.PI * 2;
    randomPhases[i * 3 + 2] = Math.random() * Math.PI * 2;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Custom round particle texture using canvas
  const createCircleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  };

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: window.innerWidth < 768 ? 0.25 : 0.15,
    transparent: true,
    opacity: 0.6,
    map: createCircleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // 2. Central Wireframe Objects
  const icosaGeometry = new THREE.IcosahedronGeometry(6, 1);
  const icosaWire = new THREE.WireframeGeometry(icosaGeometry);
  const icosaMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    linewidth: 1
  });
  const icosahedron = new THREE.LineSegments(icosaWire, icosaMaterial);
  scene.add(icosahedron);

  const octaGeometry = new THREE.OctahedronGeometry(3.5, 0);
  const octaWire = new THREE.WireframeGeometry(octaGeometry);
  const octaMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15
  });
  const octahedron = new THREE.LineSegments(octaWire, octaMaterial);
  scene.add(octahedron);

  const tetraGeometry = new THREE.TetrahedronGeometry(1.8, 0);
  const tetraWire = new THREE.WireframeGeometry(tetraGeometry);
  const tetraMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25
  });
  const tetrahedron = new THREE.LineSegments(tetraWire, tetraMaterial);
  scene.add(tetrahedron);

  // 3. Scattered Atmosphere Objects (20-30 smaller wireframe shapes)
  const scatteredObjects = [];
  const geometries = [
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.SphereGeometry(0.8, 4, 4),
    new THREE.TorusGeometry(0.8, 0.2, 4, 8)
  ];
  const scatterMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08
  });

  const numScattered = window.innerWidth < 768 ? 8 : 25;
  for (let i = 0; i < numScattered; i++) {
    const geo = geometries[Math.floor(Math.random() * geometries.length)];
    const wire = new THREE.WireframeGeometry(geo);
    const mesh = new THREE.LineSegments(wire, scatterMaterial);
    
    // Random distribution
    mesh.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 60 - 20 // deeper
    );
    
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scale = 0.5 + Math.random() * 1.5;
    mesh.scale.set(scale, scale, scale);
    
    scene.add(mesh);
    scatteredObjects.push({
      mesh: mesh,
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
      }
    });
  }

  // Post-processing setup (Bloom) — skip on mobile for performance
  let composer = null;
  const isMobile = window.innerWidth < 768;

  if (!isMobile && window.THREE.EffectComposer) {
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // UnrealBloomPass(resolution, strength, radius, threshold)
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.18, // low intensity strength
      0.8,  // radius
      0.0   // threshold
    );
    composer.addPass(bloomPass);
  }

  // Animation Variables
  const clock = new THREE.Clock();
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  
  // Explosion state
  let explosionProgress = 0;
  let isExploding = false;

  // Track Mouse Position
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
    if (composer) {
      composer.setSize(width, height);
    }
  };
  window.addEventListener('resize', onResize);

  // Scene Active Flag (for IntersectionObserver performance optimization)
  let isVisible = true;

  // Main Render Loop
  const animate = () => {
    if (!isVisible) return;
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 1. Particle drift animation
    const positionAttr = particleSystem.geometry.attributes.position;
    const posArray = positionAttr.array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const speed = randomSpeeds[i];
      const phaseX = randomPhases[idx];
      const phaseY = randomPhases[idx + 1];
      const phaseZ = randomPhases[idx + 2];

      let driftX = Math.sin(time * speed * 0.5 + phaseX) * 0.15;
      let driftY = Math.cos(time * speed * 0.4 + phaseY) * 0.15;
      let driftZ = Math.sin(time * speed * 0.6 + phaseZ) * 0.15;

      // Handle explosion physics if active
      if (isExploding) {
        // Blow outward radially from center
        const initX = initialPositions[idx];
        const initY = initialPositions[idx + 1];
        const initZ = initialPositions[idx + 2];
        
        // Direction vector from center
        const len = Math.sqrt(initX*initX + initY*initY + initZ*initZ) || 1;
        const dirX = initX / len;
        const dirY = initY / len;
        const dirZ = initZ / len;

        // Force multiplier
        const force = explosionProgress * 100.0;
        
        posArray[idx] = initX + dirX * force + driftX;
        posArray[idx + 1] = initY + dirY * force + driftY;
        posArray[idx + 2] = initZ + dirZ * force + driftZ;
      } else {
        posArray[idx] = initialPositions[idx] + driftX;
        posArray[idx + 1] = initialPositions[idx + 1] + driftY;
        posArray[idx + 2] = initialPositions[idx + 2] + driftZ;
      }
    }
    positionAttr.needsUpdate = true;

    // 2. Central wireframe rotations
    icosahedron.rotation.x = time * 0.05;
    icosahedron.rotation.y = time * 0.08;

    octahedron.rotation.y = -time * 0.12;
    octahedron.rotation.z = time * 0.07;

    // Orbiting tetrahedron
    const radiusX = 11;
    const radiusZ = 9;
    tetrahedron.position.x = Math.cos(time * 0.4) * radiusX;
    tetrahedron.position.z = Math.sin(time * 0.4) * radiusZ;
    tetrahedron.position.y = Math.sin(time * 0.3) * 2;
    tetrahedron.rotation.x = time * 0.2;
    tetrahedron.rotation.y = time * 0.3;

    // If exploding, scale up central shapes
    if (isExploding) {
      const scale = 1 + explosionProgress * 4.0;
      icosahedron.scale.set(scale, scale, scale);
      octahedron.scale.set(scale, scale, scale);
      
      icosaMaterial.opacity = Math.max(0, 0.18 - explosionProgress * 0.18);
      octaMaterial.opacity = Math.max(0, 0.15 - explosionProgress * 0.15);
      tetraMaterial.opacity = Math.max(0, 0.25 - explosionProgress * 0.25);
    }

    // 3. Ambient scattered shapes rotation
    scatteredObjects.forEach(obj => {
      obj.mesh.rotation.x += obj.rotSpeed.x;
      obj.mesh.rotation.y += obj.rotSpeed.y;
      obj.mesh.rotation.z += obj.rotSpeed.z;
    });

    // 4. Mouse Parallax (silky smooth lerped camera shift)
    targetX = mouseX * -2.5;
    targetY = mouseY * 2.5;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    
    // Central shapes tilt acknowledgment
    icosahedron.rotation.x += mouseY * 0.08;
    icosahedron.rotation.y += mouseX * 0.08;
    octahedron.rotation.y -= mouseX * 0.05;

    // Render pass
    if (composer && !isMobile) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  };

  // Start animation loop
  animate();

  // Return controllers
  return {
    triggerExplosion: () => {
      isExploding = true;
      gsap.to({ val: 0 }, {
        val: 1,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: function() {
          explosionProgress = this.targets()[0].val;
        },
        onComplete: () => {
          // Reset after explosion transition completes, or keep expanded
          // Let's fade out the systems, or keep them ambient
          gsap.to(particleMaterial, { opacity: 0.1, duration: 1.0 });
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
      if (composer) {
        // dispose composer steps
      }
    }
  };
}
