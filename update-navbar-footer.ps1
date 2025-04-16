$files = @(
    "about.html",
    "ai-doctor.html",
    "appointment.html",
    "hospital-beds.html",
    "medicine-delivery.html",
    "training.html",
    "login.html",
    "signup.html"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Add navbar-footer.css stylesheet
    $content = $content -replace '(<link rel="stylesheet" href="futuristic-theme.css">)', '$1
    <link rel="stylesheet" href="styles/navbar-footer.css">'
    
    # Update navbar
    $content = $content -replace '(?s)<header id="header".*?</header>', @'
    <!-- Header -->
    <header id="header" class="cyber-nav">
        <nav class="container">
            <a href="index.html" class="logo">MediCare</a>
            <button class="mobile-menu-toggle">
                <i data-lucide="menu"></i>
            </button>
            <div class="nav-links">
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

    # Update footer
    $content = $content -replace '(?s)<footer.*?</footer>', @'
    <!-- Footer -->
    <footer class="cyber-footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-col">
                    <h3>MediCare</h3>
                    <p>Providing quality healthcare services and innovative solutions to improve your wellbeing.</p>
                    <div class="social-links">
                        <a href="#"><i data-lucide="facebook"></i></a>
                        <a href="#"><i data-lucide="twitter"></i></a>
                        <a href="#"><i data-lucide="instagram"></i></a>
                        <a href="#"><i data-lucide="linkedin"></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="about.html">About Us</a></li>
                        <li><a href="ai-doctor.html">AI Doctor</a></li>
                        <li><a href="training.html">Training</a></li>
                        <li><a href="medicine-delivery.html">Medicine Delivery</a></li>
                        <li><a href="hospital-beds.html">Hospital Beds</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Services</h4>
                    <ul>
                        <li><a href="#">Telemedicine</a></li>
                        <li><a href="#">Health Checkups</a></li>
                        <li><a href="#">Medical Tourism</a></li>
                        <li><a href="#">Home Healthcare</a></li>
                        <li><a href="#">Emergency Services</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <ul class="contact-info">
                        <li>
                            <i data-lucide="map-pin"></i>
                            123 Healthcare Avenue, Medical District, City, Country
                        </li>
                        <li>
                            <i data-lucide="phone"></i>
                            +91 1800 123 4567
                        </li>
                        <li>
                            <i data-lucide="mail"></i>
                            info@medicare-example.com
                        </li>
                        <li>
                            <i data-lucide="clock"></i>
                            Mon-Sat: 8:00 AM - 10:00 PM
                        </li>
                    </ul>
                </div>
            </div>
            <hr class="footer-divider">
            <div class="footer-bottom">
                <p>&copy; 2025 MediCare. All rights reserved.</p>
                <div class="footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Cookie Policy</a>
                </div>
            </div>
        </div>
    </footer>
'@

    # Update chat icon
    $content = $content -replace '(?s)<div class="chatbot-container">.*?</div>\s*</div>', @'
    <!-- Chat Icon -->
    <div class="chat-toggle-container">
        <button id="chat-toggle" class="chat-toggle">
            <i data-lucide="message-circle"></i>
        </button>
    </div>
'@

    # Add mobile menu toggle script
    $content = $content -replace '(?s)(document\.addEventListener\(''DOMContentLoaded'', \(\) => \{)', @'
$1
            // Initialize Lucide icons
            lucide.createIcons();

            // Mobile menu toggle
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const navLinks = document.querySelector('.nav-links');
            
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
'@

    Set-Content $file $content
    Write-Host "Updated $file"
}

Write-Host "All files have been updated successfully!"
