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
        .then(response => {
            if (!response.ok) {
                console.log('Token validation failed:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(user => {
            currentUser = user;
            showGameSelection();
            initializeSocket();
        })
        .catch(error => {
            console.log('Token validation error:', error);
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

// Socket initialization - Disabled for now
function initializeSocket() {
    // Socket.IO disabled for now - using local game only
    console.log('Socket.IO disabled - using local game only');
    socket = null;
}

// Game functions

function initializeLine98Game() {
    const canvas = document.getElementById('line98Canvas');
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
    
    // Load saved game
    function loadGame() {
        try {
            const savedData = localStorage.getItem('line98_save');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                if (gameData.board && gameData.score !== undefined) {
                    // Ensure variables are initialized
                    if (!board) {
                        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
                    }
                    
                    board = gameData.board;
                    score = gameData.score;
                    nextBalls = gameData.nextBalls || [];
                    selectedBall = null;
                    pathPreview = [];
                    isGameOver = false;
                    
                    updateScore();
                    drawBoard();
                    showSuccess('🎮 Game đã được tải lại!');
                    return true;
                } else {
                    showError('❌ Dữ liệu game không hợp lệ!');
                    return false;
                }
            } else {
                showError('❌ Không có game đã lưu!');
                return false;
            }
        } catch (error) {
            showError('❌ Lỗi khi tải game: ' + error.message);
            return false;
        }
    }
    
    // Auto-save function
    function autoSave() {
        if (!isGameOver) {
            try {
                const gameData = {
                    board: board,
                    score: score,
                    nextBalls: nextBalls,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('line98_autosave', JSON.stringify(gameData));
            } catch (error) {
                console.warn('Auto-save failed:', error);
            }
        }
    }
    
    // Auto-save every 30 seconds
    setInterval(autoSave, 30000);
    
    // Advanced hint system with accurate evaluation
    function findBestMove() {
        console.log('🔍 Finding best move...');
        let best = null;
        let scoringMoves = [];
        let totalMoves = 0;
        
        for (let sr = 0; sr < ROWS; sr++) {
            for (let sc = 0; sc < COLS; sc++) {
                const color = board[sr][sc];
                if (color === 0) continue;
                
                const targets = bfsReachableEmpties(board, sr, sc);
                
                for (const [tr, tc] of targets) {
                    totalMoves++;
                    const stats = evaluatePlacement(board, tr, tc, color, sr, sc);
                    let score = 0;
                    
                    // Priority 1: Immediate clear (≥5 balls) - MUCH higher weight
                    if (stats.immediateClearCount > 0) {
                        score += 10000 + stats.immediateClearCount * 100;
                        console.log(`🎯 SCORING MOVE: (${sr},${sc}) -> (${tr},${tc}) clears ${stats.immediateClearCount} balls!`);
                    }
                    
                    // Priority 2: Extend existing lines (HIGHEST priority for non-scoring moves)
                    score += stats.lineExtensionBonus || 0;
                    
                    // Priority 3: Build longer lines
                    score += 10 * stats.longestRun;
                    
                    // Priority 4: Open ends (better for future moves)
                    score += 5 * stats.openEnds;
                    
                    // Priority 5: Mobility (more empty cells nearby)
                    score += 2 * stats.mobility;
                    
                    // Priority 6: Color bonus (connecting existing lines)
                    score += 8 * stats.bonusByColor;
                    
                    // Penalty for breaking existing lines
                    score -= stats.lineBreakPenalty || 0;
                    
                    // Center bias (prefer moves closer to center)
                    score += centerBias(tr, tc);
                    
                    const candidate = {
                        from: [sr, sc],
                        to: [tr, tc],
                        score: score,
                        stats: stats,
                        path: bfsPath(board, [sr, sc], [tr, tc])
                    };
                    
                    if (stats.immediateClearCount > 0) scoringMoves.push(candidate);
                    
                    if (!best || better(candidate, best) === candidate) {
                        best = candidate;
                    }
                }
            }
        }
        
        console.log(`📊 Evaluated ${totalMoves} total moves, found ${scoringMoves.length} scoring moves`);
        
        if (scoringMoves.length > 0) {
            // If we have scoring moves, pick the best one
            best = scoringMoves.reduce((a, b) => better(a, b));
            console.log(`🏆 BEST SCORING MOVE: (${best.from[0]},${best.from[1]}) -> (${best.to[0]},${best.to[1]}) clears ${best.stats.immediateClearCount} balls!`);
        } else if (best) {
            console.log(`🏆 Best strategic move: (${best.from[0]},${best.from[1]}) -> (${best.to[0]},${best.to[1]}) score: ${Math.round(best.score)}`);
            console.log(`📈 Stats: run=${best.stats.longestRun}, open=${best.stats.openEnds}, mob=${best.stats.mobility}`);
        } else {
            console.log('❌ No valid moves found - GAME OVER!');
            // Check if game is truly over (no valid moves)
            checkGameOver();
        }
        
        return best;
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
    
    // Clone board for safe evaluation
    function cloneBoard(board) {
        return board.map(row => row.slice());
    }
    
    // Find all reachable empty cells using BFS
    function bfsReachableEmpties(board, sr, sc) {
        const q = [[sr, sc]];
        const visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
        visited[sr][sc] = true;
        const targets = [];
        const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
        
        while (q.length) {
            const [r, c] = q.shift();
            for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                if (visited[nr][nc]) continue;
                
                // Can only move through empty cells
                if (board[nr][nc] === 0) {
                    visited[nr][nc] = true;
                    q.push([nr, nc]);
                    targets.push([nr, nc]);
                }
            }
        }
        return targets;
    }
    
    // Evaluate placement by actually placing the ball and checking results
    function evaluatePlacement(board, tr, tc, color, fromR = -1, fromC = -1) {
        const temp = cloneBoard(board);
        if (fromR >= 0 && fromC >= 0) temp[fromR][fromC] = 0; // simulate move: remove source
        temp[tr][tc] = color;
        
        // Find REAL lines after placement using existing function
        const clearCells = collectLineCellsAt(temp, tr, tc);
        const immediateClearCount = clearCells.length;
        
        // Debug: Log if we found a scoring move (only for significant clears)
        if (immediateClearCount >= 5) {
            console.log(`🎯 BIG SCORE: Placing ${color} at (${tr},${tc}) clears ${immediateClearCount} balls!`);
        }
        
        // Calculate longest run and open ends on temp board
        const {maxLen, maxOpen} = evalLongestRunAndOpenEnds(temp, tr, tc, color);
        
        // Check for existing lines that this move can extend
        const existingLines = findExistingLines(board, color);
        const lineExtensionBonus = calculateLineExtensionBonus(board, tr, tc, color, existingLines);
        
        // Check if this move would break an existing line (penalty)
        let lineBreakPenalty = 0;
        if (fromR >= 0 && fromC >= 0) {
            lineBreakPenalty = calculateLineBreakPenalty(board, fromR, fromC, tr, tc, color);
        }
        
        // Mobility: number of empty cells in 4 directions after placement
        const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
        let mobility = 0;
        for (const [dr, dc] of dirs) {
            const nr = tr + dr, nc = tc + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && temp[nr][nc] === 0) {
                mobility++;
            }
        }
        
        // Color bonus: reward for connecting existing lines
        const bonusByColor = (maxLen >= 4 ? 2 : (maxLen === 3 ? 1 : 0));
        
        return {
            immediateClearCount,
            longestRun: maxLen,
            openEnds: maxOpen,
            mobility,
            bonusByColor,
            lineExtensionBonus,
            lineBreakPenalty
        };
    }
    
    // Find existing lines of the same color on the board
    function findExistingLines(board, color) {
        const lines = [];
        const visited = new Set();
        
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === color && !visited.has(`${r},${c}`)) {
                    const line = findLineAtPosition(board, r, c, color);
                    if (line.length >= 2) { // Only consider lines of 2+ balls
                        lines.push(line);
                        for (const [lr, lc] of line) {
                            visited.add(`${lr},${lc}`);
                        }
                    }
                }
            }
        }
        
        // Sort lines by length (longer lines first)
        lines.sort((a, b) => b.length - a.length);
        
        return lines;
    }
    
    // Find line starting from a specific position
    function findLineAtPosition(board, r, c, color) {
        const dirs = [[0,1], [1,0], [1,1], [1,-1]];
        let bestLine = [[r, c]];
        
        for (const [dr, dc] of dirs) {
            const line = [[r, c]];
            
            // Forward direction
            let rr = r + dr, cc = c + dc;
            while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === color) {
                line.push([rr, cc]);
                rr += dr; cc += dc;
            }
            
            // Backward direction
            rr = r - dr; cc = c - dc;
            while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === color) {
                line.unshift([rr, cc]);
                rr -= dr; cc -= dc;
            }
            
            if (line.length > bestLine.length) {
                bestLine = line;
            }
        }
        
        // Only return lines that are actually connected (not just single balls)
        return bestLine.length >= 2 ? bestLine : [[r, c]];
    }
    
    // Calculate bonus for extending existing lines
    function calculateLineExtensionBonus(board, tr, tc, color, existingLines) {
        let bonus = 0;
        
        for (const line of existingLines) {
            if (line.length < 2) continue;
            
            // Check if this position can extend the line at either end
            const first = line[0];
            const last = line[line.length - 1];
            
            // Calculate direction of the line (exact integer direction)
            const dR = Math.sign(last[0] - first[0]); // -1, 0 hoặc 1
            const dC = Math.sign(last[1] - first[1]); // -1, 0 hoặc 1
            
            const end1 = [first[0] - dR, first[1] - dC];
            const end2 = [last[0] + dR, last[1] + dC];
            
            if ((tr === end1[0] && tc === end1[1]) || (tr === end2[0] && tc === end2[1])) {
                // This move extends the line
                bonus += line.length * 10; // Bigger bonus for longer lines
                console.log(`🔗 Extending line of ${line.length} balls at (${tr},${tc})`);
                break; // Only count the best extension
            }
        }
        
        return bonus;
    }
    
    // Check if moving a ball would break an existing line
    function wouldBreakExistingLine(board, fromR, fromC, toR, toC, color) {
        // Check if the source position is part of an existing line
        const existingLines = findExistingLines(board, color);
        
        for (const line of existingLines) {
            if (line.length < 2) continue;
            
            // Check if the source ball is part of this line
            const isPartOfLine = line.some(([r, c]) => r === fromR && c === fromC);
            
            if (isPartOfLine) {
                // This ball is part of an existing line, check if moving it would break it
                const remainingLine = line.filter(([r, c]) => !(r === fromR && c === fromC));
                
                if (remainingLine.length < 2) {
                    // Moving this ball would break the line completely
                    console.log(`⚠️ Moving ball from (${fromR},${fromC}) would break line of ${line.length} balls`);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Calculate penalty for breaking existing lines
    function calculateLineBreakPenalty(board, fromR, fromC, toR, toC, color) {
        let penalty = 0;
        
        // Check if moving this ball would break an existing line
        if (wouldBreakExistingLine(board, fromR, fromC, toR, toC, color)) {
            penalty = 1000; // Fixed heavy penalty for breaking existing lines
        }
        
        return penalty;
    }
    
    // Calculate longest run and open ends on temp board
    function evalLongestRunAndOpenEnds(board, r, c, color) {
        const dirs = [[0,1], [1,0], [1,1], [1,-1]];
        let maxLen = 1, maxOpen = 0;
        
        for (const [dr, dc] of dirs) {
            const cells = [[r, c]];
            
            // Forward direction
            let rr = r + dr, cc = c + dc;
            while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === color) {
                cells.push([rr, cc]);
                rr += dr; cc += dc;
            }
            const end1Open = (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === 0) ? 1 : 0;
            
            // Backward direction
            rr = r - dr; cc = c - dc;
            while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === color) {
                cells.push([rr, cc]);
                rr -= dr; cc -= dc;
            }
            const end2Open = (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === 0) ? 1 : 0;
            
            if (cells.length > maxLen) {
                maxLen = cells.length;
                maxOpen = end1Open + end2Open;
            } else if (cells.length === maxLen) {
                // Prefer more open ends
                const open = end1Open + end2Open;
                if (open > maxOpen) maxOpen = open;
            }
        }
        
        return {maxLen, maxOpen};
    }
    
    // Center bias: prefer moves closer to center
    function centerBias(tr, tc) {
        const cr = (ROWS - 1) / 2, cc = (COLS - 1) / 2;
        const dist = Math.abs(tr - cr) + Math.abs(tc - cc);
        return -dist * 0.1; // Penalty for being far from center
    }
    
    // Compare two moves and return the better one
    function better(a, b) {
        if (!a) return b;
        if (b.score !== a.score) return (b.score > a.score) ? b : a;
        
        // Tie-break rules - prioritize moves that clear balls
        if (b.stats.immediateClearCount !== a.stats.immediateClearCount)
            return (b.stats.immediateClearCount > a.stats.immediateClearCount) ? b : a;
        if (b.stats.longestRun !== a.stats.longestRun)
            return (b.stats.longestRun > a.stats.longestRun) ? b : a;
        if (b.stats.openEnds !== a.stats.openEnds)
            return (b.stats.openEnds > a.stats.openEnds) ? b : a;
        
        // Additional tie-break: prefer moves closer to center
        const centerBiasA = centerBias(a.to[0], a.to[1]);
        const centerBiasB = centerBias(b.to[0], b.to[1]);
        if (centerBiasB !== centerBiasA)
            return (centerBiasB > centerBiasA) ? b : a;
            
        return a;
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
    
    // Variables are already initialized above
    
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
                
                const bestMove = findBestMove();
                
                if (bestMove) {
                    const { from, to, path, score, stats } = bestMove;
                    const [fr, fc] = from;
                    const [tr, tc] = to;
                    
                    // Create detailed hint message
                    let hintMessage = `💡 Gợi ý: Di chuyển từ (${fr+1}, ${fc+1}) đến (${tr+1}, ${tc+1})`;
                    
                    if (stats.immediateClearCount > 0) {
                        hintMessage = `🎯 NƯỚC ĂN ĐIỂM: Di chuyển từ (${fr+1}, ${fc+1}) đến (${tr+1}, ${tc+1})`;
                        hintMessage += `\n🔥 Sẽ xóa ${stats.immediateClearCount} bóng ngay lập tức!`;
                        hintMessage += `\n💎 Điểm: +${stats.immediateClearCount}`;
                    } else {
                        if (stats.lineExtensionBonus > 0) {
                            hintMessage = `🔗 NỐI DÀI DÃY: Di chuyển từ (${fr+1}, ${fc+1}) đến (${tr+1}, ${tc+1})`;
                            hintMessage += `\n📏 Nối dài dãy có sẵn (+${stats.lineExtensionBonus} điểm)`;
                        } else if (stats.lineBreakPenalty > 0) {
                            hintMessage = `⚠️ NƯỚC TỐT: Di chuyển từ (${fr+1}, ${fc+1}) đến (${tr+1}, ${tc+1})`;
                            hintMessage += `\n📏 Tạo dãy ${stats.longestRun} bóng (${stats.openEnds} đầu mở)`;
                            hintMessage += `\n⚠️ Lưu ý: Có thể ảnh hưởng dãy hiện có`;
                        } else {
                            hintMessage += `\n📏 Tạo dãy ${stats.longestRun} bóng (${stats.openEnds} đầu mở)`;
                        }
                        hintMessage += `\n🔗 Cơ động: ${stats.mobility} ô trống lân cận`;
                        if (stats.bonusByColor > 0) {
                            hintMessage += `\n✨ Kết nối dãy có sẵn (+${stats.bonusByColor})`;
                        }
                        hintMessage += `\n📊 Điểm tiềm năng: ${Math.round(score)}`;
                    }
                    
                    showSuccess(hintMessage);
                    
                    // Set hint mode to show source ball, path, and target position
                    selectedBall = { row: fr, col: fc };
                    pathPreview = path;
                    
                    // Add target position to path preview for better visibility
                    if (pathPreview.length > 0) {
                        pathPreview.push([tr, tc]);
                    }
                    
                    drawBoard();
                    
                    setTimeout(() => {
                        selectedBall = null;
                        pathPreview = [];
                        drawBoard();
                    }, 5000); // Increased to 5 seconds for better reading
                } else {
                    showError('❌ Không tìm thấy nước đi hợp lệ!');
                    // Check if game is over
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
    
    
    // Initialize buttons
    initializeLine98Buttons();
    
}

function initializeCaroGame() {
    const canvas = document.getElementById('caroCanvas');
    const ctx = canvas.getContext('2d');
    let board = Array(15).fill().map(() => Array(15).fill(0));
    let currentPlayer = 1;
    let gameOver = false;
    let isAIMode = false;
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
        
        // Update status
        if (isAIMode) {
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
        } else {
            document.getElementById('caroStatus').textContent = 
                `Lượt chơi: ${currentPlayer === 1 ? 'X' : 'O'}`;
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
    
    // New game button
    document.getElementById('newCaroGameBtn').addEventListener('click', () => {
        // Reset game state
        board = Array(15).fill().map(() => Array(15).fill(0));
        currentPlayer = 1;
        gameOver = false;
        isAIMode = false;
        
        // Redraw board
        drawBoard();
        document.getElementById('caroStatus').textContent = 'Lượt chơi: X';
        
        showSuccess('🎮 Game mới đã bắt đầu!');
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
}

function updateGameDisplay() {
    if (gameState) {
        if (gameState.score !== undefined) {
            document.getElementById('score').textContent = gameState.score;
        }
    }
}

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const titles = {
        success: 'Thành công',
        error: 'Lỗi',
        warning: 'Cảnh báo',
        info: 'Thông tin'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <div style="display: flex; align-items: center;">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span>${titles[type] || titles.info}</span>
            </div>
            <button class="toast-close" onclick="closeToast(this)">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        closeToast(toast.querySelector('.toast-close'));
    }, duration);
}

function closeToast(button) {
    const toast = button.closest('.toast');
    if (toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

function showError(message) {
    showToast(message, 'error', 5000);
}

function showSuccess(message) {
    showToast(message, 'success', 4000);
}

function showWarning(message) {
    showToast(message, 'warning', 4000);
}

function showInfo(message) {
    showToast(message, 'info', 3000);
}
