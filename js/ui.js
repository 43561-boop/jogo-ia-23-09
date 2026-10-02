/**
 * UI Manager - Gerenciador de Telas, HUD, Modais, Recordes e Áudio
 */
class UIManager {
  constructor(game) {
    this.game = game;

    // Elementos de Telas
    this.startScreen = document.getElementById('start-screen');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.victoryScreen = document.getElementById('victory-screen');

    // Modais
    this.modalHowToPlay = document.getElementById('modal-how-to-play');
    this.modalSettings = document.getElementById('modal-settings');

    // Elementos do HUD
    this.hudDistance = document.getElementById('hud-distance');
    this.hudRecord = document.getElementById('hud-record');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudEventBanner = document.getElementById('hud-event-banner');
    this.eventBannerTitle = document.getElementById('event-banner-title');
    this.eventBannerSubtitle = document.getElementById('event-banner-subtitle');
    this.trainProgressBox = document.getElementById('train-progress-box');
    this.trainTimerText = document.getElementById('train-timer-text');
    this.trainProgressFill = document.getElementById('train-progress-fill');

    // Elementos de Som
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.iconSoundOn = document.getElementById('icon-sound-on');
    this.iconSoundOff = document.getElementById('icon-sound-off');
    this.sliderSfx = document.getElementById('slider-sfx-volume');
    this.sliderRain = document.getElementById('slider-rain-volume');

    // Estatísticas dos Menus
    this.menuRecordVal = document.getElementById('menu-record-val');

    // Estatísticas Game Over
    this.goDistance = document.getElementById('go-distance');
    this.goRecord = document.getElementById('go-record');
    this.goSpeed = document.getElementById('go-speed');
    this.goDodged = document.getElementById('go-dodged');
    this.goCause = document.getElementById('gameover-cause');

    // Estatísticas Vitória
    this.vicDistance = document.getElementById('vic-distance');
    this.vicTime = document.getElementById('vic-time');
    this.vicSpeed = document.getElementById('vic-speed');
    this.vicDodged = document.getElementById('vic-dodged');

    // Checkbox modo de teste do trem
    this.toggleTrainTest = document.getElementById('toggle-train-test');

    this.recordDistance = this.loadRecord();
    this.updateRecordDisplay();
    this.bindEvents();
  }

  loadRecord() {
    try {
      const saved = localStorage.getItem('cow_runner_best_distance');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  saveRecord(distance) {
    if (distance > this.recordDistance) {
      this.recordDistance = Math.floor(distance);
      try {
        localStorage.setItem('cow_runner_best_distance', this.recordDistance.toString());
      } catch (e) {}
      this.updateRecordDisplay();
    }
  }

  updateRecordDisplay() {
    const formatted = this.recordDistance.toLocaleString('pt-BR');
    if (this.hudRecord) this.hudRecord.textContent = formatted;
    if (this.menuRecordVal) this.menuRecordVal.textContent = formatted;
  }

  bindEvents() {
    // Botão Jogar
    document.getElementById('btn-play').addEventListener('click', () => {
      window.audioEngine.ensureContext();
      this.game.start();
    });

    // Botões de Tentar / Jogar Novamente
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.game.start();
    });
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.game.start();
    });

    // Botões de Voltar ao Menu Principal
    document.getElementById('btn-menu-from-go').addEventListener('click', () => {
      this.showStartScreen();
    });
    document.getElementById('btn-menu-from-vic').addEventListener('click', () => {
      this.showStartScreen();
    });

    // Modais
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      this.modalHowToPlay.classList.add('active');
    });
    document.getElementById('btn-close-how').addEventListener('click', () => {
      this.modalHowToPlay.classList.remove('active');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.modalSettings.classList.add('active');
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.modalSettings.classList.remove('active');
    });

    // Fechar modais ao clicar no fundo
    [this.modalHowToPlay, this.modalSettings].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Controle de Áudio (Mudo)
    this.btnToggleSound.addEventListener('click', () => {
      const isMuted = window.audioEngine.toggleMute();
      this.iconSoundOn.style.display = isMuted ? 'none' : 'block';
      this.iconSoundOff.style.display = isMuted ? 'block' : 'none';
    });

    // Sliders de Volume
    this.sliderSfx.addEventListener('input', (e) => {
      window.audioEngine.setSfxVolume(e.target.value / 100);
    });
    this.sliderRain.addEventListener('input', (e) => {
      window.audioEngine.setRainVolume(e.target.value / 100);
    });

    // Resetar Recorde
    document.getElementById('btn-reset-record').addEventListener('click', () => {
      try {
        localStorage.removeItem('cow_runner_best_distance');
      } catch (e) {}
      this.recordDistance = 0;
      this.updateRecordDisplay();
    });

    // Botão de Pausa
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.game.togglePause();
      });
    }

    // Atalhos Globais no Teclado
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        this.game.togglePause();
      }
      if (e.code === 'KeyM') {
        this.btnToggleSound.click();
      }
      if (e.code === 'Escape') {
        this.modalHowToPlay.classList.remove('active');
        this.modalSettings.classList.remove('active');
      }
    });

    // Controles de Toque para Mobile
    const touchJump = document.getElementById('touch-jump');
    const touchDuck = document.getElementById('touch-duck');

    if (touchJump) {
      touchJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleJumpPress();
      });
      touchJump.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.game.handleJumpRelease();
      });
    }

    if (touchDuck) {
      touchDuck.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleDuckPress();
      });
      touchDuck.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.game.handleDuckRelease();
      });
    }
  }

  showStartScreen() {
    this.startScreen.classList.add('active');
    this.hudOverlay.style.display = 'none';
    this.gameoverScreen.classList.remove('active');
    this.victoryScreen.classList.remove('active');
    this.trainProgressBox.classList.remove('active');
    this.hideEventBanner();
    this.updateRecordDisplay();
  }

  showInGameHUD() {
    this.startScreen.classList.remove('active');
    this.hudOverlay.style.display = 'flex';
    this.gameoverScreen.classList.remove('active');
    this.victoryScreen.classList.remove('active');
  }

  updateHUD(distance, speedKmH) {
    this.hudDistance.textContent = Math.floor(distance).toLocaleString('pt-BR');
    this.hudSpeed.textContent = Math.round(speedKmH);
  }

  showEventBanner(title, subtitle) {
    this.eventBannerTitle.textContent = title;
    this.eventBannerSubtitle.textContent = subtitle;
    this.hudEventBanner.classList.add('visible');
  }

  hideEventBanner() {
    this.hudEventBanner.classList.remove('visible');
  }

  updateTrainProgress(remainingSeconds, totalSeconds) {
    this.trainProgressBox.classList.add('active');
    this.trainTimerText.textContent = remainingSeconds.toFixed(1) + 's';
    const percent = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
    this.trainProgressFill.style.width = percent + '%';
  }

  updateLives(lives) {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`heart-${i}`);
      if (heart) {
        if (i <= lives) {
          heart.classList.remove('lost');
        } else {
          heart.classList.add('lost');
        }
      }
    }
  }

  setBannerDanger(isDanger) {
    if (this.hudEventBanner) {
      if (isDanger) {
        this.hudEventBanner.classList.add('danger');
      } else {
        this.hudEventBanner.classList.remove('danger');
      }
    }
  }

  hideTrainProgress() {
    this.trainProgressBox.classList.remove('active');
  }

  showGameOver(stats) {
    this.hudOverlay.style.display = 'none';
    this.gameoverScreen.classList.add('active');
    this.saveRecord(stats.distance);

    this.goDistance.textContent = Math.floor(stats.distance).toLocaleString('pt-BR') + ' m';
    this.goRecord.textContent = this.recordDistance.toLocaleString('pt-BR') + ' m';
    this.goSpeed.textContent = Math.round(stats.maxSpeed) + ' km/h';
    this.goDodged.textContent = stats.dodgedCount.toString();

    if (stats.hitType === 'train') {
      this.goCause.textContent = 'A vaquinha foi atingida pelo trem por não ter segurado a barra de espaço!';
    } else if (stats.hitType === 'saw') {
      this.goCause.textContent = 'A vaquinha tocou em uma serra no chão!';
    } else {
      this.goCause.textContent = 'A vaquinha foi atingida por uma flecha!';
    }
  }

  showVictory(stats) {
    this.hudOverlay.style.display = 'none';
    this.victoryScreen.classList.add('active');
    this.saveRecord(stats.distance);

    this.vicDistance.textContent = Math.floor(stats.distance).toLocaleString('pt-BR') + ' m';
    this.vicSpeed.textContent = Math.round(stats.maxSpeed) + ' km/h';
    this.vicDodged.textContent = stats.dodgedCount.toString();

    const mins = Math.floor(stats.totalTime / 60);
    const secs = Math.floor(stats.totalTime % 60);
    this.vicTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  isTrainTestActive() {
    return this.toggleTrainTest ? this.toggleTrainTest.checked : false;
  }
}

window.UIManager = UIManager;
