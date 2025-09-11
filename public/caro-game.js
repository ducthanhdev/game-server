// Caro Game module
function initializeCaroGame() {
    const canvas = document.getElementById('caroCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let board = Array(15).fill().map(() => Array(15).fill(0));
    let currentPlayer = 1;
    let gameOver = false;
    let isAIMode = true; // Always AI mode
    let aiPlayer = 2; // AI plays as O (player 2)
    
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
        
        // In AI mode, only allow human player to click
        if (isAIMode && currentPlayer === aiPlayer) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cellSize = 40;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        
        if (row >= 0 && row < 15 && col >= 0 && col < 15 && board[row][col] === 0) {
            makeMove(row, col, currentPlayer);
        }
    });
    
    function makeMove(row, col, player) {
        board[row][col] = player;
        
        // Draw the board first to show the last move
        drawBoard();
        
        // Check for win
        if (checkWin(row, col, player)) {
            gameOver = true;
            const winner = player === 1 ? 'X' : 'O';
            const winnerColor = player === 1 ? 'Đỏ' : 'Xanh';
            const winnerName = (isAIMode && player === aiPlayer) ? 'Máy' : 'Bạn';
            showSuccess(`🎉 ${winnerName} (${winner}) đã thắng!`);
            document.getElementById('caroStatus').textContent = `🎉 ${winnerName} (${winner}) thắng!`;
            
            // Highlight winning line after a short delay
            setTimeout(() => {
                highlightWinningLine(row, col, player);
            }, 100);
            return;
        }
        
        // Check for draw
        if (isBoardFull()) {
            gameOver = true;
            showWarning('🤝 Hòa! Bàn cờ đã đầy.');
            document.getElementById('caroStatus').textContent = '🤝 Hòa!';
            return;
        }
        
        // Switch player
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        
        // Update status - Always AI mode
        if (currentPlayer === aiPlayer) {
            document.getElementById('caroStatus').textContent = '🤖 Lượt của máy...';
            // AI makes move after a short delay
            setTimeout(() => {
                if (!gameOver) {
                    makeAIMove();
                }
            }, 500);
        } else {
            document.getElementById('caroStatus').textContent = '👤 Lượt của bạn (X)';
        }
    }
    
    // AI move logic
    function makeAIMove() {
        if (gameOver) return;
        
        const move = getBestMove();
        if (move) {
            makeMove(move.row, move.col, aiPlayer);
        }
    }
    
    function getBestMove() {
        // First, check if AI can win in one move
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = aiPlayer;
                    if (checkWin(i, j, aiPlayer)) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Second, check if human can win in one move (block them)
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = 1; // Human player
                    if (checkWin(i, j, 1)) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Third, try to create a threat (4 in a row)
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = aiPlayer;
                    if (countConsecutive(i, j, aiPlayer) >= 4) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Fourth, try to block human's 3 in a row
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = 1; // Human player
                    if (countConsecutive(i, j, 1) >= 3) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Fifth, try to create 3 in a row
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = aiPlayer;
                    if (countConsecutive(i, j, aiPlayer) >= 3) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Sixth, try to block human's 2 in a row
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = 1; // Human player
                    if (countConsecutive(i, j, 1) >= 2) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Seventh, try to create 2 in a row
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    board[i][j] = aiPlayer;
                    if (countConsecutive(i, j, aiPlayer) >= 2) {
                        board[i][j] = 0; // Reset
                        return { row: i, col: j };
                    }
                    board[i][j] = 0; // Reset
                }
            }
        }
        
        // Finally, play near existing pieces or center
        const center = 7;
        const moves = [];
        
        // Add center if available
        if (board[center][center] === 0) {
            moves.push({ row: center, col: center, score: 100 });
        }
        
        // Add moves near existing pieces
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] !== 0) {
                    for (let di = -2; di <= 2; di++) {
                        for (let dj = -2; dj <= 2; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < 15 && nj >= 0 && nj < 15 && board[ni][nj] === 0) {
                                const distance = Math.abs(ni - center) + Math.abs(nj - center);
                                moves.push({ row: ni, col: nj, score: 50 - distance });
                            }
                        }
                    }
                }
            }
        }
        
        if (moves.length > 0) {
            moves.sort((a, b) => b.score - a.score);
            return moves[0];
        }
        
        // Fallback: random move
        const emptyCells = [];
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        
        return null;
    }
    
    function countConsecutive(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        let maxCount = 0;
        
        for (const [dr, dc] of directions) {
            let count = 1;
            
            // Check in positive direction
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                r += dr;
                c += dc;
            }
            
            // Check in negative direction
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                r -= dr;
                c -= dc;
            }
            
            maxCount = Math.max(maxCount, count);
        }
        
        return maxCount;
    }
    
    // Check if a player has won
    function checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1; // Count the current piece
            
            // Check in positive direction
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                r += dr;
                c += dc;
            }
            
            // Check in negative direction
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                r -= dr;
                c -= dc;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check if board is full (draw)
    function isBoardFull() {
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (board[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Highlight the winning line
    function highlightWinningLine(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            let winningCells = [[row, col]];
            
            // Check in positive direction
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                winningCells.push([r, c]);
                r += dr;
                c += dc;
            }
            
            // Check in negative direction
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
                count++;
                winningCells.unshift([r, c]);
                r -= dr;
                c -= dc;
            }
            
            if (count >= 5) {
                // Draw highlight for winning line
                const cellSize = 40;
                
                // Draw a thicker background line
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.beginPath();
                
                for (let i = 0; i < Math.min(5, winningCells.length); i++) {
                    const [r, c] = winningCells[i];
                    const x = c * cellSize + cellSize / 2;
                    const y = r * cellSize + cellSize / 2;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
                
                // Draw a thinner bright line on top
                ctx.strokeStyle = '#FFFF00';
                ctx.lineWidth = 4;
                ctx.beginPath();
                
                for (let i = 0; i < Math.min(5, winningCells.length); i++) {
                    const [r, c] = winningCells[i];
                    const x = c * cellSize + cellSize / 2;
                    const y = r * cellSize + cellSize / 2;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
                break;
            }
        }
    }
    
    // Game controls - Removed offline and custom room features
    
    // New game button - Always starts with AI mode
    document.getElementById('newCaroGameBtn').addEventListener('click', () => {
        // Reset game state
        board = Array(15).fill().map(() => Array(15).fill(0));
        currentPlayer = 1;
        gameOver = false;
        isAIMode = true; // Always AI mode
        
        // Redraw board
        drawBoard();
        document.getElementById('caroStatus').textContent = '👤 Lượt của bạn (X)';
        
        showSuccess('🎮 Game mới đã bắt đầu! Bạn là X, máy là O');
    });
    
    // Play with AI button
    document.getElementById('playWithAIBtn').addEventListener('click', () => {
        // Reset game state
        board = Array(15).fill().map(() => Array(15).fill(0));
        currentPlayer = 1;
        gameOver = false;
        isAIMode = true;
        
        // Redraw board
        drawBoard();
        document.getElementById('caroStatus').textContent = '👤 Lượt của bạn (X)';
        
        showSuccess('🤖 Chế độ chơi với máy đã bắt đầu! Bạn là X, máy là O');
    });
    
    drawBoard();
    document.getElementById('caroStatus').textContent = '👤 Lượt của bạn (X)';
}

// Export function
window.initializeCaroGame = initializeCaroGame;
