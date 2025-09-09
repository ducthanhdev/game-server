// Global variables
let socket = null;
let currentUser = null;
let line98GameState = null;
let caroGameState = null;
let selectedBall = null;

// API Base URL
const API_BASE = 'http://localhost:3000';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAuthStatus();
});

// Event listeners
function initializeEventListeners() {
    // Navigation
    document.getElementById('auth-tab').addEventListener('click', () => showSection('auth-section'));
    document.getElementById('line98-tab').addEventListener('click', () => showSection('line98-section'));
    document.getElementById('caro-tab').addEventListener('click', () => showSection('caro-section'));

    // Enter key for forms
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    document.getElementById('register-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.game-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to corresponding nav button
    const buttonMap = {
        'auth-section': 'auth-tab',
        'line98-section': 'line98-tab',
        'caro-section': 'caro-tab'
    };
    document.getElementById(buttonMap[sectionId]).classList.add('active');
}

// Authentication functions
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            currentUser = data.user;
            updateUserInfo();
            showLoginForm();
            initializeSocket();
            alert('Đăng nhập thành công!');
        } else {
            alert('Đăng nhập thất bại: ' + (data.message || 'Lỗi không xác định'));
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('register-email').value;
    const nickname = document.getElementById('register-nickname').value;
    
    if (!username || !password) {
        alert('Vui lòng nhập tên đăng nhập và mật khẩu');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email, nickname }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            showLoginForm();
        } else {
            alert('Đăng ký thất bại: ' + (data.message || 'Lỗi không xác định'));
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    updateUserInfo();
    showLoginForm();
    alert('Đã đăng xuất');
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('user-info').classList.remove('show');
}

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('user-info').classList.remove('show');
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('user-username').textContent = currentUser.username;
        document.getElementById('user-email').textContent = currentUser.email || 'Chưa cập nhật';
        document.getElementById('user-nickname').textContent = currentUser.nickname || 'Chưa cập nhật';
        document.getElementById('user-info').classList.add('show');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
    } else {
        document.getElementById('user-info').classList.remove('show');
    }
}

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                currentUser = await response.json();
                updateUserInfo();
                initializeSocket();
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            localStorage.removeItem('token');
        }
    }
}

// Socket initialization
function initializeSocket() {
    if (socket) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    socket = io('http://localhost:3000', {
        auth: { token }
    });
    
    // Line 98 socket events
    socket.on('gameState', (gameState) => {
        line98GameState = gameState;
        updateLine98Display();
    });
    
    socket.on('hint', (hint) => {
        if (hint) {
            alert(`Gợi ý: Di chuyển từ (${hint.fromRow}, ${hint.fromCol}) đến (${hint.toRow}, ${hint.toCol})`);
        } else {
            alert('Không có nước đi hợp lệ!');
        }
    });
    
    // Caro socket events
    socket.on('gameJoined', (data) => {
        updateCaroStatus(`Đã tham gia phòng ${data.gameId}`, 'playing');
    });
    
    socket.on('gameCreated', (data) => {
        updateCaroStatus(`Đã tạo phòng ${data.gameId}. Đang chờ đối thủ...`, 'waiting');
    });
    
    socket.on('waitingForOpponent', () => {
        updateCaroStatus('Đang tìm đối thủ...', 'waiting');
    });
    
    socket.on('gameState', (gameState) => {
        caroGameState = gameState;
        updateCaroDisplay();
    });
    
    socket.on('gameOver', (data) => {
        if (data.isDraw) {
            updateCaroStatus('Hòa!', 'game-over');
        } else {
            const winner = data.winnerId === currentUser.id ? 'Bạn' : 'Đối thủ';
            updateCaroStatus(`${winner} thắng!`, 'game-over');
        }
    });
    
    socket.on('opponentLeft', () => {
        updateCaroStatus('Đối thủ đã rời khỏi phòng', 'game-over');
    });
}

// Line 98 functions
function updateLine98Display() {
    if (!line98GameState) return;
    
    const board = document.getElementById('line98-board');
    board.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            const color = line98GameState.board[row][col];
            
            if (color === 0) {
                cell.className = 'line98-cell empty';
            } else {
                cell.className = `line98-cell color-${color}`;
            }
            
            if (line98GameState.selectedBall && 
                line98GameState.selectedBall.row === row && 
                line98GameState.selectedBall.col === col) {
                cell.classList.add('selected');
            }
            
            cell.addEventListener('click', () => handleLine98CellClick(row, col));
            board.appendChild(cell);
        }
    }
    
    document.getElementById('line98-score').textContent = line98GameState.score;
    
    if (line98GameState.isGameOver) {
        updateLine98Status('Trò chơi kết thúc!', 'game-over');
    } else {
        updateLine98Status('Chọn bóng để di chuyển', 'playing');
    }
}

function handleLine98CellClick(row, col) {
    if (!socket || !line98GameState) return;
    
    if (line98GameState.selectedBall) {
        // Try to move ball
        socket.emit('moveBall', {
            fromRow: line98GameState.selectedBall.row,
            fromCol: line98GameState.selectedBall.col,
            toRow: row,
            toCol: col
        });
    } else {
        // Select ball
        if (line98GameState.board[row][col] !== 0) {
            socket.emit('selectBall', { row, col });
        }
    }
}

function newLine98Game() {
    if (socket) {
        socket.emit('newGame');
    }
}

function getHint() {
    if (socket) {
        socket.emit('getHint');
    }
}

function updateLine98Status(message, type) {
    const status = document.getElementById('line98-status');
    status.textContent = message;
    status.className = `status ${type}`;
}

// Caro functions
function updateCaroDisplay() {
    if (!caroGameState) return;
    
    const board = document.getElementById('caro-board');
    board.innerHTML = '';
    
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            const cell = document.createElement('div');
            const value = caroGameState.board[row][col];
            
            cell.className = 'caro-cell';
            if (value === 1) {
                cell.textContent = 'X';
                cell.classList.add('player1');
            } else if (value === 2) {
                cell.textContent = 'O';
                cell.classList.add('player2');
            }
            
            if (!caroGameState.isGameOver && value === 0) {
                cell.addEventListener('click', () => handleCaroCellClick(row, col));
            }
            
            board.appendChild(cell);
        }
    }
    
    const currentPlayerText = caroGameState.currentPlayer === 1 ? 'X' : 'O';
    const isMyTurn = (caroGameState.currentPlayer === 1 && caroGameState.player1Id === currentUser.id) ||
                     (caroGameState.currentPlayer === 2 && caroGameState.player2Id === currentUser.id);
    
    if (caroGameState.isGameOver) {
        updateCaroStatus('Trò chơi kết thúc!', 'game-over');
    } else if (isMyTurn) {
        updateCaroStatus(`Lượt của bạn (${currentPlayerText})`, 'playing');
    } else {
        updateCaroStatus(`Lượt của đối thủ (${currentPlayerText})`, 'waiting');
    }
}

function handleCaroCellClick(row, col) {
    if (!socket || !caroGameState) return;
    
    socket.emit('makeMove', {
        gameId: caroGameState.id,
        row: row,
        col: col
    });
}

function createCaroGame() {
    if (socket) {
        socket.emit('createGame');
    }
}

function findCaroMatch() {
    if (socket) {
        socket.emit('findMatch');
    }
}

function joinCaroGame() {
    document.getElementById('caro-game-id').classList.remove('hidden');
}

function joinGameById() {
    const gameId = document.getElementById('game-id-input').value;
    if (!gameId) {
        alert('Vui lòng nhập ID phòng');
        return;
    }
    
    if (socket) {
        socket.emit('joinGame', { gameId: parseInt(gameId) });
    }
}

function updateCaroStatus(message, type) {
    const status = document.getElementById('caro-status');
    status.textContent = message;
    status.className = `status ${type}`;
}

