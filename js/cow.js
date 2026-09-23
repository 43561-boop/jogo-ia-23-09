/**
 * Cow - Personagem Principal da Vaquinha
 * Renderização vetorial indie fluida, física responsiva, animações de pata, corpo, rabo e sino.
 */
class Cow {
  constructor(canvasWidth, groundY) {
    this.groundY = groundY;
    this.x = 180;
    this.y = this.groundY;
    this.vy = 0;

    // Física Aprimorada: Pulo mais alto, suave e com tempo de flutuação generoso
    this.baseGravity = 0.58;
    this.gravity = 0.58;
    this.jumpStrength = -15.6;

    // Dimensões da Vaca
    this.width = 92;
    this.height = 72;

    // Estados
    this.isGrounded = true;
    this.isDucking = false;
    this.isSheltered = false;
    this.isDead = false;
    this.isVictorious = false;
    this.isJumping = false;
    this.invulnerableTimer = 0; // Piscar e invulnerabilidade temporária pós-dano
    this.inTrainEvent = false;  // Feedback de perigo durante passagem do trem

    // Conforto de Jogabilidade: Buffer de pulo e Coyote Time
    this.jumpBufferTimer = 0; // Armazena a intenção de pular até 0.22s antes de tocar o chão
    this.coyoteTimer = 0;     // Permite pular até 0.14s após sair do chão

    // Variáveis de Animação
    this.animTime = 0;
    this.crouchProgress = 0; // 0 = em pé, 1 = totalmente agachada
    this.bellAngle = 0;
    this.tailAngle = 0;

    // Partículas de respingo da grama molhada
    this.splashParticles = [];
  }

  reset() {
    this.y = this.groundY;
    this.vy = 0;
    this.isGrounded = true;
    this.isDucking = false;
    this.isSheltered = false;
    this.isDead = false;
    this.isVictorious = false;
    this.isJumping = false;
    this.invulnerableTimer = 0;
    this.inTrainEvent = false;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.crouchProgress = 0;
    this.animTime = 0;
    this.splashParticles = [];
  }

  jump() {
    if (this.isSheltered || this.isDead) return;

    // Se estiver no chão ou dentro da janela de tolerância (Coyote Time), pula imediatamente
    if ((this.isGrounded || this.coyoteTimer > 0) && !this.isDucking) {
      this.executeJump();
    } else {
      // Caso contrário, guarda o pulo no buffer para acionar assim que tocar o chão
      this.jumpBufferTimer = 0.22;
    }
  }

  executeJump() {
    this.vy = this.jumpStrength;
    this.isGrounded = false;
    this.isJumping = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    window.audioEngine.playJump();
    this.createGroundBurst();
  }

  endJump() {
    // Pulo de altura variável: se soltar o botão no início do pulo, corta o impulso suavemente
    if (this.vy < -4) {
      this.vy *= 0.55;
    }
    this.isJumping = false;
  }

  setDucking(isDucking) {
    if (this.isSheltered || this.isDead) return;

    if (isDucking && !this.isDucking && this.isGrounded) {
      window.audioEngine.playDuck();
    }
    this.isDucking = isDucking;

    // Se estiver no ar e apertar agachar, aplica uma descida rápida suave
    if (isDucking && !this.isGrounded && this.vy < 8) {
      this.vy += 2.0;
    }
  }

  setSheltered(isSheltered) {
    this.isSheltered = isSheltered;
    if (isSheltered) {
      this.isDucking = false;
      this.vy = 0;
      this.y = this.groundY;
      this.isGrounded = true;
    }
  }

  update(dt, gameSpeed) {
    this.animTime += dt * (gameSpeed / 250);

    // Timers de conforto de controle
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    if (this.isGrounded) {
      this.coyoteTimer = 0.14;
      // Se havia um pulo armazenado no buffer, aciona imediatamente
      if (this.jumpBufferTimer > 0 && !this.isDucking && !this.isSheltered) {
        this.executeJump();
      }
    } else {
      this.coyoteTimer -= dt;
    }

    // Transição suave de agachamento
    const targetCrouch = this.isDucking ? 1 : 0;
    this.crouchProgress += (targetCrouch - this.crouchProgress) * 0.32;

    // Atualizar timer de invulnerabilidade
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer < 0) this.invulnerableTimer = 0;
    }

    // Física de pulo com flutuação no ápice para facilidade de cálculo do salto
    if (!this.isGrounded && !this.isSheltered) {
      // No ápice do pulo, a gravidade fica mais leve criando tempo extra de reação no ar
      const isNearApex = Math.abs(this.vy) < 3.0;
      const currentGravity = isNearApex ? this.baseGravity * 0.55 : this.baseGravity;

      this.vy += currentGravity;
      this.y += this.vy;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.createGroundBurst();
      }
    }

    // Pêndulo do rabo e do sino
    this.bellAngle = Math.sin(this.animTime * 6) * 0.25;
    this.tailAngle = Math.sin(this.animTime * 5) * 0.35;

    // Emissão de respingos d'água ao correr no chão molhado
    if (this.isGrounded && !this.isSheltered && !this.isDead && Math.random() < 0.35) {
      this.splashParticles.push({
        x: this.x - 20 + (Math.random() * 20),
        y: this.groundY - 4,
        vx: -2 - Math.random() * 3,
        vy: -1.5 - Math.random() * 2.5,
        radius: 1.5 + Math.random() * 2,
        alpha: 0.8,
        color: Math.random() > 0.4 ? 'rgba(147, 197, 253, 0.7)' : 'rgba(74, 85, 104, 0.6)'
      });
    }

    // Atualizar partículas de respingo
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const p = this.splashParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravidade
      p.alpha -= 0.04;
      if (p.alpha <= 0) {
        this.splashParticles.splice(i, 1);
      }
    }
  }

  createGroundBurst() {
    for (let i = 0; i < 7; i++) {
      this.splashParticles.push({
        x: this.x + (Math.random() * 40 - 20),
        y: this.groundY - 2,
        vx: (Math.random() - 0.5) * 4 - 2,
        vy: -2 - Math.random() * 3,
        radius: 2 + Math.random() * 2,
        alpha: 0.85,
        color: 'rgba(186, 230, 253, 0.75)'
      });
    }
  }

  /**
   * Retorna a caixa de colisão da vaca com margem justa e generosa para o jogador
   * A hitbox foca no centro do corpo, não punindo ponta do focinho, chifres ou rabo
   */
  getHitbox() {
    const isCrouched = this.crouchProgress > 0.35;
    const boxHeight = isCrouched ? 28 : 52;
    const boxY = this.y - boxHeight - 2;
    const boxWidth = isCrouched ? 68 : 58;
    const boxX = this.x - boxWidth / 2;

    return {
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight
    };
  }

  draw(ctx) {
    // Desenhar partículas de respingo
    this.drawParticles(ctx);

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isDead) {
      ctx.rotate(-0.2);
    }

    // Efeito de piscar durante invulnerabilidade
    if (this.invulnerableTimer > 0) {
      if (Math.floor(this.invulnerableTimer * 14) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }
    }

    // Altura efetiva influenciada pelo agachamento
    const currentHeight = this.height * (1 - this.crouchProgress * 0.45);
    const bodyBob = this.isGrounded && !this.isSheltered ? Math.sin(this.animTime * 8) * 3 : 0;
    const legPhase = this.animTime * 8;

    // Sombra projetada no chão
    const shadowScale = Math.max(0.4, 1 - (this.groundY - this.y) / 200);
    ctx.fillStyle = 'rgba(12, 20, 28, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 44 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Se estiver abrigada durante o trem (deitada confortavelmente protegida)
    if (this.isSheltered) {
      this.drawShelteredCow(ctx);
      ctx.restore();
      return;
    }

    // Se estiver no evento do trem mas NÃO estiver segurando espaço (em perigo!)
    if (this.inTrainEvent && !this.isSheltered) {
      ctx.save();
      const pulse = (Math.sin(Date.now() / 120) + 1) * 0.5;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SEGURE ESPAÇO!', 0, -currentHeight - 24);

      // Triângulo de exclamação vermelho
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, -currentHeight - 20);
      ctx.lineTo(8, -currentHeight - 6);
      ctx.lineTo(-8, -currentHeight - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -currentHeight - 16, 3, 5);
      ctx.fillRect(-1.5, -currentHeight - 9, 3, 2);
      ctx.restore();
    }

    // 1. Patas Traseiras de Fundo (Camada posterior)
    this.drawLeg(ctx, -24, 0, Math.sin(legPhase + Math.PI), true);
    this.drawLeg(ctx, 18, 0, Math.sin(legPhase + Math.PI * 0.5), true);

    // 2. Rabo da Vaca com Pompom
    ctx.save();
    ctx.translate(-40, -currentHeight * 0.75 + bodyBob);
    ctx.rotate(this.tailAngle);
    ctx.strokeStyle = '#2b2d30';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, 12, -10, 26);
    ctx.stroke();
    // Tufo de pelo preto na ponta
    ctx.fillStyle = '#18191a';
    ctx.beginPath();
    ctx.ellipse(-10, 28, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Tronco Principal (Corpo da Vaca - Branco com Manchas Pretas)
    ctx.save();
    ctx.translate(0, bodyBob);

    // Base branca do corpo
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    const bodyTop = -currentHeight * 0.85;
    const bodyBottom = -currentHeight * 0.15;
    ctx.roundRect(-42, bodyTop, 82, bodyBottom - bodyTop, 22);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Manchas Negras Orgânicas no Corpo (Estilo Holandês)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    // Mancha traseira
    ctx.ellipse(-26, bodyTop + 14, 16, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Mancha central
    ctx.beginPath();
    ctx.ellipse(2, bodyTop + 24, 18, 13, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Mancha lateral
    ctx.beginPath();
    ctx.ellipse(20, bodyTop + 10, 12, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Úbere sutil e fofo
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(-12, bodyBottom - 2, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Patas Frontais de Primeiro Plano
    this.drawLeg(ctx, -16, 0, Math.sin(legPhase), false);
    this.drawLeg(ctx, 26, 0, Math.sin(legPhase + Math.PI * 1.5), false);

    // 5. Coleira de Couro & Sino Dourado
    const neckX = 30;
    const neckY = bodyTop + 16;
    ctx.save();
    ctx.translate(neckX, neckY);
    ctx.rotate(0.3);
    // Coleira
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, -14, 8, 28);
    // Fivela
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-2, -4, 4, 8);

    // Sino pendurado
    ctx.save();
    ctx.translate(0, 16);
    ctx.rotate(this.bellAngle);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.lineTo(10, 14);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Badalo do sino
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(0, 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // 6. Cabeça da Vaca
    const headX = 36;
    const headY = bodyTop + (this.crouchProgress > 0.4 ? 12 : 2);
    ctx.save();
    ctx.translate(headX, headY);

    // Chifres bonitos
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    // Chifre traseiro
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.quadraticCurveTo(-6, -26, 2, -28);
    ctx.quadraticCurveTo(0, -20, 2, -14);
    ctx.fill();
    ctx.stroke();
    // Chifre frontal
    ctx.beginPath();
    ctx.moveTo(8, -14);
    ctx.quadraticCurveTo(10, -26, 18, -28);
    ctx.quadraticCurveTo(14, -20, 14, -14);
    ctx.fill();
    ctx.stroke();

    // Orelhas suaves
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(-10, -8, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(-10, -8, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Formato da cabeça
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-10, -16, 38, 32, 12);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Mancha preta no topo da cabeça
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(6, -10, 12, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Focinho Rosa Amigável
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.roundRect(14, -4, 20, 22, 9);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Narinas
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.ellipse(22, 6, 2.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(29, 6, 2.5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Olho Expressivo e Vivo
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    // Brilho no olhar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6.5, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Orelha frontal
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(2, -14, 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(2, -14, 6, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Fim da Cabeça
    ctx.restore(); // Fim do Tronco
    ctx.restore();
  }

  drawLeg(ctx, offsetX, groundOffset, swing, isBackLayer) {
    ctx.save();
    ctx.translate(offsetX, -18);

    const swingAngle = (this.isGrounded ? swing : (this.vy < 0 ? -0.4 : 0.4)) * 0.55;
    ctx.rotate(swingAngle);

    // Cor da pata (mais escura se na camada de trás para dar profundidade)
    ctx.fillStyle = isBackLayer ? '#94a3b8' : '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-6, 0, 12, 22, 5);
    ctx.fill();
    ctx.strokeStyle = isBackLayer ? '#64748b' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Casco escuro
    ctx.fillStyle = isBackLayer ? '#1e293b' : '#334155';
    ctx.beginPath();
    ctx.roundRect(-6.5, 16, 13, 7, [0, 0, 3, 3]);
    ctx.fill();

    ctx.restore();
  }

  drawShelteredCow(ctx) {
    // Vaca deitada tranquilamente abrigada, olhando para o trem passar ao fundo
    const bodyY = -28;

    // Patas recolhidas
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(-20, -6, 16, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(20, -6, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo deitado
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-38, bodyY, 78, 28, 14);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Manchas
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-18, bodyY + 12, 14, 9, 0.1, 0, Math.PI * 2);
    ctx.ellipse(10, bodyY + 14, 12, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Cabeça virada observando o fundo
    ctx.save();
    ctx.translate(30, bodyY + 4);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-8, -16, 32, 26, 10);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Focinho
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.roundRect(12, -4, 16, 18, 7);
    ctx.fill();

    // Olho observador calmo
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Chifres
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(2, -18, 5, 0, Math.PI, true);
    ctx.fill();

    ctx.restore();

    // Indicador visual de proteção segura
    ctx.save();
    ctx.translate(0, bodyY - 14);
    ctx.fillStyle = '#22c55e';
    ctx.font = '700 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROTEGIDA', 0, 0);

    // Escudo/círculo sutil de segurança
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 16, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawParticles(ctx) {
    for (const p of this.splashParticles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.Cow = Cow;
