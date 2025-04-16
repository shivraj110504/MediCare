# List of pages to update
$pages = @(
    "appointment.html",
    "hospital-beds.html",
    "medicine-delivery.html",
    "about.html",
    "training.html"
)

foreach ($file in $pages) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Add navbar-footer.css if not present
        if (-not ($content -match 'navbar-footer\.css')) {
            $content = $content -replace '(<link rel="stylesheet" href="futuristic-theme\.css">)', '$1
    <link rel="stylesheet" href="styles/navbar-footer.css">'
        }
        
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

        # Add chat icon if not present
        if (-not ($content -match 'chat-toggle-container')) {
            $content = $content -replace '</footer>\s*</body>', @'
    </footer>

    <!-- Chat Icon -->
    <div class="chat-toggle-container">
        <button id="chat-toggle" class="chat-toggle">
            <i data-lucide="message-circle"></i>
        </button>
    </div>
</body>
'@
        }

        # Update JavaScript for navbar functionality
        $content = $content -replace '(?s)document\.addEventListener\(''DOMContentLoaded'', \(\) => \{(?:(?!</script>).)*?\}\);', @'
document.addEventListener('DOMContentLoaded', () => {
            // Initialize Lucide icons
            lucide.createIcons();

            // Mobile menu toggle
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const navLinks = document.querySelector('.nav-links');
            
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });

            // Check login status
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                window.location.replace('login.html');
                return;
            }

            // Update user information in dropdown
            const userName = localStorage.getItem('userName') || 'User';
            const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
            
            document.getElementById('userNameDisplay').textContent = userName;
            document.getElementById('userFullName').textContent = userName;
            document.getElementById('userEmail').textContent = userEmail;

            // Handle dropdown toggle
            const dropdownToggle = document.querySelector('.dropdown-toggle');
            const dropdownMenu = document.querySelector('.dropdown-menu');
            
            // Toggle dropdown on click
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownToggle.classList.toggle('active');
                dropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && !dropdownToggle.contains(e.target)) {
                    dropdownMenu.classList.remove('show');
                    dropdownToggle.classList.remove('active');
                }
            });

            // Prevent dropdown from closing when clicking inside
            dropdownMenu.addEventListener('click', (e) => {
                if (!e.target.closest('#logoutBtn')) {
                    e.stopPropagation();
                }
            });

            // Handle logout
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                
                // Show loading state
                const loader = document.createElement('div');
                loader.className = 'page-loader';
                loader.innerHTML = '<span class="loader"></span>';
                document.body.appendChild(loader);
                
                // Clear user data
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                
                // Redirect with slight delay for smooth transition
                setTimeout(() => {
                    window.location.replace('index.html');
                }, 500);
            });
        });
'@

        Set-Content $file $content
        Write-Host "Updated $file with consistent navbar and footer"
    } else {
        Write-Host "Warning: $file not found"
    }
}

Write-Host "All pages have been updated successfully!"
