// Captura de Elementos do DOM
const storyBox = document.getElementById('story-box');
const choicesPanel = document.getElementById('choices-panel');
const hpVal = document.getElementById('hp-val');
const goldVal = document.getElementById('gold-val');
const weaponVal = document.getElementById('weapon-val');

// Objeto de Estado Global do Jogador
let state = {
    hp: 100,
    gold: 0,
    weapon: "Adaga de Ferro",
    hasShield: false
};

// Atualiza o painel superior com os valores do estado atual
function updateStats() {
    hpVal.innerText = state.hp;
    goldVal.innerText = state.gold;
    weaponVal.innerText = state.weapon;
}

// Inicia o motor do jogo no nó número 1
function startGame() {
    state = { hp: 100, gold: 0, weapon: "Adaga de Ferro", hasShield: false };
    showStoryNode(1);
}

// Renderiza o texto e as opções de um nó específico da história
function showStoryNode(nodeId) {
    const node = storyNodes.find(n => n.id === nodeId);
    
    // Atualiza o texto da tela
    storyBox.innerText = node.text;
    
    // Limpa os botões antigos
    while (choicesPanel.firstChild) {
        choicesPanel.removeChild(choicesPanel.firstChild);
    }

    // Cria e insere os novos botões baseados nas opções do nó
    node.options.forEach(option => {
        // Se a opção tiver uma condição que o jogador não cumpre, não mostra o botão
        if (option.requiredState && !option.requiredState(state)) return;

        const button = document.createElement('button');
        button.innerText = option.text;
        button.addEventListener('click', () => selectOption(option));
        choicesPanel.appendChild(button);
    });

    updateStats();
}

// Processa a escolha do jogador, aplicando consequências
function selectOption(option) {
    // Aplica alterações de estado se existirem (perda de vida, ganho de ouro, etc)
    if (option.setState) {
        state = { ...state, ...option.setState(state) };
    }

    // Verifica se o jogador morreu com essa escolha
    if (state.hp <= 0) {
        state.hp = 0;
        showStoryNode(99); // Nó de Game Over
        return;
    }

    // Avança para o próximo ID de destino da história
    showStoryNode(option.nextTextId);
}

// --- BANCO DE DADOS DA NARRATIVA (ÁRVORE DE DECISÕES) ---
const storyNodes = [
    {
        id: 1,
        text: "Você acorda no chão frio de uma masmorra. Tochas nas paredes iluminam fracamente dois caminhos à sua frente: um corredor escuro à esquerda exalando um cheiro podre, e uma escadaria de pedra à direita de onde vem um som de água corrente.",
        options: [
            { text: "Entrar no corredor escuro da esquerda", nextTextId: 2 },
            { text: "Descer a escadaria de pedra da direita", nextTextId: 3 }
        ]
    },
    {
        id: 2,
        text: "O corredor escuro é estreito. De repente, um Goblin salta das sombras com um porrete! O que você faz?",
        options: [
            { 
                text: "Atacar com sua Adaga de Ferro", 
                setState: (s) => ({ hp: s.hp - 20, gold: s.gold + 30 }), 
                nextTextId: 4 
            },
            { 
                text: "Tentar correr de volta", 
                setState: (s) => ({ hp: s.hp - 10 }), 
                nextTextId: 1 
            }
        ]
    },
    {
        id: 3,
        text: "A escadaria leva a um rio subterrâneo subterrâneo. No meio da água rasa, você vê um baú entreaberto e uma espada brilhante fincada em uma rocha.",
        options: [
            { text: "Abrir o baú entreaberto", setState: (s) => ({ gold: s.gold + 50 }), nextTextId: 5 },
            { text: "Puxar a espada brilhante da rocha", setState: (s) => ({ weapon: "Espada de Aço" }), nextTextId: 5 },
            { text: "Ignorar e voltar para o início", nextTextId: 1 }
        ]
    },
    {
        id: 4,
        text: "Você derrota o Goblin, mas recebe um golpe no processo. Vasculhando o corpo dele, você encontra 30 moedas de ouro. O corredor continua e leva até uma grande porta de ferro trancada.",
        options: [
            { text: "Usar o ouro para subornar um guarda na guarita ao lado", requiredState: (s) => s.gold >= 30, setState: (s) => ({ gold: s.gold - 30 }), nextTextId: 6 },
            { text: "Arrombar a porta usando a força bruta", setState: (s) => ({ hp: s.hp - 40 }), nextTextId: 6 }
        ]
    },
    {
        id: 5,
        text: "Com seus novos recursos, você segue o fluxo do rio até encontrar a mesma grande porta de ferro por trás, evitando os guardas. No entanto, um enorme Dragão de Fogo bloqueia a saída final da masmorra!",
        options: [
            { text: "Atacar o dragão com sua arma atual", nextTextId: 7 },
            { text: "Procurar uma rota de fuga alternativa nas paredes", nextTextId: 8 }
        ]
    },
    {
        id: 6,
        text: "Você passa pela porta de ferro, mas dá de cara com a sala principal. Um enorme Dragão de Fogo está acordado e bloqueia a saída final da masmorra!",
        options: [
            { text: "Atacar o dragão diretamente", nextTextId: 7 },
            { text: "Tentar fugir correndo desesperadamente", setState: (s) => ({ hp: 0 }), nextTextId: 99 }
        ]
    },
    {
        id: 7,
        text: "Batalha Final! Você corre em direção ao monstro.",
        options: [
            { 
                text: "Desferir o golpe com a Espada de Aço", 
                requiredState: (s) => s.weapon === "Espada de Aço", 
                nextTextId: 10 // Vitória
            },
            { 
                text: "Atacar com sua fraca Adaga de Ferro", 
                requiredState: (s) => s.weapon === "Adaga de Ferro", 
                setState: (s) => ({ hp: 0 }), 
                nextTextId: 99 // Derrota
            }
        ]
    },
    {
        id: 8,
        text: "Procurando nas frestas da parede, você acha uma pequena passagem secreta que te leva direto para a superfície, sã e salvo. Você escapou estrategicamente!",
        options: [
            { text: "Jogar Novamente", nextTextId: 1, setState: () => ({ hp: 100, gold: 0, weapon: "Adaga de Ferro" }) }
        ]
    },
    {
        id: 10,
        text: "VITÓRIA! Graças à Espada de Aço encontrada no rio, seu golpe corta as escamas do dragão, fazendo-o recuar. Você abre as grandes portas de Eldoria e sai vitorioso para a luz do sol!",
        options: [
            { text: "Jogar Novamente", nextTextId: 1, setState: () => ({ hp: 100, gold: 0, weapon: "Adaga de Ferro" }) }
        ]
    },
    {
        id: 99,
        text: "GAME OVER. Seus pontos de vida chegaram a zero. Sua jornada termina esquecida na escuridão das catacumbas.",
        options: [
            { text: "Tentar Novamente", nextTextId: 1, setState: () => ({ hp: 100, gold: 0, weapon: "Adaga de Ferro" }) }
        ]
    }
];

// Inicializa o jogo assim que a página carrega
startGame();
