// Configurações do Estado Inicial do RPG
let playerHp = 100;
let playerMaxHp = 100;
let playerShield = 0;

let enemyHp = 150;
let enemyMaxHp = 150;
let enemyDamageIntent = 15;

let lockBoard = false;
let firstCard = null;
let secondCard = null;

// Elementos do DOM mapeados
const board = document.getElementById('grid-board');
const log = document.getElementById('combat-log');
const playerHpBar = document.getElementById('player-hp-bar');
const playerHpText = document.getElementById('player-hp-text');
const playerShieldText = document.getElementById('player-shield-text');
const enemyHpBar = document.getElementById('enemy-hp-bar');
const enemyHpText = document.getElementById('enemy-hp-text');

// Tipos de efeitos e seus símbolos visuais
const cardTypes = [
    { name: 'ataque', icon: '⚔️' },
    { name: 'defesa', icon: '🛡️' },
    { name: 'cura', icon: '🧪' },
    { name: 'especial', icon: '⚡' }
];

// Duplica os itens para criar pares idênticos (Total de 16 cartas no grid 4x4)
let deck = [...cardTypes, ...cardTypes, ...cardTypes, ...cardTypes];

// Função de Embaralhamento (Algoritmo Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Inicializa a criação visual do tabuleiro
function createBoard() {
    shuffle(deck);
    deck.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.type = item.name;

        // Estrutura interna para o efeito 3D de virada
        card.innerHTML = `
            <div class="card-face card-back">?</div>
            <div class="card-face card-front">${item.icon}</div>
        `;

        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

// Gerencia o clique e a rotação das cartas
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return; // Evita clicar duas vezes na mesma carta

    this.classList.add('flipped');

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

// Valida se as duas cartas selecionadas são iguais
function checkForMatch() {
    let isMatch = firstCard.dataset.type === secondCard.dataset.type;

    if (isMatch) {
        executeCombatAction(firstCard.dataset.type);
        disableCards();
    } else {
        unflipCards();
        executeEnemyTurn(); // Errar o par concede um turno de ataque ao inimigo
    }
}

// Remove eventos se houver acerto, mantendo-as abertas
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    resetTurn();
    checkGameOver();
}

// Desvira as cartas se o jogador errar o par
function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetTurn();
    }, 1000);
}

// Reseta os ponteiros de validação de rodada
function resetTurn() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

// --- MECÂNICAS DE COMBATE (LÓGICA RPG) ---

function executeCombatAction(type) {
    switch (type) {
        case 'ataque':
            let dmg = 25;
            enemyHp = Math.max(0, enemyHp - dmg);
            log.innerText = `Sucesso! Você usou a Espada e causou ${dmg} de dano ao Monstro!`;
            break;
        case 'defesa':
            playerShield += 20;
            log.innerText = `Sucesso! Você ergueu um Escudo de proteção de 20 pontos!`;
            break;
        case 'cura':
            playerHp = Math.min(playerMaxHp, playerHp + 25);
            log.innerText = `Sucesso! Você bebeu uma Poção e recuperou 25 de Vida!`;
            break;
        case 'especial':
            let espDmg = 45;
            enemyHp = Math.max(0, enemyHp - espDmg);
            log.innerText = `Incrível! Movimento Crítico! Relâmpago causou ${espDmg} de dano!`;
            break;
    }
    updateInterface();
}

function executeEnemyTurn() {
    // Calcula o dano recebido mitigado pelo escudo do jogador
    let damageTaken = enemyDamageIntent;
    
    if (playerShield > 0) {
        if (playerShield >= damageTaken) {
            playerShield -= damageTaken;
            damageTaken = 0;
        } else {
            damageTaken -= playerShield;
            playerShield = 0;
        }
    }

    playerHp = Math.max(0, playerHp - damageTaken);
    log.innerText = `Você errou o par! O Monstro contra-atacou e te causou ${damageTaken} de dano real.`;
    
    updateInterface();
    checkGameOver();
}

function updateInterface() {
    // Atualização matemática de textos e preenchimento das barras (%)
    playerHpText.innerText = playerHp;
    playerShieldText.innerText = `Escudo: ${playerShield}`;
    playerHpBar.style.width = `${(playerHp / playerMaxHp) * 100}%`;

    enemyHpText.innerText = enemyHp;
    enemyHpBar.style.width = `${(enemyHp / enemyMaxHp) * 100}%`;
}

function checkGameOver() {
    if (enemyHp <= 0) {
        log.innerHTML = `<strong style="color: #00b37e;">VITÓRIA! O Chefe foi derrotado! Você salvou o reino!</strong>`;
        lockBoard = true;
    } else if (playerHp <= 0) {
        log.innerHTML = `<strong style="color: #f75a68;">FIM DE JOGO! Suas vidas acabaram. O Monstro venceu.</strong>`;
        lockBoard = true;
    }
}

// Inicializa a execução
createBoard();
updateInterface();
