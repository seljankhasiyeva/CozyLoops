// ==========================================
// COZY LOOPS - ALL-IN-ONE SCRIPT
// ==========================================
const BASE_URL = "http://localhost:5245";
const API_BASE_URL = `${BASE_URL}/api`;

function getImageUrl(url) {
    if (!url) return 'images/placeholder.webp';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${BASE_URL}/${cleanUrl}`;
}

// ==========================================
// 1. AUTH FUNCTIONS
// ==========================================

function saveToken(token) {
    localStorage.setItem("token", token);
    localStorage.setItem("cozyloops_token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

function removeToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("cozyloops_token");
    localStorage.removeItem("cozyloops_user");
    localStorage.removeItem("userName");
    localStorage.removeItem("isAdmin");
}

function saveUser(user) {
    localStorage.setItem("cozyloops_user", JSON.stringify(user));
    localStorage.setItem("userName", user.userName);
}

function getUser() {
    const user = localStorage.getItem("cozyloops_user");
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    return localStorage.getItem("isAdmin") === "true";
}

async function register(fullName, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            return { success: true, message: data.message || "Registration successful!" };
        } else {
            const errors = Array.isArray(data)
                ? data.map((e) => e.description).join(" ")
                : data.message || "Registration failed.";
            return { success: false, message: errors };
        }
    } catch (error) {
        console.error("Register error:", error);
        return { success: false, message: "Could not connect to the server." };
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            saveToken(data.token);
            saveUser({ userName: data.userName, expiration: data.expiration });
            localStorage.setItem("isAdmin", data.isAdmin ? "true" : "false");
            return { success: true, message: data.message, userName: data.userName, isAdmin: data.isAdmin };
        } else {
            return { success: false, message: data.message || "Login failed." };
        }
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: "Could not connect to the server." };
    }
}

window.logout = function () {
    localStorage.clear();
    window.location.href = 'index.html';
};

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        window.logout();
        throw new Error("Session expired. Please log in again.");
    }
    return response;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const errorEl = document.getElementById('login-error');
    if (!email || !password) return;
    const result = await login(email, password);
    if (result.success) {
        // Admin isə admin panelə yönləndir
        if (result.isAdmin) {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'index.html';
        }
    } else {
        if (errorEl) errorEl.innerText = result.message;
        else alert(result.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('register-fullname')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const errorEl = document.getElementById('register-error');
    if (!fullName || !email || !password) return;
    const result = await register(fullName, email, password);
    if (result.success) {
        alert("Registration successful! Please log in.");
        window.location.href = 'login.html';
    } else {
        if (errorEl) errorEl.innerText = result.message;
        else alert(result.message);
    }
}

// ==========================================
// 2. PRODUCTS
// ==========================================

async function loadProducts() {
    try {
        const response = await fetch(`${BASE_URL}/api/Product`);
        if (!response.ok) throw new Error("API Connection error");
        const products = await response.json();

        const newArrivalsSlider = document.getElementById('new-arrivals-slider');
        const othersSlider = document.getElementById('others-slider');

        if (newArrivalsSlider || othersSlider) {
            const newArrivals = products.slice(-4).reverse();
            const others = products.length > 4 ? products.slice(0, products.length - 4) : [];
            if (newArrivalsSlider) renderToContainer(newArrivalsSlider, newArrivals);
            if (othersSlider) renderToContainer(othersSlider, others);
        }

        const productGrid = document.querySelector('.product-grid.independent-grid');
        if (productGrid) renderToContainer(productGrid, products);

    } catch (error) {
        console.error("LoadProducts error:", error);
    }
}

function renderToContainer(container, productList) {
    if (!container) return;
    container.innerHTML = productList.map(product => `
        <div class="product-card" onclick="window.location.href='detail.html?id=${product.id}'">
            <div class="card-image">
                <img src="${getImageUrl(product.imageUrl)}" alt="${product.name}" onerror="this.src='images/placeholder.webp'">
                ${product.isNew ? '<span class="tag">New</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price}.00 AZN</p>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 3. BASKET
// ==========================================

function getBasketItems(basket) {
    return basket.basketItems || basket.BasketItems || [];
}

async function getShippingCost() {
    try {
        const response = await fetch(`${API_BASE_URL}/Settings/ShippingCost`);
        if (response.ok) {
            const data = await response.json();
            return parseFloat(data.value) || 5;
        }
    } catch (e) {
        console.log("Shipping cost fetch failed, using default.");
    }
    return 5;
}

async function loadBasketItems() {
    const tbody = document.querySelector(".cart-table tbody");
    const subtotalEl = document.querySelector(".summary-row span:last-child");
    const totalEl = document.querySelector(".summary-row.total span:last-child");
    const token = getToken();

    if (!tbody) return;

    if (!token) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">Please <a href="login.html">login</a> to view your basket.</td></tr>`;
        return;
    }

    try {
        const [basketResponse, shippingCost] = await Promise.all([
            fetch(`${BASE_URL}/api/Basket`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            getShippingCost()
        ]);

        if (basketResponse.status === 401) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">Session expired. Please <a href="login.html">login again</a>.</td></tr>`;
            return;
        }

        if (basketResponse.status === 404) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">Your basket is empty.</td></tr>`;
            return;
        }

        if (basketResponse.ok) {
            const basket = await basketResponse.json();
            const items = getBasketItems(basket);

            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">Your basket is empty.</td></tr>`;
                return;
            }

            let subtotal = 0;
            tbody.innerHTML = items.map(item => {
                const product = item.product || item.Product;
                const productId = item.productId || item.ProductId;
                const quantity = item.quantity || item.Quantity;
                const itemTotal = product.price * quantity;
                subtotal += itemTotal;
                return `
                <tr>
                    <td>
                        <div class="cart-product-info">
                            <img src="${getImageUrl(product.imageUrl)}" alt="${product.name}" onerror="this.src='images/placeholder.webp'">
                            <div><h3>${product.name}</h3></div>
                        </div>
                    </td>
                    <td>${product.price}.00 AZN</td>
                    <td>
                        <div class="qty-control">
                            <button onclick="updateQuantity(${productId}, ${quantity - 1})">-</button>
                            <span>${quantity}</span>
                            <button onclick="updateQuantity(${productId}, ${quantity + 1})">+</button>
                        </div>
                    </td>
                    <td>${itemTotal}.00 AZN</td>
                    <td><button class="remove-btn" onclick="removeItem(${productId})">×</button></td>
                </tr>`;
            }).join('');

            if (subtotalEl) subtotalEl.innerText = `${subtotal}.00 AZN`;
            if (totalEl) totalEl.innerText = `${subtotal + shippingCost}.00 AZN`;
        }
    } catch (error) {
        console.error("Error loading basket:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:red;">Error loading basket.</td></tr>`;
    }
}

async function addToCart(productId) {
    const token = getToken();
    if (!token) {
        alert("Please login to add items to your basket!");
        window.location.href = 'login.html';
        return;
    }
    try {
        const response = await fetch(`${BASE_URL}/api/Basket/add-item?productId=${productId}&quantity=1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            alert("Product added to basket!");
            updateBucketCount();
            if (window.location.pathname.includes('card.html')) {
                loadBasketItems();
            }
        } else if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = 'login.html';
        } else {
            const error = await response.text();
            console.error("Server error:", error);
            alert("Could not add item. Please try again.");
        }
    } catch (error) {
        console.error("Network error:", error);
        alert("Could not connect to server.");
    }
}

async function updateBucketCount() {
    const token = getToken();
    if (!token) return;
    try {
        const response = await fetch(`${BASE_URL}/api/Basket`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const items = getBasketItems(data);
            const count = items.reduce((sum, i) => sum + (i.quantity || i.Quantity || 0), 0);
            document.querySelectorAll('a[href="card.html"]').forEach(link => {
                link.innerText = `Bucket (${count})`;
            });
        }
    } catch (e) {
        console.log("Count update failed");
    }
}

window.updateQuantity = async function (productId, newQty) {
    if (newQty < 1) return window.removeItem(productId);
    const token = getToken();
    try {
        const response = await fetch(`${BASE_URL}/api/Basket/update-quantity?productId=${productId}&quantity=${newQty}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadBasketItems();
            updateBucketCount();
        }
    } catch (error) { console.error("Update error:", error); }
};

window.removeItem = async function (productId) {
    if (!confirm("Are you sure you want to remove this item?")) return;
    const token = getToken();
    try {
        const response = await fetch(`${BASE_URL}/api/Basket/remove-item?productId=${productId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadBasketItems();
            updateBucketCount();
        }
    } catch (error) { console.error("Remove error:", error); }
};

async function handleCheckout() {
    const token = getToken();
    if (!token) {
        alert("Please login to checkout.");
        window.location.href = 'login.html';
        return;
    }
    try {
        const response = await fetch(`${BASE_URL}/api/Order/checkout?address=Home`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            alert(`Order placed! Order #${data.orderNumber} | Total: ${data.total}.00 AZN`);
            window.location.href = 'checklist.html';
        } else {
            const err = await response.json();
            alert(err.message || "Something went wrong during checkout.");
        }
    } catch (error) { console.error("Checkout error:", error); }
}

// ==========================================
// 4. NAVBAR AUTH CHECK
// ==========================================

function checkAuth() {
    const token = getToken();
    const userName = localStorage.getItem('userName');
    const authBox = document.querySelector('.auth-buttons');
    if (token && userName && authBox) {
        const adminLink = isAdmin()
            ? `<a href="admin/index.html" style="color:#c9a96e; margin-left:15px; font-weight:500;">Admin Panel</a>`
            : '';
        authBox.innerHTML = `
            <span class="user-greeting">Hi, ${userName}</span>
            ${adminLink}
            <a href="#" onclick="window.logout()" class="logout-link" style="color:#ff4d4d; margin-left:15px; font-weight:500;">Logout</a>
        `;
    }
}

window.setLanguage = function (lang) {
    if (typeof translations === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
    });
    localStorage.setItem('cozy_lang', lang);
};

// ==========================================
// 5. INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadProducts();
    updateBucketCount();

    if (document.querySelector(".cart-table")) {
        loadBasketItems();
    }

    const regForm = document.getElementById('register-form');
    if (regForm) regForm.addEventListener('submit', handleRegister);

    const logForm = document.getElementById('login-form');
    if (logForm) logForm.addEventListener('submit', handleLogin);

    if (document.getElementById('main-product-img')) {
        (async () => {
            const id = new URLSearchParams(window.location.search).get('id');
            if (!id) return;
            const res = await fetch(`${BASE_URL}/api/Product/${id}`);
            if (res.ok) {
                const p = await res.json();
                document.getElementById('main-product-img').src = getImageUrl(p.imageUrl);
                document.getElementById('main-product-title').innerText = p.name;
                document.getElementById('main-product-price').innerText = `${p.price}.00 AZN`;
                document.getElementById('main-product-desc').innerText = p.description || 'Handmade quality.';
                const btn = document.getElementById('main-add-btn');
                if (btn) btn.onclick = () => addToCart(p.id);
            }
        })();
    }

    const savedLang = localStorage.getItem('cozy_lang') || 'en';
    setTimeout(() => setLanguage(savedLang), 150);
});

// Slider Navigation
window.slideLeft = (id) => document.getElementById(id)?.scrollBy({ left: -300, behavior: 'smooth' });
window.slideRight = (id) => document.getElementById(id)?.scrollBy({ left: 300, behavior: 'smooth' });