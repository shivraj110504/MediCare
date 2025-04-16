# List of files that should have the logged-in navbar
$loggedInFiles = @(
    "loggedin.html",
    "ai-doctor.html",
    "appointment.html",
    "hospital-beds.html",
    "medicine-delivery.html",
    "training.html",
    "about.html"
)

# List of files that should have the logged-out navbar
$loggedOutFiles = @(
    "index.html",
    "login.html",
    "signup.html"
)

# Update logged-in files
foreach ($file in $loggedInFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Update navbar with Home button and user dropdown
        $content = $content -replace '(?s)<header id="header".*?</header>', @'
    <!-- Header -->
    <header id="header" class="cyber-nav">
        <nav class="container">
            <a href="index.html" class="logo">MediCare</a>
            <button class="mobile-menu-toggle">
                <i data-lucide="menu"></i>
            </button>
            <div class="nav-links">
                <a href="loggedin.html">Home</a>
                <a href="ai-doctor.html">AI Doctor</a>
                <a href="appointment.html">Appointments</a>
                <a href="hospital-beds.html">Hospital Beds</a>
                <a href="training.html">Training</a>
                <a href="medicine-delivery.html">Medicine</a>
                <a href="about.html">About</a>
            </div>
            <div class="user-dropdown">
                <button class="dropdown-toggle">
                    <i data-lucide="user"></i>
                    <span id="userNameDisplay">User</span>
                    <i data-lucide="chevron-down"></i>
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-header">
                        <i data-lucide="user"></i>
                        <div class="user-info">
                            <span id="userFullName">User</span>
                            <span id="userEmail" class="user-email">user@example.com</span>
                        </div>
                    </div>
                    <a href="profile.html" class="dropdown-item">
                        <i data-lucide="user"></i>
                        Profile
                    </a>
                    <a href="#" class="dropdown-item">
                        <i data-lucide="settings"></i>
                        Settings
                    </a>
                    <a href="#" class="dropdown-item text-danger" id="logoutBtn">
                        <i data-lucide="log-out"></i>
                        Logout
                    </a>
                </div>
            </div>
        </nav>
    </header>
'@
        Set-Content $file $content
        Write-Host "Updated logged-in navbar in $file"
    }
}

# Update logged-out files
foreach ($file in $loggedOutFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Update navbar with login/signup buttons
        $content = $content -replace '(?s)<header id="header".*?</header>', @'
    <!-- Header -->
    <header id="header" class="cyber-nav">
        <nav class="container">
            <a href="index.html" class="logo">MediCare</a>
            <button class="mobile-menu-toggle">
                <i data-lucide="menu"></i>
            </button>
            <div class="nav-links">
                <a href="index.html">Home</a>
                <a href="ai-doctor.html">AI Doctor</a>
                <a href="appointment.html">Appointments</a>
                <a href="hospital-beds.html">Hospital Beds</a>
                <a href="training.html">Training</a>
                <a href="medicine-delivery.html">Medicine</a>
                <a href="about.html">About</a>
            </div>
            <div class="nav-right">
                <div class="auth-buttons" data-auth-hide="false">
                    <a href="login.html" class="btn btn-outline btn-glow">Login</a>
                    <a href="signup.html" class="btn btn-primary btn-glow">Sign Up</a>
                </div>
            </div>
        </nav>
    </header>
'@
        Set-Content $file $content
        Write-Host "Updated logged-out navbar in $file"
    }
}

Write-Host "All navbars have been updated successfully!"
