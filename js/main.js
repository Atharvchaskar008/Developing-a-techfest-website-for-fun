// Main JS Coordinator
import { initHeroScene } from './webgl-hero.js';
import { initAboutScene } from './webgl-about.js';
import { initEventsScenes } from './webgl-events.js';
import { initTimelineScene } from './webgl-timeline.js';
import { initRegisterScene } from './webgl-register.js';

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Check
  const isMobile = window.innerWidth < 768;

  // Register GSAP ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // ==========================================================================
  // 1. SMOOTH SCROLL (LENIS)
  // ==========================================================================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard expo-out
    infinite: false,
    gestureOrientation: 'vertical',
    normalizeWheel: true
  });

  // Sync ScrollTrigger with Lenis
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // ==========================================================================
  // 2. DUAL-LAYER CUSTOM CURSOR
  // ==========================================================================
  const cursor = document.getElementById('custom-cursor');
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  let mouse = { x: 0, y: 0 };
  let dotPos = { x: 0, y: 0 };
  let ringPos = { x: 0, y: 0 };

  if (!isMobile) {
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // Update dot position immediately
      dotPos.x = mouse.x;
      dotPos.y = mouse.y;
      dot.style.left = `${dotPos.x}px`;
      dot.style.top = `${dotPos.y}px`;
    });

    // Lerp trail effect for the outer ring
    const updateCursorRing = () => {
      ringPos.x += (mouse.x - ringPos.x) * 0.12; // Lerp factor
      ringPos.y += (mouse.y - ringPos.y) * 0.12;
      ring.style.left = `${ringPos.x}px`;
      ring.style.top = `${ringPos.y}px`;
      requestAnimationFrame(updateCursorRing);
    };
    updateCursorRing();

    // Cursor morphing hover states
    const addHoverTargets = () => {
      const hoverTargets = document.querySelectorAll('.hover-target, a, button, input, select, textarea, .stat-card, .event-card, .workshop-card, .team-card');
      hoverTargets.forEach((target) => {
        target.addEventListener('mouseenter', () => {
          cursor.classList.add('hovering-target');
        });
        target.addEventListener('mouseleave', () => {
          cursor.classList.remove('hovering-target');
        });
      });
      
      // Drag hovering targets (3D elements/cards)
      const dragTargets = document.querySelectorAll('.event-card, .timeline-canvas-wrapper, .workshop-card');
      dragTargets.forEach((target) => {
        target.addEventListener('mouseenter', () => {
          cursor.classList.add('drag-hovering');
        });
        target.addEventListener('mouseleave', () => {
          cursor.classList.remove('drag-hovering');
        });
      });
    };
    addHoverTargets();
  }

  // ==========================================================================
  // 3. NAVIGATION MANAGEMENT (SCROLL AWARE)
  // ==========================================================================
  const navbar = document.getElementById('navbar');
  let lastScrollY = window.scrollY;

  // Toggle navbar show/hide on scroll
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 100 && currentScrollY > lastScrollY) {
      // Scrolling down -> Hide nav
      navbar.style.transform = 'translateY(-100%)';
    } else {
      // Scrolling up -> Show nav
      navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = currentScrollY;
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  const toggleMobileMenu = () => {
    mobileToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    if (mobileMenu.classList.contains('open')) {
      lenis.stop(); // Prevent scrolling behind mobile nav
    } else {
      lenis.start();
    }
  };

  mobileToggle.addEventListener('click', toggleMobileMenu);
  
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMobileMenu();
      const targetSec = link.getAttribute('data-section');
      lenis.scrollTo(`#${targetSec}`);
    });
  });

  // Smooth Scroll Navigation Clicks
  const navLinks = document.querySelectorAll('.nav-link, .nav-logo');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      lenis.scrollTo(targetId);
    });
  });

  // Update active links on scroll
  const sections = document.querySelectorAll('section');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('data-section') === id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(sec => navObserver.observe(sec));

  // Magnetic Button Effect (Register & CTA buttons)
  if (!isMobile) {
    const magneticBtns = document.querySelectorAll('.magnetic');
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        // Mouse coordinates relative to button center
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Pull button towards cursor
        btn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px) scale(1.02)`;
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px) scale(1)';
      });
    });
  }

  // ==========================================================================
  // 4. WEBGL CONTROLLER INITIALIZATION
  // ==========================================================================
  const heroCtrl = initHeroScene();
  const aboutCtrl = initAboutScene();
  
  // Only initialize event canvases on desktop/tablet to optimize performance
  let eventsCtrls = null;
  if (!isMobile) {
    eventsCtrls = initEventsScenes();
  }
  
  const timelineCtrl = initTimelineScene();
  const registerCtrl = initRegisterScene();

  // Performance Optimization: IntersectionObserver for rendering loops
  const webglObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const secId = entry.target.getAttribute('id');
      const isVisible = entry.isIntersecting;

      if (secId === 'home' && heroCtrl) heroCtrl.setVisible(isVisible);
      if (secId === 'about' && aboutCtrl) aboutCtrl.setVisible(isVisible);
      if (secId === 'timeline' && timelineCtrl) timelineCtrl.setVisible(isVisible);
      if (secId === 'register' && registerCtrl) registerCtrl.setVisible(isVisible);
      
      if (secId === 'events' && !isMobile && eventsCtrls) {
        eventsCtrls.forEach(ctrl => ctrl.setVisible(isVisible));
      }
    });
  }, { threshold: 0.05 });

  sections.forEach(sec => webglObserver.observe(sec));

  // ==========================================================================
  // 5. CINEMATIC LOADER SCENE (THREE.JS INSIDE LOADER)
  // ==========================================================================
  const loaderContainer = document.getElementById('loader-canvas-container');
  let loaderSceneCtrl = null;

  if (loaderContainer) {
    const lWidth = loaderContainer.clientWidth;
    const lHeight = loaderContainer.clientHeight;
    const lScene = new THREE.Scene();
    const lCamera = new THREE.PerspectiveCamera(45, lWidth / lHeight, 0.1, 10);
    lCamera.position.z = 4;

    const lRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    lRenderer.setSize(lWidth, lHeight);
    lRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    loaderContainer.appendChild(lRenderer.domElement);

    // Geometry: rotating wireframe octahedron
    const octaGeo = new THREE.OctahedronGeometry(1.0, 0);
    const octaWire = new THREE.WireframeGeometry(octaGeo);
    const octaMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    });
    const octa = new THREE.LineSegments(octaWire, octaMat);
    lScene.add(octa);

    // Particles formation surrounding the octahedron
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pInitial = new Float32Array(pCount * 3);
    const pSpeeds = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      // Scattered starting points
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.0 + Math.random() * 2.0;

      pInitial[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pInitial[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pInitial[i * 3 + 2] = r * Math.cos(phi);

      pPos[i * 3] = pInitial[i * 3];
      pPos[i * 3 + 1] = pInitial[i * 3 + 1];
      pPos[i * 3 + 2] = pInitial[i * 3 + 2];

      pSpeeds[i] = 0.5 + Math.random() * 1.5;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.6
    });
    const loaderParticles = new THREE.Points(pGeo, pMat);
    lScene.add(loaderParticles);

    let loadProgress = 0.0;
    let lIsActive = true;
    const lClock = new THREE.Clock();

    const animateLoader = () => {
      if (!lIsActive) return;
      requestAnimationFrame(animateLoader);

      const time = lClock.getElapsedTime();
      octa.rotation.y = time * 0.4;
      octa.rotation.x = time * 0.2;

      // Convergence animation: particles converge to octahedron shape as loading progress grows
      const posAttr = loaderParticles.geometry.attributes.position;
      const posArr = posAttr.array;

      for (let i = 0; i < pCount; i++) {
        const idx = i * 3;
        const speed = pSpeeds[i];
        
        // Target shape is a small sphere/octahedron envelope shell (radius ~1.05)
        // Lerp from initial scattered position to the converged circular path
        const initX = pInitial[idx];
        const initY = pInitial[idx + 1];
        const initZ = pInitial[idx + 2];
        
        const length = Math.sqrt(initX*initX + initY*initY + initZ*initZ) || 1;
        const targetRadius = 1.05;
        const targetX = (initX / length) * targetRadius;
        const targetY = (initY / length) * targetRadius;
        const targetZ = (initZ / length) * targetRadius;

        posArr[idx] = THREE.MathUtils.lerp(initX, targetX, loadProgress);
        posArr[idx + 1] = THREE.MathUtils.lerp(initY, targetY, loadProgress);
        posArr[idx + 2] = THREE.MathUtils.lerp(initZ, targetZ, loadProgress);

        // Add small orbit rotation
        const orbitalAngle = time * 0.3 * speed;
        const x = posArr[idx];
        const z = posArr[idx + 2];
        posArr[idx] = x * Math.cos(orbitalAngle) - z * Math.sin(orbitalAngle);
        posArr[idx + 2] = x * Math.sin(orbitalAngle) + z * Math.cos(orbitalAngle);
      }
      posAttr.needsUpdate = true;

      lRenderer.render(lScene, lCamera);
    };
    animateLoader();

    loaderSceneCtrl = {
      updateProgress: (p) => {
        loadProgress = p;
      },
      triggerExplode: (onDone) => {
        // Explode shape outward
        gsap.to(octa.scale, { x: 8.0, y: 8.0, z: 8.0, duration: 1.2, ease: "power3.out" });
        gsap.to(octaMat, { opacity: 0, duration: 1.0 });
        gsap.to(pMat, { opacity: 0, size: 0.15, duration: 1.0 });

        // Scatter particles outward
        const posAttr = loaderParticles.geometry.attributes.position;
        const posArr = posAttr.array;
        
        const blowOut = { val: 0 };
        gsap.to(blowOut, {
          val: 8.0,
          duration: 1.2,
          ease: "power3.out",
          onUpdate: () => {
            for (let i = 0; i < pCount; i++) {
              const idx = i * 3;
              posArr[idx] *= 1.1;
              posArr[idx + 1] *= 1.1;
              posArr[idx + 2] *= 1.1;
            }
            posAttr.needsUpdate = true;
          },
          onComplete: () => {
            lIsActive = false;
            lRenderer.dispose();
            if (onDone) onDone();
          }
        });
      }
    };
  }

  // ==========================================================================
  // 6. LOADING SIMULATION & CINEMATIC INTRO TRANSITION
  // ==========================================================================
  const loaderEl = document.getElementById('loader');
  const percentageEl = document.getElementById('loader-percentage');
  const progressFillEl = document.getElementById('loader-progress-bar');

  // Prevent scroll during loading
  lenis.stop();

  let currentPercent = 0;
  const loadDuration = 2800; // 2.8 seconds cinematic duration
  const startTimestamp = performance.now();

  const updateLoader = (timestamp) => {
    const elapsed = timestamp - startTimestamp;
    const progress = Math.min(elapsed / loadDuration, 1.0);
    
    currentPercent = Math.floor(progress * 100);
    percentageEl.textContent = `${currentPercent}%`;
    progressFillEl.style.width = `${currentPercent}%`;

    if (loaderSceneCtrl) {
      loaderSceneCtrl.updateProgress(progress);
    }

    if (progress < 1.0) {
      requestAnimationFrame(updateLoader);
    } else {
      // Completed!
      onLoadingFinished();
    }
  };

  requestAnimationFrame(updateLoader);

  const onLoadingFinished = () => {
    // 1. Explode loader Three.js shape
    if (loaderSceneCtrl) {
      loaderSceneCtrl.triggerExplode(() => {
        // Complete clean up
      });
    }

    // 2. Explode primary Hero particles backdrop
    if (heroCtrl) {
      setTimeout(() => {
        heroCtrl.triggerExplosion();
      }, 300);
    }

    // 3. Dissolve loading HTML curtain screen with upward slide & fade
    gsap.timeline()
      .to(loaderEl, {
        y: '-100%',
        opacity: 0,
        duration: 1.4,
        ease: "power4.inOut",
        onComplete: () => {
          loaderEl.style.display = 'none';
          lenis.start(); // Unlock scrolling
        }
      })
      // Staggered reveal of hero content
      .fromTo('.hero-tag', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" },
        "-=0.8"
      )
      .fromTo('.hero-title span',
        { y: '100%' },
        { y: '0%', duration: 1.4, ease: "power4.out", stagger: 0.1 },
        "-=0.8"
      )
      .fromTo('.hero-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" },
        "-=1.0"
      )
      .fromTo('.hero-actions',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" },
        "-=0.9"
      )
      .fromTo('.scroll-indicator',
        { opacity: 0 },
        { opacity: 0.8, duration: 0.8 },
        "-=0.5"
      );
  };

  // ==========================================================================
  // 7. GLOBAL SCROLLTRIGGER REVEALS & PARALLAX
  // ==========================================================================
  
  // Custom Scroll Progress Fill
  ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const fill = document.getElementById('scroll-progress-fill');
      if (fill) {
        fill.style.height = `${self.progress * 100}%`;
      }
    }
  });

  // Global Reveals for headings and sections
  const revealTexts = document.querySelectorAll('.reveal-text');
  revealTexts.forEach(el => {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%"
        }
      }
    );
  });

  // Staggered reveals for bento and cards
  const sectionsWithStaggers = ['#about .reveal-stagger', '#events .reveal-stagger', '#team .reveal-stagger'];
  sectionsWithStaggers.forEach(selector => {
    const cardsToReveal = document.querySelectorAll(selector);
    if (cardsToReveal.length > 0) {
      gsap.fromTo(cardsToReveal,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.0,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsToReveal[0],
            start: "top 80%"
          }
        }
      );
    }
  });

  // Stat Count Up animation
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(num => {
    const target = parseInt(num.getAttribute('data-target'));
    gsap.fromTo(num,
      { textContent: 0 },
      {
        textContent: target,
        duration: 2.5,
        ease: "power3.out",
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: num,
          start: "top 88%"
        }
      }
    );
  });

  // Parallax headings
  const parallaxItems = document.querySelectorAll('.section-title');
  parallaxItems.forEach(item => {
    gsap.to(item, {
      y: -50,
      scrollTrigger: {
        trigger: item,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });

  // ==========================================================================
  // 8. SPECIFIC SECTION INTERACTION LOGIC
  // ==========================================================================

  // About Section scroll trigger link to WebGL
  ScrollTrigger.create({
    trigger: '#about',
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      if (aboutCtrl) {
        aboutCtrl.updateScroll(self.progress);
      }
    }
  });

  // Timeline Section Pin and Camera Flight scroll binding
  ScrollTrigger.create({
    trigger: '#timeline',
    start: "top top",
    end: "bottom bottom",
    pin: '.timeline-pinned-content',
    scrub: 0.6,
    onUpdate: (self) => {
      if (timelineCtrl) {
        timelineCtrl.updateScroll(self.progress);
      }
    }
  });

  // Workshops Section Horizontal Scroll trigger
  const workshopsRow = document.querySelector('.workshops-cards-row');
  if (workshopsRow) {
    const getScrollAmount = () => {
      return -(workshopsRow.scrollWidth - window.innerWidth);
    };

    ScrollTrigger.create({
      trigger: '#workshops',
      start: "top top",
      end: () => `+=${workshopsRow.scrollWidth}`,
      pin: '.workshops-pinned-wrap',
      scrub: 0.8,
      onUpdate: (self) => {
        // Translate horizontally
        const xOffset = self.progress * getScrollAmount();
        workshopsRow.style.transform = `translate3d(${xOffset}px, 0px, 0px)`;
      }
    });
  }

  // Sponsors marquee hover speed control
  const marqueeTracks = document.querySelectorAll('.marquee-track');
  marqueeTracks.forEach(track => {
    track.addEventListener('mouseenter', () => {
      const content = track.querySelector('.marquee-content');
      if (content) content.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', () => {
      const content = track.querySelector('.marquee-content');
      if (content) content.style.animationPlayState = 'running';
    });
  });

  // Registration Particle CTA triggers
  const regCtaBtn = document.getElementById('main-register-cta');
  if (regCtaBtn && registerCtrl) {
    regCtaBtn.addEventListener('mouseenter', () => {
      registerCtrl.triggerHoverEnter();
    });
    regCtaBtn.addEventListener('mouseleave', () => {
      registerCtrl.triggerHoverLeave();
    });
  }

  // ==========================================================================
  // 9. REGISTRATION MODAL CONTROL
  // ==========================================================================
  const modal = document.getElementById('register-modal');
  const triggerBtns = document.querySelectorAll('.trigger-modal, #nav-register-btn, #mobile-register-btn');
  const closeBtns = document.querySelectorAll('.trigger-close-modal');
  const regForm = document.getElementById('registration-form');
  const successMsg = document.getElementById('modal-success');

  const openModal = (e) => {
    if (e && e.target.id === 'main-register-cta') {
      // Trigger WebGL explosion first, then open modal with delay
      if (registerCtrl) registerCtrl.triggerClickExplosion();
      
      // Fullscreen ripple wave creation
      const ripple = document.createElement('div');
      ripple.classList.add('click-ripple-overlay');
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      
      setTimeout(() => {
        modal.classList.add('open');
        lenis.stop();
        ripple.remove();
      }, 700);
    } else {
      modal.classList.add('open');
      lenis.stop();
    }
  };

  const closeModal = () => {
    modal.classList.remove('open');
    lenis.start();
    // Reset form after close animation
    setTimeout(() => {
      regForm.reset();
      regForm.style.display = 'flex';
      successMsg.classList.remove('visible');
    }, 500);
  };

  triggerBtns.forEach(btn => btn.addEventListener('click', openModal));
  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

  // Handle Form Submission
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Fade out form, fade in success screen
      gsap.to(regForm, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          regForm.style.display = 'none';
          successMsg.style.opacity = 0;
          successMsg.classList.add('visible');
          gsap.to(successMsg, { opacity: 1, duration: 0.4 });
        }
      });
    });
  }

});
