// Event Bento Grid WebGL Micro-Scenes
export function initEventsScenes() {
  const cards = document.querySelectorAll('.event-card');
  const controllers = [];

  cards.forEach((card, index) => {
    const canvasId = `canvas-event-${index}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Common material
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15
    });

    let mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // ----------------------------------------------------
    // POPULATE SCENES ACCORDING TO THEMES
    // ----------------------------------------------------
    let updateFn = null; // Custom animation step

    switch (index) {
      case 0: // Hackathon: Interconnected floating network nodes
        const nodeCount = 12;
        const nodes = [];
        const nodePositions = new Float32Array(nodeCount * 3);
        const nodeVelocities = [];
        
        for (let i = 0; i < nodeCount; i++) {
          const x = (Math.random() - 0.5) * 4;
          const y = (Math.random() - 0.5) * 3;
          const z = (Math.random() - 0.5) * 2;
          nodes.push(new THREE.Vector3(x, y, z));
          nodePositions[i * 3] = x;
          nodePositions[i * 3 + 1] = y;
          nodePositions[i * 3 + 2] = z;
          
          nodeVelocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.015,
            (Math.random() - 0.5) * 0.01
          ));
        }

        // Nodes geometry
        const nodesGeo = new THREE.BufferGeometry();
        nodesGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
        const nodesMat = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.12,
          transparent: true,
          opacity: 0.5
        });
        const nodePoints = new THREE.Points(nodesGeo, nodesMat);
        mainGroup.add(nodePoints);

        // Lines linking nodes
        const lineGeo = new THREE.BufferGeometry();
        const maxLines = (nodeCount * (nodeCount - 1)) / 2;
        const linePositions = new Float32Array(maxLines * 6);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lineSegments = new THREE.LineSegments(lineGeo, wireMaterial);
        mainGroup.add(lineSegments);

        updateFn = (time, rotSpeedScale) => {
          mainGroup.rotation.y = time * 0.05 * rotSpeedScale;
          
          // Move nodes inside boundaries
          const posAttr = nodePoints.geometry.attributes.position;
          const posArr = posAttr.array;
          const linePosAttr = lineSegments.geometry.attributes.position;
          const linePosArr = linePosAttr.array;
          
          for (let i = 0; i < nodeCount; i++) {
            const idx = i * 3;
            posArr[idx] += nodeVelocities[i].x * rotSpeedScale;
            posArr[idx + 1] += nodeVelocities[i].y * rotSpeedScale;
            posArr[idx + 2] += nodeVelocities[i].z * rotSpeedScale;
            
            // Boundary checks
            if (Math.abs(posArr[idx]) > 2) nodeVelocities[i].x *= -1;
            if (Math.abs(posArr[idx + 1]) > 1.5) nodeVelocities[i].y *= -1;
            if (Math.abs(posArr[idx + 2]) > 1) nodeVelocities[i].z *= -1;

            nodes[i].set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
          }
          posAttr.needsUpdate = true;

          // Connect nearby nodes
          let lineIdx = 0;
          for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
              const dist = nodes[i].distanceTo(nodes[j]);
              if (dist < 1.8) {
                // Add line segment
                linePosArr[lineIdx * 6] = nodes[i].x;
                linePosArr[lineIdx * 6 + 1] = nodes[i].y;
                linePosArr[lineIdx * 6 + 2] = nodes[i].z;
                
                linePosArr[lineIdx * 6 + 3] = nodes[j].x;
                linePosArr[lineIdx * 6 + 4] = nodes[j].y;
                linePosArr[lineIdx * 6 + 5] = nodes[j].z;
                lineIdx++;
              }
            }
          }
          // Clear remaining segments
          for (let l = lineIdx; l < maxLines; l++) {
            linePosArr[l * 6] = 0;
            linePosArr[l * 6 + 1] = 0;
            linePosArr[l * 6 + 2] = 0;
            linePosArr[l * 6 + 3] = 0;
            linePosArr[l * 6 + 4] = 0;
            linePosArr[l * 6 + 5] = 0;
          }
          linePosAttr.needsUpdate = true;
        };
        break;

      case 1: // Robotics: Rotating mechanical gear
        const outerGear = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.TorusGeometry(1.8, 0.4, 8, 24)),
          wireMaterial
        );
        mainGroup.add(outerGear);

        // Add small teeth along the outer edge
        const teethCount = 8;
        const teethGroup = new THREE.Group();
        for (let i = 0; i < teethCount; i++) {
          const angle = (i / teethCount) * Math.PI * 2;
          const tooth = new THREE.LineSegments(
            new THREE.WireframeGeometry(new THREE.BoxGeometry(0.3, 0.3, 0.6)),
            wireMaterial
          );
          tooth.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
          tooth.rotation.z = angle;
          teethGroup.add(tooth);
        }
        mainGroup.add(teethGroup);

        updateFn = (time, rotSpeedScale) => {
          mainGroup.rotation.z = -time * 0.25 * rotSpeedScale;
          mainGroup.rotation.x = 0.5; // slight angle tilt
        };
        break;

      case 2: // AI/ML: Neural network node visualization
        const inputNodes = 3, hiddenNodes = 4, outputNodes = 2;
        const layers = [inputNodes, hiddenNodes, outputNodes];
        const layerSpacing = 1.8;
        const nodeHeightSpacing = 0.8;
        
        const neuronNodes = [];
        
        layers.forEach((layerCount, layerIdx) => {
          const x = (layerIdx - 1) * layerSpacing;
          for (let n = 0; n < layerCount; n++) {
            const y = (n - (layerCount - 1) / 2) * nodeHeightSpacing;
            
            const neuronGeo = new THREE.SphereGeometry(0.08, 4, 4);
            const neuron = new THREE.LineSegments(
              new THREE.WireframeGeometry(neuronGeo),
              new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
            );
            neuron.position.set(x, y, 0);
            mainGroup.add(neuron);
            neuronNodes.push({ pos: neuron.position, layer: layerIdx });
          }
        });

        // Add connections
        const netLinePositions = [];
        for (let a = 0; a < neuronNodes.length; a++) {
          for (let b = 0; b < neuronNodes.length; b++) {
            if (neuronNodes[b].layer === neuronNodes[a].layer + 1) {
              netLinePositions.push(neuronNodes[a].pos.x, neuronNodes[a].pos.y, neuronNodes[a].pos.z);
              netLinePositions.push(neuronNodes[b].pos.x, neuronNodes[b].pos.y, neuronNodes[b].pos.z);
            }
          }
        }
        const netLineGeo = new THREE.BufferGeometry();
        netLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(netLinePositions, 3));
        const netLines = new THREE.LineSegments(netLineGeo, new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.08
        }));
        mainGroup.add(netLines);

        updateFn = (time, rotSpeedScale) => {
          mainGroup.rotation.y = Math.sin(time * 0.3) * 0.4 * rotSpeedScale;
          mainGroup.rotation.x = Math.cos(time * 0.2) * 0.2;
        };
        break;

      case 3: // Cybersecurity: Firewall core / rotating shield
        const innerOcta = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.OctahedronGeometry(1.2, 0)),
          wireMaterial
        );
        mainGroup.add(innerOcta);

        const outerTorusRing = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.TorusGeometry(1.9, 0.1, 4, 32)),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
        );
        mainGroup.add(outerTorusRing);

        updateFn = (time, rotSpeedScale) => {
          innerOcta.rotation.y = time * 0.4 * rotSpeedScale;
          innerOcta.rotation.x = time * 0.2;
          
          outerTorusRing.rotation.x = Math.sin(time * 0.5) * 0.5 * rotSpeedScale;
          outerTorusRing.rotation.y = time * 0.15;
        };
        break;

      case 4: // Gaming: Torus knot
        const knot = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.TorusKnotGeometry(1.2, 0.35, 64, 8, 2, 3)),
          wireMaterial
        );
        mainGroup.add(knot);

        updateFn = (time, rotSpeedScale) => {
          mainGroup.rotation.y = time * 0.25 * rotSpeedScale;
          mainGroup.rotation.x = time * 0.15;
        };
        break;

      case 5: // Startup Pitch: Growing bar heights / rocket launch
        const barsGroup = new THREE.Group();
        const barCount = 4;
        const bars = [];
        for (let i = 0; i < barCount; i++) {
          const cylinder = new THREE.LineSegments(
            new THREE.WireframeGeometry(new THREE.CylinderGeometry(0.2, 0.2, 2.5, 4, 4)),
            wireMaterial
          );
          cylinder.position.set((i - (barCount - 1) / 2) * 0.6, -1.25, 0); // align bottom
          // translate geometry center so scaling happens from base
          cylinder.geometry.translate(0, 1.25, 0);
          barsGroup.add(cylinder);
          bars.push(cylinder);
        }
        mainGroup.add(barsGroup);

        updateFn = (time, rotSpeedScale) => {
          mainGroup.rotation.y = time * 0.08 * rotSpeedScale;
          
          bars.forEach((bar, bIdx) => {
            const hScale = 0.3 + Math.sin(time * 1.5 * rotSpeedScale + bIdx * 0.8) * 0.6;
            bar.scale.y = Math.max(0.1, hScale);
          });
        };
        break;

      case 6: // Drone Racing: Drone flying through path ring
        const pathRing = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.TorusGeometry(1.6, 0.08, 4, 24)),
          wireMaterial
        );
        pathRing.rotation.y = Math.PI / 4;
        mainGroup.add(pathRing);

        const miniDrone = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.18, 0)),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
        );
        mainGroup.add(miniDrone);

        updateFn = (time, rotSpeedScale) => {
          pathRing.rotation.z = Math.sin(time * 0.2) * 0.2;
          
          // Orbit drone
          const orbitAngle = time * 1.2 * rotSpeedScale;
          miniDrone.position.set(
            Math.cos(orbitAngle) * 1.6,
            Math.sin(orbitAngle) * 0.8,
            Math.sin(orbitAngle) * 0.8
          );
          miniDrone.rotation.y = orbitAngle;
          miniDrone.rotation.x = time * 0.5;
        };
        break;

      case 7: // Web Development: Rotating database cylinder nested in server grid
        const serverBox = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.BoxGeometry(2.0, 2.0, 2.0)),
          wireMaterial
        );
        mainGroup.add(serverBox);

        const databaseCyl = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 8, 4)),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
        );
        mainGroup.add(databaseCyl);

        updateFn = (time, rotSpeedScale) => {
          serverBox.rotation.y = time * 0.1 * rotSpeedScale;
          serverBox.rotation.x = time * 0.05;
          
          databaseCyl.rotation.y = -time * 0.3 * rotSpeedScale;
        };
        break;
    }

    // ----------------------------------------------------
    // RESIZE & INTERACTIVE ROTATION SPEEDS
    // ----------------------------------------------------
    let rotSpeedScale = 1.0;
    let targetRotSpeedScale = 1.0;

    // Card Hover Listeners inside JS for local speeds
    card.addEventListener('mouseenter', () => {
      targetRotSpeedScale = 3.5;
    });

    card.addEventListener('mouseleave', () => {
      targetRotSpeedScale = 1.0;
    });

    // 3D Card tilt calculation variables
    let cardTiltX = 0, cardTiltY = 0;
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const percentX = (x / rect.width) * 2 - 1; // -1 to 1
      const percentY = (y / rect.height) * 2 - 1; // -1 to 1
      
      cardTiltX = percentX * 4;  // max tilt +/-4 degrees Y
      cardTiltY = -percentY * 4; // max tilt +/-4 degrees X
      
      // Apply CSS style directly
      card.style.transform = `perspective(1000px) rotateX(${cardTiltY}deg) rotateY(${cardTiltX}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      cardTiltX = 0;
      cardTiltY = 0;
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    });

    const onResize = () => {
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // Visibility Check (IntersectionObserver toggle)
    let isVisible = true;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isVisible) return;
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Lerp rotation speed scaling
      rotSpeedScale += (targetRotSpeedScale - rotSpeedScale) * 0.1;

      // Execute custom animation step
      if (updateFn) {
        updateFn(time, rotSpeedScale);
      }

      renderer.render(scene, camera);
    };

    animate();

    controllers.push({
      canvasId: canvasId,
      setVisible: (visible) => {
        const wasVisible = isVisible;
        isVisible = visible;
        if (!wasVisible && isVisible) {
          animate();
        }
      },
      destroy: () => {
        isVisible = false;
        window.removeEventListener('resize', onResize);
        scene.clear();
        renderer.dispose();
      }
    });

  });

  return controllers;
}
