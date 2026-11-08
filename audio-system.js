/* =========================================================
   ALPHA BLOCKS · audio-system.js
   Módulo independiente de integración de audio Web + Pantalla "Romper Block"
   ========================================================= */
(function () {
  'use strict';

  // --- Instanciación de efectos y música ambiental (Rutas relativas) ---
  const SOUNDS = {
    intro: new Audio('sonido/adoblocks.mp3'),
    boton: new Audio('sonido/boton.mp3'),
    menu: new Audio('sonido/menu.mp3'),
    bloquin: new Audio('sonido/bloquin.mp3'),
    relA: new Audio('sonido/absolutamente-necesario.mp3'),
    relE: new Audio('sonido/especialmente-importante.mp3'),
    relI: new Audio('sonido/importante.mp3'),
    relX: new Audio('sonido/incompatible.mp3'),
    simulacion: new Audio('sonido/simulacion.mp3')
  };

  // Ajustes de volumen y repetición en bucle
  SOUNDS.menu.loop = true;
  SOUNDS.menu.volume = 0.35;
  SOUNDS.simulacion.volume = 0.6;
  SOUNDS.intro.volume = 0.8;

  let audioUnlocked = false;
  let inSimulation = false;
  let currentClassificationAudio = null;

  // La música del menú inicia automáticamente cuando termina el audio de intro
  SOUNDS.intro.addEventListener('ended', function () {
    if (audioUnlocked && !inSimulation) {
      playSound(SOUNDS.menu);
    }
  });

  // Función de reproducción segura frente a bloqueos de Autoplay
  function playSound(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  }

  // --- Crear la Pantalla Inicial con el Block "ROMPER" ---
  function createBreakBlockOverlay() {
    const appEl = document.getElementById('app');
    const splashEl = document.getElementById('splash');
    
    // Ocultar la aplicación y la animación original hasta presionar el bloque
    if (splashEl) splashEl.style.display = 'none';
    if (appEl) appEl.style.visibility = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'break-block-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: #0e1116;
      z-index: 9999999;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      user-select: none;
      transition: opacity 0.4s ease;
    `;

    const blockBtn = document.createElement('div');
    blockBtn.style.cssText = `
      background: linear-gradient(145deg, #f5a524, #ff6b35);
      border: 4px solid #fff;
      border-radius: 12px;
      padding: 2.5rem 3.5rem;
      color: #111;
      font-family: 'Segoe UI', Roboto, sans-serif;
      font-size: 2.2rem;
      font-weight: 900;
      letter-spacing: 2px;
      box-shadow: 0 10px 25px rgba(245, 165, 36, 0.4), inset 0 -5px 0 rgba(0,0,0,0.2);
      text-transform: uppercase;
      transition: transform 0.1s ease, filter 0.2s ease;
      text-align: center;
    `;
    blockBtn.innerHTML = '🧱 ROMPER';

    overlay.appendChild(blockBtn);
    document.body.appendChild(overlay);

    // Animación visual al pasar el cursor
    overlay.addEventListener('mouseenter', () => {
      blockBtn.style.transform = 'scale(1.05)';
      blockBtn.style.filter = 'brightness(1.1)';
    });
    overlay.addEventListener('mouseleave', () => {
      blockBtn.style.transform = 'scale(1)';
      blockBtn.style.filter = 'none';
    });

    // Evento al presionar: Romper bloque -> 1s de retraso -> Sonido Intro -> Animación ALPHA BLOCKS -> Música de Menú al finalizar intro
    const handleBreak = function () {
      if (audioUnlocked) return;
      audioUnlocked = true;

      // Efecto visual de ruptura
      blockBtn.style.transform = 'scale(0.8) rotate(-8deg)';
      blockBtn.style.opacity = '0';
      overlay.style.opacity = '0';

      // Reproducir sonido de introducción (adoblocks.mp3) con 1 segundo de retraso
      setTimeout(() => {
        playSound(SOUNDS.intro);
      }, 1000);

      // Desvanecer la pantalla de ruptura e iniciar animación de presentación
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        
        if (splashEl) splashEl.style.display = 'block';

        if (typeof window.splash === 'function') {
          window.splash().then(() => {
            if (appEl) appEl.style.visibility = 'visible';
          });
        } else {
          if (appEl) appEl.style.visibility = 'visible';
        }
      }, 400);

      overlay.removeEventListener('click', handleBreak);
    };

    overlay.addEventListener('click', handleBreak);
  }

  // Montar la pantalla inicial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBreakBlockOverlay);
  } else {
    createBreakBlockOverlay();
  }

  // --- B. Sonido de botones generales ---
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('button, .btn, .nav-item, input[type="radio"], input[type="checkbox"], .tab');
    if (!btn || e.target.closest('#break-block-overlay')) return;

    if (btn.classList.contains('tri') || btn.closest('.dict') || btn.id === 'menuBtn' || btn.id === 'closeBtn') {
      return;
    }

    playSound(SOUNDS.boton);
  }, true);

  // --- D. Matriz SHA interactiva (sonido/bloquin.mp3) ---
  document.addEventListener('click', function (e) {
    const tri = e.target.closest('.tri, .est');
    if (tri) {
      playSound(SOUNDS.bloquin);
    }
  }, true);

  // --- E. Clasificación de relaciones (Punto 3: Diagrama de Relaciones) ---
  document.addEventListener('click', function (e) {
    const node = e.target.closest('.rdsvg .node');
    if (!node) return;

    setTimeout(() => {
      const panel = document.getElementById('rdpanel');
      if (!panel) return;

      let targetAudio = null;
      if (panel.classList.contains('bad')) {
        targetAudio = SOUNDS.relX;
      } else if (panel.classList.contains('ok')) {
        const text = panel.innerHTML || '';
        if (text.includes('ABSOLUTAMENTE NECESARIO') || text.includes('background:#FF2E93')) {
          targetAudio = SOUNDS.relA;
        } else if (text.includes('ESPECIALMENTE IMPORTANTE') || text.includes('background:#E0A800') || text.includes('background:#FFC93C')) {
          targetAudio = SOUNDS.relE;
        } else if (text.includes('IMPORTANTE') || text.includes('background:#00A854') || text.includes('background:#00E676')) {
          targetAudio = SOUNDS.relI;
        }
      }

      if (targetAudio) {
        if (currentClassificationAudio && currentClassificationAudio !== targetAudio) {
          currentClassificationAudio.pause();
          currentClassificationAudio.currentTime = 0;
        }
        currentClassificationAudio = targetAudio;
        playSound(targetAudio);
      }
    }, 50);
  }, true);

  // --- F. Transición a la Simulación Animada y Gestión de Menú ---
  function checkNavigationState(moduleIndex) {
    if (moduleIndex === 5) {
      inSimulation = true;
      if (!SOUNDS.menu.paused) {
        SOUNDS.menu.pause();
      }
      playSound(SOUNDS.simulacion);
    } else {
      if (inSimulation) {
        inSimulation = false;
        if (!SOUNDS.simulacion.paused) {
          SOUNDS.simulacion.pause();
          SOUNDS.simulacion.currentTime = 0;
        }
        // Si la intro ya terminó por completo, reanudar la música del menú
        if (audioUnlocked && SOUNDS.intro.paused) {
          playSound(SOUNDS.menu);
        }
      }
    }
  }

  document.addEventListener('click', function (e) {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
      const items = Array.from(document.querySelectorAll('.nav-item'));
      const idx = items.indexOf(navItem);
      if (idx !== -1) {
        checkNavigationState(idx);
      }
    }
  }, true);

})();