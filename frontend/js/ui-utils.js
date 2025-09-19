// UI Utilities - Frontend thuần
function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'block';
    document.getElementById('gameSelectionScreen').style.display = 'none';
    document.getElementById('line98Game').style.display = 'none';
    document.getElementById('caroGame').style.display = 'none';
}

function showGameSelection() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('gameSelectionScreen').style.display = 'block';
    document.getElementById('line98Game').style.display = 'none';
    document.getElementById('caroGame').style.display = 'none';
    
    // Update user info
    if (window.getCurrentUser) {
        const user = window.getCurrentUser();
        if (user) {
            document.getElementById('userUsername').textContent = user.username || 'N/A';
            document.getElementById('userEmail').textContent = user.email || 'N/A';
            document.getElementById('userNickname').textContent = user.nickname || 'N/A';
            document.getElementById('userInfo').style.display = 'block';
        }
    }
}

function showGame(gameType) {
    document.getElementById('gameSelectionScreen').style.display = 'none';
    
    if (gameType === 'line98') {
        document.getElementById('line98Game').style.display = 'block';
        document.getElementById('caroGame').style.display = 'none';
        // Initialize Line 98 game
        if (typeof initLine98Game === 'function') {
            initLine98Game();
        }
    } else if (gameType === 'caro') {
        document.getElementById('line98Game').style.display = 'none';
        document.getElementById('caroGame').style.display = 'block';
        // Initialize Caro game
        if (typeof initCaroGame === 'function') {
            initCaroGame('local');
        }
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide success message
    document.getElementById('successMessage').style.display = 'none';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Hide error message
    document.getElementById('errorMessage').style.display = 'none';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span>Thông báo</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// Confirm dialog
function showConfirmDialog(title, message, onConfirm, onCancel = null) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    // Create dialog
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
            <button class="btn btn-secondary" onclick="this.closest('.confirm-dialog').parentElement.remove()">Hủy</button>
            <button class="btn btn-primary" onclick="this.closest('.confirm-dialog').parentElement.remove(); (${onConfirm.toString()})()">Xác nhận</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Handle cancel
    if (onCancel) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                onCancel();
            }
        });
    }
}

// Loading indicator
function showLoading(element, show = true) {
    if (show) {
        element.innerHTML = '<div class="loading"><div></div><div></div><div></div></div>';
    } else {
        element.innerHTML = '';
    }
}

// Waiting indicator
function showWaiting(element, message = 'Đang chờ...') {
    element.innerHTML = `
        <span>${message}</span>
        <div class="waiting-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
}

// Export functions
window.showAuthScreen = showAuthScreen;
window.showGameSelection = showGameSelection;
window.showGame = showGame;
window.showError = showError;
window.showSuccess = showSuccess;
window.showToast = showToast;
window.showConfirmDialog = showConfirmDialog;
window.showLoading = showLoading;
window.showWaiting = showWaiting;
