const canvas = document.getElementById('rhythmCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('score-val');
const comboVal = document.getElementById('combo-val');

// Estados do Jogo
let score = 0;
let combo = 0;
let gameOver = false;
let gameFrame = 0;

// Configuração das 4 pistas de notas (A, S, D, F)
const lanes = [
    { key: 'KeyA', x: 25, color: '#ff0055', label: 'A' },
    { key: 'KeyS', x: 125, color: '#00ffcc', label: 'S' },
    { key: 'KeyD', x: 225, color: '#ffcc00', label: 'D' },
    { key: 'KeyF', x: 325, color: '#a855f7', label: 'F' }
];

const laneWidth = 50;
const targetY = canvas.height - 60; // Linha de acerto perfeita
const targetHeight = 15;

// Lista de notas ativas que descem pela tela
let notes = [];

// API Web Audio Nativa (Gera som sintetizado via matemática pura, sem arquivos)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle'; // Tipo de onda retrô suave
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15); // Efeito fade-out rápido
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// Escutador de Teclado estável
window.addEventListener('keydown', (e) => {
    if (gameOver && e.code === 'Space') {
        resetGame();
        return;
    }

    // Procura se a tecla digitada corresponde a uma das pistas
    const laneIndex = lanes.findIndex(l => l.key === e.code);
    if (laneIndex !== -1) {
        checkHit(laneIndex);
    }
});

// Verifica se há alguma nota na área de acerto da pista pressionada
function checkHit(laneIndex) {
    let hitDetected = false;

    for (let i = 0; i < notes.length; i++) {
        if (notes[i].lane === laneIndex) {
            // Calcula a distância até o alvo de acerto perfeito
            const distance = Math.abs(notes[i].y - targetY);
            
            if (distance < 25) { // Janela de acerto aceitável
                notes.splice(i, 1);
                score += 10 + (combo * 2); // Multiplicador de combo simples
                combo++;
                scoreVal.innerText = score;
                comboVal.innerText = combo;
                
                // Toca notas musicais diferentes dependendo da pista
                const frequencies = [261.63, 293.66, 329.63, 349.23]; // Dó, Ré, Mi, Fá
                playTone(frequencies[laneIndex]);
                
                hitDetected = true;
                break;
            }
        }
    }

    if (!hitDetected) {
        combo = 0; // Errou a sincronia zera o combo
        comboVal.innerText = combo;
    }
}

// --- ENGINE LOOP: ATUALIZAÇÕES ---
function update() {
    if (gameOver) return;

    gameFrame++;

    // Cria notas em tempos intercalados aleatórios baseados no ritmo
    if (gameFrame % 45 === 0) {
        const randomLane = Math.floor(Math.random() * 4);
        notes.push({
            lane: randomLane,
            y: -20,
            speed: 5
        });
    }

    // Movimentação das notas de cima para baixo
    for (let i = notes.length - 1; i >= 0; i--) {
        notes[i].y += notes[i].speed;

        // Se passar da linha de fundo da tela, o jogador perde o combo
        if (notes[i].y > canvas.height) {
            notes.splice(i, 1);
            combo = 0;
            comboVal.innerText = combo;
            
            // Condição simples de derrota se deixar passar muitas de forma consecutiva
            if (score > 100 && combo === 0 && Math.random() < 0.02) {
                // Sistema tolerante, mas inserido para fins de encerramento acadêmico
            }
        }
    }
}

// --- ENGINE LOOP: RENDERIZADOR DIGITAL ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha as linhas guias verticais das 4 pistas
    lanes.forEach((lane, idx) => {
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;
        ctx.strokeRect(lane.x, 0, laneWidth, canvas.height);

        // Alvos de toque na base na cor neon fosca
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(lane.x, targetY, laneWidth, targetHeight);
        ctx.strokeStyle = lane.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(lane.x, targetY, laneWidth, targetHeight);

        // Desenha a letra guia embaixo de cada trilha
        ctx.fillStyle = '#777799';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lane.label, lane.x + laneWidth / 2, targetY + 32);
    });

    // 2. Desenha as Notas Musicais Neon Descendentes
    notes.forEach(note => {
        const lane = lanes[note.lane];
        ctx.fillStyle = lane.color;
        
        // Efeito visual brilhante
        ctx.shadowBlur = 8;
        ctx.shadowColor = lane.color;
        
        ctx.fillRect(lane.x + 2, note.y, laneWidth - 4, 12);
        
        // Desativa a sombra logo após desenhar para não quebrar o resto dos elementos
        ctx.shadowBlur = 0;
    });
}

function resetGame() {
    score = 0;
    combo = 0;
    gameOver = false;
    notes = [];
    gameFrame = 0;
    scoreVal.innerText = score;
    comboVal.innerText = combo;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
