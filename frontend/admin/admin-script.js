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
