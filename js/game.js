/**
 * Game - Controlador Principal do Jogo e Máquina de Estados
 * Coordena o loop de animação (requestAnimationFrame), física, colisão,
 * evento especial dos 4000 metros (30 segundos do trem) e final da corrida aos 5000 metros.
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Resolução virtual padrão 16:9
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.groundY = 580; // Altura do chão

    // Instanciação dos Módulos
    const CowClass = window.Cow || Cow;
    const ObstaclesClass = window.ObstacleManager || ObstacleManager;
    const BackgroundClass = window.Background || Background;
    const UIClass = window.UIManager || UIManager;

    this.cow = new CowClass(this.width, this.groundY);
    this.obstacles = new ObstaclesClass(this.width, this.groundY);
    this.background = new BackgroundClass(this.width, this.height, this.groundY);
    this.ui = new UIClass(this);

    // Estados do Jogo: 'MENU', 'PLAYING', 'APPROACHING_TRAIN', 'TRAIN_PASSING', 'GAME_OVER', 'VICTORY'
    this.state = 'MENU';
    this.isPaused = false;

    // Métricas de Corrida
    this.distance = 0;
    this.finalDistance = 10000; // Meta final da corrida (10000 metros)
    this.baseSpeed = 290;      // Velocidade inicial mais suave e acessível (~24 km/h)
    this.maxSpeedReached = 24;
    this.gameSpeed = this.baseSpeed;
    this.runStartTime = 0;
    this.totalRunTime = 0;

    // Teclas Pressionadas
    this.keys = {
      jump: false,
      duck: false
    };

    // Parâmetros do Evento do Trem (4000m)
    this.trainEventTriggered = false;
    this.trainWaitCountdown = 0;

    // Loop de Tempo
    this.lastTime = performance.now();

    this.bindInputEvents();
    this.ui.showStartScreen();

    // Iniciar loop de renderização (renderiza o menu dinamicamente com chuva)
    requestAnimationFrame((t) => this.loop(t));
  }

  bindInputEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.handleJumpPress();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.handleDuckPress();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.handleJumpRelease();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.handleDuckRelease();
      }
    });

    // Se a aba perder o foco, pausa o jogo
    window.addEventListener('blur', () => {
      if (this.state === 'PLAYING' || this.state === 'APPROACHING_TRAIN' || this.state === 'TRAIN_PASSING') {
        this.isPaused = true;
      }
    });
  }

  handleJumpPress() {
    this.keys.jump = true;

    if (this.state === 'MENU') {
      this.start();
      return;
    }
    if (this.state === 'GAME_OVER') {
      this.start();
      return;
    }

    // Se estiver no evento do trem, segurar espaço abriga a vaca
    if (this.state === 'TRAIN_PASSING' || this.state === 'APPROACHING_TRAIN') {
      this.cow.setSheltered(true);
      return;
    }

    if (this.state === 'PLAYING') {
      this.cow.jump();
    }
  }

  handleJumpRelease() {
    this.keys.jump = false;
    if (this.state === 'PLAYING') {
      this.cow.endJump();
    }
    if (this.state === 'TRAIN_PASSING') {
      // Se soltar o espaço durante o trem, continua abrigada se ainda estiver dentro do evento
      // mas reforça aviso se necessário
    }
  }

  handleDuckPress() {
    this.keys.duck = true;
    if (this.state === 'PLAYING') {
      this.cow.setDucking(true);
    }
  }

  handleDuckRelease() {
    this.keys.duck = false;
    if (this.state === 'PLAYING') {
      this.cow.setDucking(false);
    }
  }

  start() {
    window.audioEngine.ensureContext();

    this.state = 'PLAYING';
    this.isPaused = false;
    this.runStartTime = performance.now();
    this.totalRunTime = 0;
    this.maxSpeedReached = 24;

    // Se o modo de teste estiver ativado, pula para 3900m para testar o evento do trem instantaneamente
    if (this.ui.isTrainTestActive()) {
      this.distance = 3900;
    } else {
      this.distance = 0;
    }

    this.trainEventTriggered = false;

    this.cow.reset();
    this.obstacles.reset();
    this.background.reset();

    this.ui.showInGameHUD();
  }

  togglePause() {
    if (this.state === 'PLAYING' || this.state === 'TRAIN_PASSING' || this.state === 'APPROACHING_TRAIN') {
      this.isPaused = !this.isPaused;
    }
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Clamp para evitar saltos
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // No Menu, apenas atualizamos a chuva e o moinho do fundo suavemente
    if (this.state === 'MENU') {
      this.background.update(dt, 60);
      return;
    }

    // Durante a Partida
    if (this.state === 'PLAYING' || this.state === 'APPROACHING_TRAIN' || this.state === 'TRAIN_PASSING') {
      this.totalRunTime += dt;

      // 1. Cálculo de Velocidade Progressiva
      // Acelera gradualmente conforme a distância percorrida
      // 0m = ~28 km/h | 4000m = ~56 km/h | 5000m = ~62 km/h
      const speedProgress = Math.min(1, this.distance / this.finalDistance);
      const currentPixelsPerSec = this.baseSpeed + speedProgress * 340;
      const speedKmH = (currentPixelsPerSec / 12); // Conversão estética para km/h

      if (speedKmH > this.maxSpeedReached) {
        this.maxSpeedReached = speedKmH;
      }

      // Se a vaca estiver no evento do trem e abrigada, a velocidade do cenário desacelera até parar
      let effectiveSpeed = currentPixelsPerSec;
      if (this.state === 'TRAIN_PASSING') {
        effectiveSpeed = 0; // A vaca para em segurança enquanto o trem passa ao fundo
      }

      this.gameSpeed = effectiveSpeed;

      // 2. Acúmulo de Distância
      if (this.state !== 'TRAIN_PASSING') {
        // Incremento proporcional à velocidade
        this.distance += (effectiveSpeed * dt) / 10;
      }

      // Atualizar HUD
      this.ui.updateHUD(this.distance, speedKmH);

      // 3. Atualizar Entidades
      this.cow.update(dt, currentPixelsPerSec);
      this.background.update(dt, effectiveSpeed, this.distance);

      // 4. Verificação do Evento Especial dos 4000 Metros
      this.handleTrainEventLogic(dt);

      // 5. Atualizar Obstáculos e Colisões (apenas se não estiver no evento do trem)
      if (this.state !== 'TRAIN_PASSING') {
        this.obstacles.update(dt, effectiveSpeed, this.distance);

        // Checagem de Colisão
        const col = this.obstacles.checkCollision(this.cow);
        if (col.hit) {
          this.triggerGameOver(col.type);
          return;
        }
      }

      // 6. Verificação do Final do Jogo (Vitória aos 5000 metros)
      if (this.distance >= this.finalDistance && this.state !== 'VICTORY') {
        this.triggerVictory();
        return;
      }
    }
  }

  handleTrainEventLogic(dt) {
    // Fase 1: Aproximação aos 3900m
    if (this.distance >= 3900 && this.distance < 4000 && !this.trainEventTriggered) {
      if (this.state !== 'APPROACHING_TRAIN') {
        this.state = 'APPROACHING_TRAIN';
        this.obstacles.setPaused(true); // Para de spawnar novos obstáculos
        this.background.railroadVisible = true;
        this.ui.showEventBanner(
          'CRUZAMENTO FERROVIÁRIO ADIANTE!',
          'Mantenha a tecla ESPAÇO pressionada para se abrigar em segurança!'
        );
      }
    }

    // Fase 2: Chegada aos 4000m (Início dos 30 segundos do Trem)
    if (this.distance >= 4000 && !this.trainEventTriggered) {
      this.trainEventTriggered = true;
      this.state = 'TRAIN_PASSING';
      this.cow.setSheltered(true); // Vaca se abriga no chão
      this.background.startTrainEvent();
      this.ui.showEventBanner(
        'TREM PASSANDO PELO TÚNEL!',
        'Permaneça abrigado enquanto o trem a vapor cruza a ferrovia.'
      );
    }

    // Fase 3: Contagem dos 30 Segundos
    if (this.state === 'TRAIN_PASSING') {
      const remainingTime = this.background.trainTimer;
      this.ui.updateTrainProgress(remainingTime, this.background.trainTotalDuration);

      // Se o jogador pressionar espaço, reforça o abrigo
      if (this.keys.jump) {
        this.cow.setSheltered(true);
      }

      // Término dos 30 segundos
      if (remainingTime <= 0) {
        this.endTrainEvent();
      }
    }
  }

  endTrainEvent() {
    this.state = 'PLAYING';
    this.cow.setSheltered(false); // Vaca se levanta e volta a correr
    this.obstacles.setPaused(false); // Obstáculos voltam
    this.ui.hideTrainProgress();
    this.ui.showEventBanner(
      'O TREM PASSOU!',
      'Caminho livre! A corrida continua rumo à linha de chegada!'
    );

    // Ocultar banner após 4 segundos
    setTimeout(() => {
      this.ui.hideEventBanner();
    }, 4000);
  }

  triggerGameOver(hitType) {
    this.state = 'GAME_OVER';
    this.cow.isDead = true;
    window.audioEngine.playHit();

    this.ui.showGameOver({
      distance: this.distance,
      maxSpeed: this.maxSpeedReached,
      dodgedCount: this.obstacles.dodgedCount,
      hitType: hitType
    });
  }

  triggerVictory() {
    this.state = 'VICTORY';
    this.cow.isVictorious = true;
    this.cow.setSheltered(false);
    window.audioEngine.playVictory();

    this.ui.showVictory({
      distance: this.finalDistance,
      totalTime: this.totalRunTime,
      maxSpeed: this.maxSpeedReached,
      dodgedCount: this.obstacles.dodgedCount
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Desenhar Cenário em Paralaxe & Chuva
    this.background.draw(this.ctx);

    // 2. Desenhar Obstáculos (Serras e Flechas)
    if (this.state !== 'MENU') {
      this.obstacles.draw(this.ctx);
    }

    // 3. Desenhar a Vaquinha
    if (this.state !== 'MENU') {
      this.cow.draw(this.ctx);
    }

    // 4. Se estiver pausado, desenha overlay suave
    if (this.isPaused) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(15, 23, 33, 0.65)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '700 36px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('JOGO PAUSADO', this.width / 2, this.height / 2 - 10);

      this.ctx.fillStyle = '#94a3b8';
      this.ctx.font = '500 18px Outfit, sans-serif';
      this.ctx.fillText('Pressione P ou clique em Retomar para continuar', this.width / 2, this.height / 2 + 30);
      this.ctx.restore();
    }
  }
}

window.Game = Game;

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
