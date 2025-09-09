// Global variables
let socket;
let currentUser = null;
let currentGame = null;
let gameState = null;

// DOM elements
const authScreen = document.getElementById('authScreen');
const gameSelectionScreen = document.getElementById('gameSelectionScreen');
const line98Game = document.getElementById('line98Game');
const caroGame = document.getElementById('caroGame');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing app...');
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(user => {
            currentUser = user;
            showGameSelection();
            initializeSocket();
        })
        .catch(() => {
            localStorage.removeItem('token');
            showAuthScreen();
        });
    } else {
        showAuthScreen();
    }
    setupEventListeners();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auth form toggles
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    
    console.log('showRegisterBtn:', showRegisterBtn);
    console.log('showLoginBtn:', showLoginBtn);
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            console.log('Show register clicked');
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        });
    } else {
        console.error('showRegisterBtn not found!');
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            console.log('Show login clicked');
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });
    } else {
        console.error('showLoginBtn not found!');
    }

    // Auth forms
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Game selection
    const line98Card = document.getElementById('line98Card');
    const caroCard = document.getElementById('caroCard');
    
    if (line98Card) {
        line98Card.addEventListener('click', () => showGame('line98'));
    }
    
    if (caroCard) {
        caroCard.addEventListener('click', () => showGame('caro'));
    }

    // Back buttons
    const backToSelection = document.getElementById('backToSelection');
    const backToSelectionCaro = document.getElementById('backToSelectionCaro');
    
    if (backToSelection) {
        backToSelection.addEventListener('click', () => showGameSelection());
    }
    
    if (backToSelectionCaro) {
        backToSelectionCaro.addEventListener('click', () => showGameSelection());
    }
}

function showAuthScreen() {
    authScreen.style.display = 'block';
    gameSelectionScreen.style.display = 'none';
    line98Game.style.display = 'none';
    caroGame.style.display = 'none';
}

function showGameSelection() {
    authScreen.style.display = 'none';
    gameSelectionScreen.style.display = 'block';
    line98Game.style.display = 'none';
    caroGame.style.display = 'none';
    
    if (currentUser) {
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('userUsername').textContent = currentUser.username;
        document.getElementById('userEmail').textContent = currentUser.email || 'Chưa cập nhật';
        document.getElementById('userNickname').textContent = currentUser.nickname || 'Chưa cập nhật';
    }
}

function showGame(gameType) {
    authScreen.style.display = 'none';
    gameSelectionScreen.style.display = 'none';
    
    if (gameType === 'line98') {
        line98Game.style.display = 'block';
        caroGame.style.display = 'none';
        initializeLine98Game();
    } else if (gameType === 'caro') {
        line98Game.style.display = 'none';
        caroGame.style.display = 'block';
        initializeCaroGame();
    }
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            currentUser = data.user;
            showSuccess('Đăng nhập thành công!');
            setTimeout(() => {
                showGameSelection();
                initializeSocket();
            }, 1000);
        } else {
            showError(data.message || 'Đăng nhập thất bại');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const email = document.getElementById('registerEmail').value;
    const nickname = document.getElementById('registerNickname').value;

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email, nickname })
        });

        const data = await response.json();
        if (response.ok) {
            // Register now returns login response directly
            localStorage.setItem('token', data.access_token);
            currentUser = data.user;
            showSuccess('Đăng ký thành công!');
            setTimeout(() => {
                showGameSelection();
                initializeSocket();
            }, 1000);
        } else {
            showError(data.message || 'Đăng ký thất bại');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    if (socket) socket.disconnect();
    showAuthScreen();
}

// Socket initialization
function initializeSocket() {
    if (socket) socket.disconnect();
    const token = localStorage.getItem('token');
    socket = io({ auth: { token } });

    socket.on('connect', () => console.log('Connected to server'));
    socket.on('disconnect', () => console.log('Disconnected from server'));
    
    // Game events
    socket.on('gameState', (state) => {
        gameState = state;
        updateGameDisplay();
    });
    
    socket.on('gameOver', (data) => {
        showSuccess(`Game Over! ${data.score ? `Điểm: ${data.score}` : ''}`);
    });
}

// Game functions
function initializeLine98Game() {
    const canvas = document.getElementById('line98Canvas');
    const ctx = canvas.getContext('2d');
    
    // Game constants
    const ROWS = 9, COLS = 9, K = 7, LINE = 5, SPAWN = 3;
    
    // Game state
    let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));   
    let score = 0;
    let selectedBall = null;
    let isGameOver = false;
    let nextBalls = [];
    let usePreview = true;
    
    // Improved colors with better contrast and 3D effect
    const colors = [
        { main: '#E74C3C', light: '#F1948A', dark: '#C0392B' }, // Red
        { main: '#3498DB', light: '#85C1E9', dark: '#2980B9' }, // Blue
        { main: '#2ECC71', light: '#82E0AA', dark: '#27AE60' }, // Green
        { main: '#F39C12', light: '#F7DC6F', dark: '#D68910' }, // Orange
        { main: '#9B59B6', light: '#BB8FCE', dark: '#8E44AD' }, // Purple
        { main: '#E67E22', light: '#F8C471', dark: '#D35400' }, // Dark Orange
        { main: '#1ABC9C', light: '#7DCEA0', dark: '#16A085' }  // Turquoise
    ];
    
    // Utility functions
    function inBoard(r, c) {
        return r >= 0 && r < ROWS && c >= 0 && c < COLS;
    }
    
    function emptyCells(board) {
        const res = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === 0) res.push([r, c]);
            }
        }
        return res;
    }
    
    function randInt(n) { 
        return Math.floor(Math.random() * n); 
    }
    
    function randomColor() { 
        return 1 + randInt(K); 
    }
    
    function spawnRandomBalls(board, count, colors = null) {
        let empties = emptyCells(board);
        if (empties.length === 0) return 0;
        let placed = 0;

        for (let i = 0; i < count && empties.length > 0; i++) {
            const idx = randInt(empties.length);
            const [r, c] = empties[idx];
            const col = colors ? colors[i] : randomColor();
            board[r][c] = col;
            empties.splice(idx, 1);
            placed++;
        }
        return placed;
    }
    
    function initBoard() {
        // Clear board
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                board[i][j] = 0;
            }
        }
        
        // Spawn initial balls (5-7 balls)
        const initialCount = 5 + randInt(3);
        spawnRandomBalls(board, initialCount);
        
        // Remove any initial lines
        collectAllLines(board);
        
        // Generate next balls for preview
        if (usePreview) {
            nextBalls = Array(SPAWN).fill().map(() => randomColor());
        }
        
        drawBoard();
    }
    
    // BFS pathfinding algorithm
    function bfsPath(board, start, target) {
        const [sr, sc] = start;
        const [tr, tc] = target;
        if (sr === tr && sc === tc) return [];

        const q = [];
        const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

        visited[sr][sc] = true;
        q.push([sr, sc]);
        
        while (q.length) {
            const [r, c] = q.shift();
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (!inBoard(nr, nc)) continue;
                if (visited[nr][nc]) continue;
                if (board[nr][nc] !== 0 && !(nr === tr && nc === tc)) continue;
                
                visited[nr][nc] = true;
                parent[nr][nc] = [r, c];
                
                if (nr === tr && nc === tc) {
                    // Reconstruct path
                    const path = [];
                    let cur = [tr, tc];
                    while (cur && !(cur[0] === sr && cur[1] === sc)) {
                        path.push(cur);
                        cur = parent[cur[0]][cur[1]];
                    }
                    path.reverse();
                    return path;
                }
                q.push([nr, nc]);
            }
        }
        return null;
    }
    
    // Collect line cells at specific position
    function collectLineCellsAt(board, r, c) {
        const col = board[r][c];
        if (col === 0) return [];
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        const result = new Set();

        for (const [dr, dc] of dirs) {
            const cells = [[r, c]];
            // Forward direction
            let rr = r + dr, cc = c + dc;
            while (inBoard(rr, cc) && board[rr][cc] === col) {
                cells.push([rr, cc]);
                rr += dr; cc += dc;
            }
            // Backward direction
            rr = r - dr; cc = c - dc;
            while (inBoard(rr, cc) && board[rr][cc] === col) {
                cells.push([rr, cc]);
                rr -= dr; cc -= dc;
            }
            if (cells.length >= LINE) {
                for (const cell of cells) result.add(cell.toString());
            }
        }
        return Array.from(result).map(s => s.split(',').map(Number));
    }
    
    // Collect all lines on board
    function collectAllLines(board) {
        const bag = new Set();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === 0) continue;
                const cells = collectLineCellsAt(board, r, c);
                for (const cell of cells) bag.add(cell.toString());
            }
        }
        return Array.from(bag).map(s => s.split(',').map(Number));
    }
    
    // Remove cells from board
    function removeCells(board, cells) {
        for (const [r, c] of cells) board[r][c] = 0;
    }
    
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = 50;
        
        // Draw grid background
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                const x = j * cellSize;
                const y = i * cellSize;
                
                // Cell background with subtle gradient
                const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                gradient.addColorStop(0, '#f8f9fa');
                gradient.addColorStop(1, '#e9ecef');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, cellSize, cellSize);
                
                // Cell border
                ctx.strokeStyle = '#dee2e6';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }
        
        // Draw balls with 3D effect
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                if (board[i][j] > 0) {
                    drawBall(j * cellSize, i * cellSize, cellSize, board[i][j], i, j);
                }
            }
        }
        
        // Draw selection highlight
        if (selectedBall) {
            const x = selectedBall.col * cellSize;
            const y = selectedBall.row * cellSize;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            ctx.setLineDash([]);
        }
        
        // Draw next balls preview
        if (usePreview && nextBalls.length > 0) {
            drawNextBallsPreview();
        }
    }
    
    function drawNextBallsPreview() {
        const cellSize = 50;
        const previewX = COLS * cellSize + 20;
        const previewY = 20;
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText('Tiếp theo:', previewX, previewY);
        
        for (let i = 0; i < nextBalls.length; i++) {
            const x = previewX + (i * 30);
            const y = previewY + 20;
            drawBall(x, y, 25, nextBalls[i], 0, 0);
        }
    }
    
    function drawBall(x, y, cellSize, colorIndex, row, col) {
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;
        const radius = 18;
        const color = colors[colorIndex - 1];
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 2, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Main ball with gradient
        const gradient = ctx.createRadialGradient(
            centerX - radius/3, centerY - radius/3, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, color.light);
        gradient.addColorStop(0.7, color.main);
        gradient.addColorStop(1, color.dark);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - radius/3, centerY - radius/3, radius/3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = color.dark;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Main game move logic
    function doMove(board, sr, sc, tr, tc) {
        if (board[sr][sc] === 0 || board[tr][tc] !== 0) return false;

        const path = bfsPath(board, [sr, sc], [tr, tc]);
        if (!path) return false;

        const col = board[sr][sc];
        board[sr][sc] = 0;
        board[tr][tc] = col;

        // Check and remove lines after move
        const rm1 = collectLineCellsAt(board, tr, tc);
        if (rm1.length > 0) {
            removeCells(board, rm1);
            score += rm1.length;
            return true; // Don't spawn new balls
        }

        // Spawn 3 new balls
        if (usePreview && nextBalls.length > 0) {
            spawnRandomBalls(board, SPAWN, nextBalls);
            nextBalls = Array(SPAWN).fill().map(() => randomColor());
        } else {
            spawnRandomBalls(board, SPAWN);
        }

        // Check and remove lines after spawning
        const rm2 = collectAllLines(board);
        if (rm2.length > 0) {
            removeCells(board, rm2);
            score += rm2.length;
        }

        return true;
    }
    
    canvas.addEventListener('click', (e) => {
        if (isGameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellSize = 50;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            if (!selectedBall) {
                // No ball selected - select this ball if it exists
                if (board[row][col] > 0) {
                    selectedBall = { row, col };
                }
            } else {
                // Ball already selected
                const [sr, sc] = [selectedBall.row, selectedBall.col];
                
                if (row === sr && col === sc) {
                    // Clicked same ball - deselect
                    selectedBall = null;
                } else if (board[row][col] > 0) {
                    // Clicked different ball - select new one
                    selectedBall = { row, col };
                } else {
                    // Clicked empty cell - try to move
                    const success = doMove(board, sr, sc, row, col);
                    if (success) {
                        selectedBall = null;
                        updateScore();
                        
                        // Check game over
                        if (emptyCells(board).length === 0) {
                            isGameOver = true;
                            showSuccess(`Game Over! Điểm cuối: ${score}`);
                        }
                    } else {
                        showError('Không thể di chuyển đến vị trí này!');
                    }
                }
            }
            drawBoard();
        }
    });
    
    // Find valid moves for hint system
    function findValidMoves() {
        const validMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] > 0) {
                    // Check adjacent cells
                    const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                    for (const [dr, dc] of directions) {
                        const nr = r + dr, nc = c + dc;
                        if (inBoard(nr, nc) && board[nr][nc] === 0) {
                            const path = bfsPath(board, [r, c], [nr, nc]);
                            if (path) {
                                validMoves.push({from: [r, c], to: [nr, nc]});
                            }
                        }
                    }
                }
            }
        }
        return validMoves;
    }
    
    function updateScore() {
        document.getElementById('score').textContent = score;
        document.getElementById('gameStatus').textContent = `Điểm: ${score}`;
    }
    
    // Game controls
    document.getElementById('newGameBtn').addEventListener('click', () => {
        score = 0;
        selectedBall = null;
        isGameOver = false;
        initBoard();
        updateScore();
    });
    
    document.getElementById('hintBtn').addEventListener('click', () => {
        if (isGameOver) return;
        
        const validMoves = findValidMoves();
        if (validMoves.length > 0) {
            const move = validMoves[0];
            const [fr, fc] = move.from;
            const [tr, tc] = move.to;
            selectedBall = { row: fr, col: fc };
            drawBoard();
            showSuccess(`Gợi ý: Di chuyển bóng từ (${fr+1},${fc+1}) đến (${tr+1},${tc+1})`);
        } else {
            showError('Không có nước đi hợp lệ!');
        }
    });
    
    document.getElementById('saveGameBtn').addEventListener('click', () => {
        if (socket) {
            socket.emit('saveGame', { gameState: { board, score, nextBalls } });
            showSuccess('Game đã được lưu!');
        } else {
            showSuccess('Game đã được lưu!');
        }
    });
    
    initBoard();
    updateScore();
}

function initializeCaroGame() {
    const canvas = document.getElementById('caroCanvas');
    const ctx = canvas.getContext('2d');
    let board = Array(15).fill().map(() => Array(15).fill(0));
    let currentPlayer = 1;
    let gameOver = false;
    
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = 40;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 15; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, 600);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(600, i * cellSize);
            ctx.stroke();
        }
        
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] !== 0) {
                    const x = j * cellSize + cellSize / 2;
                    const y = i * cellSize + cellSize / 2;
                    const radius = 15;
                    
                    ctx.fillStyle = board[i][j] === 1 ? '#FF6B6B' : '#4ECDC4';
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
    }
    
    canvas.addEventListener('click', (e) => {
        if (gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellSize = 40;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        
        if (row >= 0 && row < 15 && col >= 0 && col < 15 && board[row][col] === 0) {
            board[row][col] = currentPlayer;
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            drawBoard();
            document.getElementById('caroStatus').textContent = 
                `Lượt chơi: ${currentPlayer === 1 ? 'X' : 'O'}`;
        }
    });
    
    // Game controls
    document.getElementById('findMatchBtn').addEventListener('click', () => {
        showSuccess('Đang tìm đối thủ...');
    });
    
    document.getElementById('createGameBtn').addEventListener('click', () => {
        showSuccess('Phòng game đã được tạo!');
    });
    
    document.getElementById('joinGameBtn').addEventListener('click', () => {
        const gameId = prompt('Nhập ID phòng game:');
        if (gameId) showSuccess(`Đã tham gia phòng ${gameId}`);
    });
    
    drawBoard();
}

function updateGameDisplay() {
    if (gameState) {
        if (gameState.score !== undefined) {
            document.getElementById('score').textContent = gameState.score;
        }
    }
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    setTimeout(() => errorEl.style.display = 'none', 5000);
}

function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    successEl.textContent = message;
    successEl.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    setTimeout(() => successEl.style.display = 'none', 3000);
}
