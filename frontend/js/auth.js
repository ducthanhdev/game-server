// Authentication module
let currentUser = null;

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
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
        const requestData = { username, password, email, nickname };
        
        const response = await fetch(`${window.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            currentUser = data.user;
            showSuccess('Đăng ký thành công!');
            setTimeout(() => {
                showGameSelection();
            }, 1000);
        } else {
            if (response.status === 409) {
                showError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
            } else {
                showError(data.message || 'Đăng ký thất bại');
            }
        }
    } catch (error) {
        showError('Lỗi kết nối server');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    showAuthScreen();
}

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const user = await response.json();
                currentUser = user;
                showGameSelection();
            } else {
                throw new Error('Invalid token');
            }
        } catch (error) {
            localStorage.removeItem('token');
            showAuthScreen();
        }
    } else {
        showAuthScreen();
    }
}

// Update user profile
async function updateUserProfile(updateData) {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${window.API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            return true;
        } else {
            const error = await response.json();
            showError(error.message || 'Cập nhật thất bại');
            return false;
        }
    } catch (error) {
        showError('Lỗi kết nối server');
        return false;
    }
}

// Export functions
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.checkAuthStatus = checkAuthStatus;
window.getCurrentUser = () => currentUser;
window.setCurrentUser = (user) => { currentUser = user; };
window.updateUserProfile = updateUserProfile;
