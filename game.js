const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const turnVal = document.getElementById('turn-val');
const logBox = document.getElementById('log-box');

const boardSize = 8;
const tileSize = canvas.width / boardSize;

let currentTurn = 'W'; // 'W' para Brancas, 'B' para Pretas
let selectedPiece = null; // Guarda {r, c} da peça selecionada

// Símbolos Unicode das peças de xadrez
const piecesSymbols = {
    'W_R': '♜', 'W_N': '♞', 'W_B': '♝', 'W_Q': '♛', 'W_K': '♚', 'W_P': '♟',
    'B_R': '♜', 'B_N': '♞', 'B_B': '♝', 'B_Q': '♛', 'B_K': '♚', 'B_P': '♟'
};

// Matriz do Tabuleiro Inicial (Linha, Coluna)
let board = [
    ['B_R', 'B_N', 'B_B', 'B_Q', 'B_K', 'B_B', 'B_N', 'B_R'],
    ['B_P', 'B_P', 'B_P', 'B_P', 'B_P', 'B_P', 'B_P', 'B_P'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['W_P', 'W_P', 'W_P', 'W_P', 'W_P', 'W_P', 'W_P', 'W_P'],
    ['W_R', 'W_N', 'W_B', 'W_Q', 'W_K', 'W_B', 'W_N', 'W_R']
];

// --- DESENHO GRÁFICO ---
function drawBoard() {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            // Alterna cores das casas (Clara / Escura)
            ctx.fillStyle = (r + c) % 2 === 0 ? '#eeeed2' : '#769656';
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

            // Destaca visualmente a peça selecionada
            if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }

            // Renderiza o caractere Unicode da Peça se a casa não estiver vazia
            const piece = board[r][c];
            if (piece) {
                ctx.fillStyle = piece.startsWith('W') ? '#ffffff' : '#000000';
                
                // Aplica contorno sutil nas peças pretas para destacar no fundo verde escuro
                if (piece.startsWith('B')) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.font = '42px sans-serif';
                    ctx.strokeText(piecesSymbols[piece], c * tileSize + 8, r * tileSize + 44);
                }

                ctx.font = '42px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alpha';
                ctx.fillText(piecesSymbols[piece], c * tileSize + 8, r * tileSize + 44);
            }
        }
    }
}

// --- REGRAS BÁSICAS DE MOVIMENTAÇÃO (Simplificada para Escopo Escolar) ---
function isValidMove(fromR, fromC, toR, toC, piece) {
    const color = piece.split('_')[0];
    const type = piece.split('_')[1];
    const target = board[toR][toC];

    // Impedir de capturar uma peça da mesma cor
    if (target && target.startsWith(color)) return false;

    const dr = toR - fromR;
    const dc = toC - fromC;

    switch (type) {
        case 'P': // Peão (Movimento básico para frente)
            const direction = color === 'W' ? -1 : 1;
            // Avanço simples de 1 casa vazia
            if (dc === 0 && dr === direction && !target) return true;
            // Avanço duplo inicial
            if (dc === 0 && dr === 2 * direction && ((color === 'W' && fromR === 6) || (color === 'B' && fromR === 1)) && !target) return true;
            // Captura diagonal
            if (Math.abs(dc) === 1 && dr === direction && target) return true;
            return false;

        case 'R': // Torre (Linhas retas)
            return (dr === 0 || dc === 0);

        case 'B': // Bispo (Diagonais)
            return Math.abs(dr) === Math.abs(dc);

        case 'N': // Cavalo (Formato de L)
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);

        case 'Q': // Rainha (Torre + Bispo)
            return (dr === 0 || dc === 0) || Math.abs(dr) === Math.abs(dc);

        case 'K': // Rei (1 casa para qualquer direção)
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    return false;
}

// --- CAPTURA DE INTERAÇÕES (CLIQUE) ---
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Converte os pixels clicados em Índices da Matriz [Linha][Coluna]
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);

    const clickedPiece = board[r][c];

    if (selectedPiece === null) {
        // Primeira fase: Selecionar a peça do jogador do turno atual
        if (clickedPiece && clickedPiece.startsWith(currentTurn)) {
            selectedPiece = { r, c };
            logBox.innerText = `Peça selecionada. Escolha a casa de destino.`;
        } else {
            logBox.innerText = `Não é sua vez ou a casa está vazia!`;
        }
    } else {
        // Segunda fase: Mover a peça selecionada para o local escolhido
        const fromPiece = board[selectedPiece.r][selectedPiece.c];

        if (isValidMove(selectedPiece.r, selectedPiece.c, r, c, fromPiece)) {
            // Executa o movimento alterando a matriz de dados
            board[r][c] = fromPiece;
            board[selectedPiece.r][selectedPiece.c] = '';

            // Inverte o turno do jogo
            currentTurn = currentTurn === 'W' ? 'B' : 'W';
            turnVal.innerText = currentTurn === 'W' ? 'Brancas' : 'Pretas';
            logBox.innerText = `Movimento realizado com sucesso!`;
        } else {
            logBox.innerText = `Movimento inválido! Seleção cancelada.`;
        }
        
        selectedPiece = null; // Limpa a seleção para a próxima jogada
    }

    drawBoard(); // Redesenha a tela atualizada
});

// Inicialização Gráfica
drawBoard();
