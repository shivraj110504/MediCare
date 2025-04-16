document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Check if user is logged in and update the UI accordingly
    checkLoginStatus();
    
    // Add logout functionality
    setupLogout();

    // Setup dropdown toggle functionality
    setupDropdownToggle();

    // Set up the modal functionality
    setupBedBookingModal();

    // Set up the form submission
    setupBedBookingForm();

    // Define hospital data
    const hospitals = {
        'city-hospital': {
            name: 'City Hospital',
            location: 'Central City',
            contact: '+1 234 567 890',
            facilities: ['24/7 Emergency', 'ICU', 'General Ward', 'Private Rooms'],
            specialties: ['Cardiology', 'Neurology', 'Orthopedics'],
            rating: 4.5,
            bedTypes: ['General Ward', 'Private Room', 'ICU'],
            fees: {
                'General Ward': 2000,
                'Private Room': 5000,
                'ICU': 8000
            }
        },
        'apollo': {
            name: 'Apollo Hospital',
            location: 'North City',
            contact: '+1 234 567 891',
            facilities: ['Emergency Care', 'ICU', 'NICU', 'Private Rooms'],
            specialties: ['Pediatrics', 'Oncology', 'Gastroenterology'],
            rating: 4.8,
            bedTypes: ['General Ward', 'Private Room', 'ICU', 'NICU'],
            fees: {
                'General Ward': 2500,
                'Private Room': 6000,
                'ICU': 10000,
                'NICU': 12000
            }
        },
        'fortis': {
            name: 'Fortis Hospital',
            location: 'South City',
            contact: '+1 234 567 892',
            facilities: ['24/7 Emergency', 'ICU', 'Private Rooms'],
            specialties: ['Cardiology', 'Urology', 'Nephrology'],
            rating: 4.6,
            bedTypes: ['General Ward', 'Private Room', 'ICU'],
            fees: {
                'General Ward': 2200,
                'Private Room': 5500,
                'ICU': 9000
            }
        },
        'max': {
            name: 'Max Healthcare',
            location: 'East City',
            contact: '+1 234 567 893',
            facilities: ['Emergency Care', 'ICU', 'General Ward'],
            specialties: ['Orthopedics', 'Neurology', 'Psychiatry'],
            rating: 4.7,
            bedTypes: ['General Ward', 'Private Room', 'ICU'],
            fees: {
                'General Ward': 2300,
                'Private Room': 5800,
                'ICU': 9500
            }
        }
    };

    // Quick book functionality
    window.quickBookBed = function(hospitalId) {
        const userData = JSON.parse(localStorage.getItem('medicare-user'));
        if (!userData) {
            showToast('Please log in to book a bed', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Open the booking modal
        const modal = document.getElementById('bedBookingModal');
        modal.classList.add('active');
        
        // Pre-fill user data
        document.getElementById('patientName').value = userData.username || '';
        document.getElementById('patientEmail').value = userData.email || '';
        document.getElementById('patientPhone').value = userData.phone || '';
        
        // Set the hospital in the dropdown
        const hospitalSelect = document.getElementById('hospitalName');
        const hospital = hospitals[hospitalId];
        
        if (hospital) {
            // Find the option with the hospital name
            for (let i = 0; i < hospitalSelect.options.length; i++) {
                if (hospitalSelect.options[i].value === hospital.name) {
                    hospitalSelect.selectedIndex = i;
                    break;
                }
            }
            
            // Update room types based on selected hospital
            updateRoomTypes(hospitalId);
        }
    };

    // View hospital details
    window.viewHospitalDetails = function(hospitalId) {
        const hospital = hospitals[hospitalId];
        
        if (!hospital) {
            showToast('Hospital information not found', 'error');
            return;
        }
        
        const modalContent = `
            <div class="hospital-details">
                <h2>${hospital.name}</h2>
                <div class="rating">
                    Rating: ${hospital.rating} 
                </div>
                <div class="location">
                    <i data-lucide="map-pin"></i> ${hospital.location}
                </div>
                <div class="contact">
                    <i data-lucide="phone"></i> ${hospital.contact}
                </div>
                <div class="facilities">
                    <h3>Facilities</h3>
                    <ul>
                        ${hospital.facilities.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
                <div class="specialties">
                    <h3>Specialties</h3>
                    <ul>
                        ${hospital.specialties.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                <div class="bed-types">
                    <h3>Available Bed Types & Fees</h3>
                    <ul>
                        ${Object.entries(hospital.fees).map(([type, fee]) => 
                            `<li>${type}: ₹${fee}/day</li>`).join('')}
                    </ul>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="quickBookBed('${hospitalId}')">
                        Book Now
                    </button>
                </div>
            </div>
        `;
        
        showModal(modalContent);
    };

    function setupBedBookingModal() {
        const modal = document.getElementById('bedBookingModal');
        const closeBtn = modal.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // Setup hospital selection change handler
        const hospitalSelect = document.getElementById('hospitalName');
        if (hospitalSelect) {
            hospitalSelect.addEventListener('change', function() {
                const selectedHospital = Object.keys(hospitals).find(
                    key => hospitals[key].name === this.value
                );
                updateRoomTypes(selectedHospital);
            });
        }
    }

    function setupBedBookingForm() {
        const form = document.getElementById('bedBookingForm');
        
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const patientName = document.getElementById('patientName').value.trim();
                const email = document.getElementById('patientEmail').value.trim();
                const phone = document.getElementById('patientPhone').value.trim();
                const admissionDate = document.getElementById('admissionDate').value;
                const roomType = document.getElementById('roomType').value;
                const emergencyContact = document.getElementById('emergencyContact').value.trim();
                const hospitalName = document.getElementById('hospitalName').value;
                
                // Validation
                if (!patientName || !email || !phone || !admissionDate || !roomType || !emergencyContact || !hospitalName) {
                    showToast('Please fill in all fields', 'error');
                    return;
                }
                
                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showToast('Please enter a valid email address', 'error');
                    return;
                }
                
                // Phone validation
                if (phone.length !== 10 || !/^\d+$/.test(phone)) {
                    showToast('Please enter a valid 10-digit phone number', 'error');
                    return;
                }
                
                // Emergency contact validation
                if (emergencyContact.length !== 10 || !/^\d+$/.test(emergencyContact)) {
                    showToast('Please enter a valid emergency contact number', 'error');
                    return;
                }
                
                // Date validation
                const selectedDate = new Date(admissionDate);
                const now = new Date();
                if (selectedDate < now) {
                    showToast('Please select a future date', 'error');
                    return;
                }
                
                const bookingData = {
                    patientName,
                    email,
                    phone,
                    admissionDate,
                    roomType,
                    emergencyContact,
                    hospitalName
                };
                
                try {
                    showToast('Processing your booking...', 'info');
                    
                    const response = await fetch('http://localhost:5000/api/hospital-beds', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(bookingData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        showToast(result.message || 'Hospital bed booked successfully!', 'success');
                        
                        // Reset only non-user data
                        document.getElementById('admissionDate').value = '';
                        document.getElementById('roomType').value = '';
                        document.getElementById('emergencyContact').value = '';
                        
                        // Close modal
                        const modal = document.getElementById('bedBookingModal');
                        modal.classList.remove('active');
                    } else {
                        showToast(result.message || 'Failed to book hospital bed', 'error');
                    }
                } catch (error) {
                    console.error('Hospital Bed Booking Error:', error);
                    showToast('An error occurred. Please try again.', 'error');
                }
            });
        }
    }
    
    function updateRoomTypes(hospitalId) {
        const roomTypeSelect = document.getElementById('roomType');
        const hospital = hospitals[hospitalId];
        
        if (roomTypeSelect && hospital) {
            // Clear existing options
            roomTypeSelect.innerHTML = '';
            
            // Add new options
            hospital.bedTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = `${type} - ₹${hospital.fees[type]}/day`;
                roomTypeSelect.appendChild(option);
            });
        }
    }

    function showModal(content) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">
                    <i data-lucide="x"></i>
                </button>
                ${content}
            </div>
        `;

        // Add modal to body
        document.body.appendChild(modal);
        lucide.createIcons();

        // Close modal on click outside or close button
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.closest('.modal-close')) {
                modal.remove();
            }
        });
    }

    const bookBedBtn = document.getElementById('bookBedBtn');
    const bookingModal = document.getElementById('bookingModal');
    const hospitalBedForm = document.getElementById('hospitalBedForm');

    // Hide form by default
    if (bookingModal) bookingModal.style.display = 'none';

    // Show form when button is clicked
    if (bookBedBtn && bookingModal) {
        bookBedBtn.addEventListener('click', function() {
            bookingModal.style.display = (bookingModal.style.display === 'none' || !bookingModal.style.display) ? 'block' : 'none';
        });
    }

    // Form submission
    if (hospitalBedForm) {
        hospitalBedForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const hospital = document.getElementById('hospital').value.trim();
            const bedType = document.getElementById('bedType').value.trim();
            const admissionDate = document.getElementById('admissionDate').value.trim();
            const duration = document.getElementById('duration').value.trim();
            const medicalCondition = document.getElementById('medicalCondition').value.trim();
            let hasError = false;
            if (!name) { showToast('Name is required', 'error'); hasError = true; }
            if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { showToast('Valid email required', 'error'); hasError = true; }
            if (!phone || !phone.match(/^\d{10}$/)) { showToast('Valid 10-digit phone required', 'error'); hasError = true; }
            if (!hospital) { showToast('Hospital required', 'error'); hasError = true; }
            if (!bedType) { showToast('Bed type required', 'error'); hasError = true; }
            if (!admissionDate) { showToast('Admission date required', 'error'); hasError = true; }
            if (!duration) { showToast('Duration required', 'error'); hasError = true; }
            if (!medicalCondition) { showToast('Medical condition required', 'error'); hasError = true; }
            if (hasError) return;
            const data = { name, email, phone, hospital, bedType, admissionDate, duration, medicalCondition };
            try {
                showToast('Booking bed...', 'info');
                const res = await fetch('/api/hospital-beds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (res.ok && result.success) {
                    showToast('Bed booked!', 'success');
                    hospitalBedForm.reset();
                    bookingModal.style.display = 'none';
                } else {
                    showToast(result.message || 'Booking failed', 'error');
                }
            } catch (err) {
                showToast('Server error. Try again.', 'error');
            }
        });
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// Check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userProfile = document.querySelector('.user-profile');
    
    if (isLoggedIn) {
        // User is logged in
        userProfile.classList.remove('hidden');
        
        // Set user name
        const userData = JSON.parse(localStorage.getItem('medicare-user'));
        const userNameElement = document.getElementById('displayUsername');
        
        if (userData && userNameElement) {
            userNameElement.textContent = userData.username || userData.email.split('@')[0];
        }
    } else {
        // User is not logged in
        userProfile.classList.add('hidden');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear login status
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('medicare-user');
            
            // Show success message
            showToast('Logged out successfully!', 'success');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }
}

// Setup dropdown toggle
function setupDropdownToggle() {
    const userProfileToggle = document.getElementById('userProfileToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (userProfileToggle && dropdownMenu) {
        userProfileToggle.addEventListener('click', function() {
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userProfileToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

// Show toast message
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) return;
    
    // Remove existing toasts
    const existingToasts = toastContainer.getElementsByClassName('toast');
    Array.from(existingToasts).forEach(toast => toast.remove());
    
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
