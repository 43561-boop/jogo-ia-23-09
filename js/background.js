/**
 * Background & Parallax System - Cenário 2D de Fazenda em Dia Chuvoso
 * Efeito de paralaxe em múltiplas camadas, chuva contínua, moinho com pás girando,
 * túnel de pedra e o trem do evento especial dos 4000 metros (30 segundos).
 */
class Background {
  constructor(canvasWidth, canvasHeight, groundY) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.groundY = groundY;

    // Offset de rolagem das camadas de paralaxe
    this.offsetSky = 0;
    this.offsetHills = 0;
    this.offsetFarm = 0;
    this.offsetFence = 0;
    this.offsetGround = 0;

    // Rotação do Moinho de Vento
    this.windmillAngle = 0;

    // Relâmpagos ocasionais distantes (clarão suave no céu)
    this.lightningTimer = 8;
    this.lightningFlash = 0;

    // Sistema de Chuva
    this.rainDrops = [];
    this.rainSplashes = [];
    this.initRain();

    // Evento Especial do Trem (4000m)
    this.trainActive = false;
    this.trainTimer = 0; // Contagem dos 10 segundos
    this.trainTotalDuration = 10.0;
    this.trainX = this.width + 400; // Posição do trem
    this.tunnelX = this.width + 100; // Túnel ao fundo
    this.smokeParticles = [];
    this.crossingGateAngle = 0; // Ângulo da cancela
    this.railroadVisible = false;
  }

  initRain() {
    const count = 180;
    for (let i = 0; i < count; i++) {
      this.rainDrops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: 16 + Math.random() * 14,
        speed: 16 + Math.random() * 8,
        thickness: 1 + Math.random() * 1.5,
        alpha: 0.35 + Math.random() * 0.4
      });
    }
  }

  reset() {
    this.offsetSky = 0;
    this.offsetHills = 0;
    this.offsetFarm = 0;
    this.offsetFence = 0;
    this.offsetGround = 0;
    this.windmillAngle = 0;
    this.lightningFlash = 0;
    this.lightningTimer = 8;
    this.trainActive = false;
    this.trainTimer = 0;
    this.trainX = this.width + 400;
    this.tunnelX = this.width + 100;
    this.smokeParticles = [];
    this.crossingGateAngle = 0;
    this.railroadVisible = false;
    this.rainSplashes = [];
  }

  startTrainEvent() {
    this.trainActive = true;
    this.trainTimer = this.trainTotalDuration;
    this.railroadVisible = true;
    // O trem começará saindo do túnel à direita e cruzando para a esquerda
    this.trainX = this.width + 100;
    window.audioEngine.startTrainAudio();
  }

  stopTrainEvent() {
    this.trainActive = false;
    window.audioEngine.stopTrainAudio();
  }

  update(dt, gameSpeed, distance = 0) {
    this.isRaining = Math.floor(distance / 200) % 2 === 0; // Alterna chuva
    this.timeOfDay = Math.floor(distance / 60) % 4;
    this.season = Math.floor(distance / 150) % 4; // 0: Prim, 1: Ver, 2: Out, 3: Inv

    // Rolagem em Paralaxe proporcional à velocidade da vaca
    this.offsetSky += gameSpeed * dt * 0.05;
    this.offsetHills += gameSpeed * dt * 0.12;
    this.offsetFarm += gameSpeed * dt * 0.35;
    this.offsetFence += gameSpeed * dt * 0.70;
    this.offsetGround += gameSpeed * dt * 1.0;

    // Rotação suave das pás do moinho
    this.windmillAngle += dt * 0.8;

    // Clarão de relâmpago distante atmosférico
    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      this.lightningFlash = 0.35;
      this.lightningTimer = 12 + Math.random() * 15;
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash -= dt * 1.2;
      if (this.lightningFlash < 0) this.lightningFlash = 0;
    }

    // Atualização da Chuva
    if (this.isRaining) {
      for (const drop of this.rainDrops) {
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.22; // Chuva em ângulo com vento

        // Ao atingir o chão, cria um pequeno respingo
        if (drop.y >= this.groundY - 10) {
          if (Math.random() < 0.25) {
            this.rainSplashes.push({
              x: drop.x,
              y: this.groundY + Math.random() * 10 - 5,
              radius: 1,
              maxRadius: 3 + Math.random() * 3,
              alpha: 0.6
            });
          }
          drop.y = -20;
          drop.x = Math.random() * (this.width + 200);
        }
      }
    }

    // Atualização dos respingos no chão
    for (let i = this.rainSplashes.length - 1; i >= 0; i--) {
      const s = this.rainSplashes[i];
      s.radius += 0.4;
      s.alpha -= 0.06;
      if (s.alpha <= 0) {
        this.rainSplashes.splice(i, 1);
      }
    }

    // Atualização do Evento do Trem (30 Segundos)
    if (this.trainActive) {
      this.trainTimer -= dt;
      if (this.trainTimer <= 0) {
        this.trainTimer = 0;
        this.stopTrainEvent();
      }

      // Cancela do cruzamento fecha suavemente
      if (this.crossingGateAngle < 1.4) {
        this.crossingGateAngle += dt * 1.5;
      }

      // Movimentação do trem pelo cenário de fundo
      // O trem se desloca a uma velocidade calculada para que a composição
      // (locomotiva + 8 vagões compridos) passe continuamente durante os 30s
      const trainSpeed = 160; // px/s
      this.trainX -= trainSpeed * dt;

      // Puffs de fumaça da chaminé a vapor
      if (Math.random() < 0.45) {
        this.smokeParticles.push({
          x: this.trainX + 90,
          y: this.groundY - 140,
          vx: 1 + Math.random() * 2,
          vy: -1.5 - Math.random() * 2,
          radius: 8 + Math.random() * 6,
          maxRadius: 28,
          alpha: 0.75
        });
      }
    } else {
      // Abre a cancela quando o trem terminar
      if (this.crossingGateAngle > 0) {
        this.crossingGateAngle -= dt * 1.2;
        if (this.crossingGateAngle < 0) this.crossingGateAngle = 0;
      }
    }

    // Atualização das partículas de fumaça
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const sp = this.smokeParticles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.radius += 0.3;
      sp.alpha -= 0.015;
      if (sp.alpha <= 0) {
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // 1. Céu Chuvoso e Nublado com Clarão de Relâmpago
    this.drawSky(ctx);

    // 2. Camada Distante: Colinas e Pinheiros
    this.drawDistantHills(ctx);

    // 3. Camada Intermediária: Fazenda (Celeiro, Moinho, Árvores)
    this.drawFarmLayer(ctx);

    // 4. Camada de Fundo do Trem e Trilhos (quando ativo ou próximo aos 4000m)
    if (this.railroadVisible) {
      this.drawRailroadAndTrain(ctx);
    }

    // 5. Camada Próxima: Cercas de Madeira da Fazenda
    this.drawFences(ctx);

    // 6. Chão e Trilha de Terra com Poças D'água
    this.drawGround(ctx);

    // 7. Cancela de Cruzamento Ferroviário
    if (this.railroadVisible) {
      this.drawCrossingGate(ctx);
    }

    // 8. Chuva Animada e Respingos (Camada Frontal)
    if (this.isRaining) {
      this.drawRain(ctx);
    }
  }

  drawSky(ctx) {
    const isRaining = this.isRaining === undefined ? true : this.isRaining;
    let colorTop = '#111a24', colorMid = '#1e2b3a', colorBot = '#2c3e50';

    if (!isRaining) {
      const tod = this.timeOfDay || 0;
      if (tod === 0) { // Manhã
        colorTop = '#38bdf8'; colorMid = '#7dd3fc'; colorBot = '#bae6fd';
      } else if (tod === 1) { // Dia
        colorTop = '#0ea5e9'; colorMid = '#38bdf8'; colorBot = '#7dd3fc';
      } else if (tod === 2) { // Tarde
        colorTop = '#f97316'; colorMid = '#fb923c'; colorBot = '#fcd34d';
      } else { // Noite
        colorTop = '#0f172a'; colorMid = '#1e293b'; colorBot = '#334155';
      }
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, colorTop);
    skyGrad.addColorStop(0.5, colorMid);
    skyGrad.addColorStop(1, colorBot);

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Nuvens densas de chuva em paralaxe
    const cloudShift = -(this.offsetSky % 600);
    ctx.fillStyle = 'rgba(15, 23, 33, 0.45)';
    for (let i = -1; i < 4; i++) {
      const cx = cloudShift + i * 500;
      ctx.beginPath();
      ctx.ellipse(cx + 80, 80, 160, 60, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 220, 95, 200, 75, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 360, 70, 150, 55, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clarão de relâmpago distante
    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningFlash})`;
      ctx.fillRect(0, 0, this.width, this.groundY);
    }
  }

  drawDistantHills(ctx) {
    const shift = -(this.offsetHills % 800);
    ctx.fillStyle = '#1c2d3d';

    for (let i = -1; i < 3; i++) {
      const hx = shift + i * 800;
      ctx.beginPath();
      ctx.moveTo(hx, this.groundY);
      ctx.quadraticCurveTo(hx + 200, this.groundY - 170, hx + 400, this.groundY - 110);
      ctx.quadraticCurveTo(hx + 600, this.groundY - 180, hx + 800, this.groundY);
      ctx.lineTo(hx + 800, this.groundY);
      ctx.lineTo(hx, this.groundY);
      ctx.fill();
    }

    // Silhuetas de pinheiros distantes
    ctx.fillStyle = '#172431';
    for (let i = -1; i < 5; i++) {
      const tx = shift + i * 350 + 120;
      this.drawTreeSilhouette(ctx, tx, this.groundY - 105, 36, 65);
      this.drawTreeSilhouette(ctx, tx + 45, this.groundY - 115, 42, 75);
    }
  }

  drawTreeSilhouette(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y - height);
    ctx.lineTo(x + width, y);
    ctx.closePath();
    ctx.fill();
  }

  drawFarmLayer(ctx) {
    const shift = -(this.offsetFarm % 1200);

    for (let i = -1; i < 2; i++) {
      const fx = shift + i * 1200;

      // 1. Celeiro Rústico Vermelho
      const barnX = fx + 160;
      const barnY = this.groundY - 145;
      this.drawBarn(ctx, barnX, barnY);

      // 2. Moinho de Vento com Pás Giratórias
      const millX = fx + 720;
      const millY = this.groundY - 165;
      this.drawWindmill(ctx, millX, millY);

      // 3. Fardos de Feno
      this.drawHayBale(ctx, fx + 460, this.groundY - 26);
      this.drawHayBale(ctx, fx + 505, this.groundY - 26);

      // 4. Árvores Frondosas de Fazenda
      this.drawFarmTree(ctx, fx + 360, this.groundY - 20, 50);
      this.drawFarmTree(ctx, fx + 1020, this.groundY - 20, 60);
    }
  }

  drawBarn(ctx, x, y) {
    ctx.save();
    // Corpo do celeiro
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x, y + 45, 130, 100);
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + 45, 130, 100);

    // Telhado triangular
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 45);
    ctx.lineTo(x + 65, y);
    ctx.lineTo(x + 142, y + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Portas brancas com cruzeta em 'X' estilo celeiro
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 40, y + 80, 50, 65);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2.5;
    // Moldura e X
    ctx.strokeRect(x + 40, y + 80, 50, 65);
    ctx.beginPath();
    ctx.moveTo(x + 40, y + 80);
    ctx.lineTo(x + 90, y + 145);
    ctx.moveTo(x + 90, y + 80);
    ctx.lineTo(x + 40, y + 145);
    ctx.stroke();

    // Silo ao lado do celeiro
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 138, y + 30, 36, 115);
    ctx.beginPath();
    ctx.arc(x + 156, y + 30, 18, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  drawWindmill(ctx, x, y) {
    ctx.save();
    // Torre de pedra/madeira
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 165);
    ctx.lineTo(x + 24, y + 30);
    ctx.lineTo(x + 46, y + 30);
    ctx.lineTo(x + 58, y + 165);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cúpula do topo
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x + 35, y + 30, 14, Math.PI, 0);
    ctx.fill();

    // Eixo central
    const hubX = x + 35;
    const hubY = y + 30;

    // Pás giratórias
    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(this.windmillAngle);

    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;

    for (let p = 0; p < 4; p++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.lineTo(7, -65);
      ctx.lineTo(-7, -65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Centro do eixo
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(hubX, hubY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawHayBale(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.roundRect(x, y, 38, 26, 6);
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Cordas do fardo
    ctx.strokeStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 10, y + 26);
    ctx.moveTo(x + 28, y);
    ctx.lineTo(x + 28, y + 26);
    ctx.stroke();
    ctx.restore();
  }

  drawFarmTree(ctx, x, y, radius) {
    ctx.save();
    // Tronco
    ctx.fillStyle = '#3e2312';
    ctx.fillRect(x - 7, y - 50, 14, 52);

    let c1 = '#1e3a2b', c2 = '#2d5a3f'; // Winter / Rain
    if (!this.isRaining) {
      const s = this.season || 0;
      if (s === 0) { c1 = '#4ade80'; c2 = '#22c55e'; } // Spring
      else if (s === 1) { c1 = '#16a34a'; c2 = '#15803d'; } // Summer
      else if (s === 2) { c1 = '#f97316'; c2 = '#ea580c'; } // Autumn
      else { c1 = '#cbd5e1'; c2 = '#94a3b8'; } // Winter
    }

    // Copa da árvore
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(x, y - 75, radius, 0, Math.PI * 2);
    ctx.arc(x - 22, y - 65, radius * 0.75, 0, Math.PI * 2);
    ctx.arc(x + 22, y - 65, radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(x + 4, y - 82, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRailroadAndTrain(ctx) {
    const trackY = this.groundY - 55;

    // 1. Túnel de Pedra ao fundo à direita
    ctx.save();
    const tX = this.width - 220;
    // Montanha do túnel
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(tX - 40, this.groundY);
    ctx.quadraticCurveTo(tX + 50, trackY - 140, tX + 220, this.groundY);
    ctx.fill();

    // Boca do túnel (arco de pedra)
    ctx.fillStyle = '#090d13';
    ctx.beginPath();
    ctx.arc(tX + 80, trackY - 30, 48, Math.PI, 0);
    ctx.lineTo(tX + 128, trackY + 10);
    ctx.lineTo(tX + 32, trackY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    // 2. Dormentes e Trilhos de Ferro no chão de fundo
    ctx.save();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    for (let r = 0; r < this.width; r += 22) {
      ctx.beginPath();
      ctx.moveTo(r, trackY - 4);
      ctx.lineTo(r + 6, trackY + 14);
      ctx.stroke();
    }
    // Trilhos de ferro superiores e inferiores
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(this.width, trackY);
    ctx.moveTo(0, trackY + 10);
    ctx.lineTo(this.width, trackY + 10);
    ctx.stroke();
    ctx.restore();

    // 3. Fumaça da Locomotiva
    for (const sm of this.smokeParticles) {
      ctx.save();
      ctx.fillStyle = `rgba(226, 232, 240, ${sm.alpha})`;
      ctx.beginPath();
      ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Composição do Trem a Vapor (Locomotiva + Carros)
    if (this.trainActive) {
      this.drawFullTrain(ctx, this.trainX, trackY);
    }
  }

  drawFullTrain(ctx, x, trackY) {
    ctx.save();

    // Sincronização matemática dos 30 segundos exatos
    const elapsed = Math.max(0, this.trainTotalDuration - this.trainTimer);
    const progress = Math.min(1, elapsed / this.trainTotalDuration);

    const totalCars = 34;
    const carSpacing = 155;
    const totalTrainLength = 190 + totalCars * carSpacing;

    const startX = this.width + 80;
    const endX = -totalTrainLength - 80;
    const currentLocoX = startX - progress * (startX - endX);

    // 1. Locomotiva a Vapor (se estiver dentro ou próxima da tela)
    if (currentLocoX > -260 && currentLocoX < this.width + 200) {
      const locoX = currentLocoX;
      const locoY = trackY - 70;

      // Caldeira principal preta
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(locoX + 30, locoY + 20, 110, 48);
      // Frente abaulada
      ctx.beginPath();
      ctx.arc(locoX + 30, locoY + 44, 24, Math.PI * 0.5, Math.PI * 1.5);
      ctx.fill();

      // Cabine do Maquinista
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(locoX + 115, locoY, 52, 68);
      // Telhado da cabine
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(locoX + 110, locoY);
      ctx.lineTo(locoX + 172, locoY);
      ctx.lineTo(locoX + 168, locoY - 6);
      ctx.lineTo(locoX + 114, locoY - 6);
      ctx.closePath();
      ctx.fill();

      // Janela iluminada acolhedora
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(locoX + 128, locoY + 14, 26, 22);

      // Chaminé de fumaça
      ctx.fillStyle = '#334155';
      ctx.fillRect(locoX + 50, locoY + 4, 16, 20);
      ctx.beginPath();
      ctx.moveTo(locoX + 46, locoY + 4);
      ctx.lineTo(locoX + 70, locoY + 4);
      ctx.lineTo(locoX + 66, locoY - 4);
      ctx.lineTo(locoX + 50, locoY - 4);
      ctx.closePath();
      ctx.fill();

      // Farol dianteiro brilhante iluminando a chuva
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(locoX + 10, locoY + 36, 7, 0, Math.PI * 2);
      ctx.fill();
      // Feixe de luz
      const beamGrad = ctx.createLinearGradient(locoX + 10, locoY + 36, locoX - 160, locoY + 50);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(locoX + 10, locoY + 36);
      ctx.lineTo(locoX - 180, locoY);
      ctx.lineTo(locoX - 180, locoY + 80);
      ctx.closePath();
      ctx.fill();

      // Rodas da Locomotiva
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.arc(locoX + 50 + w * 42, trackY + 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 2. Composição Contínua de Vagões (renderiza apenas os que estão visíveis)
    const wagonWidth = 142;
    const wagonSpacing = 13;

    for (let v = 0; v < totalCars; v++) {
      const curX = currentLocoX + 180 + v * (wagonWidth + wagonSpacing);

      // Frustum culling para performance perfeita
      if (curX < -180 || curX > this.width + 180) continue;

      // Engate metálico entre vagões
      ctx.fillStyle = '#334155';
      ctx.fillRect(curX - wagonSpacing, trackY - 24, wagonSpacing + 2, 6);

      const isCaboose = (v === totalCars - 1);
      const isTender = (v === 0);

      if (isTender) {
        // Vagão Tender de Carvão
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curX, trackY - 48, wagonWidth, 46);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(curX + wagonWidth / 2, trackY - 48, 28, Math.PI, 0);
        ctx.fill();
      } else if (isCaboose) {
        // Caboose Final (Vagão vermelho com lanterna de cauda)
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.roundRect(curX, trackY - 62, wagonWidth, 60, 6);
        ctx.fill();
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cúpula superior
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(curX + 45, trackY - 74, 50, 14);

        // Lanterna vermelha de fim de trem
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(curX + wagonWidth + 2, trackY - 34, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Vagões de Passageiros e Cargas variados
        const colors = ['#1e3a2b', '#3e2312', '#1e293b', '#2e3a4e'];
        ctx.fillStyle = colors[v % colors.length];
        ctx.beginPath();
        ctx.roundRect(curX, trackY - 60, wagonWidth, 58, 6);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Telhado
        ctx.fillStyle = '#475569';
        ctx.fillRect(curX - 2, trackY - 65, wagonWidth + 4, 7);

        // Janelas amarelas aconchegantes iluminadas
        ctx.fillStyle = '#fef08a';
        for (let j = 0; j < 4; j++) {
          ctx.fillRect(curX + 14 + j * 30, trackY - 48, 18, 18);
        }
      }

      // Rodas do vagão
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(curX + 25, trackY + 2, 9, 0, Math.PI * 2);
      ctx.arc(curX + 45, trackY + 2, 9, 0, Math.PI * 2);
      ctx.arc(curX + wagonWidth - 45, trackY + 2, 9, 0, Math.PI * 2);
      ctx.arc(curX + wagonWidth - 25, trackY + 2, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCrossingGate(ctx) {
    // Poste com cancela de passagem de nível (cruzamento)
    const gateX = 260;
    const gateY = this.groundY;

    ctx.save();
    ctx.translate(gateX, gateY);

    // Poste vertical
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -65, 12, 65);

    // Luzes de aviso de cruzamento (piscam alternadamente se o trem estiver ativo)
    const isBlink = Math.floor(Date.now() / 400) % 2 === 0;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-18, -62, 36, 12);
    // Luz esquerda
    ctx.fillStyle = this.trainActive && isBlink ? '#ef4444' : '#450a0a';
    ctx.beginPath();
    ctx.arc(-10, -56, 5, 0, Math.PI * 2);
    ctx.fill();
    // Luz direita
    ctx.fillStyle = this.trainActive && !isBlink ? '#ef4444' : '#450a0a';
    ctx.beginPath();
    ctx.arc(10, -56, 5, 0, Math.PI * 2);
    ctx.fill();

    // Braço da cancela listrado em vermelho e branco (gira para baixo quando fecha)
    ctx.save();
    ctx.translate(0, -32);
    ctx.rotate(this.crossingGateAngle);

    const armLength = 110;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -5, armLength, 10);
    // Listras vermelhas
    ctx.fillStyle = '#ef4444';
    for (let s = 10; s < armLength; s += 24) {
      ctx.fillRect(s, -5, 12, 10);
    }
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -5, armLength, 10);

    ctx.restore();
    ctx.restore();
  }

  drawFences(ctx) {
    const shift = -(this.offsetFence % 320);
    ctx.save();
    ctx.strokeStyle = '#5c3a21';
    ctx.fillStyle = '#78431b';
    ctx.lineWidth = 2;

    for (let i = -1; i < 5; i++) {
      const fx = shift + i * 320;

      // Vigas horizontais da cerca de madeira
      ctx.fillRect(fx, this.groundY - 38, 330, 6);
      ctx.fillRect(fx, this.groundY - 22, 330, 6);

      // Postes verticais
      for (let p = 0; p < 4; p++) {
        const px = fx + p * 80;
        ctx.fillRect(px, this.groundY - 50, 10, 52);
        ctx.strokeRect(px, this.groundY - 50, 10, 52);
      }
    }
    ctx.restore();
  }

  drawGround(ctx) {
    const shift = -(this.offsetGround % 400);

    // Camada de solo e terra úmida
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGrad.addColorStop(0, '#15803d'); // Grama verde escura molhada
    groundGrad.addColorStop(0.18, '#166534');
    groundGrad.addColorStop(0.45, '#3f2e1e'); // Solo terroso
    groundGrad.addColorStop(1, '#1c130b');

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Linha superior de grama com textura de tufos
    ctx.fillStyle = '#22c55e';
    for (let x = 0; x < this.width; x += 14) {
      const tuftHeight = (Math.sin(x * 0.05 + this.offsetGround * 0.02) + 1) * 3 + 2;
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + 7, this.groundY - tuftHeight);
      ctx.lineTo(x + 14, this.groundY);
      ctx.fill();
    }

    // Poças de chuva refletindo a luz do céu
    ctx.fillStyle = 'rgba(148, 163, 184, 0.38)';
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1;

    for (let i = -1; i < 4; i++) {
      const px = shift + i * 380 + 100;
      ctx.beginPath();
      ctx.ellipse(px, this.groundY + 12, 42, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pequenas flores amarelas e brancas de campo
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(px + 70, this.groundY + 6, 2.5, 0, Math.PI * 2);
      ctx.arc(px - 60, this.groundY + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Linha de chegada com arco festivo (aparece ao se aproximar dos 5000m)
    // Desenhada dinamicamente pelo gerenciador do jogo se necessário
  }

  drawRain(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineCap = 'round';

    for (const drop of this.rainDrops) {
      ctx.lineWidth = drop.thickness;
      ctx.globalAlpha = drop.alpha;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.22, drop.y + drop.length);
      ctx.stroke();
    }

    // Respingos circulares na grama molhada
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.6)';
    ctx.lineWidth = 1.2;
    for (const s of this.rainSplashes) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius * 2, s.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.Background = Background;
