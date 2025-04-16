document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Set current year in footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Debug: Check localStorage on page load
    const userDataStr = localStorage.getItem('medicare-user');
    console.log('LocalStorage on load:', {
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        userData: userDataStr ? JSON.parse(userDataStr) : null
    });

    // Check login status and update UI
    checkLoginStatus();
    
    // Setup user profile dropdown
    setupUserProfile();
    
    // Setup logout functionality
    setupLogout();
});

// Function to check login status and update UI
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    // Skip if we're on signup or login page
    if (window.location.pathname.includes('signup.html') || 
        window.location.pathname.includes('login.html')) {
        return;
    }
    
    if (!authButtons && !userProfile) {
        console.log('Auth elements not found - might be signup/login page');
        return;
    }
    
    if (isLoggedIn) {
        // Show user profile, hide auth buttons
        if (authButtons) authButtons.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        
        // Update user name
        try {
            const userDataStr = localStorage.getItem('medicare-user');
            if (!userDataStr) {
                console.log('No user data found');
                return;
            }
            
            const userData = JSON.parse(userDataStr);
            const userNameElement = document.querySelector('#displayUsername');
            
            if (userData && userNameElement) {
                const displayName = userData.fullName || userData.email.split('@')[0];
                userNameElement.textContent = displayName;
                console.log('Updated display name:', displayName);
            }
        } catch (error) {
            console.error('Error updating username:', error);
        }
        
        // If on login/signup page, redirect to loggedin.html
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
            window.location.href = 'loggedin.html';
        }
    } else {
        // Show auth buttons, hide user profile
        if (authButtons) authButtons.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        
        // If on protected pages, redirect to login
        if (window.location.pathname.includes('loggedin.html')) {
            window.location.href = 'login.html';
        }
    }
}

// Function to setup user profile dropdown
function setupUserProfile() {
    const userProfileToggle = document.getElementById('userProfileToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    // Skip if we're on signup or login page
    if (window.location.pathname.includes('signup.html') || 
        window.location.pathname.includes('login.html')) {
        return;
    }
    
    if (!userProfileToggle || !dropdownMenu) {
        console.log('Dropdown elements not found - might be signup/login page');
        return;
    }
    
    // Initially hide dropdown
    dropdownMenu.style.display = 'none';
    
    // Toggle dropdown on user profile click
    userProfileToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!userProfileToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
}

// Function to setup logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear user data
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('medicare-user');
            
            // Show success message
            showToast('Logged out successfully!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }
}

// Function to show toast messages
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        // Create toast container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return showToast(message, type); // Retry now that container exists
    }

    // Remove existing toasts
    const existingToasts = toastContainer.getElementsByClassName('toast');
    Array.from(existingToasts).forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i data-lucide="check-circle"></i>';
            break;
        case 'error':
            icon = '<i data-lucide="x-circle"></i>';
            break;
        case 'info':
            icon = '<i data-lucide="info"></i>';
            break;
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
