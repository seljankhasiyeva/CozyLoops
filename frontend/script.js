// ==========================================
// COZY LOOPS - ALL-IN-ONE SCRIPT
// ==========================================
const BASE_URL = "http://localhost:5245";

// Şəkil yolunu və xətaları idarə edən funksiya
function getImageUrl(url) {
    if (!url) return 'images/placeholder.webp';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${BASE_URL}/${cleanUrl}`;
}

// ==========================================
// 1. MƏHSULLARIN YÜKLƏNMƏSİ (INDEX & PRODUCTS)
// ==========================================

async function loadProducts() {
    try {
        const response = await fetch(`${BASE_URL}/api/Product`);
        if (!response.ok) throw new Error("API Connection error");
        let products = await response.json();

        // 1a. Index Slider-ləri üçün (New Arrivals & Others)
        const newArrivalsSlider = document.getElementById('new-arrivals-slider');
        const othersSlider = document.getElementById('others-slider');

        if (newArrivalsSlider || othersSlider) {
            const newArrivals = products.slice(-4).reverse();
            const others = products.length > 4 ? products.slice(0, products.length - 4) : [];

            if (newArrivalsSlider) renderToContainer(newArrivalsSlider, newArrivals);
            if (othersSlider) renderToContainer(othersSlider, others);
        }

        // 1b. Products Grid (Məhsullar səhifəsi) üçün
        const productGrid = document.querySelector('.product-grid.independent-grid');
        if (productGrid) renderToContainer(productGrid, products);

    } catch (error) {
        console.error("LoadProducts error:", error);
    }
}

// Kartları generaciya edən tək funksiya (Ziq-zaq problemini həll edir)
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
// 2. SƏBƏT VƏ ORDER MƏNTİQİ
// ==========================================

async function loadBasketItems() {
    const tbody = document.querySelector(".cart-table tbody");
    const subtotalEl = document.querySelector(".summary-row span:last-child"); // Subtotal element
    const totalEl = document.querySelector(".summary-row.total span:last-child"); // Total element
    const token = localStorage.getItem('token');

    if (!tbody || !token) return;

    try {
        const response = await fetch(`${BASE_URL}/api/Basket`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const basket = await response.json();
            const items = basket.basketItems || [];

            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">Your bucket is empty.</td></tr>`;
                return;
            }

            let subtotal = 0;
            tbody.innerHTML = items.map(item => {
                const itemTotal = item.product.price * item.quantity;
                subtotal += itemTotal;
                
                // Using your exact HTML structure from card.html
                return `
                <tr>
                    <td>
                        <div class="cart-product-info">
                            <img src="${item.product.imageUrl || 'images/placeholder.webp'}" alt="${item.product.name}">
                            <div><h3>${item.product.name}</h3></div>
                        </div>
                    </td>
                    <td>$${item.product.price}.00</td>
                    <td>
                        <div class="qty-control">
                            <button onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td>$${itemTotal}.00</td>
                    <td><button class="remove-btn" onclick="removeItem(${item.productId})">×</button></td>
                </tr>`;
            }).join('');

            // Update Summary
            if (subtotalEl) subtotalEl.innerText = `$${subtotal}.00`;
            if (totalEl) totalEl.innerText = `$${subtotal + 5}.00`; // Assuming $5 shipping
        }
    } catch (error) {
        console.error("Error loading basket:", error);
    }
}

async function addToCart(productId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Please login to add items to your bucket!");
        window.location.href = 'login.html';
        return;
    }

    try {
        // Matches your C# Controller: AddItemToBasket(int productId, int quantity)
        const response = await fetch(`${BASE_URL}/api/Basket/add-item?productId=${productId}&quantity=1`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert("Product added to bucket!");
            // Update the count in the navbar immediately
            updateBucketCount(); 
            
            // If we are currently on the card.html page, refresh the list
            if (window.location.pathname.includes('card.html')) {
                loadBasketItems();
            }
        } else {
            const error = await response.text();
            console.error("Server responded with error:", error);
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

async function updateBucketCount() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${BASE_URL}/api/Basket`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const count = (data.basketItems || []).reduce((sum, i) => sum + i.quantity, 0);
            const bucketLinks = document.querySelectorAll('a[href="card.html"]');
            bucketLinks.forEach(link => link.innerText = `Bucket (${count})`);
        }
    } catch (e) { console.log("Count update failed"); }
}

// ==========================================
// 3. AUTH VƏ DİL
// ==========================================

function checkAuth() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const authBox = document.querySelector('.auth-buttons');
    if (token && userName && authBox) {
        authBox.innerHTML = `
            <span class="user-greeting">Hi, ${userName}</span>
            <a href="#" onclick="logout()" class="logout-link" style="color:#ff4d4d; margin-left:15px; font-weight:500;">Logout</a>
        `;
    }
}

window.logout = function() {
    localStorage.clear();
    window.location.href = 'index.html';
}

window.setLanguage = function(lang) {
    if (typeof translations === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) el.innerHTML = translations[lang][key];
    });
    localStorage.setItem('cozy_lang', lang);
}

// 2b. UPDATE QUANTITY
window.updateQuantity = async function(productId, newQty) {
    if (newQty < 1) return removeItem(productId);
    const token = localStorage.getItem('token');
    
    try {
        // Bu hissə sənin backend-dəki update endpoint-inə uyğun olmalıdır
        const response = await fetch(`${BASE_URL}/api/Basket/update-quantity?productId=${productId}&quantity=${newQty}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadBasketItems(); // Cədvəli yenidən yüklə
            updateBucketCount(); // Navbardakı rəqəmi yenilə
        }
    } catch (error) { console.error("Update error:", error); }
}

async function handleCheckout() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Backend-dəki Order controller-inə uyğun:
        const response = await fetch(`${BASE_URL}/api/Order/checkout?address=Home`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Order placed successfully!");
            window.location.href = 'checklist.html';
        } else {
            alert("Something went wrong during checkout.");
        }
    } catch (error) { console.error("Checkout error:", error); }
}

// 2c. REMOVE ITEM
window.removeItem = async function(productId) {
    if (!confirm("Are you sure you want to remove this item?")) return;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${BASE_URL}/api/Basket/remove-item?productId=${productId}`, {
            method: 'POST', // Və ya DELETE (backend-dən asılıdır)
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadBasketItems();
            updateBucketCount();
        }
    } catch (error) { console.error("Remove error:", error); }
}

// ==========================================
// 4. BAŞLATMA (INIT)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadProducts();
    updateBucketCount();
    if (document.querySelector(".cart-table")) {
        loadBasketItems();
    }
    
    // Detal səhifəsi üçündürsə
    if (document.getElementById('main-product-img')) {
        const loadProductDetail = async () => {
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
        };
        loadProductDetail();
    }

    const savedLang = localStorage.getItem('cozy_lang') || 'en';
    setTimeout(() => setLanguage(savedLang), 150);
});

// Slider Naviqasiyası
window.slideLeft = (id) => document.getElementById(id)?.scrollBy({ left: -300, behavior: 'smooth' });
window.slideRight = (id) => document.getElementById(id)?.scrollBy({ left: 300, behavior: 'smooth' });