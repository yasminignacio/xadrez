// Captura dos elementos do HTML
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('score-val');
const livesVal = document.getElementById('lives-val');

// Estados Globais do Jogo
let score = 0;
let lives = 3;
let gameOver = false;

// Configuração do Jogador (Nave)
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 30,
    speed: 6
};

// Listas de entidades mecânicas
const lasers = [];
const asteroids = [];

// Controle de teclas pressionadas pelo usuário
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Escutadores de eventos do teclado
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space' && !keys.Space && !gameOver) {
        keys.Space = true;
        // Cria um laser saindo exatamente do meio da nave
        lasers.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 8
        });
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
});

// Geração procedural de Inimigos (Asteroides)
function spawnAsteroid() {
    if (gameOver) return;
    
    const size = Math.floor(Math.random() * 20) + 15; // Tamanho randômico entre 15 e 35
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: Math.random() * 2 + 1.5 // Velocidades variadas
    });

    // Agenda o surgimento do próximo asteroide em um tempo aleatório
    setTimeout(spawnAsteroid, Math.random() * 1000 + 800);
}

// Detecção matemática de colisão por caixas envolventes (AABB)
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- ENGINE LOOP (ATUALIZAÇÃO DE FRAMES GRÁFICOS) ---
function update() {
    if (gameOver) return;

    // Movimentação da Nave com travas nas bordas laterais do mapa
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Processamento e movimentação dos tiros (Lasers)
    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].y -= lasers[i].speed;
        // Limpa da memória os lasers que saíram da tela superior
        if (lasers[i].y < 0) {
            lasers.splice(i, 1);
        }
    }

    // Processamento, movimentação e física dos asteroides
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speed;

        // Se o asteroide ultrapassar o limite inferior, jogador perde 1 vida
        if (asteroids[i].y > canvas.height) {
            asteroids.splice(i, 1);
            lives--;
            livesVal.innerText = lives;
            if (lives <= 0) {
                gameOver = true;
            }
            continue;
        }

        // Checa colisão física: Asteroide encostou na Nave do Jogador
        if (checkCollision(asteroids[i], player)) {
            asteroids.splice(i, 1);
            lives--;
            livesVal.innerText = lives;
            if (lives <= 0) {
                gameOver = true;
            }
            continue;
        }

        // Checa colisão física: Tiros de Laser acertaram o Asteroide
        for (let j = lasers.length - 1; j >= 0; j--) {
            if (checkCollision(lasers[j], asteroids[i])) {
                asteroids.splice(i, 1);
                lasers.splice(j, 1);
                score += 10;
                scoreVal.innerText = score;
                break;
            }
        }
    }
}

// --- RENDERIZADOR DIGITAL (DESENHO NA TELA) ---
function draw() {
    // Limpa o canvas para o próximo quadro líquido
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = '#ff477e';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIM DE JOGO', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.fillText('Pressione F5 para reiniciar a missão', canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    // Desenha o jogador (Representado por um triângulo futurista azul)
    ctx.fillStyle = '#4ea8de';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Desenha todos os Lasers ativos na cor verde neon
    ctx.fillStyle = '#70e000';
    lasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    });

    // Desenha os asteroides como círculos cinzas texturizados
    ctx.fillStyle = '#555566';
    asteroids.forEach(asteroid => {
        ctx.beginPath();
        ctx.arc(
            asteroid.x + asteroid.width / 2, 
            asteroid.y + asteroid.height / 2, 
            asteroid.width / 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    });
}

// Gatilho principal que sincroniza as atualizações com a taxa de atualização do monitor
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Disparos automáticos iniciais
spawnAsteroid();
gameLoop();
