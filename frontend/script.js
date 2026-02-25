// ==========================================
// 1. GLOBAL FUNKSİYALAR
// ==========================================

async function loadProducts() {
    try {
        const sliders = {
            'new-arrivals-slider': 'http://localhost:5245/api/Product',
            'others-slider': 'http://localhost:5245/api/Product' // Replace with proper endpoint if available
        };

        for (const [id, url] of Object.entries(sliders)) {
            const slider = document.getElementById(id);
            if (!slider) continue;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch products for ${id}`);

            const products = await response.json();
            slider.innerHTML = "";

            // If it's "others", maybe filter or slice
            const displayProducts = id === 'others-slider' ? products.slice(4) : products.slice(0, 4);

            displayProducts.forEach(product => {
                slider.innerHTML += `
                    <div class="product-card" onclick="window.location.href='detail.html?id=${product.id}'">
                        <div class="card-image">
                            <img src="${product.imageUrl || 'images/placeholder.webp'}" alt="${product.name}">
                            ${product.isNew ? '<span class="tag">New</span>' : ''}
                        </div>
                        <h3>${product.name}</h3>
                        <p>${product.price}.00 AZN</p>
                        <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function slideLeft(sliderId) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        slider.scrollBy({ left: -300, behavior: 'smooth' });
    }
}

function slideRight(sliderId) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        slider.scrollBy({ left: 300, behavior: 'smooth' });
    }
}

async function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId || !document.querySelector(".product-detail-section")) return;

    try {
        const response = await fetch(`http://localhost:5245/api/Product/${productId}`);
        const product = await response.json();

        document.querySelector(".pd-title").innerText = product.name;
        document.querySelector(".pd-price").innerText = `$${product.price}.00`;
        document.querySelector(".pd-description p").innerText = product.description;
        document.querySelector(".pd-image img").src = product.imageUrl || 'images/49103715.webp';
        document.querySelector(".pd-meta span").innerText = product.code || 'COZY-' + product.id;

        const addBtn = document.querySelector(".add-to-cart-btn");
        if (addBtn) addBtn.onclick = () => addToCart(product.id);
    } catch (error) {
        console.error("Product detail error:", error);
    }
}

async function updateQty(productId, newQty) {
    const token = localStorage.getItem('token');
    if (newQty < 1) {
        removeFromCart(productId);
        return;
    }

    try {
        const response = await fetch(`http://localhost:5245/api/Basket/update-quantity?productId=${productId}&quantity=${newQty}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) loadBasket();
    } catch (error) {
        console.error("Update error:", error);
    }
}

async function removeFromCart(productId) {
    const token = localStorage.getItem('token');
    if (!confirm("Are you sure?")) return;

    try {
        const response = await fetch(`http://localhost:5245/api/Basket/remove-item?productId=${productId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) loadBasket();
    } catch (error) {
        console.error("Remove error:", error);
    }
}

async function loadBasket() {
    const token = localStorage.getItem('token');
    const tbody = document.querySelector(".cart-table tbody");
    const summaryContainer = document.querySelector(".cart-summary");

    if (!tbody || !token) return;

    try {
        const response = await fetch('http://localhost:5245/api/Basket', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const basketData = await response.json();
            const items = basketData.basketItems;

            if (!items || items.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>Your bucket is empty.</td></tr>";
                if (summaryContainer) {
                    summaryContainer.querySelector(".summary-row:nth-child(2) span:last-child").innerText = "$0.00";
                    summaryContainer.querySelector(".total span:last-child").innerText = "$0.00";
                }
                return;
            }

            let subtotal = 0;
            tbody.innerHTML = items.map(item => {
                const itemTotal = item.product.price * item.quantity;
                subtotal += itemTotal;
                return `
                    <tr>
                        <td>
                            <div class="cart-product-info">
                                <img src="${item.product.imageUrl || 'images/placeholder.webp'}" alt="${item.product.name}">
                                <div><h3>${item.product.name}</h3><span>Code: COZY-${item.product.id}</span></div>
                            </div>
                        </td>
                        <td>$${item.product.price}.00</td>
                        <td>
                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateQty(${item.productId}, ${item.quantity - 1})">-</button>
                                <input type="text" value="${item.quantity}" readonly>
                                <button class="qty-btn" onclick="updateQty(${item.productId}, ${item.quantity + 1})">+</button>
                            </div>
                        </td>
                        <td>$${itemTotal}.00</td>
                        <td><button class="remove-btn" onclick="removeFromCart(${item.productId})">Remove</button></td>
                    </tr>`;
            }).join('');

            if (summaryContainer) {
                const total = subtotal + 5;
                summaryContainer.querySelector(".summary-row:nth-child(2) span:last-child").innerText = `$${subtotal}.00`;
                summaryContainer.querySelector(".total span:last-child").innerText = `$${total}.00`;
            }
        }
    } catch (error) { console.error("Basket load error:", error); }
}

async function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please login first!");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:5245/api/Basket/add-item?productId=${productId}&quantity=1`, {
            // ... (rest of the code seems to be okay)
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) alert("Added to cart!");
        else alert("Error adding item.");
    } catch (error) { console.error("Cart error:", error); }
}

async function handleCheckout() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please login first!");
        window.location.href = 'login.html';
        return;
    }

    const address = prompt("Please enter your shipping address:");
    if (!address) {
        alert("Address is required for checkout.");
        return;
    }

    if (!confirm(`Confirm your order to be delivered to: ${address}?`)) return;

    try {
        const response = await fetch(`http://localhost:5245/api/Order/checkout?address=${encodeURIComponent(address)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (response.ok) {
            alert("Order placed successfully!");
            window.location.href = 'checklist.html';
        } else {
            const errorMsg = await response.text();
            alert("Error placing order: " + errorMsg);
        }
    } catch (error) {
        console.error("Checkout error:", error);
    }
}

// ==========================================
// 2. AUTH, DİL VƏ NAVİQASİYA
// ==========================================

function checkAuth() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const loginLink = document.querySelector('.auth-buttons');

    if (token && userName && loginLink) {
        loginLink.innerHTML = `
            <span class="user-greeting">Hi, ${userName}</span>
            <a href="#" onclick="logout()" class="logout-btn" style="color:red; margin-left:10px;">Logout</a>
        `;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5245/api/Auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.userName || email.split('@')[0]);
            window.location.href = 'index.html';
        } else {
            alert("Login failed! Please check your credentials.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login.");
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5245/api/Auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        if (response.ok) {
            alert("Registration successful! Please login.");
            window.location.href = 'login.html';
        } else {
            const errorData = await response.json();
            alert("Registration failed: " + (errorData.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred during registration.");
    }
}

window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
}

window.setLanguage = function (lang) {
    if (typeof translations === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) el.innerHTML = translations[lang][key];
    });
    localStorage.setItem('cozy_lang', lang);
}

// ==========================================
// 3. INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    checkAuth();
    loadProducts();
    loadBasket();
    loadProductDetail();

    const savedLang = localStorage.getItem('cozy_lang') || 'en';
    setTimeout(() => setLanguage(savedLang), 100);
});