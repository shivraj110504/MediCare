document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('medicare-user'));
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Pre-fill user data
    document.getElementById('name').value = userData.username || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('contact').value = userData.phone || '';

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Appointment form
    const appointmentForm = document.getElementById('appointmentForm');
    
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('contact').value.trim();
            const department = document.getElementById('department').value.trim();
            const doctor = document.getElementById('doctor').value.trim();
            const date = document.getElementById('date').value.trim();
            const time = document.getElementById('time').value.trim();

            // Validate
            let hasError = false;
            if (!name || name.length < 2) {
                showToast('Name must be at least 2 characters', 'error'); hasError = true;
            }
            if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                showToast('Please enter a valid email address', 'error'); hasError = true;
            }
            if (!phone || !phone.match(/^\d{10}$/)) {
                showToast('Please enter a valid 10-digit phone number', 'error'); hasError = true;
            }
            if (!department) {
                showToast('Department is required', 'error'); hasError = true;
            }
            if (!doctor) {
                showToast('Doctor is required', 'error'); hasError = true;
            }
            if (!date) {
                showToast('Date is required', 'error'); hasError = true;
            }
            if (!time) {
                showToast('Time is required', 'error'); hasError = true;
            }
            if (hasError) return;

            const appointmentData = {
                name,
                email,
                phone,
                department,
                doctor,
                date,
                time
            };

            try {
                showToast('Booking your appointment...', 'info');
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData)
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    showToast('Appointment booked!', 'success');
                    appointmentForm.reset();
                } else {
                    showToast(result.message || 'Failed to book appointment', 'error');
                }
            } catch (error) {
                showToast('An error occurred. Please try again.', 'error');
            }
        });
    }
});
