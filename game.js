// Captura dos elementos do DOM e do Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const lifeVal = document.getElementById('life-val');
const goldVal = document.getElementById('gold-val');
const waveVal = document.getElementById('wave-val');

// Variáveis de estado do Jogo
let playerLife = 20;
let playerGold = 150;
let currentWave = 1;
let gameOver = false;

// Listas para gerenciar as entidades do jogo
const towers = [];
const enemies = [];
const projectiles = [];

// Definição do Caminho que os inimigos vão percorrer (Coordenadas X, Y)
const waypoint = [
    { x: 0, y: 200 },
    { x: 250, y: 200 },
    { x: 250, y: 70 },
    { x: 550, y: 70 },
    { x: 550, y: 320 },
    { x: 800, y: 320 }
];

// --- CLASSES DO JOGO (Estrutura Orientada a Objetos) ---

// Classe Inimigo
class Enemy {
    constructor(hp, speed) {
        this.x = waypoint[0].x;
        this.y = waypoint[0].y;
        this.radius = 12;
        this.speed = speed;
        this.hp = hp;
        this.maxHp = hp;
        this.targetIndex = 1; // Próximo ponto do caminho para onde se move
    }

    update() {
        let target = waypoint[this.targetIndex];
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let distance = Math.hypot(dx, dy);

        // Se chegou muito perto do ponto atual, avança para o próximo ponto de destino
        if (distance < this.speed) {
            this.targetIndex++;
            if (this.targetIndex >= waypoint.length) {
                // Chegou ao fim do mapa: tira vida do jogador e se auto-destrói
                playerLife--;
                lifeVal.innerText = playerLife;
                this.hp = 0; // Marcar para remoção
                return;
            }
            target = waypoint[this.targetIndex];
            dx = target.x - this.x;
            dy = target.y - this.y;
        }

        // Movimentação normal em direção ao ponto de destino
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }

    draw() {
        // Corpo do inimigo
        ctx.fillStyle = '#ff5252';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Barra de Vida acima do inimigo
        ctx.fillStyle = '#555';
        ctx.fillRect(this.x - 15, this.y - 20, 30, 4);
        ctx.fillStyle = '#10fa10';
        ctx.fillRect(this.x - 15, this.y - 20, (this.hp / this.maxHp) * 30, 4);
    }
}

// Classe Torre de Defesa
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.range = 120;
        this.cooldown = 0;
        this.fireRate = 30; // Atira a cada 30 quadros (meio segundo)
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;

        // Encontra o inimigo mais próximo dentro do alcance da torre
        let target = null;
        let minDistance = this.range;

        for (let enemy of enemies) {
            let dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDistance && enemy.hp > 0) {
                minDistance = dist;
                target = enemy;
            }
        }

        // Se achou um alvo e a torre não está em tempo de recarga, atira
        if (target && this.cooldown === 0) {
            projectiles.push(new Projectile(this.x, this.y, target));
            this.cooldown = this.fireRate;
        }
    }

    draw() {
        // Base da torre
        ctx.fillStyle = '#40c4ff';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // Canhão da torre
        ctx.fillStyle = '#0091ea';
        ctx.fillRect(this.x - 6, this.y - 6, 12, 12);
    }
}

// Classe Projétil (Tiros da Torre)
class Projectile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = 7;
        this.damage = 10;
        this.radius = 4;
        this.finished = false;
    }

    update() {
        // Se o alvo morreu antes do tiro chegar, o tiro se perde
        if (this.target.hp <= 0) {
            this.finished = true;
            return;
        }

        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            // Acertou o inimigo
            this.target.hp -= this.damage;
            if (this.target.hp <= 0) {
                playerGold += 15; // Recompensa em dinheiro por derrotar
                goldVal.innerText = playerGold;
            }
            this.finished = true;
        } else {
            // Continua voando até o alvo
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = '#ffd740';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- LOGICA DE FLUXO DO CENÁRIO ---

function drawPath() {
    // Desenha a estrada cinza onde os inimigos andam
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(waypoint[0].x, waypoint[0].y);
    for (let i = 1; i < waypoint.length; i++) {
        ctx.lineTo(waypoint[i].x, waypoint[i].y);
    }
    ctx.stroke();
}

function spawnWave() {
    // Gera uma leva de inimigos baseado na onda atual
    let count = 5 + currentWave * 2;
    let baseHp = 20 + currentWave * 10;
    let baseSpeed = 1.2 + currentWave * 0.1;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            if (!gameOver) enemies.push(new Enemy(baseHp, baseSpeed));
        }, i * 800); // Intervalo de surgimento de quase 1 segundo
    }
}

// Evento de Clique para Construir Torres
canvas.addEventListener('click', (event) => {
    if (gameOver) return;

    // Descobrir onde o jogador clicou no canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Verificar custo
    if (playerGold >= 50) {
        // Criar uma nova torre na posição clicada
        towers.push(new Tower(clickX, clickY));
        playerGold -= 50;
        goldVal.innerText = playerGold;
    }
});

// --- LOOP PRINCIPAL DO JOGO ---

function gameLoop() {
    if (playerLife <= 0) {
        gameOver = true;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff5252';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Limpar a tela para desenhar o novo frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar Cenário Estático
    drawPath();

    // 2. Atualizar e Desenhar Torres
    towers.forEach(tower => {
        tower.update();
        tower.draw();
    });

    // 3. Atualizar e Desenhar Inimigos (filtra os que morreram ou passaram)
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        if (enemies[i].hp <= 0) {
            enemies.splice(i, 1);
        } else {
            enemies[i].draw();
        }
    }

    // 4. Atualizar e Desenhar Projéteis
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (projectiles[i].finished) {
            projectiles.splice(i, 1);
        } else {
            projectiles[i].draw();
        }
    }

    // 5. Gerenciamento automático de Próximas Ondas
    if (enemies.length === 0 && !gameOver) {
        currentWave++;
        waveVal.innerText = currentWave;
        spawnWave();
    }

    requestAnimationFrame(gameLoop);
}

// Inicialização das primeiras ações
spawnWave();
gameLoop();
