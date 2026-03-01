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

    // Mock Data Rendering for Dashboard
    if (document.getElementById('recent-orders-table')) {
        renderRecentOrders();
    }

    if (document.getElementById('salesChart')) {
        initSalesChart();
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

function renderRecentOrders() {
    const orders = [
        { id: '#1234', customer: 'Sarah Miller', product: 'Fox Amigurumi', amount: '$45.00', status: 'completed' },
        { id: '#1235', customer: 'David King', product: 'Wool Cardigan', amount: '$120.00', status: 'pending' },
        { id: '#1236', customer: 'Anna Smith', product: 'Baby Blanket', amount: '$65.00', status: 'completed' },
        { id: '#1237', customer: 'John Doe', product: 'Crochet Hat', amount: '$25.00', status: 'cancelled' },
        { id: '#1238', customer: 'Elena R.', product: 'Custom Toy', amount: '$55.00', status: 'pending' }
    ];

    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) return;

    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.product}</td>
            <td>${order.amount}</td>
            <td><span class="status-pills status-${order.status}">${order.status}</span></td>
            <td><button class="btn-action">View</button></td>
        </tr>
    `).join('');
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
