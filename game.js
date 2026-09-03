const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const turnVal = document.getElementById('turn-val');
const logBox = document.getElementById('log-box');

const boardSize = 8;
const tileSize = canvas.width / boardSize;

let currentTurn = 'W'; // 'W' para Brancas, 'B' para Pretas
let selectedPiece = null; // Guarda {r, c} da peça selecionada
let isGameOver = false;

// Símbolos Unicode corretos
const piecesSymbols = {
    'W_R': '♖', 'W_N': '♘', 'W_B': '♗', 'W_Q': '♕', 'W_K': '♔', 'W_P': '♙',
    'B_R': '♜', 'B_N': '♞', 'B_B': '♝', 'B_Q': '♛', 'B_K': '♚', 'B_P': '♟'
};

// Matriz do Tabuleiro Inicial
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
            ctx.fillStyle = (r + c) % 2 === 0 ? '#eeeed2' : '#769656';
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

            if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }

            const piece = board[r][c];
            if (piece) {
                ctx.font = '46px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const posX = c * tileSize + tileSize / 2;
                const posY = r * tileSize + tileSize / 2;

                if (piece.startsWith('B')) {
                    ctx.fillStyle = '#000000';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeText(piecesSymbols[piece], posX, posY);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1.5;
                    ctx.strokeText(piecesSymbols[piece], posX, posY);
                }
                ctx.fillText(piecesSymbols[piece], posX, posY);
            }
        }
    }
}

// --- FUNÇÃO AUXILIAR: VERIFICA CAMINHO LIVRE ---
function isPathClear(fromR, fromC, toR, toC, currentBoard = board) {
    const stepR = Math.sign(toR - fromR);
    const stepC = Math.sign(toC - fromC);
    
    let currentR = fromR + stepR;
    let currentC = fromC + stepC;

    while (currentR !== toR || currentC !== toC) {
        if (currentBoard[currentR][currentC] !== '') {
            return false;
        }
        currentR += stepR;
        currentC += stepC;
    }
    return true;
}

// --- REGRAS BÁSICAS DE MOVIMENTAÇÃO (Suporta tabuleiros simulados) ---
function isValidMove(fromR, fromC, toR, toC, piece, currentBoard = board) {
    const color = piece.split('_')[0];
    const type = piece.split('_')[1];
    const target = currentBoard[toR][toC];

    if (target && target.startsWith(color)) return false;

    const dr = toR - fromR;
    const dc = toC - fromC;

    switch (type) {
        case 'P': 
            const direction = color === 'W' ? -1 : 1;
            if (dc === 0 && dr === direction && !target) return true;
            if (dc === 0 && dr === 2 * direction && ((color === 'W' && fromR === 6) || (color === 'B' && fromR === 1)) && !target) {
                return currentBoard[fromR + direction][fromC] === '';
            }
            if (Math.abs(dc) === 1 && dr === direction && target) return true;
            return false;

        case 'R': 
            if (dr === 0 || dc === 0) return isPathClear(fromR, fromC, toR, toC, currentBoard);
            return false;

        case 'B': 
            if (Math.abs(dr) === Math.abs(dc)) return isPathClear(fromR, fromC, toR, toC, currentBoard);
            return false;

        case 'N': 
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);

        case 'Q': 
            if ((dr === 0 || dc === 0) || Math.abs(dr) === Math.abs(dc)) return isPathClear(fromR, fromC, toR, toC, currentBoard);
            return false;

        case 'K': 
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    return false;
}

// --- ENCONTRAR O REI ---
function findKing(color, currentBoard = board) {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (currentBoard[r][c] === `${color}_K`) {
                return { r, c };
            }
        }
    }
    return null;
}

// --- VERIFICA SE A COR ESTÁ EM XEQUE ---
function isInCheck(color, currentBoard = board) {
    const kingPos = findKing(color, currentBoard);
    if (!kingPos) return false;

    const opponentColor = color === 'W' ? 'B' : 'W';

    // Varre o tabuleiro procurando peças adversárias que atacam o Rei
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const piece = currentBoard[r][c];
            if (piece && piece.startsWith(opponentColor)) {
                if (isValidMove(r, c, kingPos.r, kingPos.c, piece, currentBoard)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// --- VERIFICA SE A JOGADA EVITA OU CAUSA XEQUE (SIMULAÇÃO) ---
function eliminatesCheck(fromR, fromC, toR, toC, color) {
    // Cria cópia profunda do tabuleiro atual para simular
    let tempBoard = board.map(row => [...row]);
    
    // Executa movimento simulado
    tempBoard[toR][toC] = tempBoard[fromR][fromC];
    tempBoard[fromR][fromC] = '';

    // Se após esse movimento o Rei ainda estiver (ou entrar) em xeque, a jogada é ilegal
    return !isInCheck(color, tempBoard);
}

// --- VERIFICA SE É XEQUE-MATE ---
function isCheckmate(color) {
    if (!isInCheck(color)) return false;

    // Varre todas as peças do jogador do turno atual
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const piece = board[r][c];
            if (piece && piece.startsWith(color)) {
                
                // Varre todas as casas possíveis do tabuleiro para ver se há alguma saída
                for (let toR = 0; toR < boardSize; toR++) {
                    for (let toC = 0; toC < boardSize; toC++) {
                        if (isValidMove(r, c, toR, toC, piece)) {
                            // Se existir pelo menos uma jogada que tire o Rei do xeque, não é mate
                            if (eliminatesCheck(r, c, toR, toC, color)) {
                                return false; 
                            }
                        }
                    }
                }

            }
        }
    }
    return true; // Nenhuma jogada legal pôde salvar o Rei
}

// --- CAPTURA DE INTERAÇÕES (CLIQUE) ---
canvas.addEventListener('click', (event) => {
    if (isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);

    const clickedPiece = board[r][c];

    if (selectedPiece === null) {
        if (clickedPiece && clickedPiece.startsWith(currentTurn)) {
            selectedPiece = { r, c };
            logBox.innerText = `Peça selecionada. Escolha a casa de destino.`;
        } else {
            logBox.innerText = `Não é sua vez ou a casa está vazia!`;
        }
    } else {
        const fromPiece = board[selectedPiece.r][selectedPiece.c];

        if (clickedPiece && clickedPiece.startsWith(currentTurn)) {
            selectedPiece = { r, c };
            logBox.innerText = `Seleção alterada. Escolha o novo destino.`;
            drawBoard();
            return;
        }

        // Validação dupla: movimento mecânico válido E se resolve/não causa xeque próprio
        if (isValidMove(selectedPiece.r, selectedPiece.c, r, c, fromPiece) && eliminatesCheck(selectedPiece.r, selectedPiece.c, r, c, currentTurn)) {
            board[r][c] = fromPiece;
            board[selectedPiece.r][selectedPiece.c] = '';

            // Próximo turno provisório para checar as condições do oponente
            const nextTurn = currentTurn === 'W' ? 'B' : 'W';

            if (isCheckmate(nextTurn)) {
                logBox.innerHTML = `<strong style="color: #ff3333;">XEQUE-MATE! Fim de jogo. Vitória das ${currentTurn === 'W' ? 'Brancas' : 'Pretas'}.</strong>`;
                turnVal.innerText = "Fim de Jogo";
                isGameOver = true;
            } else if (isInCheck(nextTurn)) {
                logBox.innerHTML = `<span style="color: #ffaa00; font-weight: bold;">Atenção: Rei em XEQUE!</span>`;
                currentTurn = nextTurn;
                turnVal.innerText = currentTurn === 'W' ? 'Brancas' : 'Pretas';
            } else {
                logBox.innerText = `Movimento realizado com sucesso!`;
                currentTurn = nextTurn;
                turnVal.innerText = currentTurn === 'W' ? 'Brancas' : 'Pretas';
            }

            selectedPiece = null;
        } else {
            if (isInCheck(currentTurn)) {
                logBox.innerText = `Movimento inválido! Seu rei está em Xeque, você precisa defendê-lo.`;
            } else {
                logBox.innerText = `Movimento inválido ou colocaria seu próprio rei em Xeque!`;
            }
        }
    }

    drawBoard();
});

drawBoard();
