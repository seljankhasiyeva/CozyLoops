// ==========================================
// COZY LOOPS - ADMIN PANEL SCRIPT
// ==========================================

const API_BASE = "http://localhost:5245/api";

function getToken() {
    return localStorage.getItem('token');
}

document.addEventListener('DOMContentLoaded', function () {

    // ── Sidebar Toggle ──────────────────────────────
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // ── Page Detection & Data Loading ───────────────
    if (document.getElementById('products-table'))      fetchProducts();
    if (document.getElementById('orders-table'))        fetchOrders();
    if (document.getElementById('customers-table'))     fetchCustomers();
    if (document.getElementById('recent-orders-table')) renderRecentOrders();
    if (document.getElementById('stat-total-sales'))    loadStats();
    if (document.getElementById('salesChart'))          initSalesChart();
    if (document.getElementById('shipping-cost-input')) loadShippingCost();
});

// ==========================================
// 1. DASHBOARD STATS
// ==========================================

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/Order/stats`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) return;
        const stats = await response.json();

        const salEl = document.getElementById('stat-total-sales');
        const ordEl = document.getElementById('stat-total-orders');
        const cusEl = document.getElementById('stat-total-customers');

        if (salEl) salEl.innerText = `$${stats.totalSales.toFixed(2)}`;
        if (ordEl) ordEl.innerText = stats.totalOrders;
        if (cusEl) cusEl.innerText = stats.totalCustomers;
    } catch (error) {
        console.error("Stats load error:", error);
    }
}

// ==========================================
// 2. PRODUCTS
// ==========================================

async function fetchProducts() {
    const tableBody = document.getElementById('products-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/Product`);
        if (!response.ok) throw new Error('Failed to fetch');

        const products = await response.json();

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No products found.</td></tr>';
            return;
        }

        tableBody.innerHTML = products.map(product => `
            <tr>
                <td class="product-img-td">
                    <img src="${product.imageUrl ? 'http://localhost:5245' + product.imageUrl : '../images/placeholder.webp'}"
                         alt="${product.name}"
                         onerror="this.src='../images/placeholder.webp'">
                </td>
                <td style="font-weight:500;">${product.name}</td>
                <td>${product.category ? product.category.name : 'Uncategorized'}</td>
                <td>${product.price}.00 AZN</td>
                <td class="stock-status ${product.stock > 5 ? 'stock-ok' : 'stock-low'}">${product.stock} in stock</td>
                <td><span class="status-pills status-completed">Active</span></td>
                <td>
                    <a href="edit-product.html?id=${product.id}" class="btn-action"><i class="fas fa-edit"></i></a>
                    <button class="btn-action" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Products load error:", error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading products.</td></tr>';
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        const response = await fetch(`${API_BASE}/Product/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (response.ok) {
            alert('Product deleted!');
            fetchProducts();
        } else {
            alert('Delete failed.');
        }
    } catch (error) {
        alert('Connection error.');
    }
}

// ==========================================
// 3. ORDERS
// ==========================================

async function fetchOrders() {
    const tableBody = document.getElementById('orders-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/Order/all-orders`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No orders found.</td></tr>';
            return;
        }

        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td style="font-weight:600;">#${order.orderNumber}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>${order.customerName || 'Anonymous'}</td>
                <td>${order.itemCount} items</td>
                <td>${order.totalPrice}.00 AZN</td>
                <td><span class="status-pills status-pending">${order.status || 'Pending'}</span></td>
                <td><button class="btn-action" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Orders load error:", error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading orders.</td></tr>';
    }
}

async function renderRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/Order/all-orders`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Failed');

        const orders = await response.json();
        const recent = orders.slice(0, 5);

        if (recent.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No recent orders.</td></tr>';
            return;
        }

        tableBody.innerHTML = recent.map(order => `
            <tr>
                <td style="font-weight:600;">#${order.orderNumber}</td>
                <td>${order.customerName || 'Anonymous'}</td>
                <td>${order.itemCount} items</td>
                <td>${order.totalPrice}.00 AZN</td>
                <td><span class="status-pills status-pending">${order.status || 'Pending'}</span></td>
                <td><a href="orders.html" class="btn-action">View</a></td>
            </tr>
        `).join('');
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load orders.</td></tr>';
    }
}

function viewOrder(id) {
    alert(`Order #${id} details coming soon.`);
}

// ==========================================
// 4. CUSTOMERS
// ==========================================

async function fetchCustomers() {
    const tableBody = document.getElementById('customers-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/User/all`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error('Failed to fetch customers');

        const customers = await response.json();

        if (customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No customers found.</td></tr>';
            return;
        }

        tableBody.innerHTML = customers.map(customer => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:#c9a96e; color:white; display:flex; align-items:center; justify-content:center; font-weight:700;">
                            ${(customer.fullName || customer.userName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:500;">${customer.fullName || customer.userName}</div>
                            <div style="font-size:0.8rem; color:#888;">${customer.email}</div>
                        </div>
                    </div>
                </td>
                <td>${customer.orderCount || 0}</td>
                <td>${customer.totalSpent ? customer.totalSpent + '.00 AZN' : '0.00 AZN'}</td>
                <td>${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}</td>
                <td><span class="status-pills status-completed">Active</span></td>
                <td>
                    <button class="btn-action" onclick="viewCustomer('${customer.id}')"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Customers load error:", error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading customers.</td></tr>';
    }
}

function viewCustomer(id) {
    alert(`Customer profile #${id} coming soon.`);
}

// ==========================================
// 5. SHIPPING COST SETTINGS
// ==========================================

async function loadShippingCost() {
    try {
        const response = await fetch(`${API_BASE}/Settings/ShippingCost`);
        if (response.ok) {
            const data = await response.json();
            const input = document.getElementById('shipping-cost-input');
            if (input) input.value = data.value;
        }
    } catch (error) {
        console.error("Shipping cost load error:", error);
    }
}

async function updateShippingCost() {
    const input = document.getElementById('shipping-cost-input');
    if (!input) return;

    try {
        const response = await fetch(`${API_BASE}/Settings/ShippingCost`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ value: input.value })
        });

        if (response.ok) {
            alert('Shipping cost updated successfully!');
        } else {
            alert('Update failed.');
        }
    } catch (error) {
        alert('Connection error.');
    }
}

// ==========================================
// 6. SALES CHART
// ==========================================

function initSalesChart() {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Revenue (AZN)',
                data: [0, 0, 0, 0],
                borderColor: '#c9a96e',
                backgroundColor: 'rgba(201,169,110,0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}