// Caro Game - Frontend thuần với API calls
let caroGameState = null;
let currentCaroGameId = null;
let isOnlineMode = false;
let isAIMode = false;
let aiDifficulty = 'medium'; // easy, medium, hard
let caroSocket = null;
let currentPlayerSymbol = null;

// Animation system
let caroAnimations = {
    placing: [],
    winning: [],
    pulse: null
};

let caroAnimationId = null;

// Get current user ID from token
function getCurrentUserId() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        // Decode JWT token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
}

// Animation functions
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startPlacingAnimation(x, y, player) {
    const animation = {
        x: x,
        y: y,
        player: player,
        startTime: Date.now(),
        duration: 300,
        scale: 0,
        opacity: 0
    };
    
    caroAnimations.placing.push(animation);
    
    if (!caroAnimationId) {
        startAnimationLoop();
    }
}

function startWinningAnimation(winningCells) {
    const now = Date.now();
    winningCells.forEach((cell, index) => {
        const animation = {
            x: cell.x,
            y: cell.y,
            startTime: now + index * 100,
            duration: 800,
            scale: 1,
            pulse: 0,
            color: cell.player === 1 ? '#ff6b6b' : '#4ecdc4'
        };
        
        caroAnimations.winning.push(animation);
    });
    
    if (!caroAnimationId) {
        startAnimationLoop();
    }
}

function updateAnimations(deltaTime) {
    let hasActiveAnimations = false;
    
    caroAnimations.placing = caroAnimations.placing.filter(anim => {
        const elapsed = Date.now() - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        if (progress >= 1) {
            return false;
        }
        
        anim.scale = easeInOutCubic(progress);
        anim.opacity = easeInOutCubic(progress);
        hasActiveAnimations = true;
        return true;
    });
    
    caroAnimations.winning = caroAnimations.winning.filter(anim => {
        const elapsed = Date.now() - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        if (progress >= 1) {
            return false;
        }
        
        anim.pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 1;
        anim.scale = easeInOutCubic(progress) * anim.pulse;
        hasActiveAnimations = true;
        return true;
    });
    
    if (hasActiveAnimations) {
        renderCaroBoard();
    }
    
    return hasActiveAnimations;
}

function startAnimationLoop() {
    if (caroAnimationId) return;
    
    let lastTime = Date.now();
    
    function animate() {
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        const hasAnimations = updateAnimations(deltaTime);
        
        if (hasAnimations) {
            caroAnimationId = requestAnimationFrame(animate);
        } else {
            caroAnimationId = null;
        }
    }
    
    caroAnimationId = requestAnimationFrame(animate);
}

// Status display functions
function showStatusDisplay(message, icon = '⏳') {
    const statusDisplay = document.getElementById('statusDisplay');
    const statusIcon = statusDisplay.querySelector('.status-icon');
    const statusText = statusDisplay.querySelector('.status-text');
    
    if (statusDisplay && statusIcon && statusText) {
        statusIcon.textContent = icon;
        statusText.textContent = message;
        statusDisplay.style.display = 'block';
    }
}

function hideStatusDisplay() {
    const statusDisplay = document.getElementById('statusDisplay');
    if (statusDisplay) {
        statusDisplay.style.display = 'none';
    }
}

// Polling function to check if opponent joined
let waitingInterval = null;

function startWaitingForOpponent() {
    if (waitingInterval) {
        clearInterval(waitingInterval);
    }
    
    waitingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${window.API_BASE_URL}/games/caro/${currentCaroGameId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const game = await response.json();
                // Check if opponent joined (player2Id is not null)
                if (game.player2Id) {
                    clearInterval(waitingInterval);
                    waitingInterval = null;
                    showStatusDisplay('Đối thủ đã tham gia! Bắt đầu chơi...', '🎉');
                    setTimeout(() => hideStatusDisplay(), 2000);
                }
            }
        } catch (error) {
            console.error('Error checking for opponent:', error);
        }
    }, 2000); // Check every 2 seconds
}

function stopWaitingForOpponent() {
    if (waitingInterval) {
        clearInterval(waitingInterval);
        waitingInterval = null;
    }
}

// WebSocket connection for real-time updates
function connectCaroWebSocket() {
    if (caroSocket) {
        caroSocket.disconnect();
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    caroSocket = io(`${window.API_BASE_URL}/caro`, {
        auth: { token }
    });
    
    caroSocket.on('connect', () => {
        console.log('🔌 Connected to Caro WebSocket');
    });
    
    caroSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from Caro WebSocket');
    });
    
    caroSocket.on('queue.matched', (data) => {
        console.log('🎮 Match found:', data);
        currentCaroGameId = data.roomId;
        currentPlayerSymbol = data.symbol;
        
        // Initialize game state
        caroGameState = {
            board: Array(15).fill(null).map(() => Array(15).fill(0)),
            currentPlayer: 1,
            winner: null,
            isGameOver: false,
            player1: 'X',
            player2: 'O',
            gameId: data.roomId
        };
        
        // Show leave room button for online mode
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        if (leaveRoomBtn) {
            leaveRoomBtn.style.display = 'inline-block';
        }
        
        renderCaroBoard();
        updateCaroDisplay();
        showStatusDisplay(`Đã ghép phòng! Bạn là ${data.symbol}`, '🎉');
        setTimeout(() => hideStatusDisplay(), 3000);
    });
    
    caroSocket.on('queue.waiting', (data) => {
        console.log('⏳ Waiting for opponent:', data);
        showStatusDisplay('Đang tìm đối thủ...', '⏳');
    });
    
    caroSocket.on('queue.error', (data) => {
        console.error('❌ Queue error:', data);
        showStatusDisplay(data.message, '❌');
        setTimeout(() => hideStatusDisplay(), 3000);
    });
    
    caroSocket.on('room.update', (data) => {
        console.log('🔄 Game update received:', data);
        if (caroGameState) {
            console.log('🔄 [FRONTEND] Before update:', {
                currentPlayer: caroGameState.currentPlayer,
                isGameOver: caroGameState.isGameOver,
                winner: caroGameState.winner
            });
            
            // Track turn change
            const oldCurrentPlayer = caroGameState.currentPlayer;
            caroGameState.board = data.board;
            caroGameState.currentPlayer = data.currentPlayer;
            caroGameState.isGameOver = data.isGameOver;
            caroGameState.winner = data.winner;
            
            // If turn changed, record the timestamp and clear any pending moves
            if (oldCurrentPlayer !== data.currentPlayer) {
                caroGameState.lastTurnChange = Date.now();
                console.log('🔄 [FRONTEND] Turn changed from', oldCurrentPlayer, 'to', data.currentPlayer);
                
                // Clear any pending move attempts
                if (caroGameState.pendingMove) {
                    console.log('🚫 [FRONTEND] Clearing pending move due to turn change');
                    caroGameState.pendingMove = null;
                }
                
                // Reset move cooldown to prevent immediate moves
                caroGameState.moveCooldown = Date.now() + 1000; // 1 second cooldown
            }
            
            console.log('🔄 [FRONTEND] After update:', {
                currentPlayer: caroGameState.currentPlayer,
                isGameOver: caroGameState.isGameOver,
                winner: caroGameState.winner,
                lastTurnChange: caroGameState.lastTurnChange
            });
            
            // Check if this is a new game (board is empty and isGameOver is false)
            const isNewGame = data.board.every(row => row.every(cell => cell === 0)) && !data.isGameOver;
            if (isNewGame && data.gameId) {
                console.log('🆕 New game detected, updating gameId from', currentCaroGameId, 'to', data.gameId);
                // Update currentCaroGameId to the new game ID
                currentCaroGameId = data.gameId;
                caroGameState.gameId = currentCaroGameId;
                
                // Reset game state for new game
                caroGameState.isGameOver = false;
                caroGameState.winner = null;
                
                // Reset cooldown and pending move for new game
                caroGameState.moveCooldown = null;
                caroGameState.pendingMove = null;
                caroGameState.lastTurnChange = null;
                
                console.log('🔄 Game state reset for new game:', {
                    currentPlayer: caroGameState.currentPlayer,
                    isGameOver: caroGameState.isGameOver,
                    winner: caroGameState.winner,
                    moveCooldown: caroGameState.moveCooldown,
                    pendingMove: caroGameState.pendingMove,
                    lastTurnChange: caroGameState.lastTurnChange
                });
            }
            
            // Always update gameId if provided (for consistency)
            if (data.gameId && data.gameId !== currentCaroGameId) {
                console.log('🔄 Updating gameId from', currentCaroGameId, 'to', data.gameId);
                currentCaroGameId = data.gameId;
                caroGameState.gameId = currentCaroGameId;
            }
            
            renderCaroBoard();
            updateCaroDisplay();
            
            if (data.isGameOver) {
                stopWaitingForOpponent();
                hideStatusDisplay();
            } else {
                // New game started, hide any status display
                hideStatusDisplay();
            }
        } else {
            // Initialize game state if not exists (for new game)
            caroGameState = {
                board: data.board,
                currentPlayer: data.currentPlayer,
                winner: data.winner,
                isGameOver: data.isGameOver,
                player1: 'X',
                player2: 'O',
                gameId: currentCaroGameId
            };
            
            renderCaroBoard();
            updateCaroDisplay();
            hideStatusDisplay();
        }
    });
    
    caroSocket.on('room.end', (data) => {
        console.log('🏁 Game ended:', data);
        if (caroGameState) {
            caroGameState.isGameOver = true;
            caroGameState.winner = data.winner;
            renderCaroBoard();
            updateCaroDisplay();
            stopWaitingForOpponent();
            hideStatusDisplay();
        }
    });
    
    caroSocket.on('room.error', (data) => {
        console.error('❌ Room error:', data);
        console.error('❌ [FRONTEND] Room error details:', {
            message: data.message,
            error: data.error,
            statusCode: data.statusCode,
            gameState: {
                currentPlayer: caroGameState?.currentPlayer,
                isGameOver: caroGameState?.isGameOver,
                winner: caroGameState?.winner,
                moveCooldown: caroGameState?.moveCooldown,
                pendingMove: caroGameState?.pendingMove,
                lastTurnChange: caroGameState?.lastTurnChange
            },
            gameId: currentCaroGameId,
            currentPlayerSymbol: currentPlayerSymbol,
            isOnlineMode: isOnlineMode
        });
        showStatusDisplay(data.message, '❌');
        setTimeout(() => hideStatusDisplay(), 3000);
    });
    
    
    caroSocket.on('room.playerLeft', (data) => {
        console.log('🚪 Player left room:', data);
        showStatusDisplay(data.message, 'ℹ️');
        setTimeout(() => {
            hideStatusDisplay();
            // Return to game selection
            resetCaroGame();
        }, 3000);
    });
}

function disconnectCaroWebSocket() {
    if (caroSocket) {
        caroSocket.disconnect();
        caroSocket = null;
    }
}

// Reset caro game state and return to game selection
function resetCaroGame() {
    // Hide leave room button
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
        leaveRoomBtn.style.display = 'none';
    }
    
    // Cleanup animations
    if (caroAnimationId) {
        cancelAnimationFrame(caroAnimationId);
        caroAnimationId = null;
    }
    
    caroAnimations.placing = [];
    caroAnimations.winning = [];
    caroAnimations.pulse = null;
    
    // Reset game state
    caroGameState = null;
    currentCaroGameId = null;
    isOnlineMode = false;
    isAIMode = false;
    currentPlayerSymbol = null;
    
    // Disconnect WebSocket
    disconnectCaroWebSocket();
    
    // Call the main showGameSelection function
    if (window.showGameSelection) {
        window.showGameSelection();
    }
}

// Game initialization
async function initCaroGame(mode = 'local', difficulty = 'medium') {
    console.log('🎮 Initializing caro game with mode:', mode, 'difficulty:', difficulty);
    isOnlineMode = (mode === 'online');
    isAIMode = (mode === 'ai');
    aiDifficulty = difficulty;
    
    if (isOnlineMode) {
        console.log('🌐 Starting online game...');
        connectCaroWebSocket();
        await initOnlineCaroGame();
    } else if (isAIMode) {
        console.log('🤖 Starting AI game...');
        disconnectCaroWebSocket();
        initAICaroGame();
    } else {
        console.log('🏠 Starting local game...');
        disconnectCaroWebSocket();
        initLocalCaroGame();
    }
}

// Initialize local game
function initLocalCaroGame() {
    stopWaitingForOpponent();
    hideStatusDisplay();
    
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
}

// Initialize AI game
function initAICaroGame() {
    stopWaitingForOpponent();
    hideStatusDisplay();
    
    caroGameState = {
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1, // Human always starts
        winner: null,
        isGameOver: false,
        player1: 'X', // Human
        player2: 'O'  // AI
    };
    
    renderCaroBoard();
    updateCaroDisplay();
}

// Initialize online game
async function initOnlineCaroGame() {
    try {
        console.log('🔍 Starting online game...');
        showStatusDisplay('Đang tìm đối thủ...', '🔍');
        
        // Join WebSocket queue for matchmaking
        if (caroSocket) {
            caroSocket.emit('queue.join');
        } else {
            console.error('❌ WebSocket not connected');
            showStatusDisplay('Lỗi kết nối WebSocket', '❌');
            setTimeout(() => hideStatusDisplay(), 3000);
        }
    } catch (error) {
        console.error('❌ Error in initOnlineCaroGame:', error);
        showStatusDisplay('Lỗi khi tìm đối thủ: ' + error.message, '❌');
        setTimeout(() => hideStatusDisplay(), 3000);
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
    } else if (isAIMode) {
        makeAICaroMove(x, y);
    } else {
        makeLocalCaroMove(x, y);
    }
}

// Make local move
function makeLocalCaroMove(x, y) {
    caroGameState.board[x][y] = caroGameState.currentPlayer;
    
    startPlacingAnimation(x, y, caroGameState.currentPlayer);
    
    // Check for win
    const winner = checkCaroWinner(x, y);
    if (winner) {
        const winningLine = getWinningLine(x, y);
        caroGameState.winningLine = winningLine; // Store winning line for drawing
        setTimeout(() => {
            startWinningAnimation(winningLine);
        }, 300);
        
        caroGameState.winner = winner;
        caroGameState.isGameOver = true;
        stopWaitingForOpponent();
    } else if (isCaroBoardFull()) {
        caroGameState.isGameOver = true;
        stopWaitingForOpponent();
    } else {
        caroGameState.currentPlayer = caroGameState.currentPlayer === 1 ? 2 : 1;
    }
    
    renderCaroBoard();
    updateCaroDisplay();
}

// Make AI move
function makeAICaroMove(x, y) {
    // Human move
    caroGameState.board[x][y] = caroGameState.currentPlayer;
    
    startPlacingAnimation(x, y, caroGameState.currentPlayer);
    
    // Check for win
    const winner = checkCaroWinner(x, y);
    if (winner) {
        const winningLine = getWinningLine(x, y);
        caroGameState.winningLine = winningLine; // Store winning line for drawing
        setTimeout(() => {
            startWinningAnimation(winningLine);
        }, 300);
        
        caroGameState.winner = winner;
        caroGameState.isGameOver = true;
        stopWaitingForOpponent();
        renderCaroBoard();
        updateCaroDisplay();
        return;
    } else if (isCaroBoardFull()) {
        caroGameState.isGameOver = true;
        stopWaitingForOpponent();
        renderCaroBoard();
        updateCaroDisplay();
        return;
    }
    
    // Switch to AI turn
    caroGameState.currentPlayer = 2;
    renderCaroBoard();
    updateCaroDisplay();
    
    // AI makes move after a short delay
    setTimeout(() => {
        if (!caroGameState.isGameOver) {
            const aiMove = getAIMove();
            if (aiMove) {
                makeAIMove(aiMove.x, aiMove.y);
            }
        }
    }, 500); // 500ms delay for better UX
}

// Execute AI move
function makeAIMove(x, y) {
    caroGameState.board[x][y] = 2; // AI is always player 2
    
    startPlacingAnimation(x, y, 2);
    
    // Check for win
    const winner = checkCaroWinner(x, y);
    if (winner) {
        const winningLine = getWinningLine(x, y);
        caroGameState.winningLine = winningLine; // Store winning line for drawing
        setTimeout(() => {
            startWinningAnimation(winningLine);
        }, 300);
        
        caroGameState.winner = winner;
        caroGameState.isGameOver = true;
        stopWaitingForOpponent();
    } else if (isCaroBoardFull()) {
        caroGameState.isGameOver = true;
        stopWaitingForOpponent();
    } else {
        caroGameState.currentPlayer = 1; // Switch back to human
    }
    
    renderCaroBoard();
    updateCaroDisplay();
}

// Make online move
async function makeOnlineCaroMove(x, y) {
    if (!currentCaroGameId || !caroSocket) {
      console.error('❌ Missing gameId or socket:', { currentCaroGameId, caroSocket: !!caroSocket });
      return;
    }

    // Check if game is over
    if (caroGameState && caroGameState.isGameOver) {
        console.log('❌ Cannot make move - game is over:', {
            isGameOver: caroGameState.isGameOver,
            winner: caroGameState.winner,
            currentPlayer: caroGameState.currentPlayer
        });
        return;
    }

    // Check if we're in move cooldown
    if (caroGameState && caroGameState.moveCooldown && Date.now() < caroGameState.moveCooldown) {
        console.log('⏳ Move cooldown active, waiting:', {
            moveCooldown: caroGameState.moveCooldown,
            timeUntilReady: caroGameState.moveCooldown - Date.now(),
            currentPlayer: caroGameState.currentPlayer
        });
        return;
    }
    
    // Check if there's already a pending move
    if (caroGameState && caroGameState.pendingMove) {
        console.log('⏳ Move already pending, skipping:', caroGameState.pendingMove);
        return;
    }
    
    // Mark this move as pending
    if (caroGameState) {
        caroGameState.pendingMove = { x, y, timestamp: Date.now() };
    }

    try {
        console.log('🎮 [FRONTEND] Sending move:', { 
            roomId: currentCaroGameId, 
            x, 
            y,
            currentPlayer: caroGameState.currentPlayer,
            currentPlayerSymbol,
            isGameOver: caroGameState.isGameOver,
            gameState: {
                currentPlayer: caroGameState.currentPlayer,
                isGameOver: caroGameState.isGameOver,
                winner: caroGameState.winner
            },
            gameId: {
                currentCaroGameId: currentCaroGameId,
                caroGameStateGameId: caroGameState.gameId
            }
        });
        
        // Send move via WebSocket for real-time sync
        caroSocket.emit('room.makeMove', {
            roomId: currentCaroGameId,
            x: x,
            y: y
        });
        
        // Clear pending move and cooldown after sending
        if (caroGameState) {
            caroGameState.pendingMove = null;
            caroGameState.moveCooldown = null;
        }
        
        // The board will be updated via WebSocket 'room.update' event
        // No need to manually update here
    } catch (error) {
        console.error('❌ Error making move:', error);
        
        // Clear pending move and cooldown on error
        if (caroGameState) {
            caroGameState.pendingMove = null;
            caroGameState.moveCooldown = null;
        }
    }
}

// Check winner
function checkCaroWinner(x, y) {
    const winningLine = getWinningLine(x, y);
    return winningLine ? winningLine[0].player : null;
}

function getWinningLine(x, y) {
    const player = caroGameState.board[x][y];
    const WIN_LENGTH = 5;
    
    const directions = [
        { dx: 1, dy: 0 },   // horizontal
        { dx: 0, dy: 1 },   // vertical
        { dx: 1, dy: 1 },   // diagonal \
        { dx: 1, dy: -1 }   // diagonal /
    ];
    
    for (const dir of directions) {
        const line = [{ x, y, player }];
        
        for (let i = 1; i < WIN_LENGTH; i++) {
            const nx = x + i * dir.dx;
            const ny = y + i * dir.dy;
            if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && caroGameState.board[nx][ny] === player) {
                line.push({ x: nx, y: ny, player });
            } else {
                break;
            }
        }
        
        for (let i = 1; i < WIN_LENGTH; i++) {
            const nx = x - i * dir.dx;
            const ny = y - i * dir.dy;
            if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && caroGameState.board[nx][ny] === player) {
                line.unshift({ x: nx, y: ny, player });
            } else {
                break;
            }
        }
        
        if (line.length >= WIN_LENGTH) {
            return line.slice(0, WIN_LENGTH);
        }
    }
    
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

// AI Algorithm
function getAIMove() {
    const board = caroGameState.board;
    const emptyCells = getEmptyCells(board);
    
    if (emptyCells.length === 0) return null;
    
    switch (aiDifficulty) {
        case 'easy':
            return getEasyAIMove(emptyCells);
        case 'medium':
            return getMediumAIMove(board, emptyCells);
        case 'hard':
            return getHardAIMove(board, emptyCells);
        default:
            return getMediumAIMove(board, emptyCells);
    }
}

// Get empty cells
function getEmptyCells(board) {
    const empty = [];
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (board[row][col] === 0) {
                empty.push({ x: row, y: col });
            }
        }
    }
    return empty;
}

// Easy AI: Random move
function getEasyAIMove(emptyCells) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
}

// Medium AI: Basic strategy
function getMediumAIMove(board, emptyCells) {
    // 1. Try to win
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 2; // Try AI move
        if (checkCaroWinner(cell.x, cell.y)) {
            board[cell.x][cell.y] = 0; // Undo
            return cell;
        }
        board[cell.x][cell.y] = 0; // Undo
    }
    
    // 2. Block human from winning
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 1; // Try human move
        if (checkCaroWinner(cell.x, cell.y)) {
            board[cell.x][cell.y] = 0; // Undo
            return cell;
        }
        board[cell.x][cell.y] = 0; // Undo
    }
    
    // 3. Try to create 4 in a row
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 2;
        if (countConsecutive(board, cell.x, cell.y, 2) >= 4) {
            board[cell.x][cell.y] = 0;
            return cell;
        }
        board[cell.x][cell.y] = 0;
    }
    
    // 4. Block human from creating 4 in a row
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 1;
        if (countConsecutive(board, cell.x, cell.y, 1) >= 4) {
            board[cell.x][cell.y] = 0;
            return cell;
        }
        board[cell.x][cell.y] = 0;
    }
    
    // 5. Center preference
    const centerCells = emptyCells.filter(cell => {
        const distFromCenter = Math.abs(cell.x - 7) + Math.abs(cell.y - 7);
        return distFromCenter <= 3;
    });
    
    if (centerCells.length > 0) {
        return centerCells[Math.floor(Math.random() * centerCells.length)];
    }
    
    // 6. Random
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// Hard AI: Advanced strategy with minimax
function getHardAIMove(board, emptyCells) {
    // 1. Try to win
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 2;
        if (checkCaroWinner(cell.x, cell.y)) {
            board[cell.x][cell.y] = 0;
            return cell;
        }
        board[cell.x][cell.y] = 0;
    }
    
    // 2. Block human from winning
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 1;
        if (checkCaroWinner(cell.x, cell.y)) {
            board[cell.x][cell.y] = 0;
            return cell;
        }
        board[cell.x][cell.y] = 0;
    }
    
    // 3. Use minimax for best move
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const cell of emptyCells) {
        board[cell.x][cell.y] = 2;
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[cell.x][cell.y] = 0;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = cell;
        }
    }
    
    return bestMove || emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// Minimax algorithm with alpha-beta pruning
function minimax(board, depth, isMaximizing, alpha, beta) {
    if (depth >= 3) { // Limit depth for performance
        return evaluateBoard(board);
    }
    
    const emptyCells = getEmptyCells(board);
    
    if (emptyCells.length === 0) {
        return 0; // Draw
    }
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const cell of emptyCells) {
            board[cell.x][cell.y] = 2;
            const eval = minimax(board, depth + 1, false, alpha, beta);
            board[cell.x][cell.y] = 0;
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const cell of emptyCells) {
            board[cell.x][cell.y] = 1;
            const eval = minimax(board, depth + 1, true, alpha, beta);
            board[cell.x][cell.y] = 0;
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Evaluate board position
function evaluateBoard(board) {
    let score = 0;
    
    // Check all possible 5-in-a-row positions
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (board[row][col] !== 0) {
                const player = board[row][col];
                const consecutive = countConsecutive(board, row, col, player);
                
                if (consecutive >= 5) {
                    return player === 2 ? 10000 : -10000; // AI wins or human wins
                }
                
                // Score based on consecutive pieces
                const multiplier = player === 2 ? 1 : -1;
                score += multiplier * Math.pow(consecutive, 2);
            }
        }
    }
    
    return score;
}

// Count consecutive pieces in all directions
function countConsecutive(board, x, y, player) {
    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal \
        [1, -1]   // diagonal /
    ];
    
    let maxCount = 0;
    
    for (const [dx, dy] of directions) {
        let count = 1;
        
        // Count in positive direction
        for (let i = 1; i < 5; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[nx][ny] === player) {
                count++;
            } else {
                break;
            }
        }
        
        // Count in negative direction
        for (let i = 1; i < 5; i++) {
            const nx = x - i * dx;
            const ny = y - i * dy;
            if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[nx][ny] === player) {
                count++;
            } else {
                break;
            }
        }
        
        maxCount = Math.max(maxCount, count);
    }
    
    return maxCount;
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

    // Draw pieces with animation
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const piece = caroGameState.board[row][col];
            if (piece > 0) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                
                const placingAnim = caroAnimations.placing.find(anim => anim.x === col && anim.y === row);
                const winningAnim = caroAnimations.winning.find(anim => anim.x === col && anim.y === row);
                
                let scale = 1;
                let opacity = 1;
                let fillColor = piece === 1 ? '#ff6b6b' : '#4ecdc4';
                
                if (placingAnim) {
                    scale = Math.max(0.1, Math.min(2, placingAnim.scale));
                    opacity = Math.max(0.1, Math.min(1, placingAnim.opacity));
                } else if (winningAnim) {
                    scale = Math.max(0.1, Math.min(3, winningAnim.scale));
                    fillColor = winningAnim.color || fillColor;
                }
                
                ctx.save();
                ctx.globalAlpha = opacity;
                
                // Ensure radius is always positive
                const radius = Math.max(1, (cellSize / 2 - 5) * scale);
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw X or O
                ctx.fillStyle = '#fff';
                const fontSize = Math.max(8, (cellSize / 2) * scale);
                ctx.font = `${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(piece === 1 ? 'X' : 'O', x, y);
                
                ctx.restore();
            }
        }
    }
    
    // Draw winning line if game is over and there's a winner
    if (caroGameState && caroGameState.isGameOver && caroGameState.winner) {
        drawWinningLine();
    }
}

// Draw winning line
function drawWinningLine() {
    if (!caroGameState || !caroGameState.winner) return;
    
    // Use stored winning line if available
    let winningLine = caroGameState.winningLine;
    
    // If no stored winning line, find it manually
    if (!winningLine) {
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (caroGameState.board[row][col] === caroGameState.winner) {
                    const line = getWinningLine(row, col);
                    if (line && line.length >= 5) {
                        winningLine = line;
                        break;
                    }
                }
            }
            if (winningLine) break;
        }
    }
    
    if (!winningLine) return;
    
    const canvas = document.getElementById('caroCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const cellSize = 40;
    
    // Draw winning line
    ctx.save();
    ctx.strokeStyle = '#ffd700'; // Gold color for winning line
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 10;
    
    const startX = winningLine[0].y * cellSize + cellSize / 2;
    const startY = winningLine[0].x * cellSize + cellSize / 2;
    const endX = winningLine[winningLine.length - 1].y * cellSize + cellSize / 2;
    const endY = winningLine[winningLine.length - 1].x * cellSize + cellSize / 2;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore();
}

// Update display
function updateCaroDisplay() {
    if (!caroGameState) return;

    const statusElement = document.getElementById('caroStatus');

    if (statusElement) {
        if (caroGameState.isGameOver) {
            if (caroGameState.winner) {
                if (isAIMode) {
                    statusElement.textContent = caroGameState.winner === 1 ? 
                        'Bạn thắng! 🎉' : 'AI thắng! 🤖';
                } else if (isOnlineMode && currentPlayerSymbol) {
                    // Online mode: winner is user ID, need to check if it's current user
                    const isCurrentUserWinner = caroGameState.winner === getCurrentUserId();
                    const winnerSymbol = isCurrentUserWinner ? currentPlayerSymbol : (currentPlayerSymbol === 'X' ? 'O' : 'X');
                    const winnerText = isCurrentUserWinner ? `Bạn (${winnerSymbol}) thắng! 🎉` : `Đối thủ (${winnerSymbol}) thắng! 😭`;
                    
                    console.log('🏆 [FRONTEND] Game Over - Winner Check:', {
                        backendWinnerId: caroGameState.winner,
                        currentUserId: getCurrentUserId(),
                        isCurrentUserWinner,
                        currentPlayerSymbol,
                        winnerSymbol,
                        winnerText
                    });
                    
                    statusElement.textContent = winnerText;
                } else {
                    statusElement.textContent = `Người chơi ${caroGameState.winner === 1 ? 'X' : 'O'} thắng!`;
                }
            } else {
                statusElement.textContent = 'Hòa!';
            }
        } else {
            if (isAIMode) {
                if (caroGameState.currentPlayer === 1) {
                    statusElement.textContent = 'Lượt của bạn (X)';
                } else {
                    statusElement.textContent = 'AI đang suy nghĩ... 🤖';
                }
            } else if (isOnlineMode && currentPlayerSymbol) {
                const currentSymbol = caroGameState.currentPlayer === 1 ? 'X' : 'O';
                const isMyTurn = (currentPlayerSymbol === 'X' && caroGameState.currentPlayer === 1) || 
                                (currentPlayerSymbol === 'O' && caroGameState.currentPlayer === 2);
                
                if (isMyTurn) {
                    statusElement.textContent = `🎯 Lượt của bạn (${currentPlayerSymbol})`;
                } else {
                    statusElement.textContent = `⏳ Lượt của đối thủ (${currentSymbol})`;
                }
            } else {
                const currentSymbol = caroGameState.currentPlayer === 1 ? 'X' : 'O';
                statusElement.textContent = `Lượt của người chơi ${currentSymbol}`;
            }
        }
    }
}

// Canvas hover handler
function handleCaroCanvasHover(event) {
    if (!caroGameState || caroGameState.isGameOver) return;
    
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const cellSize = 40;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
        canvas.style.cursor = caroGameState.board[row][col] === 0 ? 'pointer' : 'not-allowed';
    } else {
        canvas.style.cursor = 'default';
    }
}

// Canvas click handler
function handleCaroCanvasClick(event) {
    if (!caroGameState || caroGameState.isGameOver) return;

    // Check if it's player's turn in online mode
    if (isOnlineMode && currentPlayerSymbol) {
      const expectedPlayer = currentPlayerSymbol === 'X' ? 1 : 2;
      const isMyTurn = caroGameState.currentPlayer === expectedPlayer;
      
      console.log('🎯 Turn check:', {
        currentPlayerSymbol,
        expectedPlayer,
        currentPlayer: caroGameState.currentPlayer,
        isMyTurn,
        isGameOver: caroGameState.isGameOver,
        gameId: currentCaroGameId,
        lastTurnChange: caroGameState.lastTurnChange,
        timeSinceChange: caroGameState.lastTurnChange ? Date.now() - caroGameState.lastTurnChange : 'N/A'
      });
      
      if (!isMyTurn) {
        console.log('❌ Not your turn, skipping move');
        return;
      }
      
      // Additional check: if we're in move cooldown, wait
      if (caroGameState.moveCooldown && Date.now() < caroGameState.moveCooldown) {
        console.log('⏳ Move cooldown active, waiting:', {
          moveCooldown: caroGameState.moveCooldown,
          timeUntilReady: caroGameState.moveCooldown - Date.now(),
          currentPlayer: caroGameState.currentPlayer,
          expectedPlayer
        });
        return;
      }
    }

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
        canvas.addEventListener('mousemove', handleCaroCanvasHover);
    }

    const newCaroGameBtn = document.getElementById('newCaroGameBtn');
    if (newCaroGameBtn) {
        newCaroGameBtn.addEventListener('click', () => {
            if (isOnlineMode) {
                // Online mode - show message that new game is not available
                showStatusDisplay('Chức năng tạo game mới không khả dụng trong chế độ online', 'ℹ️');
                setTimeout(() => hideStatusDisplay(), 3000);
            } else {
                // Local or AI mode - start new game
                initCaroGame(isAIMode ? 'ai' : 'local', aiDifficulty);
            }
        });
    }

    const playWithAIBtn = document.getElementById('playWithAIBtn');
    if (playWithAIBtn) {
        playWithAIBtn.addEventListener('click', () => {
            const difficulty = document.getElementById('aiDifficultySelect').value;
            initCaroGame('ai', difficulty);
        });
    }

    const playOnlineBtn = document.getElementById('playOnlineBtn');
    if (playOnlineBtn) {
        playOnlineBtn.addEventListener('click', () => {
            console.log('🎮 Play online button clicked');
            initCaroGame('online');
        });
    }

    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => {
            if (isOnlineMode && caroSocket) {
                // Leave room and disconnect
                caroSocket.emit('queue.leave');
                resetCaroGame();
            }
        });
    }
});

// Export functions
window.initCaroGame = initCaroGame;
window.makeCaroMove = makeCaroMove;
