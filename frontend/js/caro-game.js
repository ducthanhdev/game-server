// Caro Game - Frontend thuần với API calls
let caroGameState = null;
let currentCaroGameId = null;
let isOnlineMode = false;

// Game initialization
async function initCaroGame(mode = 'local') {
    isOnlineMode = (mode === 'online');
    
    if (isOnlineMode) {
        await initOnlineCaroGame();
    } else {
        initLocalCaroGame();
    }
}

// Initialize local game
function initLocalCaroGame() {
    caroGameState = {
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        winner: null,
        isGameOver: false,
        player1: 'X',
        player2: 'O'
    };
    
    renderCaroBoard();
    updateCaroDisplay();
    showToast('Game local đã bắt đầu', 'success');
}

// Initialize online game
async function initOnlineCaroGame() {
    try {
        // Try to join existing game first
        const availableGames = await getAvailableCaroGames();
        
        if (availableGames.length > 0) {
            // Join existing game
            const game = availableGames[0];
            await joinCaroGame(game._id);
        } else {
            // Create new game
            await createCaroGame();
        }
    } catch (error) {
        showError('Không thể khởi tạo game online');
    }
}

// Create new caro game
async function createCaroGame() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/games/caro/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const game = await response.json();
            currentCaroGameId = game._id;
            caroGameState = {
                board: game.board,
                currentPlayer: game.currentPlayer,
                winner: null,
                isGameOver: game.isGameOver,
                player1: 'X',
                player2: 'O',
                gameId: game._id
            };
            
            renderCaroBoard();
            updateCaroDisplay();
            showToast('Game online đã được tạo. Chờ người chơi khác...', 'info');
        } else {
            showError('Không thể tạo game online');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

// Join existing caro game
async function joinCaroGame(gameId) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/games/caro/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ gameId })
        });

        if (response.ok) {
            const game = await response.json();
            currentCaroGameId = game._id;
            caroGameState = {
                board: game.board,
                currentPlayer: game.currentPlayer,
                winner: null,
                isGameOver: game.isGameOver,
                player1: 'X',
                player2: 'O',
                gameId: game._id
            };
            
            renderCaroBoard();
            updateCaroDisplay();
            showToast('Đã tham gia game online!', 'success');
        } else {
            const error = await response.json();
            showError(error.message || 'Không thể tham gia game');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

// Get available caro games
async function getAvailableCaroGames() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/games/caro/available`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            return await response.json();
        } else {
            return [];
        }
    } catch (error) {
        return [];
    }
}

// Make a move
async function makeCaroMove(x, y) {
    if (!caroGameState || caroGameState.isGameOver) return;
    
    if (caroGameState.board[x][y] !== 0) {
        showToast('Vị trí này đã được chọn', 'warning');
        return;
    }

    if (isOnlineMode) {
        await makeOnlineCaroMove(x, y);
    } else {
        makeLocalCaroMove(x, y);
    }
}

// Make local move
function makeLocalCaroMove(x, y) {
    caroGameState.board[x][y] = caroGameState.currentPlayer;
    
    // Check for win
    const winner = checkCaroWinner(x, y);
    if (winner) {
        caroGameState.winner = winner;
        caroGameState.isGameOver = true;
        showToast(`Người chơi ${winner} thắng!`, 'success');
    } else if (isCaroBoardFull()) {
        caroGameState.isGameOver = true;
        showToast('Hòa!', 'info');
    } else {
        caroGameState.currentPlayer = caroGameState.currentPlayer === 1 ? 2 : 1;
    }
    
    renderCaroBoard();
    updateCaroDisplay();
}

// Make online move
async function makeOnlineCaroMove(x, y) {
    if (!currentCaroGameId) return;

    try {
        const response = await fetch(`${window.API_BASE_URL}/games/caro/${currentCaroGameId}/move`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ x, y })
        });

        if (response.ok) {
            const game = await response.json();
            caroGameState.board = game.board;
            caroGameState.currentPlayer = game.currentPlayer;
            caroGameState.isGameOver = game.isGameOver;
            
            if (game.winnerId) {
                caroGameState.winner = game.winnerId;
                showToast('Game kết thúc!', 'success');
            }
            
            renderCaroBoard();
            updateCaroDisplay();
        } else {
            const error = await response.json();
            showToast(error.message || 'Nước đi không hợp lệ', 'error');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

// Check winner
function checkCaroWinner(x, y) {
    const player = caroGameState.board[x][y];
    const WIN_LENGTH = 5;
    
    // Check horizontal
    let count = 1;
    for (let i = x - 1; i >= 0 && caroGameState.board[i][y] === player; i--) count++;
    for (let i = x + 1; i < 15 && caroGameState.board[i][y] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    // Check vertical
    count = 1;
    for (let i = y - 1; i >= 0 && caroGameState.board[x][i] === player; i--) count++;
    for (let i = y + 1; i < 15 && caroGameState.board[x][i] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; x - i >= 0 && y - i >= 0 && caroGameState.board[x - i][y - i] === player; i++) count++;
    for (let i = 1; x + i < 15 && y + i < 15 && caroGameState.board[x + i][y + i] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    // Check diagonal (top-right to bottom-left)
    count = 1;
    for (let i = 1; x - i >= 0 && y + i < 15 && caroGameState.board[x - i][y + i] === player; i++) count++;
    for (let i = 1; x + i < 15 && y - i >= 0 && caroGameState.board[x + i][y - i] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    return null;
}

// Check if board is full
function isCaroBoardFull() {
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (caroGameState.board[row][col] === 0) {
                return false;
            }
        }
    }
    return true;
}

// Render board
function renderCaroBoard() {
    const canvas = document.getElementById('caroCanvas');
    if (!canvas || !caroGameState) return;

    const ctx = canvas.getContext('2d');
    const cellSize = 40;
    const boardSize = 15;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, boardSize * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(boardSize * cellSize, i * cellSize);
        ctx.stroke();
    }

    // Draw pieces
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const piece = caroGameState.board[row][col];
            if (piece > 0) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                
                ctx.beginPath();
                ctx.arc(x, y, cellSize / 2 - 5, 0, 2 * Math.PI);
                
                if (piece === 1) {
                    ctx.fillStyle = '#ff6b6b'; // Red for X
                } else {
                    ctx.fillStyle = '#4ecdc4'; // Blue for O
                }
                
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw X or O
                ctx.fillStyle = '#fff';
                ctx.font = `${cellSize / 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(piece === 1 ? 'X' : 'O', x, y);
            }
        }
    }
}

// Update display
function updateCaroDisplay() {
    if (!caroGameState) return;

    const statusElement = document.getElementById('caroStatus');

    if (statusElement) {
        if (caroGameState.isGameOver) {
            if (caroGameState.winner) {
                statusElement.textContent = `Người chơi ${caroGameState.winner === 1 ? 'X' : 'O'} thắng!`;
            } else {
                statusElement.textContent = 'Hòa!';
            }
        } else {
            const currentSymbol = caroGameState.currentPlayer === 1 ? 'X' : 'O';
            statusElement.textContent = `Lượt của người chơi ${currentSymbol}`;
        }
    }
}

// Canvas click handler
function handleCaroCanvasClick(event) {
    if (!caroGameState || caroGameState.isGameOver) return;

    const canvas = document.getElementById('caroCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cellSize = 40;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || row >= 15 || col < 0 || col >= 15) return;

    makeCaroMove(row, col);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('caroCanvas');
    if (canvas) {
        canvas.addEventListener('click', handleCaroCanvasClick);
    }

    const newCaroGameBtn = document.getElementById('newCaroGameBtn');
    if (newCaroGameBtn) {
        newCaroGameBtn.addEventListener('click', () => initCaroGame('local'));
    }

    const playWithAIBtn = document.getElementById('playWithAIBtn');
    if (playWithAIBtn) {
        playWithAIBtn.addEventListener('click', () => {
            showToast('Chế độ chơi với AI chưa được triển khai', 'info');
        });
    }

    const playOnlineBtn = document.getElementById('playOnlineBtn');
    if (playOnlineBtn) {
        playOnlineBtn.addEventListener('click', () => initCaroGame('online'));
    }
});

// Export functions
window.initCaroGame = initCaroGame;
window.makeCaroMove = makeCaroMove;
