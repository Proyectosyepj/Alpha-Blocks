/* =========================================================
   ALPHA BLOCKS · audio-system.js
   Módulo independiente de integración de audio Web
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

  // Función de reproducción segura frente a bloqueos de Autoplay
  function playSound(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Captura silenciosa si el navegador bloquea la reproducción previa a interacción
        });
      }
    } catch (e) {
      // Evita interrupciones en la consola si algún archivo aún no ha sido copiado
    }
  }

  // --- 1. Desbloqueo inicial por interacción del usuario ---
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    // A. Sonido de introducción (se ejecuta una vez por entrada)
    playSound(SOUNDS.intro);

    // C. Música ambiental del menú
    if (!inSimulation) {
      playSound(SOUNDS.menu);
    }

    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  }

  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  // --- B. Sonido de botones generales ---
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('button, .btn, .nav-item, input[type="radio"], input[type="checkbox"], .tab');
    if (!btn) return;

    // Filtrar elementos que tengan sonidos específicos
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
        targetAudio = SOUNDS.relX; // Incompatible
      } else if (panel.classList.contains('ok')) {
        const text = panel.innerHTML || '';
        if (text.includes('ABSOLUTAMENTE NECESARIO') || text.includes('background:#FF2E93')) {
          targetAudio = SOUNDS.relA; // Absolutamente necesario
        } else if (text.includes('ESPECIALMENTE IMPORTANTE') || text.includes('background:#E0A800') || text.includes('background:#FFC93C')) {
          targetAudio = SOUNDS.relE; // Especialmente importante
        } else if (text.includes('IMPORTANTE') || text.includes('background:#00A854') || text.includes('background:#00E676')) {
          targetAudio = SOUNDS.relI; // Importante
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
    // El índice 5 corresponde al apartado "6. Simulación Animada HTML5"
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
        if (audioUnlocked) {
          playSound(SOUNDS.menu);
        }
      }
    }
  }

  // Listener para capturar el cambio de apartado en la navegación
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