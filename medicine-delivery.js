document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Check if user is logged in and update the UI accordingly
    checkLoginStatus();
    
    // Add logout functionality
    setupLogout();

    // Setup dropdown toggle functionality
    setupDropdownToggle();
    
    // Elements
    const medicinesList = document.getElementById('medicinesList');
    const searchInput = document.getElementById('searchInput');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const cartItems = document.getElementById('cartItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const totalAmount = document.getElementById('totalAmount');
    const uploadBtn = document.getElementById('uploadBtn');
    const prescriptionUpload = document.getElementById('prescriptionUpload');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const orderForm = document.getElementById('orderForm');
    
    // Cart state
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Sample medicine data
    const medicines = [
        {
            id: '1',
            name: 'Paracetamol 500mg',
            genericName: 'Acetaminophen',
            price: 35,
            stock: 'In Stock',
            prescriptionRequired: false
        },
        {
            id: '2',
            name: 'Azithromycin 250mg',
            genericName: 'Azithromycin',
            price: 120,
            stock: 'In Stock',
            prescriptionRequired: true
        },
        {
            id: '3',
            name: 'Amoxicillin 500mg',
            genericName: 'Amoxicillin',
            price: 80,
            stock: 'In Stock',
            prescriptionRequired: true
        },
        {
            id: '4',
            name: 'Cetrizine 10mg',
            genericName: 'Cetrizine',
            price: 45,
            stock: 'In Stock',
            prescriptionRequired: false
        },
        {
            id: '5',
            name: 'Pantoprazole 40mg',
            genericName: 'Pantoprazole',
            price: 95,
            stock: 'Low Stock',
            prescriptionRequired: false
        },
        {
            id: '6',
            name: 'Metformin 500mg',
            genericName: 'Metformin',
            price: 60,
            stock: 'In Stock',
            prescriptionRequired: true
        }
    ];
    
    // Initialize the page
    displayMedicines(medicines);
    updateCartUI();
    
    // Event listeners
    searchInput.addEventListener('input', handleSearch);
    uploadBtn.addEventListener('click', () => prescriptionUpload.click());
    
    prescriptionUpload.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    const medicineOrderForm = document.getElementById('medicineOrderForm');
    if (medicineOrderForm) {
        medicineOrderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const deliveryTime = document.getElementById('deliveryTime').value.trim();
            const paymentMethod = document.getElementById('paymentMethod').value.trim();
            const notes = document.getElementById('notes').value.trim();
            let hasError = false;
            if (!name) { showToast('Name is required', 'error'); hasError = true; }
            if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { showToast('Valid email required', 'error'); hasError = true; }
            if (!phone || !phone.match(/^\d{10}$/)) { showToast('Valid 10-digit phone required', 'error'); hasError = true; }
            if (!address) { showToast('Address required', 'error'); hasError = true; }
            if (!deliveryTime) { showToast('Delivery time required', 'error'); hasError = true; }
            if (!paymentMethod) { showToast('Payment method required', 'error'); hasError = true; }
            if (hasError) return;
            const data = { name, email, phone, address, deliveryTime, paymentMethod, notes };
            try {
                showToast('Submitting order...', 'info');
                const res = await fetch('/api/medicine-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (res.ok && result.success) {
                    showToast('Medicine request submitted!', 'success');
                    medicineOrderForm.reset();
                } else {
                    showToast(result.message || 'Order failed', 'error');
                }
            } catch (err) {
                showToast('Server error. Try again.', 'error');
            }
        });
    }
    
    // Functions
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredMedicines = medicines.filter(medicine => 
            medicine.name.toLowerCase().includes(searchTerm) ||
            medicine.genericName.toLowerCase().includes(searchTerm)
        );
        displayMedicines(filteredMedicines);
    }

    function displayMedicines(medicinesToDisplay) {
        medicinesList.innerHTML = '';
        
        medicinesToDisplay.forEach(medicine => {
            const medicineCard = document.createElement('div');
            medicineCard.className = 'medicine-card';
            medicineCard.innerHTML = `
                <h3>${medicine.name}</h3>
                <p class="generic-name">${medicine.genericName}</p>
                <p class="price">₹${medicine.price}</p>
                <p class="stock ${medicine.stock === 'In Stock' ? 'in-stock' : 'low-stock'}">${medicine.stock}</p>
                ${medicine.prescriptionRequired ? '<p class="prescription-required">Prescription Required</p>' : ''}
                <button class="btn btn-primary" onclick="addToCart(${JSON.stringify(medicine)})">
                    Add to Cart
                </button>
            `;
            medicinesList.appendChild(medicineCard);
        });
    }

    // Make addToCart and removeFromCart available globally
    window.addToCart = function(medicine) {
        const existingItem = cart.find(item => item.id === medicine.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: medicine.id,
                name: medicine.name,
                price: medicine.price,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
        showToast('Added to cart', 'success');
    };

    window.removeFromCart = function(medicineId) {
        cart = cart.filter(item => item.id !== medicineId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    };

    window.updateQuantity = function(medicineId, newQuantity) {
        const item = cart.find(item => item.id === medicineId);
        
        if (item) {
            if (newQuantity < 1) {
                removeFromCart(medicineId);
            } else {
                item.quantity = parseInt(newQuantity);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            }
        }
    };

    function updateCartUI() {
        if (cart.length === 0) {
            emptyCart.classList.remove('hidden');
            cartContent.classList.add('hidden');
            return;
        }
        
        emptyCart.classList.add('hidden');
        cartContent.classList.remove('hidden');
        
        // Update cart items
        cartItems.innerHTML = '';
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" 
                            onchange="updateQuantity('${item.id}', this.value)">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="btn btn-icon btn-danger" onclick="removeFromCart('${item.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        // Update totals
        const subtotal = calculateSubtotal();
        const deliveryFee = 40; // Fixed delivery fee
        const total = subtotal + deliveryFee;

        subtotalAmount.textContent = `₹${subtotal}`;
        totalAmount.textContent = `₹${total}`;

        // Reinitialize icons
        lucide.createIcons();
    }

    function calculateSubtotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
});

// Check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (isLoggedIn) {
        // User is logged in
        authButtons.classList.add('hidden');
        userProfile.classList.remove('hidden');
        
        // Set user name
        const userData = JSON.parse(localStorage.getItem('medicare-user'));
        const userNameElement = document.querySelector('.user-name');
        
        if (userData && userNameElement) {
            userNameElement.textContent = userData.username || userData.email.split('@')[0];
        }

        // Pre-fill user data in order form
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            document.getElementById('name').value = userData.username || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
        }
    } else {
        // User is not logged in
        authButtons.classList.remove('hidden');
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
            
            // Clear login data
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('medicare-user');
            localStorage.removeItem('cart');
            
            // Show toast message
            showToast('Logged out successfully', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }
}

// Setup Dropdown Toggle
function setupDropdownToggle() {
    const userProfileToggle = document.getElementById('userProfileToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (userProfileToggle && dropdownMenu) {
        // Toggle dropdown on click
        userProfileToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
            userProfileToggle.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!userProfileToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.add('hidden');
                userProfileToggle.classList.remove('active');
            }
        });
    }
}

// Show Toast Messages
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
