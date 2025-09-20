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
    if (window.checkAuthStatus) {
        window.checkAuthStatus();
    } else if (window.showAuthScreen) {
        window.showAuthScreen();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });
    }

    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const line98Card = document.getElementById('line98Card');
    const caroCard = document.getElementById('caroCard');
    
    if (line98Card) {
        line98Card.addEventListener('click', () => showGame('line98'));
    }
    
    if (caroCard) {
        caroCard.addEventListener('click', () => showGame('caro'));
    }

    const backToSelection = document.getElementById('backToSelection');
    const backToSelectionCaro = document.getElementById('backToSelectionCaro');
    
    if (backToSelection) {
        backToSelection.addEventListener('click', () => showGameSelection());
    }
    
    if (backToSelectionCaro) {
        backToSelectionCaro.addEventListener('click', () => showGameSelection());
    }
}

window.initializeApp = initializeApp;
