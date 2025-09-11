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
// Loading and waiting indicators
function showLoading(elementId, message = 'Đang tải...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const loadingHtml = `
        <span class="waiting-indicator">
            ${message}
            <div class="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </span>
    `;
    
    element.innerHTML = loadingHtml;
}

function hideLoading(elementId, defaultText = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = defaultText;
}

function showWaitingForOpponent() {
    const statusElement = document.getElementById('caroStatus');
    if (!statusElement) return;
    
    const waitingHtml = `
        <span class="waiting-indicator">
            Đang chờ đối thủ đi...
            <div class="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </span>
    `;
    
    statusElement.innerHTML = waitingHtml;
}

function showCountdownTimer(seconds) {
    const statusElement = document.getElementById('caroStatus');
    if (!statusElement) return;
    
    const timerHtml = `
        <span class="waiting-indicator">
            Đang chờ đối thủ đi... (${seconds}s)
            <div class="waiting-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </span>
    `;
    
    statusElement.innerHTML = timerHtml;
}

function showConfirmDialog(title, message, onConfirm, onCancel) {
    console.log('showConfirmDialog called with:', { title, message });
    
    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.className = 'toast-overlay';
    overlay.style.zIndex = '10000';
    
    // Tạo dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div class="confirm-header">
            <h3>${title}</h3>
        </div>
        <div class="confirm-body">
            <p>${message}</p>
        </div>
        <div class="confirm-footer">
            <button class="btn btn-secondary" id="confirmCancel">Hủy</button>
            <button class="btn btn-primary" id="confirmOk">OK</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    console.log('Dialog created and added to DOM');
    
    // Xử lý sự kiện
    document.getElementById('confirmOk').onclick = () => {
        console.log('OK button clicked');
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
    };
    
    document.getElementById('confirmCancel').onclick = () => {
        console.log('Cancel button clicked');
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
    };
    
    // Đóng khi click overlay
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            console.log('Overlay clicked');
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        }
    };
}

window.showToast = showToast;
window.closeToast = closeToast;
window.showError = showError;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showAuthScreen = showAuthScreen;
window.showGameSelection = showGameSelection;
window.showGame = showGame;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showWaitingForOpponent = showWaitingForOpponent;
window.showCountdownTimer = showCountdownTimer;
window.showConfirmDialog = showConfirmDialog;