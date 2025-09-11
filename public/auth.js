// Authentication module
let currentUser = null;

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
    if (window.socket) window.socket.disconnect();
    showAuthScreen();
}

// Check if user is logged in
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) {
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
            localStorage.removeItem('token');
            showAuthScreen();
        });
    } else {
        showAuthScreen();
    }
}

// Export functions
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.checkAuthStatus = checkAuthStatus;
window.getCurrentUser = () => currentUser;
window.setCurrentUser = (user) => { currentUser = user; };
