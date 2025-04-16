// Cart state
let cart = [];
let subtotal = 0;

// Add to cart function
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id,
            name,
            price,
            quantity: 1
        });
    }
    updateCart();
    showToast('Item added to cart');
}

// Update cart display
function updateCart() {
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');
    const cartItems = document.getElementById('cartItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const totalAmount = document.getElementById('totalAmount');

    if (cart.length === 0) {
        cartContent.classList.add('hidden');
        emptyCart.classList.remove('hidden');
        return;
    }

    cartContent.classList.remove('hidden');
    emptyCart.classList.add('hidden');

    // Clear current items
    cartItems.innerHTML = '';
    subtotal = 0;

    // Add each item to the cart
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        cartItems.innerHTML += `
            <div class="flex items-center justify-between p-2 border-b">
                <div>
                    <h4 class="font-medium">${item.name}</h4>
                    <div class="text-sm text-gray-500">₹${item.price} × ${item.quantity}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-medium">₹${itemTotal}</span>
                    <button onclick="removeFromCart('${item.id}')" class="text-primary hover:text-primary-dark transition-colors">
                        <i data-lucide="trash-2" class="icon-sm"></i>
                    </button>
                </div>
            </div>
        `;
    });

    // Update totals
    subtotalAmount.textContent = `₹${subtotal}`;
    totalAmount.textContent = `₹${subtotal + 40}`; // Adding delivery fee
    lucide.createIcons();
}

// Remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
    showToast('Item removed from cart');
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} fade-in`;
    toast.innerHTML = message;
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Handle order placement
document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate cart is not empty
    if (cart.length === 0) {
        showToast('Please add items to your cart first', 'error');
        return;
    }

    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        specialInstructions: document.getElementById('specialInstructions').value,
        items: cart,
        subtotal: subtotal,
        deliveryFee: 40,
        total: subtotal + 40
    };

    // Show success message first
    showToast('Order placed successfully! Thank you for your purchase. 🎉');

    // Clear cart after a small delay to ensure toast is shown
    setTimeout(() => {
        // Clear cart
        cart = [];
        updateCart();

        // Reset form
        e.target.reset();
        document.getElementById('fileNameDisplay').textContent = 'No file chosen';
    }, 100);
});

// Handle file upload
document.getElementById('uploadBtn').addEventListener('click', function() {
    document.getElementById('prescriptionUpload').click();
});

document.getElementById('prescriptionUpload').addEventListener('change', function() {
    const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
    document.getElementById('fileNameDisplay').textContent = fileName;
});

// Initialize cart on page load
updateCart();
