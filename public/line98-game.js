// Line98 Game module
function initializeLine98Game() {
    const canvas = document.getElementById('line98Canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Game constants
    const ROWS = 9, COLS = 9, K = 7, LINE = 5, SPAWN = 3;
    
    // Game state - Initialize immediately and verify
    let board = [];
    for (let i = 0; i < ROWS; i++) {
        board[i] = [];
        for (let j = 0; j < COLS; j++) {
            board[i][j] = 0;
        }
    }
    let score = 0;
    let selectedBall = null;
    let isGameOver = false;
    let nextBalls = [];
    let usePreview = true;
    
    console.log('Board initialized:', board);
    console.log('Board length:', board.length, 'First row length:', board[0]?.length);
    
    // Animation state
    let animatingCells = new Set();
    let appearingCells = new Set();
    let sparkleEffects = [];
    let movingBall = null;
    let pathPreview = [];
    let animationFrame = 0;
    
    // Initialize board function - moved up for hoisting
    function initBoard() {
        console.log('initBoard called, board:', board);
        console.log('ROWS:', ROWS, 'COLS:', COLS);
        
        // Ensure board is properly initialized
        if (!board || !Array.isArray(board) || board.length !== ROWS) {
            console.log('Reinitializing board...');
            board = [];
            for (let i = 0; i < ROWS; i++) {
                board[i] = [];
                for (let j = 0; j < COLS; j++) {
                    board[i][j] = 0;
                }
            }
        }
        
        // Clear board
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                board[i][j] = 0;
            }
        }
        
        console.log('Board cleared, spawning balls...');
        
        // Spawn initial balls (5-7 balls)
        const initialCount = 5 + randInt(3);
        console.log('Spawning', initialCount, 'balls');
        spawnRandomBalls(board, initialCount);
        
        console.log('Board after spawning:', board);
        
        // Remove any initial lines
        const initialLines = collectAllLines(board);
        if (initialLines.length > 0) {
            for (const [r, c] of initialLines) board[r][c] = 0; // clear instantly
        }
        
        // Generate next balls for preview
        if (usePreview) {
            nextBalls = Array(SPAWN).fill().map(() => randomColor());
        }
        
        selectedBall = null;
        isGameOver = false;
        score = 0;
        
        drawBoard();
    }
    
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
        const newCells = [];

        for (let i = 0; i < count && empties.length > 0; i++) {
            const idx = randInt(empties.length);
            const [r, c] = empties[idx];
            const col = colors ? colors[i] : randomColor();
            board[r][c] = col;
            newCells.push([r, c]);
            empties.splice(idx, 1);
            placed++;
        }
        
        // Animate appearance of new balls
        if (newCells.length > 0) {
            animateAppearance(newCells);
        }
        
        return placed;
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
    
    // Remove cells from board with animation
    function removeCells(board, cells) {
        // Add cells to animation set
        for (const [r, c] of cells) {
            animatingCells.add(`${r},${c}`);
        }
        
        // Add sparkle effects
        for (const [r, c] of cells) {
            const cellSize = 50;
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;
            sparkleEffects.push({
                x, y, 
                life: 1.0,
                maxLife: 1.0,
                angle: Math.random() * Math.PI * 2,
                speed: 2 + Math.random() * 3
            });
        }
        
        // Start animation
        animateRemoval(() => {
            // Actually remove cells after animation
            for (const [r, c] of cells) {
                board[r][c] = 0;
            }
            animatingCells.clear();
            drawBoard();
        });
    }
    
    // Animate cell removal
    function animateRemoval(callback) {
        const duration = 300; // 300ms animation
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update animation frame
            animationFrame = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        }
        
        animate();
    }
    
    // Animate cell appearance
    function animateAppearance(cells) {
        for (const [r, c] of cells) {
            appearingCells.add(`${r},${c}`);
        }
        
        const duration = 200; // 200ms animation
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            animationFrame = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                appearingCells.clear();
            }
        }
        
        animate();
    }
    
    // Animate ball movement
    function animateBallMovement(fromRow, fromCol, toRow, toCol, colorIndex, callback) {
        const cellSize = 50;
        const startX = fromCol * cellSize + cellSize / 2;
        const startY = fromRow * cellSize + cellSize / 2;
        const endX = toCol * cellSize + cellSize / 2;
        const endY = toRow * cellSize + cellSize / 2;
        
        movingBall = {
            x: startX,
            y: startY,
            targetX: endX,
            targetY: endY,
            colorIndex: colorIndex,
            startX: startX,
            startY: startY,
            progress: 0
        };
        
        const duration = 300; // 300ms animation
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            
            movingBall.x = startX + (endX - startX) * easeProgress;
            movingBall.y = startY + (endY - startY) * easeProgress;
            movingBall.progress = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                movingBall = null;
                if (callback) callback();
            }
        }
        
        animate();
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
                    // Don't draw ball if it's currently moving from this position
                    if (!movingBall || movingBall.startX !== j * cellSize + cellSize / 2 || movingBall.startY !== i * cellSize + cellSize / 2) {
                        drawBall(j * cellSize, i * cellSize, cellSize, board[i][j], i, j);
                    }
                }
            }
        }
        
        // Draw moving ball
        if (movingBall) {
            drawMovingBall(movingBall);
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
        
        // Draw path preview
        drawPathPreview();
        
        // Draw sparkle effects
        drawSparkleEffects();
        
        // Continue animation if needed
        if (animatingCells.size > 0 || appearingCells.size > 0 || sparkleEffects.length > 0 || movingBall) {
            requestAnimationFrame(drawBoard);
        }
    }
    
    function drawSparkleEffects() {
        for (let i = sparkleEffects.length - 1; i >= 0; i--) {
            const sparkle = sparkleEffects[i];
            sparkle.life -= 0.05;
            
            if (sparkle.life <= 0) {
                sparkleEffects.splice(i, 1);
                continue;
            }
            
            const alpha = sparkle.life / sparkle.maxLife;
            const size = 3 + (1 - alpha) * 5;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, size, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add some sparkle lines
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sparkle.x - size, sparkle.y);
            ctx.lineTo(sparkle.x + size, sparkle.y);
            ctx.moveTo(sparkle.x, sparkle.y - size);
            ctx.lineTo(sparkle.x, sparkle.y + size);
            ctx.stroke();
            
            // Update position
            sparkle.x += Math.cos(sparkle.angle) * sparkle.speed;
            sparkle.y += Math.sin(sparkle.angle) * sparkle.speed;
        }
        
        ctx.globalAlpha = 1;
    }
    
    function drawMovingBall(movingBall) {
        const cellSize = 50;
        const baseRadius = 18;
        const color = colors[movingBall.colorIndex - 1];
        
        // Add slight scale effect during movement
        const scale = 1 + Math.sin(movingBall.progress * Math.PI) * 0.1;
        const radius = baseRadius * scale;
        
        // Add trail effect
        const trailAlpha = 0.3;
        const trailRadius = radius * 0.7;
        
        // Draw trail
        ctx.globalAlpha = trailAlpha;
        ctx.fillStyle = color.main;
        ctx.beginPath();
        ctx.arc(movingBall.x, movingBall.y, trailRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Main ball with gradient
        ctx.globalAlpha = 1;
        const gradient = ctx.createRadialGradient(
            movingBall.x - radius/3, movingBall.y - radius/3, 0,
            movingBall.x, movingBall.y, radius
        );
        gradient.addColorStop(0, color.light);
        gradient.addColorStop(0.7, color.main);
        gradient.addColorStop(1, color.dark);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(movingBall.x, movingBall.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Enhanced highlight for moving ball
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(movingBall.x - radius/3, movingBall.y - radius/3, radius/3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Glowing border
        ctx.strokeStyle = color.light;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Additional glow effect
        ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    function drawPathPreview() {
        if (pathPreview.length < 2) return;
        
        const cellSize = 50;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        
        ctx.beginPath();
        for (let i = 0; i < pathPreview.length; i++) {
            const [r, c] = pathPreview[i];
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw dots at each path point
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        for (let i = 0; i < pathPreview.length; i++) {
            const [r, c] = pathPreview[i];
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.setLineDash([]);
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
        const baseRadius = 18;
        const color = colors[colorIndex - 1];
        
        // Check if this cell is animating
        const cellKey = `${row},${col}`;
        const isAnimating = animatingCells.has(cellKey);
        const isAppearing = appearingCells.has(cellKey);
        
        let radius = baseRadius;
        let alpha = 1;
        
        if (isAnimating) {
            // Fade out and shrink for removal
            alpha = 1 - animationFrame;
            radius = baseRadius * (1 - animationFrame * 0.5);
        } else if (isAppearing) {
            // Scale up and fade in for appearance
            alpha = animationFrame;
            radius = baseRadius * animationFrame;
        }
        
        // Apply alpha
        ctx.globalAlpha = alpha;
        
        // Shadow (only if not too transparent)
        if (alpha > 0.3) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * alpha})`;
            ctx.beginPath();
            ctx.arc(centerX + 2, centerY + 2, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
        
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
        
        // Highlight (only if not too transparent)
        if (alpha > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * alpha})`;
            ctx.beginPath();
            ctx.arc(centerX - radius/3, centerY - radius/3, radius/3, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Border
        ctx.strokeStyle = color.dark;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Reset alpha
        ctx.globalAlpha = 1;
    }
    
    // Main game move logic
    function doMove(board, sr, sc, tr, tc) {
        if (board[sr][sc] === 0 || board[tr][tc] !== 0) return false;

        const path = bfsPath(board, [sr, sc], [tr, tc]);
        if (!path) return false;

        const col = board[sr][sc];
        board[sr][sc] = 0;
        
        // Animate ball movement
        animateBallMovement(sr, sc, tr, tc, col, () => {
            // Place ball at destination after animation
            board[tr][tc] = col;
            
            // Check and remove lines after move
            const rm1 = collectLineCellsAt(board, tr, tc);
            if (rm1.length > 0) {
                removeCells(board, rm1);
                score += rm1.length;
                updateScore();
                return; // Don't spawn new balls
            }

            // Spawn 3 new balls
            if (usePreview && nextBalls.length > 0) {
                spawnRandomBalls(board, SPAWN, nextBalls);
                nextBalls = Array(SPAWN).fill().map(() => randomColor());
            } else {
                spawnRandomBalls(board, SPAWN);
            }

            // Check and remove lines after spawning (with delay for animation)
            setTimeout(() => {
                const rm2 = collectAllLines(board);
                if (rm2.length > 0) {
                    removeCells(board, rm2);
                    score += rm2.length;
                    updateScore();
                }
                
                // Check game over after spawning new balls
                checkGameOver();
            }, 250); // Wait for appearance animation to complete
        });

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
                    pathPreview = [];
                } else if (board[row][col] > 0) {
                    // Clicked different ball - select new one
                    selectedBall = { row, col };
                    pathPreview = [];
                } else {
                    // Clicked empty cell - show path preview and try to move
                    const path = bfsPath(board, [sr, sc], [row, col]);
                    if (path) {
                        pathPreview = [[sr, sc], ...path];
                        drawBoard();
                        
                        // Move after a short delay to show path
                        setTimeout(() => {
                            const success = doMove(board, sr, sc, row, col);
                            if (success) {
                                selectedBall = null;
                                pathPreview = [];
                                updateScore();
                                
                                // Check game over
                                if (emptyCells(board).length === 0) {
                                    isGameOver = true;
                                    showSuccess(`🎮 Game Over! Điểm cuối: ${score}`);
                                } else {
                                    // Check if there are any valid moves left
                                    checkGameOver();
                                }
                            } else {
                                pathPreview = [];
                                showError('Không thể di chuyển đến vị trí này!');
                            }
                            drawBoard();
                        }, 500); // Show path for 500ms
                    } else {
                        showError('Không có đường đi đến vị trí này!');
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
                    // Check all empty cells, not just adjacent ones
                    for (let nr = 0; nr < ROWS; nr++) {
                        for (let nc = 0; nc < COLS; nc++) {
                            if (board[nr][nc] === 0) {
                                const path = bfsPath(board, [r, c], [nr, nc]);
                                if (path) {
                                    validMoves.push({from: [r, c], to: [nr, nc]});
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return validMoves;
    }
    
    // Check if game is over (no valid moves available)
    function checkGameOver() {
        if (isGameOver) return; // Already game over
        
        // Check if there are any valid moves left
        const validMoves = findValidMoves();
        
        if (validMoves.length === 0) {
            isGameOver = true;
            showSuccess(`🎮 Game Over! Điểm cuối: ${score}`);
            console.log('🎮 Game Over - No valid moves available');
        }
    }
    
    function updateScore() {
        const scoreElement = document.getElementById('score');
        const statusElement = document.getElementById('gameStatus');
        
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        if (statusElement) {
            statusElement.textContent = `Điểm: ${score}`;
        }
    }
    
    // Initialize button event listeners
    initializeLine98Buttons();
    
    // Try to load saved game first, otherwise start new game
    const savedData = localStorage.getItem('line98_save');
    if (savedData) {
        try {
            const gameData = JSON.parse(savedData);
            if (gameData.board && gameData.score !== undefined) {
                board = gameData.board;
                score = gameData.score;
                nextBalls = gameData.nextBalls || [];
                selectedBall = null;
                pathPreview = [];
                isGameOver = false;
                
                updateScore();
                drawBoard();
                showSuccess('🎮 Đã tải game đã lưu!');
            } else {
                initBoard();
                updateScore();
            }
        } catch (error) {
            console.warn('Error loading saved game:', error);
            initBoard();
            updateScore();
        }
    } else {
        initBoard();
        updateScore();
    }
    
    // Initialize button event listeners inside the game scope
    function initializeLine98Buttons() {
        // Remove existing listeners first
        const newGameBtn = document.getElementById('newGameBtn');
        const hintBtn = document.getElementById('hintBtn');
        const saveGameBtn = document.getElementById('saveGameBtn');
        
        if (newGameBtn) {
            newGameBtn.replaceWith(newGameBtn.cloneNode(true));
            const newNewGameBtn = document.getElementById('newGameBtn');
            
            newNewGameBtn.addEventListener('click', () => {
                // Show confirmation toast instead of alert
                showWarning('🎮 Bạn có chắc muốn bắt đầu game mới? Game hiện tại sẽ bị mất!');
                
                // Create confirmation buttons
                const confirmToast = document.createElement('div');
                confirmToast.className = 'toast warning';
                confirmToast.innerHTML = `
                    <div class="toast-header">
                        <div style="display: flex; align-items: center;">
                            <span class="toast-icon">⚠️</span>
                            <span>Xác nhận</span>
                        </div>
                    </div>
                    <div class="toast-body">
                        <p>Bạn có chắc muốn bắt đầu game mới? Game hiện tại sẽ bị mất!</p>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="confirmNewGame()" style="background: #51cf66; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Có</button>
                            <button onclick="closeToast(this)" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Không</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('toastContainer').appendChild(confirmToast);
                
                // Auto remove after 10 seconds
                setTimeout(() => {
                    if (confirmToast.parentNode) {
                        confirmToast.parentNode.removeChild(confirmToast);
                    }
                }, 10000);
            });
        }
        
        // Global function for confirming new game
        window.confirmNewGame = function() {
            // Close confirmation toast
            const toasts = document.querySelectorAll('.toast');
            toasts.forEach(toast => {
                if (toast.querySelector('button[onclick="confirmNewGame()"]')) {
                    closeToast(toast.querySelector('.toast-close') || toast.querySelector('button[onclick="closeToast(this)"]'));
                }
            });
            
            // Proceed with new game
            if (true) { // Always proceed since user clicked "Có"
                // Clear saved games
                localStorage.removeItem('line98_save');
                localStorage.removeItem('line98_autosave');
                
                // Reset game state
                selectedBall = null;
                pathPreview = [];
                isGameOver = false;
                score = 0;
                nextBalls = [];
                animatingCells.clear();
                appearingCells.clear();
                sparkleEffects = [];
                movingBall = null;
                animationFrame = 0;

                // Clear the board
                for (let i = 0; i < ROWS; i++) {
                    for (let j = 0; j < COLS; j++) {
                        board[i][j] = 0;
                    }
                }

                // Initialize new game
                initBoard();
                updateScore();
                drawBoard();

                showSuccess('🎮 Game mới đã bắt đầu!');
            }
        };
        
        if (hintBtn) {
            hintBtn.replaceWith(hintBtn.cloneNode(true));
            const newHintBtn = document.getElementById('hintBtn');
            
            newHintBtn.addEventListener('click', () => {
                if (isGameOver) {
                    showError('❌ Game đã kết thúc!');
                    return;
                }
                
                // Simple hint: find first valid move
                const validMoves = findValidMoves();
                if (validMoves.length > 0) {
                    const move = validMoves[0];
                    const [fr, fc] = move.from;
                    const [tr, tc] = move.to;
                    
                    showSuccess(`💡 Gợi ý: Di chuyển từ (${fr+1}, ${fc+1}) đến (${tr+1}, ${tc+1})`);
                    
                    // Highlight the move
                    selectedBall = { row: fr, col: fc };
                    pathPreview = [[fr, fc], [tr, tc]];
                    drawBoard();
                    
                    setTimeout(() => {
                        selectedBall = null;
                        pathPreview = [];
                        drawBoard();
                    }, 3000);
                } else {
                    showError('❌ Không tìm thấy nước đi hợp lệ!');
                    checkGameOver();
                }
            });
        }
        
        if (saveGameBtn) {
            saveGameBtn.replaceWith(saveGameBtn.cloneNode(true));
            const newSaveGameBtn = document.getElementById('saveGameBtn');
            
            newSaveGameBtn.addEventListener('click', () => {
                if (isGameOver) {
                    showError('❌ Không thể lưu game đã kết thúc!');
                    return;
                }
                
                try {
                    const gameData = {
                        board: board,
                        score: score,
                        nextBalls: nextBalls,
                        timestamp: new Date().toISOString()
                    };
                    
                    localStorage.setItem('line98_save', JSON.stringify(gameData));
                    showSuccess('💾 Game đã được lưu thành công!');
                } catch (error) {
                    showError('❌ Lỗi khi lưu game: ' + error.message);
                }
            });
        }
    }
}

// Export function
window.initializeLine98Game = initializeLine98Game;
