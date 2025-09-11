// UI utilities and toast notification system
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

// Screen management functions
function showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const gameSelectionScreen = document.getElementById('gameSelectionScreen');
    const line98Game = document.getElementById('line98Game');
    const caroGame = document.getElementById('caroGame');
    
    if (authScreen) authScreen.style.display = 'block';
    if (gameSelectionScreen) gameSelectionScreen.style.display = 'none';
    if (line98Game) line98Game.style.display = 'none';
    if (caroGame) caroGame.style.display = 'none';
}

function showGameSelection() {
    const authScreen = document.getElementById('authScreen');
    const gameSelectionScreen = document.getElementById('gameSelectionScreen');
    const line98Game = document.getElementById('line98Game');
    const caroGame = document.getElementById('caroGame');
    
    if (authScreen) authScreen.style.display = 'none';
    if (gameSelectionScreen) gameSelectionScreen.style.display = 'block';
    if (line98Game) line98Game.style.display = 'none';
    if (caroGame) caroGame.style.display = 'none';
    
    if (window.getCurrentUser && window.getCurrentUser()) {
        const currentUser = window.getCurrentUser();
        const userInfo = document.getElementById('userInfo');
        const userUsername = document.getElementById('userUsername');
        const userEmail = document.getElementById('userEmail');
        const userNickname = document.getElementById('userNickname');
        
        if (userInfo) userInfo.style.display = 'block';
        if (userUsername) userUsername.textContent = currentUser.username;
        if (userEmail) userEmail.textContent = currentUser.email || 'Chưa cập nhật';
        if (userNickname) userNickname.textContent = currentUser.nickname || 'Chưa cập nhật';
    }
}

function showGame(gameType) {
    const authScreen = document.getElementById('authScreen');
    const gameSelectionScreen = document.getElementById('gameSelectionScreen');
    const line98Game = document.getElementById('line98Game');
    const caroGame = document.getElementById('caroGame');
    
    if (authScreen) authScreen.style.display = 'none';
    if (gameSelectionScreen) gameSelectionScreen.style.display = 'none';
    
    if (gameType === 'line98') {
        if (line98Game) line98Game.style.display = 'block';
        if (caroGame) caroGame.style.display = 'none';
        if (window.initializeLine98Game) {
            window.initializeLine98Game();
        }
    } else if (gameType === 'caro') {
        if (line98Game) line98Game.style.display = 'none';
        if (caroGame) caroGame.style.display = 'block';
        if (window.initializeCaroGame) {
            window.initializeCaroGame();
        }
    }
}

// Export functions
window.showToast = showToast;
window.closeToast = closeToast;
window.showError = showError;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showAuthScreen = showAuthScreen;
window.showGameSelection = showGameSelection;
window.showGame = showGame;