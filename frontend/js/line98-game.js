let line98GameState = null;
let currentGameId = null;
let animations = {
    moving: null,
    spawning: [],
    clearing: [],
    invalidMove: null,
    pathPreview: [],
    pulseTime: 0
};

let lastFrameTime = 0;

// Ball Drawing Functions
function drawEnhancedBall(ctx, x, y, radius, colorIndex, options = {}) {
    const {
        scale = 1,
        opacity = 1,
        glow = false,
        pulse = false,
        pulseTime = 0
    } = options;
    
    const colors = [
        { primary: '#ff6b6b', secondary: '#ff5252', shadow: '#d32f2f' },
        { primary: '#4ecdc4', secondary: '#26a69a', shadow: '#00695c' },
        { primary: '#45b7d1', secondary: '#2196f3', shadow: '#1565c0' },
        { primary: '#96ceb4', secondary: '#66bb6a', shadow: '#2e7d32' },
        { primary: '#feca57', secondary: '#ffeb3b', shadow: '#f57f17' },
        { primary: '#ff9ff3', secondary: '#e91e63', shadow: '#ad1457' },
        { primary: '#54a0ff', secondary: '#3f51b5', shadow: '#1a237e' }
    ];
    
    const color = colors[colorIndex - 1] || colors[0];
    const finalRadius = radius * scale;
    
    let pulseScale = 1;
    if (pulse) {
        pulseScale = 1 + Math.sin(pulseTime * 0.008) * 0.1;
    }
    const actualRadius = finalRadius * pulseScale;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    if (glow) {
        ctx.shadowColor = color.primary;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, actualRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * opacity})`;
    ctx.fill();
    
    const gradient = ctx.createRadialGradient(
        x - actualRadius * 0.3, y - actualRadius * 0.3, 0,
        x, y, actualRadius
    );
    gradient.addColorStop(0, color.secondary);
    gradient.addColorStop(0.7, color.primary);
    gradient.addColorStop(1, color.shadow);
    
    ctx.beginPath();
    ctx.arc(x, y, actualRadius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    const highlightGradient = ctx.createRadialGradient(
        x - actualRadius * 0.4, y - actualRadius * 0.4, 0,
        x - actualRadius * 0.4, y - actualRadius * 0.4, actualRadius * 0.6
    );
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.6 * opacity})`);
    highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    
    ctx.beginPath();
    ctx.arc(x, y, actualRadius, 0, 2 * Math.PI);
    ctx.fillStyle = highlightGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x, y, actualRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 * opacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

// Animation Functions
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function startMoveAnimation(fromRow, fromCol, toRow, toCol) {
    animations.moving = {
        fromRow,
        fromCol,
        toRow,
        toCol,
        progress: 0,
        duration: 300
    };
}

function startSpawnAnimation(cells) {
    animations.spawning = cells.map(([row, col]) => ({
        row,
        col,
        scale: 0,
        opacity: 0,
        startTime: Date.now() + Math.random() * 200
    }));
}

function startClearAnimation(cells) {
    animations.clearing = cells.map(([row, col]) => ({
        row,
        col,
        scale: 1,
        opacity: 1,
        startTime: Date.now()
    }));
}

function startInvalidMoveAnimation(fromRow, fromCol, toRow, toCol) {
    try {
        animations.invalidMove = {
            row: fromRow,
            col: fromCol,
            shakeTime: 0,
            duration: 600
        };
        
        animations.pathPreview = [{
            row: toRow,
            col: toCol,
            opacity: 1,
            startTime: Date.now(),
            duration: 800,
            isError: true
        }];
    } catch (error) {
        console.error('Error in startInvalidMoveAnimation:', error);
    }
}

function updateAnimations(deltaTime) {
    const currentTime = Date.now();
    
    if (animations.moving) {
        animations.moving.progress += deltaTime / animations.moving.duration;
        if (animations.moving.progress >= 1) {
            animations.moving = null;
        }
    }
    
    if (animations.invalidMove) {
        animations.invalidMove.shakeTime += deltaTime;
        if (animations.invalidMove.shakeTime >= animations.invalidMove.duration) {
            animations.invalidMove = null;
        }
    }
    
    animations.pathPreview = animations.pathPreview.filter(anim => {
        const elapsed = currentTime - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        if (anim.isError) {
            anim.opacity = Math.max(0, 1 - progress);
        } else {
            anim.opacity = Math.sin(progress * Math.PI * 3) * 0.5 + 0.5;
        }
        
        return progress < 1;
    });
    
    animations.spawning = animations.spawning.filter(anim => {
        if (currentTime >= anim.startTime) {
            const elapsed = currentTime - anim.startTime;
            const progress = Math.min(elapsed / 400, 1);
            anim.scale = easeInOutCubic(progress);
            anim.opacity = progress;
            return progress < 1;
        }
        return true;
    });
    
    animations.clearing = animations.clearing.filter(anim => {
        const elapsed = currentTime - anim.startTime;
        const progress = Math.min(elapsed / 500, 1);
        anim.scale = 1 + progress * 0.5;
        anim.opacity = 1 - progress;
        return progress < 1;
    });
    
    animations.pulseTime += deltaTime;
}

// Game Management Functions
function clearLine98Game() {
    currentGameId = null;
    line98GameState = null;
}

async function initLine98Game(forceNew = false) {
    clearLine98Game();
    
    if (!forceNew) {
        try {
            const savedGame = await loadLatestLine98Game();
            if (savedGame) {
                currentGameId = savedGame._id;
                line98GameState = savedGame.gameState;
                renderLine98Board();
                updateLine98Display();
                showToast('Đã tải game đã lưu!', 'success');
                return;
            }
        } catch (error) {
        }
    }
    try {
        const response = await fetch(`${window.API_BASE_URL}/games/line98/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const game = await response.json();
            currentGameId = game._id;
            line98GameState = game.gameState;
            renderLine98Board();
            updateLine98Display();
            if (forceNew) {
                showToast('Đã tạo game mới!', 'success');
            }
        } else {
            const error = await response.json();
            showError('Không thể tạo game mới');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

async function loadLatestLine98Game() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/games/line98/latest`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const game = await response.json();
            return game;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function makeLine98Move(fromRow, fromCol, toRow, toCol) {
    if (!currentGameId) {
        await initLine98Game();
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/games/line98/${currentGameId}/move`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                fromRow,
                fromCol,
                toRow,
                toCol
            })
        });

        if (response.ok) {
            const game = await response.json();
            
            startMoveAnimation(fromRow, fromCol, toRow, toCol);
            
            setTimeout(() => {
                const oldBoard = line98GameState ? [...line98GameState.board.map(row => [...row])] : null;
                
                line98GameState = game.gameState;
                
                if (oldBoard && game.clearedCells) {
                    startClearAnimation(game.clearedCells);
                    
                    setTimeout(() => {
                        const newBalls = [];
                        if (game.gameState.board) {
                            for (let row = 0; row < 9; row++) {
                                for (let col = 0; col < 9; col++) {
                                    if (game.gameState.board[row][col] > 0 && 
                                        !(row === toRow && col === toCol) &&
                                        (!oldBoard[row] || oldBoard[row][col] === 0)) {
                                        newBalls.push([row, col]);
                                    }
                                }
                            }
                        }
                        
                        if (newBalls.length > 0) {
                            startSpawnAnimation(newBalls);
                        }
                    }, 250);
                } else {
                    const newBalls = [];
                    if (game.gameState.board && oldBoard) {
                        for (let row = 0; row < 9; row++) {
                            for (let col = 0; col < 9; col++) {
                                if (game.gameState.board[row][col] > 0 && 
                                    !(row === toRow && col === toCol) &&
                                    oldBoard[row][col] === 0) {
                                    newBalls.push([row, col]);
                                }
                            }
                        }
                    }
                    
                    if (newBalls.length > 0) {
                        startSpawnAnimation(newBalls);
                    }
                }
                
                updateLine98Display();
            }, 300);
        } else {
            try {
                const error = await response.json();
                
                startInvalidMoveAnimation(fromRow, fromCol, toRow, toCol);
                
                if (error.message === 'No valid path found') {
                    showError('🚫 Không thể di chuyển đến vị trí này!');
                } else {
                    showError(error.message || 'Nước đi không hợp lệ');
                }
            } catch (parseError) {
                startInvalidMoveAnimation(fromRow, fromCol, toRow, toCol);
                showError('🚫 Nước đi không hợp lệ!');
            }
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

// Get hint
async function getLine98Hint() {
    if (!currentGameId) return;

    try {
        const response = await fetch(`${window.API_BASE_URL}/games/line98/${currentGameId}/hint`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const hint = await response.json();
            if (hint) {
                highlightHint(hint);
                
                const stats = hint.stats || {};
                let message = `⚡ AI Gợi ý: (${hint.fromRow + 1},${hint.fromCol + 1}) → (${hint.toRow + 1},${hint.toCol + 1})`;
                
                if (stats.immediateClearCount > 0) {
                    message += `\n🔥 Tạo line ngay: ${stats.immediateClearCount} bóng!`;
                } else if (stats.longestRun >= 4) {
                    message += `\n🎯 Tạo line ${stats.longestRun} bóng`;
                } else if (stats.colorBonus > 1) {
                    message += `\n🧩 Nối dãy cùng màu`;
                } else {
                    message += `\n🧠 Nước đi thông minh`;
                }
                
                showToast(message, 'success');
            } else {
                showToast('🤔 AI không tìm thấy gợi ý tốt', 'info');
            }
        } else {
            showError('Không thể lấy gợi ý');
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

// Render board with enhanced graphics and animations
function renderLine98Board() {
    try {
        const canvas = document.getElementById('line98Canvas');
        if (!canvas) return;
        if (!line98GameState) return;

        const ctx = canvas.getContext('2d');
        const cellSize = 50;
        const boardSize = 9;
        const ballRadius = cellSize / 2 - 8;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw enhanced grid with gradient background
    const gridGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gridGradient.addColorStop(0, '#f8f9fa');
    gridGradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gridGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#dee2e6';
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

    // Draw static balls (not moving or clearing)
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const ballColor = line98GameState.board[row][col];
            if (ballColor > 0) {
                // Skip if this ball is currently moving
                if (animations.moving && 
                    animations.moving.fromRow === row && 
                    animations.moving.fromCol === col) {
                    continue;
                }
                
                // Skip if this ball is being cleared
                const isClearing = animations.clearing.some(anim => 
                    anim.row === row && anim.col === col
                );
                if (isClearing) continue;
                
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                
                // Check if selected for pulse effect
                const isSelected = line98GameState.selectedBall && 
                    line98GameState.selectedBall.row === row && 
                    line98GameState.selectedBall.col === col;
                
                // Check if this ball is shaking due to invalid move
                const isShaking = animations.invalidMove && 
                    animations.invalidMove.row === row && 
                    animations.invalidMove.col === col;
                
                let shakeX = x, shakeY = y;
                if (isShaking) {
                    // Create shake effect
                    const shakeIntensity = 8; // Increased intensity
                    const shakeFreq = 0.3; // Proper frequency
                    const shakeProgress = animations.invalidMove.shakeTime / animations.invalidMove.duration;
                    const shakeDamping = Math.max(0, 1 - shakeProgress); // Reduce shake over time
                    
                    shakeX += Math.sin(animations.invalidMove.shakeTime * shakeFreq) * shakeIntensity * shakeDamping;
                    shakeY += Math.cos(animations.invalidMove.shakeTime * shakeFreq * 1.3) * shakeIntensity * shakeDamping;
                }
                
                drawEnhancedBall(ctx, shakeX, shakeY, ballRadius, ballColor, {
                    pulse: isSelected,
                    pulseTime: animations.pulseTime,
                    glow: isSelected || isShaking
                });
            }
        }
    }
    
    // Draw moving ball
    if (animations.moving) {
        const { fromRow, fromCol, toRow, toCol, progress } = animations.moving;
        const ballColor = line98GameState.board[toRow][toCol] || 
                         line98GameState.board[fromRow][fromCol];
        
        if (ballColor > 0) {
            const fromX = fromCol * cellSize + cellSize / 2;
            const fromY = fromRow * cellSize + cellSize / 2;
            const toX = toCol * cellSize + cellSize / 2;
            const toY = toRow * cellSize + cellSize / 2;
            
            const easedProgress = easeInOutCubic(Math.min(progress, 1));
            const currentX = fromX + (toX - fromX) * easedProgress;
            const currentY = fromY + (toY - fromY) * easedProgress;
            
            // Add slight scale animation during movement
            const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
            
            drawEnhancedBall(ctx, currentX, currentY, ballRadius, ballColor, {
                scale: scale,
                glow: true
            });
        }
    }
    
    // Draw spawning balls
    animations.spawning.forEach(anim => {
        if (anim.scale > 0) {
            const x = anim.col * cellSize + cellSize / 2;
            const y = anim.row * cellSize + cellSize / 2;
            const ballColor = line98GameState.board[anim.row][anim.col];
            
            if (ballColor > 0) {
                drawEnhancedBall(ctx, x, y, ballRadius, ballColor, {
                    scale: anim.scale,
                    opacity: anim.opacity,
                    glow: true
                });
            }
        }
    });
    
    // Draw clearing balls with explosion effect
    animations.clearing.forEach(anim => {
        const x = anim.col * cellSize + cellSize / 2;
        const y = anim.row * cellSize + cellSize / 2;
        
        ctx.save();
        ctx.globalAlpha = anim.opacity;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25 * anim.scale;
        
        // Explosion particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = (1 - anim.opacity) * 30;
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, 3 * anim.opacity, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
        }
        
        // Central explosion
        ctx.beginPath();
        ctx.arc(x, y, ballRadius * anim.scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.restore();
    });
    
    // Draw path preview (red flash for invalid moves)
    animations.pathPreview.forEach(anim => {
        const x = anim.col * cellSize + cellSize / 2;
        const y = anim.row * cellSize + cellSize / 2;
        
        ctx.save();
        ctx.globalAlpha = anim.opacity;
        
        if (anim.isError) {
            // Pulsing red circle background
            const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 30;
            
            // Red circle background with pulse
            ctx.beginPath();
            ctx.arc(x, y, (cellSize / 2 - 8) * pulseScale, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255, 68, 68, ${0.7 * anim.opacity})`;
            ctx.fill();
            
            // Draw red X mark
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            const size = cellSize * 0.25;
            
            ctx.beginPath();
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.moveTo(x + size, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.stroke();
        }
        
        ctx.restore();
    });

    // Draw selected ball
    if (line98GameState.selectedBall) {
        const { row, col } = line98GameState.selectedBall;
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 2 - 2, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    } catch (error) {
        // Handle rendering error silently
    }
}

// Update display
function updateLine98Display() {
    if (!line98GameState) return;

    const scoreElement = document.getElementById('score');
    const statusElement = document.getElementById('gameStatus');

    if (scoreElement) {
        scoreElement.textContent = line98GameState.score;
    }

    if (statusElement) {
        if (line98GameState.isGameOver) {
            statusElement.textContent = 'Game Over!';
        } else if (line98GameState.selectedBall) {
            statusElement.textContent = 'Chọn vị trí đích';
        } else {
            statusElement.textContent = 'Chọn bóng để di chuyển';
        }
    }
}

// Highlight hint
function highlightHint(hint) {
    if (!hint) return;

    // Re-render board first
    renderLine98Board();
    
    const canvas = document.getElementById('line98Canvas');
    const ctx = canvas.getContext('2d');
    const cellSize = 50;

    // Highlight source ball with pulsing green border
    const sourceX = hint.fromCol * cellSize;
    const sourceY = hint.fromRow * cellSize;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(sourceX + 2, sourceY + 2, cellSize - 4, cellSize - 4);
    
    // Add "FROM" text
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('FROM', sourceX + 5, sourceY + 15);

    // Highlight destination with dashed green border
    const destX = hint.toCol * cellSize;
    const destY = hint.toRow * cellSize;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(destX + 2, destY + 2, cellSize - 4, cellSize - 4);
    ctx.setLineDash([]); // Reset line dash
    
    // Add "TO" text
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('TO', destX + 5, destY + 15);
    
    // Draw arrow from source to destination
    drawArrow(ctx, 
        sourceX + cellSize/2, 
        sourceY + cellSize/2, 
        destX + cellSize/2, 
        destY + cellSize/2, 
        '#00ff00'
    );

    // Auto clear highlight after 5 seconds
    setTimeout(() => {
        renderLine98Board();
    }, 5000);
}

// Draw arrow between two points
function drawArrow(ctx, fromx, fromy, tox, toy, color) {
    const headlen = 10; // length of head in pixels
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

// Handle touch events for mobile
function handleLine98CanvasTouch(event) {
    // Only prevent default if touch is within canvas bounds
    const canvas = document.getElementById('line98Canvas');
    const rect = canvas.getBoundingClientRect();
    const touch = event.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Check if touch is within canvas bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        event.preventDefault(); // Only prevent default for canvas touches
        handleCanvasInteraction(canvas, x, y);
    }
}

// Canvas click handler
function handleLine98CanvasClick(event) {
    const canvas = document.getElementById('line98Canvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    handleCanvasInteraction(canvas, x, y);
}

// Common interaction handler for both click and touch
function handleCanvasInteraction(canvas, x, y) {
    if (!line98GameState || line98GameState.isGameOver) return;

    // Calculate cell size based on current canvas size for responsive
    const canvasWidth = canvas.offsetWidth;
    const cellSize = canvasWidth / 9; // Dynamic cell size
    
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || row >= 9 || col < 0 || col >= 9) return;

    if (line98GameState.selectedBall) {
        const { row: fromRow, col: fromCol } = line98GameState.selectedBall;
        
        // Check if clicking on the same ball (deselect)
        if (fromRow === row && fromCol === col) {
            line98GameState.selectedBall = null;
            renderLine98Board();
            updateLine98Display();
            return;
        }
        
        // Check if clicking on another ball (change selection)
        if (line98GameState.board[row][col] > 0) {
            line98GameState.selectedBall = { row, col };
            renderLine98Board();
            updateLine98Display();
            return;
        }
        
        // Try to move to empty cell
        makeLine98Move(fromRow, fromCol, row, col);
    } else {
        // Select ball
        if (line98GameState.board[row][col] > 0) {
            line98GameState.selectedBall = { row, col };
            renderLine98Board();
            updateLine98Display();
        }
    }
}

// Animation loop
function animationLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // Update animations
    updateAnimations(deltaTime);
    
    // Re-render if there are active animations
    if (animations.moving || 
        animations.spawning.length > 0 || 
        animations.clearing.length > 0 ||
        animations.invalidMove ||
        animations.pathPreview.length > 0 ||
        (line98GameState && line98GameState.selectedBall)) {
        renderLine98Board();
    }
    
    requestAnimationFrame(animationLoop);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('line98Canvas');
    if (canvas) {
        // Add both click and touch events for better mobile support
        canvas.addEventListener('click', handleLine98CanvasClick);
        canvas.addEventListener('touchend', handleLine98CanvasTouch);
        
        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    // Start animation loop
    lastFrameTime = Date.now();
    requestAnimationFrame(animationLoop);

    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => initLine98Game(true)); // Force new game
    }

    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
        hintBtn.addEventListener('click', getLine98Hint);
    }


});

// Export functions
window.initLine98Game = initLine98Game;
window.makeLine98Move = makeLine98Move;
window.getLine98Hint = getLine98Hint;
