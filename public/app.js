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
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let score = 0;
    let selectedBall = null;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    function initBoard() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                board[i][j] = Math.floor(Math.random() * 5) + 1;
            }
        }
        drawBoard();
    }
    
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cellSize = 50;
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const x = j * cellSize;
                const y = i * cellSize;
                
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeStyle = '#ddd';
                ctx.strokeRect(x, y, cellSize, cellSize);
                
                if (board[i][j] > 0) {
                    const centerX = x + cellSize / 2;
                    const centerY = y + cellSize / 2;
                    const radius = 20;
                    
                    ctx.fillStyle = colors[board[i][j] - 1];
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
                
                if (selectedBall && selectedBall.row === i && selectedBall.col === j) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x, y, cellSize, cellSize);
                }
            }
        }
    }
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellSize = 50;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        
        if (row >= 0 && row < 9 && col >= 0 && col < 9) {
            if (selectedBall) {
                if (isValidMove(selectedBall.row, selectedBall.col, row, col)) {
                    moveBall(selectedBall.row, selectedBall.col, row, col);
                    selectedBall = null;
                } else if (board[row][col] > 0) {
                    selectedBall = { row, col };
                }
            } else if (board[row][col] > 0) {
                selectedBall = { row, col };
            }
            drawBoard();
        }
    });
    
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        if (board[toRow][toCol] !== 0) return false;
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    function moveBall(fromRow, fromCol, toRow, toCol) {
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = 0;
        checkLines();
        addNewBalls();
        updateScore();
    }
    
    function checkLines() {
        // Simple line checking logic
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 5; j++) {
                const color = board[i][j];
                if (color === 0) continue;
                let count = 1;
                for (let k = j + 1; k < 9 && board[i][k] === color; k++) count++;
                if (count >= 5) {
                    for (let k = j; k < j + count; k++) board[i][k] = 0;
                    score += count * 10;
                }
            }
        }
    }
    
    function addNewBalls() {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) emptyCells.push({ row: i, col: j });
            }
        }
        for (let i = 0; i < Math.min(3, emptyCells.length); i++) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const cell = emptyCells[randomIndex];
            board[cell.row][cell.col] = Math.floor(Math.random() * 5) + 1;
            emptyCells.splice(randomIndex, 1);
        }
    }
    
    function updateScore() {
        document.getElementById('score').textContent = score;
        document.getElementById('gameStatus').textContent = `Điểm: ${score}`;
    }
    
    // Game controls
    document.getElementById('newGameBtn').addEventListener('click', () => {
        score = 0;
        selectedBall = null;
        initBoard();
        updateScore();
    });
    
    document.getElementById('hintBtn').addEventListener('click', () => {
        showSuccess('Tính năng gợi ý đang được phát triển!');
    });
    
    document.getElementById('saveGameBtn').addEventListener('click', () => {
        showSuccess('Game đã được lưu!');
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
