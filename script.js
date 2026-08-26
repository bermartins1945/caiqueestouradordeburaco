/* ============================================
   CAIQUE MENGHIN — O ESTOURADOR DE BURACOS
   Script principal
   ============================================ */

(function() {
  'use strict';

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================
  const CONFIG = {
    totalHoles: 20,
    particleCount: 12,
    particleVelocity: { min: 80, max: 140 },
    particleDuration: { min: 700, max: 1000 },
    particleColors: ['#ff6b1a', '#ffc93c', '#e63946', '#f5f5f5', '#ff9f43'],
    confettiCount: 150,
    soundEnabled: true,
    vibrationEnabled: true
  };

  // ==========================================
  // UTILITÁRIOS
  // ==========================================
  const Utils = {
    random: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    vibrate: (pattern) => {
      if (CONFIG.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    }
  };

  // ==========================================
  // SISTEMA DE ÁUDIO (Web Audio API)
  // ==========================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized || !CONFIG.soundEnabled) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio API não suportada');
      }
    }

    // Som de "pum" sintetizado
    playPop() {
      if (!this.initialized) this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Oscilador principal (grave)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Ruído de ar (compressão)
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const noise = this.ctx.createBufferSource();
      const noiseGain = this.ctx.createGain();
      noise.buffer = buffer;
      noiseGain.gain.setValueAtTime(0.15, now);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    }

    // Som de vitória
    playVictory() {
      if (!this.initialized) this.init();
      if (!this.ctx) return;

      const notes = [523, 659, 784, 1047]; // Dó, Mi, Sol, Dó oitavado
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    }
  }

  // ==========================================
  // SISTEMA DE PARTÍCULAS
  // ==========================================
  class ParticleSystem {
    static spawn(x, y, count = CONFIG.particleCount) {
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = Utils.pick(CONFIG.particleColors);
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        document.body.appendChild(p);

        const angle = (Math.PI * 2 * i) / count;
        const velocity = Utils.random(
          CONFIG.particleVelocity.min,
          CONFIG.particleVelocity.max
        );
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        const duration = Utils.random(
          CONFIG.particleDuration.min,
          CONFIG.particleDuration.max
        );

        p.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
        ], {
          duration,
          easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)'
        }).onfinish = () => p.remove();
      }
    }

    static confetti() {
      const colors = ['#ff6b1a', '#ffc93c', '#e63946', '#f5f5f5', '#4ecdc4'];
      for (let i = 0; i < CONFIG.confettiCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = Utils.pick(colors);
        p.style.width = Utils.randomInt(6, 12) + 'px';
        p.style.height = Utils.randomInt(6, 12) + 'px';
        p.style.borderRadius = Utils.randomInt(0, 1) ? '50%' : '0';

        const startX = Utils.random(window.innerWidth * 0.2, window.innerWidth * 0.8);
        const startY = -20;
        p.style.left = startX + 'px';
        p.style.top = startY + 'px';
        document.body.appendChild(p);

        const endX = startX + Utils.random(-200, 200);
        const endY = window.innerHeight + 50;
        const rotation = Utils.random(0, 720);
        const duration = Utils.random(2000, 3500);

        p.animate([
          {
            transform: `translate(0,0) rotate(0deg)`,
            opacity: 1
          },
          {
            transform: `translate(${endX - startX}px, ${endY}px) rotate(${rotation}deg)`,
            opacity: 0
          }
        ], {
          duration,
          easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
        }).onfinish = () => p.remove();
      }
    }
  }

  // ==========================================
  // SCROLL REVEAL
  // ==========================================
  class ScrollReveal {
    constructor(selector, options = {}) {
      this.elements = document.querySelectorAll(selector);
      this.threshold = options.threshold || 0.2;
      this.init();
    }

    init() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: this.threshold });

      this.elements.forEach(el => observer.observe(el));
    }
  }

  // ==========================================
  // JOGO DOS BURACOS
  // ==========================================
  class HoleGame {
    constructor() {
      this.board = document.getElementById('holeBoard');
      this.poppedCountEl = document.getElementById('poppedCount');
      this.remainingCountEl = document.getElementById('remainingCount');
      this.levelEl = document.getElementById('level');
      this.resetBtn = document.getElementById('resetBtn');
      this.timeEl = document.getElementById('timeDisplay');

      this.popped = 0;
      this.startTime = null;
      this.timerInterval = null;
      this.sound = new SoundEngine();

      this.init();
    }

    init() {
      this.resetBtn.addEventListener('click', () => this.reset());
      this.reset();
    }

    reset() {
      this.board.innerHTML = '';
      this.popped = 0;
      this.startTime = null;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      if (this.timeEl) this.timeEl.textContent = '00:00';
      this.updateStats();

      for (let i = 0; i < CONFIG.totalHoles; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.dataset.index = i;
        hole.setAttribute('role', 'button');
        hole.setAttribute('aria-label', `Buraco ${i + 1}`);
        hole.setAttribute('tabindex', '0');
        hole.addEventListener('click', (e) => this.popHole(e));
        hole.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.popHole(e);
          }
        });
        this.board.appendChild(hole);
      }
    }

    startTimer() {
      if (this.timerInterval) return;
      this.startTime = Date.now();
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        if (this.timeEl) this.timeEl.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    popHole(e) {
      const hole = e.currentTarget;
      if (hole.classList.contains('popped')) return;

      // Inicia timer no primeiro clique
      if (this.popped === 0) this.startTimer();

      hole.classList.add('popped');
      this.popped++;
      this.updateStats();

      // Efeitos
      const rect = hole.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      this.sound.playPop();
      ParticleSystem.spawn(x, y);
      Utils.vibrate(50);

      // Verifica conclusão
      if (this.popped === CONFIG.totalHoles) {
        this.complete();
      }
    }

    updateStats() {
      this.poppedCountEl.textContent = this.popped;
      this.remainingCountEl.textContent = CONFIG.totalHoles - this.popped;
      this.levelEl.textContent = Math.floor(this.popped / 5) + 1;
    }

    complete() {
      clearInterval(this.timerInterval);
      this.timerInterval = null;

      // Confetti + som de vitória
      ParticleSystem.confetti();
      this.sound.playVictory();
      Utils.vibrate([100, 50, 100, 50, 200]);

      // Mensagem do Menghin
      setTimeout(() => {
        const time = this.timeEl ? this.timeEl.textContent : '00:00';
        alert(
          `🎉 PARABÉNS! Você ajudou o Menghin a estourar todos os buracos!\n\n` +
          `⏱️ Tempo: ${time}\n` +
          `🕳️ Buracos: ${CONFIG.totalHoles}\n\n` +
          `"Pronto. Estourou limpo. Pode usar de novo."`
        );
      }, 600);
    }
  }

  // ==========================================
  // EFEITOS NAS CITAÇÕES
  // ==========================================
  function initQuoteEffects() {
    document.querySelectorAll('.quote-card').forEach(card => {
      card.addEventListener('click', (e) => {
        ParticleSystem.spawn(e.clientX, e.clientY, 8);
      });
    });
  }

  // ==========================================
  // EFEITO PARALLAX NO HERO
  // ==========================================
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const opacity = Utils.clamp(1 - scrollY / 600, 0.3, 1);
      const translateY = scrollY * 0.3;
      hero.style.opacity = opacity;
      hero.style.transform = `translateY(${translateY}px)`;
    }, { passive: true });
  }

  // ==========================================
  // EASTER EGG: KONAMI CODE
  // ==========================================
  function initEasterEgg() {
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let index = 0;

    document.addEventListener('keydown', (e) => {
      if (e.key === konami[index]) {
        index++;
        if (index === konami.length) {
          index = 0;
          // Ativa modo Menghin supremo
          document.body.style.setProperty('--orange', '#ff00ff');
          document.body.style.setProperty('--yellow', '#00ffff');
          ParticleSystem.confetti();
          ParticleSystem.confetti();
          alert('🔥 MODO MENGHIN SUPREMO ATIVADO 🔥\n"Quanto mais apertado, mais eu gosto!"');
        }
      } else {
        index = 0;
      }
    });
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  function init() {
    // Scroll reveal nos parágrafos
    new ScrollReveal('.story p', { threshold: 0.2 });

    // Jogo dos buracos
    new HoleGame();

    // Efeitos extras
    initQuoteEffects();
    initHeroParallax();
    initEasterEgg();

    // Inicializa áudio no primeiro clique (política de autoplay)
    document.addEventListener('click', () => {
      const sound = new SoundEngine();
      sound.init();
    }, { once: true });

    console.log('%c🕳️ Caique Menghin — O Estourador de Buracos', 'color:#ff6b1a;font-size:20px;font-weight:bold;');
    console.log('%c"Nasci pra estourar buraco."', 'color:#ffc93c;font-style:italic;');
  }

  // Inicia quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
