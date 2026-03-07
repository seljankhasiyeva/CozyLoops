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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// 1. AUTH FUNCTIONS
// ==========================================

function saveToken(token) {
    localStorage.setItem("token", token);
    localStorage.setItem("cozyloops_token", token);
}

function getToken() {
    return localStorage.getItem("token") || localStorage.getItem("cozyloops_token");
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
    removeToken();
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
            const newArrivals = products.slice(-3).reverse();
            const others = products.length > 3 ? products.slice(0, products.length - 3) : [];
            if (newArrivalsSlider) renderToContainer(newArrivalsSlider, newArrivals);
            if (othersSlider) renderToContainer(othersSlider, others);
        }

        const productGrid = document.querySelector('.product-grid.independent-grid');
        if (productGrid) {
            window._allProducts = products;
            renderToContainer(productGrid, products);
            setupFilters(products);
        }

    } catch (error) {
        console.error("LoadProducts error:", error);
    }
}

function setupFilters(products) {
    const categoryContainer = document.getElementById('category-filters');
    const priceRange = document.getElementById('price-range');
    const priceLabel = document.getElementById('price-max-label');
    const productGrid = document.querySelector('.product-grid.independent-grid');

    if (!productGrid) return;

    // Max qiyməti məhsullara görə təyin et
    const maxProductPrice = Math.max(...products.map(p => p.price));
    if (priceRange) {
        priceRange.max = maxProductPrice;
        priceRange.value = maxProductPrice;
        if (priceLabel) priceLabel.textContent = `${maxProductPrice} AZN`;
    }

    // Seçili kateqoriyaları saxla
    const selectedCats = new Set();

    function applyFilters() {
        const maxPrice = priceRange ? parseInt(priceRange.value) : 9999;
        let filtered = window._allProducts;

        if (selectedCats.size > 0) {
            filtered = filtered.filter(p => selectedCats.has(p.categoryId));
        }

        filtered = filtered.filter(p => p.price <= maxPrice);

        if (filtered.length === 0) {
            productGrid.innerHTML = '<p style="text-align:center; padding:3rem; color:#999; grid-column:1/-1;">No products found.</p>';
        } else {
            renderToContainer(productGrid, filtered);
        }
    }

    // Kateqoriyaları API-dən çək
    // Kateqoriyaları API-dən bir dəfəyə çək
    if (categoryContainer) {
        const uniqueCategoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];

        fetch(`${BASE_URL}/api/Category`)
            .then(r => r.json())
            .then(allCategories => {
                // Yalnız məhsullarda olan kateqoriyaları götür, adı boş olanları atla
                const filtered = allCategories.filter(cat =>
                    uniqueCategoryIds.includes(cat.id) && cat.name && cat.name.trim() !== '' && cat.name !== 'string'
                );

                categoryContainer.innerHTML = filtered.map(cat => `
                <button class="cat-chip" data-id="${cat.id}">${cat.name}</button>
            `).join('');

                categoryContainer.querySelectorAll('.cat-chip').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = parseInt(btn.dataset.id);
                        if (selectedCats.has(id)) {
                            selectedCats.delete(id);
                            btn.classList.remove('active');
                        } else {
                            selectedCats.add(id);
                            btn.classList.add('active');
                        }
                        applyFilters();
                    });
                });
            })
            .catch(() => {
                categoryContainer.innerHTML = '<p style="color:#999; font-size:0.85rem;">Could not load categories.</p>';
            });
    }

    // Price filter
    // Price filter
    if (priceRange) {
        priceRange.addEventListener('input', () => {
            if (priceLabel) priceLabel.textContent = `${priceRange.value} AZN`;
            applyFilters();
        });
    }

    // Hər şey hazır olduqda sidebar-ı göstər
    const sidebar = document.querySelector('.filters-sidebar');
    if (sidebar) sidebar.classList.add('ready');  // ← bu sətri əlavə et
}

function renderToContainer(container, productList) {
    if (!container) return;
    container.innerHTML = productList.map(product => `
        <div class="product-card" onclick="window.location.href='detail.html?id=${product.id}'">
            <div class="card-image">
                <img src="${getImageUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" onerror="this.src='images/placeholder.webp'">
                ${product.isNew ? '<span class="tag">New</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${escapeHtml(product.name)}</h3>
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
        const response = await fetch(`${API_BASE_URL}/Setting/ShippingCost`);
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
    const subtotalEl = document.getElementById("subtotal-amount");
    const shippingEl = document.getElementById("shipping-amount");
    const totalEl = document.getElementById("total-amount");
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
            <img src="${getImageUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" onerror="this.src='images/placeholder.webp'">
            <div><h3>${escapeHtml(product.name)}</h3></div>
        </div>
    </td>
    <td>${product.price}.00 AZN</td>
    <td>
        <div class="qty-control">
            <button class="qty-btn" onclick="updateQuantity(${productId}, ${quantity - 1})">−</button>
            <input type="number" value="${quantity}" min="1" readonly>
            <button class="qty-btn" onclick="updateQuantity(${productId}, ${quantity + 1})">+</button>
        </div>
    </td>
    <td>${itemTotal}.00 AZN</td>
    <td><button class="remove-btn" onclick="removeItem(${productId})">Remove</button></td>
</tr>`;
            }).join('');

            if (subtotalEl) subtotalEl.textContent = `${subtotal}.00 AZN`;
            if (shippingEl) shippingEl.textContent = `${shippingCost}.00 AZN`;
            if (totalEl) totalEl.textContent = `${subtotal + shippingCost}.00 AZN`;
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
            if (window.location.pathname.includes('cart.html')) {
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
            document.querySelectorAll('#bucket-count').forEach(el => {
                el.textContent = count;
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
            ? `<a href="admin/index.html" class="account-menu-item">Admin Panel</a>`
            : '';
        authBox.innerHTML = `
            <div class="account-menu-wrap">
                <button class="account-trigger" aria-label="Account menu" aria-expanded="false">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="8" r="3.6"></circle>
                        <path d="M5 19c.8-3.2 3.6-5 7-5s6.2 1.8 7 5"></path>
                    </svg>
                </button>
                <div class="account-menu" role="menu">
                    <div class="account-menu-user">${escapeHtml(userName)}</div>
                    ${adminLink}
                    <button class="account-menu-item logout-item" type="button" onclick="window.logout()">Logout</button>
                </div>
            </div>
        `;
        setupAccountMenu();
    }
}

function setupAccountMenu() {
    if (window.__accountMenuBound) return;
    window.__accountMenuBound = true;

    document.addEventListener('click', (event) => {
        const menuWrap = document.querySelector('.account-menu-wrap');
        if (!menuWrap) return;

        const trigger = menuWrap.querySelector('.account-trigger');
        const isTriggerClick = trigger && (event.target === trigger || trigger.contains(event.target));

        if (isTriggerClick) {
            menuWrap.classList.toggle('open');
            const expanded = menuWrap.classList.contains('open');
            trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            return;
        }

        if (!menuWrap.contains(event.target)) {
            menuWrap.classList.remove('open');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const menuWrap = document.querySelector('.account-menu-wrap');
        const trigger = menuWrap?.querySelector('.account-trigger');
        menuWrap?.classList.remove('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
}

window.setLanguage = function (lang) {
    if (typeof translations === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
    });
    const langMap = { az: 'AZE', ru: 'RUS', en: 'ENG' };
    document.querySelectorAll('.lang-trigger').forEach(trigger => {
        trigger.textContent = langMap[lang] || 'ENG';
    });
    localStorage.setItem('cozy_lang', lang);
};

function setupLanguageMenu() {
    document.querySelectorAll('.lang-switch').forEach((wrap) => {
        if (wrap.dataset.bound === '1') return;
        wrap.dataset.bound = '1';

        const trigger = wrap.querySelector('.lang-trigger');
        const options = wrap.querySelectorAll('.lang-option');

        trigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = !wrap.classList.contains('open');
            document.querySelectorAll('.lang-switch.open').forEach(el => el.classList.remove('open'));
            wrap.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });

        options.forEach((btn) => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                if (lang) setLanguage(lang);
                wrap.classList.remove('open');
                trigger?.setAttribute('aria-expanded', 'false');
            });
        });
    });

    if (!window.__langMenuGlobalBound) {
        window.__langMenuGlobalBound = true;
        document.addEventListener('click', () => {
            document.querySelectorAll('.lang-switch.open').forEach((wrap) => {
                wrap.classList.remove('open');
                const trigger = wrap.querySelector('.lang-trigger');
                trigger?.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

// ==========================================
// 4. LUMA ASSISTANT
// ==========================================

const LUMA_API = "http://localhost:8000";
let lumaHistory = [];

function initAssistant() {
    const assistantBtn = document.createElement('button');
    assistantBtn.id = 'luma-assistant-btn';
    assistantBtn.className = 'luma-assistant-btn';
    assistantBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="7.8" fill="#f3dec7" stroke="#9b6b43" stroke-width="1.6"></circle>
            <path d="M7.2 12c1.2-1.6 3.4-2.6 5.6-2.6 1.8 0 3.2.6 4.1 1.5M6.8 14.8c1.2 1.1 3 1.8 5 1.8 2.1 0 3.8-.7 5-1.9M10.2 7.7c-.7 1.3-.8 2.8-.4 4.1.5 1.6 1.8 2.9 3.5 3.4" fill="none" stroke="#9b6b43" stroke-width="1.6" stroke-linecap="round"></path>
            <path d="M18.6 17.8l2.7 2.4" fill="none" stroke="#d7b38e" stroke-width="1.8" stroke-linecap="round"></path>
        </svg>
    `;
    assistantBtn.title = 'LUMA Assistant';
    assistantBtn.onclick = openAssistant;
    document.body.appendChild(assistantBtn);

    const modal = document.createElement('div');
    modal.id = 'luma-modal';
    modal.className = 'luma-modal';
    modal.innerHTML = `
        <div class="luma-modal-content">
            <div class="luma-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:32px; height:32px; background:#c9a96e; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; color:#fff;">L</div>
                    <div>
                        <div style="font-weight:600; font-size:1rem;">LUMA</div>
                        <div style="font-size:0.75rem; opacity:0.7;">CozyLoops Assistant</div>
                    </div>
                </div>
                <button class="luma-close-btn" onclick="closeAssistant()">&times;</button>
            </div>
            <div class="luma-messages" id="luma-messages">
                <div class="luma-message luma">Salam! Məhsullar, materiallar və ya sifarişlər haqqında sual ver, kömək edim! 🧶</div>
            </div>
            <div class="luma-input-area">
                <input type="text" id="luma-input" placeholder="Sualınızı yazın..." class="luma-input">
                <button onclick="sendLumaMessage()" id="luma-send-btn" class="luma-send-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Enter key
    modal.querySelector('#luma-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendLumaMessage();
    });

    if (!document.getElementById('luma-styles')) {
        const style = document.createElement('style');
        style.id = 'luma-styles';
        style.textContent = `
            .luma-assistant-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #211b19;
                color: white;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s;
                z-index: 999;
            }
            .luma-assistant-btn svg { width: 32px; height: 32px; }
            .luma-assistant-btn:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
            .luma-modal {
                display: none;
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 350px;
                height: 480px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 1000;
                flex-direction: column;
                overflow: hidden;
            }
            .luma-modal.open { display: flex; }
            .luma-modal-content { display: flex; flex-direction: column; height: 100%; }
            .luma-header {
                padding: 1rem 1.2rem;
                background: #211b19;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }
            .luma-close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; line-height: 1; }
            .luma-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                background: #f9f7f5;
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
            }
            .luma-message {
                padding: 0.7rem 1rem;
                border-radius: 12px;
                max-width: 85%;
                font-size: 0.9rem;
                line-height: 1.5;
                word-wrap: break-word;
            }
            .luma-message.user {
                background: #211b19;
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 3px;
            }
            .luma-message.luma {
                background: #ede9e4;
                color: #2D2420;
                border-bottom-left-radius: 3px;
            }
            .luma-typing {
                display: flex;
                gap: 4px;
                align-items: center;
                padding: 0.7rem 1rem;
                background: #ede9e4;
                border-radius: 12px;
                border-bottom-left-radius: 3px;
                width: fit-content;
            }
            .luma-typing span {
                width: 7px; height: 7px;
                background: #9b6b43;
                border-radius: 50%;
                animation: lumaBounce 1.2s infinite;
            }
            .luma-typing span:nth-child(2) { animation-delay: 0.2s; }
            .luma-typing span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes lumaBounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-5px); }
            }
            .luma-input-area {
                display: flex;
                gap: 0.5rem;
                padding: 0.8rem 1rem;
                border-top: 1px solid #eee;
                background: white;
                flex-shrink: 0;
            }
            .luma-input {
                flex: 1;
                border: 1px solid #ddd;
                padding: 0.6rem 1rem;
                border-radius: 20px;
                font-family: var(--font-body);
                font-size: 0.9rem;
                outline: none;
                transition: border-color 0.3s;
            }
            .luma-input:focus { border-color: #c9a96e; }
            .luma-send-btn {
                background: #211b19;
                color: white;
                border: none;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: background 0.3s;
            }
            .luma-send-btn:hover { background: #c9a96e; }
            .luma-send-btn:disabled { background: #ccc; cursor: not-allowed; }
            @media (max-width: 600px) {
                .luma-modal { width: calc(100% - 40px); bottom: 90px; right: 20px; }
                .luma-assistant-btn { bottom: 20px; right: 20px; width: 50px; height: 50px; }
            }
        `;
        document.head.appendChild(style);
    }
}

window.openAssistant = function () {
    document.getElementById('luma-modal')?.classList.add('open');
};

window.closeAssistant = function () {
    document.getElementById('luma-modal')?.classList.remove('open');
};

window.sendLumaMessage = async function () {
    const input = document.getElementById('luma-input');
    const messagesDiv = document.getElementById('luma-messages');
    const sendBtn = document.getElementById('luma-send-btn');
    const text = input.value.trim();
    if (!text) return;

    // User mesajı
    const userMsg = document.createElement('div');
    userMsg.className = 'luma-message user';
    userMsg.textContent = text;
    messagesDiv.appendChild(userMsg);
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    lumaHistory.push({ role: 'user', content: text });

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'luma-typing';
    typing.id = 'luma-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesDiv.appendChild(typing);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    sendBtn.disabled = true;

    try {
        // Hazırda hansı məhsulun detail səhifəsindəyik
        const productId = new URLSearchParams(window.location.search).get('id');
        const lang = localStorage.getItem('cozy_lang') || 'en';

        const formData = new FormData();
        formData.append('message', text);
        formData.append('lang', lang);
        formData.append('conversation_history', JSON.stringify(lumaHistory.slice(-10)));
        if (productId) formData.append('product_id', productId);

        const response = await fetch(`${LUMA_API}/ask-luma`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        const reply = data.reply || 'Xəta baş verdi.';

        lumaHistory.push({ role: 'assistant', content: reply });

        document.getElementById('luma-typing')?.remove();

        const lumaMsg = document.createElement('div');
        lumaMsg.className = 'luma-message luma';
        lumaMsg.textContent = reply;
        messagesDiv.appendChild(lumaMsg);

    } catch (e) {
        document.getElementById('luma-typing')?.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'luma-message luma';
        errMsg.textContent = 'Bağlantı xətası. Python server işləyirmi?';
        messagesDiv.appendChild(errMsg);
    }

    sendBtn.disabled = false;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};
// ==========================================
// 5. INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initAssistant();
    checkAuth();
    setupLanguageMenu();
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
                loadReviews(p.id);
                loadRelatedProducts(p.categoryId, p.id);
                updateReviewFormVisibility();

                // Attach review form handler
                const reviewForm = document.getElementById('review-form');
                if (reviewForm) {
                    reviewForm.addEventListener('submit', (e) => handleReviewSubmit(e, id));
                }
            }
        })();
    }

    const savedLang = localStorage.getItem('cozy_lang') || 'en';
    setLanguage(savedLang);
    document.documentElement.style.visibility = 'visible';
});

// Slider Navigation
window.slideLeft = (id) => document.getElementById(id)?.scrollBy({ left: -300, behavior: 'smooth' });
window.slideRight = (id) => document.getElementById(id)?.scrollBy({ left: 300, behavior: 'smooth' });

// ==========================================
// 6. REVIEWS
// ==========================================

async function loadReviews(productId) {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;

    try {
        const response = await fetch(`${BASE_URL}/api/Review/product/${productId}`);
        if (response.ok) {
            const reviews = await response.json();
            if (!reviews || reviews.length === 0) {
                reviewsList.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">No reviews yet. Be the first to review!</p>';
                return;
            }

            // Calculate average rating
            const avgRating = (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1);
            const ratingEl = document.querySelector('.rating-number');
            const countEl = document.querySelector('.review-count');

            if (ratingEl) ratingEl.textContent = avgRating;
            if (countEl) countEl.textContent = `Based on ${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;

            // Render reviews
            reviewsList.innerHTML = reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <h4 class="reviewer-name">${escapeHtml(review.userName || 'Anonymous')}</h4>
                            <div class="review-stars">
                                ${Array(5).fill(0).map((_, i) => `<span class="star ${i < review.rating ? 'filled' : ''}">&#9733;</span>`).join('')}
                            </div>
                        </div>
                        <span class="review-date">${new Date(review.createdDate).toLocaleDateString()}</span>
                    </div>
                    <p class="review-comment">${escapeHtml(review.comment)}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Handle review form submission
async function handleReviewSubmit(event, productId) {
    event.preventDefault();

    if (!getToken()) {
        alert('Please login to submit a review.');
        window.location.href = 'login.html';
        return;
    }

    const rating = document.querySelector('input[name="rating"]:checked');
    const comment = document.getElementById('review-comment').value.trim();

    if (!rating) {
        alert('Please select a rating.');
        return;
    }

    if (!comment) {
        alert('Please write a review.');
        return;
    }

    try {
        const response = await authFetch(`${BASE_URL}/api/Review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: parseInt(productId),
                rating: parseInt(rating.value),
                comment: comment
            })
        });

        if (response.ok) {
            alert('Review submitted successfully!');
            document.getElementById('review-form').reset();
            loadReviews(productId); // Reload reviews
        } else {
            const error = await response.text();
            alert('Failed to submit review: ' + error);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review. Please try again.');
    }
}

// Load related products from the same category
async function loadRelatedProducts(categoryId, currentProductId) {
    const grid = document.getElementById('related-products-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${BASE_URL}/api/Product`);
        if (response.ok) {
            const products = await response.json();
            const related = products.filter(p => p.categoryId === categoryId && p.id !== currentProductId).slice(0, 3);

            if (related.length === 0) {
                grid.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">No related products found.</p>';
                return;
            }

            grid.innerHTML = related.map(product => `
                <div class="product-card" onclick="window.location.href='detail.html?id=${product.id}'">
                    <div class="card-image">
                        <img src="${getImageUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}" onerror="this.src='images/placeholder.webp'">
                    </div>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${product.price}.00 AZN</p>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

// Show/hide review form based on login status
function updateReviewFormVisibility() {
    const formSection = document.getElementById('review-form-section');
    const user = getUser();

    if (formSection) {
        if (user) {
            formSection.style.display = 'block';
        } else {
            formSection.style.display = 'none';
        }
    }
}
