/**
 * Obstacles - Serras no Chão e Flechas Aéreas
 * Animação contínua de rotação das serras, variação dinâmica de altitude das flechas e colisão precisa.
 */

// 1. SERRA NO CHÃO
class FloorSaw {
  constructor(x, groundY) {
    this.type = 'saw';
    this.x = x;
    this.groundY = groundY;
    this.radius = 24; // Tamanho visual ajustado
    this.y = groundY - this.radius + 6; // Apoio no chão
    this.rotation = 0;
    this.rotationSpeed = 20; // Rotação viva
    this.teethCount = 10;
    this.passed = false;

    // Partículas de faísca/água ejetadas pela serra
    this.sparks = [];
  }

  update(dt, gameSpeed) {
    this.x -= gameSpeed * dt;
    this.rotation += this.rotationSpeed * dt;

    // Gerar pequenas faíscas/respingos d'água ao cortar o ar úmido
    if (Math.random() < 0.25) {
      this.sparks.push({
        x: this.x + (Math.random() * 20 - 10),
        y: this.y + (Math.random() * 20 - 10),
        vx: -Math.random() * 4 - 2,
        vy: -Math.random() * 3,
        radius: 1.5 + Math.random() * 1.5,
        alpha: 0.9
      });
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.05;
      if (s.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Desenhar suporte de madeira no chão
    ctx.save();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(this.x - 6, this.groundY - 14, 12, 16);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.x - 6, this.groundY - 14, 12, 16);
    ctx.restore();

    // Desenhar a lâmina circular de serra
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Dentes afiados da serra
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const angleStep = (Math.PI * 2) / this.teethCount;
    for (let i = 0; i < this.teethCount; i++) {
      const a = i * angleStep;
      const outerX = Math.cos(a) * this.radius;
      const outerY = Math.sin(a) * this.radius;

      const innerA = a + angleStep * 0.45;
      const innerX = Math.cos(innerA) * (this.radius * 0.65);
      const innerY = Math.sin(innerA) * (this.radius * 0.65);

      if (i === 0) {
        ctx.moveTo(outerX, outerY);
      } else {
        ctx.lineTo(outerX, outerY);
      }
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Disco metálico interno com gradiente
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 0.65);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(0.7, '#64748b');
    grad.addColorStop(1, '#334155');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Parafuso central dourado
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Faíscas
    for (const s of this.sparks) {
      ctx.save();
      ctx.fillStyle = '#93c5fd';
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  checkCollision(hitbox) {
    // Colisão Círculo vs Caixa AABB
    const closestX = Math.max(hitbox.x, Math.min(this.x, hitbox.x + hitbox.width));
    const closestY = Math.max(hitbox.y, Math.min(this.y, hitbox.y + hitbox.height));

    const dx = this.x - closestX;
    const dy = this.y - closestY;

    // Margem generosa de segurança (raio efetivo de colisão 15px contra raio visual 24px)
    // Permite que pulos raspando no topo passem com sucesso!
    const effectiveRadius = 15;
    return (dx * dx + dy * dy) < (effectiveRadius * effectiveRadius);
  }
}

// 2. FLECHA AÉREA
class AerialArrow {
  constructor(x, groundY, heightLevel) {
    this.type = 'arrow';
    this.x = x;
    this.groundY = groundY;
    this.heightLevel = heightLevel; // 'LOW', 'MID', 'HIGH'
    this.passed = false;
    this.whooshPlayed = false;

    // Alturas calculadas em relação à vaca:
    // Vaca em pé: altura 52px (groundY - 52 até groundY)
    // Vaca agachada: altura 28px (groundY - 28 até groundY)
    if (this.heightLevel === 'LOW') {
      // Rasante ao chão (altura ~18px) -> Jogador pula facilmente
      this.y = groundY - 18;
    } else if (this.heightLevel === 'MID') {
      // Meia altura (~42px) -> Se agachar (altura 28px), a vaca passa por baixo com folga!
      this.y = groundY - 42;
    } else {
      // Alta (~100px) -> Passa tranquilamente por cima da vaca correndo
      this.y = groundY - 100;
    }

    this.length = 60;
    this.arrowExtraSpeed = 65; // Velocidade relativa reduzida para dar tempo claro de reação
    this.trailTime = 0;
  }

  update(dt, gameSpeed) {
    this.x -= (gameSpeed + this.arrowExtraSpeed) * dt;
    this.trailTime += dt;

    // Tocar efeito sonoro de assobio aerodinâmico quando se aproximar da vaca (x em torno de 400)
    if (!this.whooshPlayed && this.x < 480 && this.x > 100) {
      window.audioEngine.playArrowWhoosh();
      this.whooshPlayed = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Cores e efeitos telegrafados com base na altitude da flecha
    let trailColor, featherColor, glowColor;
    if (this.heightLevel === 'LOW') {
      // Flecha rasante (Verde -> Salto)
      trailColor = 'rgba(34, 197, 94, 0.7)';
      featherColor = '#16a34a';
      glowColor = '#22c55e';
    } else if (this.heightLevel === 'MID') {
      // Flecha no peito (Vermelha -> Agachar)
      trailColor = 'rgba(239, 68, 68, 0.85)';
      featherColor = '#dc2626';
      glowColor = '#ef4444';
    } else {
      // Flecha alta (Azul -> Passa por cima)
      trailColor = 'rgba(56, 189, 248, 0.6)';
      featherColor = '#0284c7';
      glowColor = '#38bdf8';
    }

    // Linhas de rastro aerodinâmico coloridas
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.length + 5, 0);
    ctx.lineTo(this.length + 45, 0);
    ctx.moveTo(this.length + 8, -4);
    ctx.lineTo(this.length + 30, -4);
    ctx.moveTo(this.length + 8, 4);
    ctx.lineTo(this.length + 30, 4);
    ctx.stroke();

    // Haste de madeira da flecha
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.length, 0);
    ctx.stroke();

    // Ponta afiada metálica com brilho telegrafado
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(2, -7);
    ctx.lineTo(2, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Penas na cauda com código de cor
    ctx.fillStyle = featherColor;
    ctx.beginPath();
    ctx.moveTo(this.length - 14, 0);
    ctx.lineTo(this.length, -8);
    ctx.lineTo(this.length - 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.length - 14, 0);
    ctx.lineTo(this.length, 8);
    ctx.lineTo(this.length - 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  checkCollision(hitbox) {
    // Caixa de colisão da flecha: ponta e haste com tolerância justa
    const arrowBox = {
      x: this.x - 6,
      y: this.y - 3,
      width: this.length - 8,
      height: 6
    };

    return (
      arrowBox.x < hitbox.x + hitbox.width &&
      arrowBox.x + arrowBox.width > hitbox.x &&
      arrowBox.y < hitbox.y + hitbox.height &&
      arrowBox.y + arrowBox.height > hitbox.y
    );
  }
}

// 3. GERENCIADOR DE OBSTÁCULOS
class ObstacleManager {
  constructor(canvasWidth, groundY) {
    this.canvasWidth = canvasWidth;
    this.groundY = groundY;
    this.obstacles = [];
    this.spawnTimer = 1.6;
    this.isPaused = false;
    this.dodgedCount = 0;
  }

  reset() {
    this.obstacles = [];
    this.spawnTimer = 1.6;
    this.isPaused = false;
    this.dodgedCount = 0;
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  update(dt, gameSpeed, distance) {
    // Atualizar obstáculos existentes
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(dt, gameSpeed);

      // Contabilizar obstáculo superado com sucesso
      if (!obs.passed && obs.x < 140) {
        obs.passed = true;
        this.dodgedCount++;
      }

      // Remover se saiu totalmente da tela pela esquerda
      if (obs.x < -120) {
        this.obstacles.splice(i, 1);
      }
    }

    if (this.isPaused) return;

    // Intervalo dinâmico de spawn com ritmo justo e relaxado no início
    // Começa em ~2.8s e reduz gradualmente até ~1.5s
    const currentInterval = Math.max(1.5, 2.8 - (distance / 5000) * 1.3);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle(distance);
      this.spawnTimer = currentInterval + (Math.random() * 0.5 - 0.25);
    }
  }

  spawnObstacle(distance) {
    const spawnX = this.canvasWidth + 60;

    // Espaçamento generoso entre obstáculos (pelo menos 440px)
    // Garante que o jogador sempre tenha tempo confortável para aterrissar e reagir
    if (this.obstacles.length > 0) {
      const last = this.obstacles[this.obstacles.length - 1];
      if (spawnX - last.x < 440) {
        return; // Espaço insuficiente, aguardar próximo ciclo
      }
    }

    // Variedade de obstáculos:
    // Aos primeiros metros predominam serras e flechas médias
    // Conforme avança, alterna entre todos os tipos
    const roll = Math.random();

    if (roll < 0.48) {
      // Serra no chão
      this.obstacles.push(new FloorSaw(spawnX, this.groundY));
    } else {
      // Flecha Aérea
      let heightLevel;
      const heightRoll = Math.random();
      if (heightRoll < 0.50) {
        heightLevel = 'MID'; // Exige agachar
      } else if (heightRoll < 0.80) {
        heightLevel = 'LOW'; // Rasante, exige pular
      } else {
        heightLevel = 'HIGH'; // Passa por cima
      }
      this.obstacles.push(new AerialArrow(spawnX, this.groundY, heightLevel));
    }
  }

  draw(ctx) {
    for (const obs of this.obstacles) {
      obs.draw(ctx);
    }
  }

  checkCollision(cow) {
    const hitbox = cow.getHitbox();
    for (const obs of this.obstacles) {
      if (obs.checkCollision(hitbox)) {
        return {
          hit: true,
          type: obs.type,
          obstacle: obs
        };
      }
    }
    return { hit: false };
  }
}

window.ObstacleManager = ObstacleManager;
