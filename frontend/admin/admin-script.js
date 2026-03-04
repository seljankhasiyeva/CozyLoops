// ==========================================
// CORE ADMIN PANEL SCRIPTS (Real API Linked)
// ==========================================

const API_BASE = "http://localhost:5245/api";

document.addEventListener('DOMContentLoaded', function () {
    // 1. Sidebar toggle logic
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // 2. Navigation Active State
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && currentPath.includes(link.getAttribute('href'))) {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        }
    });

    // 3. Page Specific Data Loading
    if (document.getElementById('products-table')) {
        fetchProducts();
    }
    if (document.getElementById('recent-orders-table')) {
        renderRecentOrders(); // Fetch from API
    }
    if (document.getElementById('orders-table')) {
        fetchOrders();
    }
    if (document.getElementById('customers-table')) {
        fetchCustomers();
    }
    if (document.getElementById('salesChart')) {
        initSalesChart(); // Keep random for now as charts need specialized logic
    }
});

// --- PRODUCTS LOGIC ---
async function fetchProducts() {
    const tableBody = document.getElementById('products-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/Product`);
        if (!response.ok) throw new Error('Failed to fetch');

        const products = await response.json();
        tableBody.innerHTML = products.map(product => `
            <tr>
                <td class="product-img-td">
                    <img src="${product.imageUrl ? 'http://localhost:5245' + product.imageUrl : '../images/placeholder.webp'}" alt="${product.name}">
                </td>
                <td style="font-weight: 500;">${product.name}</td>
                <td>${product.category ? product.category.name : 'Uncategorized'}</td>
                <td>${product.price}.00 AZN</td>
                <td class="stock-status ${product.stock > 10 ? 'stock-ok' : 'stock-low'}">${product.stock} in stock</td>
                <td><span class="status-pills status-completed">Active</span></td>
                <td>
                    <a href="edit-product.html?id=${product.id}" class="btn-action"><i class="fas fa-edit"></i></a>
                    <button class="btn-action" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Products Load Error:", error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading products.</td></tr>';
    }
}

// --- ORDERS LOGIC (Real Data) ---
async function renderRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/Order/all-orders`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        const recent = orders.slice(0, 5); // Get last 5

        tableBody.innerHTML = recent.map(order => `
            <tr>
                <td style="font-weight: 600;">#${order.orderNumber || order.id}</td>
                <td>${order.customerName || 'Anonymous'}</td>
                <td>${order.itemCount || 0} items</td>
                <td>${order.totalPrice || 0}.00 AZN</td>
                <td><span class="status-pills status-${(order.status || 'Pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                <td><a href="orders.html" class="btn-action">View</a></td>
            </tr>
        `).join('');
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to connect to API.</td></tr>';
    }
}

// --- DELETE LOGIC ---
async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        const response = await fetch(`${API_BASE}/Product/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Deleted!');
            fetchProducts();
        }
    } catch (error) {
        alert('Delete failed.');
    }
}

// --- SALES CHART (Visual Only) ---
function initSalesChart() {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;
    // Keeping Chart logic as is for visual representation
    new Chart(ctx, { /* Chart config here... */ });
}