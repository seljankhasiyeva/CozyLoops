// Admin Panel Scripts

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle for mobile/compact view
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Navigation Active State Handler
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;

    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && currentPath.includes(link.getAttribute('href'))) {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        }
    });

    // Real Data Rendering for Products
    if (document.getElementById('products-table')) {
        fetchProducts();
    }

    // Mock Data Rendering for Dashboard
    if (document.getElementById('recent-orders-table')) {
        renderRecentOrders();
    }

    if (document.getElementById('salesChart')) {
        initSalesChart();
    }

    if (document.getElementById('orders-table')) {
        fetchOrders();
    }

    if (document.getElementById('customers-table')) {
        fetchCustomers();
    }

    // Modal Logic
    const modal = document.getElementById('customer-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = 'none';
        }
    }

    // Add click listeners to View Profile buttons
    document.querySelectorAll('.btn-action').forEach(btn => {
        if (btn.textContent === 'View Profile') {
            btn.onclick = () => {
                // In a real app, we'd get customer ID from data attribute
                const customerRow = btn.closest('tr');
                const name = customerRow.querySelector('span[style*="font-weight: 600"]').textContent;
                const email = customerRow.querySelector('.customer-email').textContent;
                const initials = customerRow.querySelector('.customer-avatar').textContent;
                showCustomerProfile({ name, email, initials });
            };
        }
    });
});

async function fetchProducts() {
    const tableBody = document.getElementById('products-table');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:5245/api/Product');
        if (!response.ok) throw new Error('Failed to fetch products');

        const products = await response.json();
        tableBody.innerHTML = products.map(product => `
            <tr>
                <td class="product-img-td"><img src="${product.imageUrl || '../images/placeholder.webp'}" alt="${product.name}"></td>
                <td style="font-weight: 500;">${product.name}</td>
                <td>${product.category ? product.category.name : 'Uncategorized'}</td>
                <td>$${product.price}.00</td>
                <td class="stock-status ${product.stock > 10 ? 'stock-ok' : 'stock-low'}">${product.stock} in stock</td>
                <td><span class="status-pills status-completed">Active</span></td>
                <td>
                    <a href="edit-product.html?id=${product.id}" class="btn-action"><i class="fas fa-edit"></i></a>
                    <button class="btn-action" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error fetching products:", error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:red;">Error loading products.</td></tr>';
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`http://localhost:5245/api/Product/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Product deleted successfully');
            fetchProducts();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        alert('An error occurred while deleting the product');
    }
}

async function renderRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:5245/api/Order/all-orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        const recent = orders.slice(0, 5);

        if (recent.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No orders yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = recent.map(order => `
            <tr>
                <td style="font-weight: 600;">#${order.orderNumber}</td>
                <td>${order.customerName || 'Anonymous'}</td>
                <td>${order.itemCount} items</td>
                <td>$${order.totalPrice}.00</td>
                <td><span class="status-pills status-${(order.status || 'Pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                <td><a href="orders.html" class="btn-action">View</a></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error loading recent orders:", error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Error loading orders.</td></tr>';
    }
}

async function fetchOrders() {
    const tableBody = document.getElementById('orders-table');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:5245/api/Order/all-orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td style="font-weight: 600;">#${order.orderNumber}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>${order.customerName || 'Anonymous'}</td>
                <td>${order.itemCount} items</td>
                <td>$${order.totalPrice}.00</td>
                <td><span class="status-pills status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn-action">View Details</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error fetching orders:", error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:red;">Error loading orders.</td></tr>';
    }
}

async function fetchCustomers() {
    const tableBody = document.getElementById('customers-table');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:5245/api/Customer', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch customers');

        const customers = await response.json();
        tableBody.innerHTML = customers.map(c => {
            const initials = (c.userName || c.email).substring(0, 2).toUpperCase();
            return `
                <tr>
                    <td>
                        <div class="customer-info-cell">
                            <div class="customer-avatar">${initials}</div>
                            <div>
                                <span style="font-weight: 600; display: block;">${c.userName || 'No Name'}</span>
                                <span class="customer-email">${c.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>${c.totalOrders} Orders</td>
                    <td>$0.00</td>
                    <td>-</td>
                    <td><span class="status-pills status-completed">${c.status}</span></td>
                    <td>
                        <button class="btn-action" onclick='showCustomerProfile({ name: "${c.userName}", email: "${c.email}", initials: "${initials}" })'>View Profile</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error fetching customers:", error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Error loading customers.</td></tr>';
    }
}

function initSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Generate dates for the last 30 days
    const labels = [];
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        // Random sales data between 100 and 800
        data.push(Math.floor(Math.random() * 700) + 100);
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue ($)',
                data: data,
                borderColor: '#C08552',
                backgroundColor: 'rgba(192, 133, 82, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#C08552',
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#2D2420',
                    titleColor: '#F8F5F2',
                    bodyColor: '#F8F5F2',
                    borderColor: 'rgba(248, 245, 242, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(45, 36, 32, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'Outfit'
                        },
                        callback: function (value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10,
                        font: {
                            family: 'Outfit'
                        }
                    }
                }
            }
        }
    });
}

function showCustomerProfile(customer) {
    const modal = document.getElementById('customer-modal');
    const modalBody = document.getElementById('modal-body');

    // Mock past orders for the profile card
    const pastOrders = [
        { id: '#1234', date: 'Feb 28, 2026', items: 'Fox Amigurumi, Crochet Hook', amount: '$52.00', status: 'completed' },
        { id: '#1190', date: 'Jan 15, 2026', items: 'Baby Blanket (Custom)', amount: '$85.00', status: 'completed' },
        { id: '#1052', date: 'Dec 10, 2025', items: 'Wool Yarn x5', amount: '$45.00', status: 'completed' }
    ];

    modalBody.innerHTML = `
        <div class="profile-card-header">
            <div class="profile-avatar-large">${customer.initials}</div>
            <div class="profile-header-info">
                <h2>${customer.name}</h2>
                <p style="opacity: 0.8;">Customer since Oct 2025</p>
            </div>
        </div>
        <div class="profile-card-body">
            <div class="profile-section">
                <h3><i class="fas fa-info-circle"></i> Personal Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Email Address</label>
                        <span>${customer.email}</span>
                    </div>
                    <div class="info-item">
                        <label>Phone</label>
                        <span>+994 50 123 45 67</span>
                    </div>
                    <div class="info-item">
                        <label>Location</label>
                        <span>Baku, Azerbaijan</span>
                    </div>
                    <div class="info-item">
                        <label>Total Spent</label>
                        <span style="color: var(--success); font-weight: 700;">$1,240.00</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-section">
                <h3><i class="fas fa-history"></i> Order History</h3>
                <div class="table-responsive">
                    <table class="past-orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pastOrders.map(order => `
                                <tr>
                                    <td><span style="font-weight: 600;">${order.id}</span></td>
                                    <td>${order.date}</td>
                                    <td>${order.items}</td>
                                    <td>${order.amount}</td>
                                    <td><span class="status-pills status-${order.status}">${order.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}
