const canvas = document.getElementById('runnerCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('score-val');
const highscoreVal = document.getElementById('highscore-val');

// Estados fundamentais do motor
let score = 0;
let highscore = 0;
let gameOver = false;
let gameSpeed = 5;
let frameCount = 0;

// Configurações físicas do Jogador (Cubo Neon)
const player = {
    x: 50,
    y: canvas.height - 60,
    width: 30,
    height: 40,
    velocityY: 0,
    gravity: 0.6,
    jumpForce: -12,
    isGrounded: true
};

// Lista de Obstáculos na pista
let obstacles = [];

// Gerenciador de Entrada de teclado estável
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault(); // Evita que a página role para baixo ao apertar espaço
        
        if (gameOver) {
            resetGame();
        } else if (player.isGrounded) {
            player.velocityY = player.jumpForce;
            player.isGrounded = false;
        }
    }
});

function spawnObstacle() {
    // Escolhe aleatoriamente se cria um obstáculo alto ou baixo
    const height = Math.random() > 0.5 ? 40 : 25;
    obstacles.push({
        x: canvas.width,
        y: canvas.height - height - 20, // Descontando a linha do chão
        width: 20,
        height: height
    });
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- LOOP MATEMÁTICO (UPDATE) ---
function update() {
    if (gameOver) return;

    frameCount++;
    
    // Aumenta a velocidade do jogo gradualmente para ficar desafiador
    if (frameCount % 500 === 0) {
        gameSpeed += 0.5;
    }

    // Aplica física de gravidade no jogador
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Trava o jogador na linha do chão firme
    const groundY = canvas.height - player.height - 20;
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // Adiciona pontos pelo tempo de sobrevivência
    if (frameCount % 5 === 0) {
        score++;
        scoreVal.innerText = score;
    }

    // Controle de spawn dinâmico de obstáculos baseado na velocidade atual
    const spawnInterval = Math.max(60, 120 - Math.floor(gameSpeed * 4));
    if (frameCount % spawnInterval === 0) {
        spawnObstacle();
    }

    // Movimentação e colisão de obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        // Apaga do array os obstáculos que saíram da tela esquerda para otimizar memória
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            continue;
        }

        // Executa o teste de colisão contra o jogador
        if (checkCollision(player, obstacles[i])) {
            gameOver = true;
            if (score > highscore) {
                highscore = score;
                highscoreVal.innerText = highscore;
            }
        }
    }
}

// --- LOOP VISUAL (DRAW) ---
function draw() {
    // Limpeza completa do quadro
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Linha do Chão Neon
    ctx.strokeStyle = '#1f1a44';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // 2. Desenho do Jogador (Quadrante com rastro Neon Ciano)
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // 3. Desenho dos Obstáculos (Barreiras Neon Roxas)
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Reset de sombras para textos não borrarem
    ctx.shadowBlur = 0;

    // 4. Tela de Fim de Jogo overlay
    if (gameOver) {
        ctx.fillStyle = 'rgba(8, 7, 17, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff007f';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CONEXÃO INTERROMPIDA', canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.fillText('Pressione ESPAÇO para restaurar o sistema', canvas.width / 2, canvas.height / 2 + 30);
    }
}

function resetGame() {
    score = 0;
    scoreVal.innerText = score;
    gameOver = false;
    gameSpeed = 5;
    frameCount = 0;
    obstacles = [];
    player.y = canvas.height - player.height - 20;
    player.velocityY = 0;
    player.isGrounded = true;
}

// Inicializador sincronizado da engine
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
