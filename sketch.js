const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timerDisplay');
const modal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const startBtn = document.getElementById('startBtn');

// Configuración
const COLS = 61; 
const ROWS = 61; 
const CELL_SIZE = 35; 

let maze = [];
let player = { x: 1, y: 1 };
let trail = []; 
let exit = { x: COLS - 2, y: ROWS - 2 };
let timeLeft = 30;
let gameActive = false;
let lastTime = 0;

const keys = {};

function generateMaze() {
    maze = Array(ROWS).fill().map(() => Array(COLS).fill(1)); 
    function walk(x, y) {
        maze[y][x] = 0;
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
        for (let [dx, dy] of dirs) {
            let nx = x + dx;
            let ny = y + dy;
            if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                walk(nx, ny);
            }
        }
    }
    walk(1, 1);
    maze[exit.y][exit.x] = 0;
}

function initGame() {
    generateMaze();
    player = { x: 1, y: 1 };
    trail = []; 
    timeLeft = 30;
    gameActive = true;
    modal.style.display = 'none';
    timerDisplay.classList.remove('timer-low');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameActive) return;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    timeLeft -= delta;

    if (timeLeft <= 0) {
        timeLeft = 0;
        endGame(false);
        return;
    }

    updatePlayer();
    updateTrail();
    draw();

    timerDisplay.innerText = timeLeft.toFixed(1) + 's';
    if (timeLeft < 10) timerDisplay.classList.add('timer-low');
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    let moved = false;
    const speed = 0.28; 

    const move = (dx, dy) => {
        let nx = player.x + dx;
        let ny = player.y + dy;
        if (maze[Math.round(ny)][Math.round(nx)] === 0) {
            player.x = nx;
            player.y = ny;
            moved = true;
        }
    };

    if (keys['ArrowUp'] || keys['w'] || keys['W']) move(0, -speed);
    if (keys['ArrowDown'] || keys['s'] || keys['S']) move(0, speed);
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) move(-speed, 0);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) move(speed, 0);

    if (moved) {
        trail.push({ x: player.x, y: player.y });
        if (trail.length > 5) trail.shift();
    } else {
        if (trail.length > 0) trail.shift();
    }

    if (Math.hypot(player.x - exit.x, player.y - exit.y) < 0.5) endGame(true);
}

function updateTrail() {
    // La lógica de desaparición está integrada en el shift del updatePlayer
}

function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(
        canvas.width / 2 - player.x * CELL_SIZE,
        canvas.height / 2 - player.y * CELL_SIZE
    );

    // Dibujar Paredes
    ctx.fillStyle = '#1e293b';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (maze[y][x] === 1) {
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // Dibujar Estela
    trail.forEach((p, i) => {
        ctx.fillStyle = `rgba(99, 102, 241, ${0.1 * (i + 1)})`;
        ctx.fillRect(p.x * CELL_SIZE + 8, p.y * CELL_SIZE + 8, CELL_SIZE - 16, CELL_SIZE - 16);
    });

    // Salida
    ctx.fillStyle = '#22c55e';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#22c55e';
    ctx.fillRect(exit.x * CELL_SIZE + 5, exit.y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);

    // Jugador
    ctx.fillStyle = '#6366f1';
    ctx.shadowColor = '#6366f1';
    ctx.fillRect(player.x * CELL_SIZE + 5, player.y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    
    ctx.restore();
}

function endGame(victory) {
    gameActive = false;
    modal.style.display = 'flex';
    modalTitle.innerText = victory ? "¡VICTORIA!" : "FIN DEL TIEMPO";
    modalDesc.innerText = victory ? `Escapaste faltando ${timeLeft.toFixed(1)}s.` : "El laberinto te ha atrapado.";
    startBtn.innerText = "VOLVER A INTENTAR";
}

// Controles
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
startBtn.addEventListener('click', initGame);

const setupTouch = (id, key) => {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; }, {passive: false});
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; }, {passive: false});
};
setupTouch('btnUp', 'ArrowUp');
setupTouch('btnDown', 'ArrowDown');
setupTouch('btnLeft', 'ArrowLeft');
setupTouch('btnRight', 'ArrowRight');

// Inicialización
generateMaze();
draw();
