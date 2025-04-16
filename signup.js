document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.classList.remove('show');
            });
            
            // Get form data
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            // Validate form data
            let hasError = false;
            
            if (!firstName || firstName.length < 2) {
                document.getElementById('firstNameError').textContent = 'First name must be at least 2 characters';
                document.getElementById('firstNameError').classList.add('show');
                hasError = true;
            }
            
            if (!lastName || lastName.length < 2) {
                document.getElementById('lastNameError').textContent = 'Last name must be at least 2 characters';
                document.getElementById('lastNameError').classList.add('show');
                hasError = true;
            }
            
            if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                document.getElementById('emailError').textContent = 'Please enter a valid email address';
                document.getElementById('emailError').classList.add('show');
                hasError = true;
            }
            
            if (!phone || !phone.match(/^\d{10}$/)) {
                document.getElementById('phoneError').textContent = 'Please enter a valid 10-digit phone number';
                document.getElementById('phoneError').classList.add('show');
                hasError = true;
            }
            
            if (!password || password.length < 6) {
                document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
                document.getElementById('passwordError').classList.add('show');
                hasError = true;
            }
            
            if (password !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                document.getElementById('confirmPasswordError').classList.add('show');
                hasError = true;
            }
            
            if (!terms) {
                showToast('Please accept the Terms of Service and Privacy Policy', 'error');
                hasError = true;
            }
            
            if (hasError) return;

            try {
                showToast('Creating your account...', 'info');
                
                const userData = {
                    username: `${firstName} ${lastName}`,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    password: password
                };

                console.log('Sending user data:', userData);

                const response = await fetch('http://localhost:5000/api/signup', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();
                console.log('Server response:', result);

                if (response.ok) {
                    showToast(result.message || 'Account created successfully!', 'success');
                    // Store user data in localStorage
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('medicare-user', JSON.stringify({
                        fullName: userData.username,
                        email: userData.email,
                        phone: userData.phone,
                        firstName: userData.firstName,
                        lastName: userData.lastName
                    }));
                    setTimeout(() => window.location.href = 'loggedin.html', 1500);
                } else {
                    showToast(result.message || 'Signup failed', 'error');
                }
            } catch (error) {
                console.error('Signup Error:', error);
                showToast('Server error occurred. Please try again.', 'error');
            }
        });
    }

    // Initialize Lucide icons
    lucide.createIcons();
});
