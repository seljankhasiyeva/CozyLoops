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
        // Admin isÃƒÆ’Ã¢â‚¬Â°ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ admin panelÃƒÆ’Ã¢â‚¬Â°ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ yÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶nlÃƒÆ’Ã¢â‚¬Â°ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ndir
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
                            <button onclick="updateQuantity(${productId}, ${quantity - 1})">-</button>
                            <span>${quantity}</span>
                            <button onclick="updateQuantity(${productId}, ${quantity + 1})">+</button>
                        </div>
                    </td>
                    <td>${itemTotal}.00 AZN</td>
                    <td><button class="remove-btn" onclick="removeItem(${productId})">ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</button></td>
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
// 4. LUNA ASSISTANT
// ==========================================

function initAssistant() {
    // Create floating assistant button
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

    // Create assistant modal
    const modal = document.createElement('div');
    modal.id = 'luma-modal';
    modal.className = 'luma-modal';
    modal.innerHTML = `
        <div class="luma-modal-content">
            <div class="luma-header">
                <h3>LUMA Assistant</h3>
                <button class="luma-close-btn" onclick="closeAssistant()">&times;</button>
            </div>
            <div class="luma-messages"></div>
            <div class="luma-input-area">
                <input type="text" id="luma-input" placeholder="Tell me your ideas..." class="luma-input">
                <button onclick="sendLumaMessage()" class="luma-send-btn">Send</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add styles dynamically
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
            .luma-assistant-btn svg {
                width: 32px;
                height: 32px;
            }
            .luma-assistant-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            }
            .luma-modal {
                display: none;
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 350px;
                max-height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 1000;
                flex-direction: column;
            }
            .luma-modal.open {
                display: flex;
            }
            .luma-modal-content {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .luma-header {
                padding: 1rem;
                background: #211b19;
                color: white;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .luma-header h3 {
                margin: 0;
                font-size: 1.1rem;
            }
            .luma-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            .luma-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                background: #f9f9f9;
            }
            .luma-message {
                margin-bottom: 0.8rem;
                padding: 0.8rem;
                border-radius: 8px;
                max-width: 85%;
                word-wrap: break-word;
            }
            .luma-message.user {
                background: #211b19;
                color: white;
                margin-left: auto;
            }
            .luma-message.luma {
                background: #e8e8e8;
                color: #333;
            }
            .luma-input-area {
                display: flex;
                gap: 0.5rem;
                padding: 1rem;
                border-top: 1px solid #eee;
                background: white;
                border-radius: 0 0 12px 12px;
            }
            .luma-input {
                flex: 1;
                border: 1px solid #ddd;
                padding: 0.5rem;
                border-radius: 4px;
                font-family: var(--font-body);
            }
            .luma-send-btn {
                background: #211b19;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }
            @media (max-width: 600px) {
                .luma-modal {
                    width: calc(100% - 40px);
                    bottom: 90px;
                    right: 20px;
                }
                .luma-assistant-btn {
                    bottom: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    font-size: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

window.openAssistant = function() {
    const modal = document.getElementById('luma-modal');
    if (modal) modal.classList.add('open');
};

window.closeAssistant = function() {
    const modal = document.getElementById('luma-modal');
    if (modal) modal.classList.remove('open');
};

window.sendLumaMessage = function() {
    const input = document.getElementById('luma-input');
    const messagesDiv = document.querySelector('.luma-messages');
    
    if (!input.value.trim()) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'luma-message user';
    userMsg.textContent = input.value;
    messagesDiv.appendChild(userMsg);
    
    // Simulate LUMA response (can be connected to actual AI)
    setTimeout(() => {
        const lumaMsg = document.createElement('div');
        lumaMsg.className = 'luma-message luma';
        lumaMsg.textContent = 'Thanks for your message! This feature will be connected to our AI assistant soon.';
        messagesDiv.appendChild(lumaMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 500);
    
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

// ==========================================
// 5. INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initAssistant();
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
    setTimeout(() => setLanguage(savedLang), 150);
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
