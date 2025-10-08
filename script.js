// Global variables
let customers = [];
let orders = [];
let inventory = [];
let currentEditingId = null;

// API Base URL
const API_BASE = '/api';

// Utility functions
function showLoading() {
    document.getElementById('loadingSpinner').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('show');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Navigation event listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // Initial page load
    showPage('dashboard');
    loadDashboardData();
});

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName).classList.add('active');
    
    // Add active class to selected nav button
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Load page-specific data
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'billing':
            loadBilling();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load recent orders
        const ordersResponse = await fetch(`${API_BASE}/orders`);
        const ordersData = await ordersResponse.json();
        
        // Load low stock alerts
        const inventoryResponse = await fetch(`${API_BASE}/inventory/alerts/low-stock`);
        const inventoryData = await inventoryResponse.json();
        
        // Load sales summary
        const salesResponse = await fetch(`${API_BASE}/reports/sales?period=today`);
        const salesData = await salesResponse.json();
        
        // Update dashboard stats
        document.getElementById('total-orders').textContent = salesData.total_orders || 0;
        document.getElementById('daily-revenue').textContent = formatCurrency(salesData.total_revenue || 0);
        document.getElementById('pending-orders').textContent = salesData.pending_orders || 0;
        document.getElementById('low-stock').textContent = inventoryData.length;
        
        // Display recent orders
        displayRecentOrders(ordersData.slice(0, 5));
        
        // Display low stock alerts
        displayLowStockAlerts(inventoryData);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No recent orders</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>#${order.id}</td>
                        <td>${order.customer_name}</td>
                        <td>${order.service_type.replace('_', ' + ')}</td>
                        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                        <td>${formatDate(order.order_date)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function displayLowStockAlerts(inventory) {
    const container = document.getElementById('low-stock-alerts');
    
    if (inventory.length === 0) {
        container.innerHTML = '<p>All items are in stock</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${inventory.map(item => `
                    <tr>
                        <td>${item.item_name}</td>
                        <td>${item.quantity} ${item.unit}</td>
                        <td>${item.threshold} ${item.unit}</td>
                        <td><span class="stock-status stock-low">Low Stock</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Customer management functions
async function loadCustomers() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/customers`);
        customers = await response.json();
        displayCustomers(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Error loading customers', 'error');
    } finally {
        hideLoading();
    }
}

function displayCustomers(customers) {
    const tbody = document.querySelector('#customers-table tbody');
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No customers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.contact}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.address || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showCustomerModal(customerId = null) {
    currentEditingId = customerId;
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    
    if (customerId) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('customerModalTitle').textContent = 'Edit Customer';
            document.getElementById('customerId').value = customer.id;
            document.getElementById('customerName').value = customer.name;
            document.getElementById('customerContact').value = customer.contact;
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerAddress').value = customer.address || '';
        }
    } else {
        document.getElementById('customerModalTitle').textContent = 'Add Customer';
        form.reset();
        document.getElementById('customerId').value = '';
    }
    
    modal.style.display = 'block';
}

function editCustomer(customerId) {
    showCustomerModal(customerId);
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Customer deleted successfully');
            loadCustomers();
        } else {
            throw new Error('Failed to delete customer');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        showToast('Error deleting customer', 'error');
    } finally {
        hideLoading();
    }
}

// Customer form submission
document.getElementById('customerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const customerData = {
        name: document.getElementById('customerName').value,
        contact: document.getElementById('customerContact').value,
        email: document.getElementById('customerEmail').value,
        address: document.getElementById('customerAddress').value
    };
    
    try {
        showLoading();
        
        const url = currentEditingId ? 
            `${API_BASE}/customers/${currentEditingId}` : 
            `${API_BASE}/customers`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            showToast(currentEditingId ? 'Customer updated successfully' : 'Customer created successfully');
            closeModal('customerModal');
            loadCustomers();
        } else {
            throw new Error('Failed to save customer');
        }
    } catch (error) {
        console.error('Error saving customer:', error);
        showToast('Error saving customer', 'error');
    } finally {
        hideLoading();
    }
});

// Order management functions
async function loadOrders() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/orders`);
        orders = await response.json();
        displayOrders(orders);
        loadCustomersForOrder();
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders', 'error');
    } finally {
        hideLoading();
    }
}

function displayOrders(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer_name}</td>
            <td>${order.service_type.replace('_', ' + ')}</td>
            <td>${order.weight} kg</td>
            <td>${formatCurrency(order.price)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${formatDate(order.order_date)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="updateOrderStatus(${order.id})">
                    <i class="fas fa-edit"></i> Update Status
                </button>
                <button class="btn btn-sm btn-success" onclick="printReceipt(${order.id})">
                    <i class="fas fa-print"></i> Receipt
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadCustomersForOrder() {
    try {
        const response = await fetch(`${API_BASE}/customers`);
        const customersData = await response.json();
        
        const select = document.getElementById('orderCustomer');
        select.innerHTML = '<option value="">Select Customer</option>' +
            customersData.map(customer => 
                `<option value="${customer.id}">${customer.name} - ${customer.contact}</option>`
            ).join('');
    } catch (error) {
        console.error('Error loading customers for order:', error);
    }
}

function showOrderModal(orderId = null) {
    currentEditingId = orderId;
    const modal = document.getElementById('orderModal');
    const form = document.getElementById('orderForm');
    
    if (orderId) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            document.getElementById('orderModalTitle').textContent = 'Edit Order';
            document.getElementById('orderId').value = order.id;
            document.getElementById('orderCustomer').value = order.customer_id;
            document.getElementById('orderWeight').value = order.weight;
            document.getElementById('orderServiceType').value = order.service_type;
            document.getElementById('orderPrice').value = order.price;
            document.getElementById('orderNotes').value = order.notes || '';
        }
    } else {
        document.getElementById('orderModalTitle').textContent = 'New Order';
        form.reset();
        document.getElementById('orderId').value = '';
        calculateOrderPrice();
    }
    
    modal.style.display = 'block';
}

// Order form submission
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const orderData = {
        customer_id: parseInt(document.getElementById('orderCustomer').value),
        weight: parseFloat(document.getElementById('orderWeight').value),
        service_type: document.getElementById('orderServiceType').value,
        notes: document.getElementById('orderNotes').value
    };
    
    try {
        showLoading();
        
        const url = currentEditingId ? 
            `${API_BASE}/orders/${currentEditingId}` : 
            `${API_BASE}/orders`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            showToast(currentEditingId ? 'Order updated successfully' : 'Order created successfully');
            closeModal('orderModal');
            loadOrders();
        } else {
            throw new Error('Failed to save order');
        }
    } catch (error) {
        console.error('Error saving order:', error);
        showToast('Error saving order', 'error');
    } finally {
        hideLoading();
    }
});

// Calculate order price
function calculateOrderPrice() {
    const weight = parseFloat(document.getElementById('orderWeight').value) || 0;
    const serviceType = document.getElementById('orderServiceType').value;
    
    if (weight > 0 && serviceType) {
        // This is a simplified calculation - in a real app, you'd call the API
        const prices = {
            'wash': { base: 5, perKg: 15 },
            'dry': { base: 8, perKg: 20 },
            'fold': { base: 3, perKg: 10 },
            'wash_dry': { base: 10, perKg: 30 },
            'wash_dry_fold': { base: 12, perKg: 35 }
        };
        
        const pricing = prices[serviceType];
        if (pricing) {
            const totalPrice = pricing.base + (weight * pricing.perKg);
            document.getElementById('orderPrice').value = totalPrice.toFixed(2);
        }
    }
}

// Add event listeners for price calculation
document.getElementById('orderWeight').addEventListener('input', calculateOrderPrice);
document.getElementById('orderServiceType').addEventListener('change', calculateOrderPrice);

async function updateOrderStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const currentStatus = order.status;
    const statusOptions = {
        'received': 'washing',
        'washing': 'ready',
        'ready': 'claimed'
    };
    
    const nextStatus = statusOptions[currentStatus];
    if (!nextStatus) {
        showToast('Order is already completed', 'warning');
        return;
    }
    
    if (!confirm(`Update order status from "${currentStatus}" to "${nextStatus}"?`)) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: nextStatus })
        });
        
        if (response.ok) {
            showToast('Order status updated successfully');
            loadOrders();
        } else {
            throw new Error('Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Order deleted successfully');
            loadOrders();
        } else {
            throw new Error('Failed to delete order');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Error deleting order', 'error');
    } finally {
        hideLoading();
    }
}

// Inventory management functions
async function loadInventory() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/inventory`);
        inventory = await response.json();
        displayInventory(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showToast('Error loading inventory', 'error');
    } finally {
        hideLoading();
    }
}

function displayInventory(inventory) {
    const tbody = document.querySelector('#inventory-table tbody');
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No inventory items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = inventory.map(item => `
        <tr>
            <td>${item.item_name}</td>
            <td>${item.quantity}</td>
            <td>${item.threshold}</td>
            <td>${item.unit}</td>
            <td><span class="stock-status ${item.quantity <= item.threshold ? 'stock-low' : 'stock-ok'}">
                ${item.quantity <= item.threshold ? 'Low Stock' : 'In Stock'}
            </span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="addStock(${item.id})">
                    <i class="fas fa-plus"></i> Add Stock
                </button>
                <button class="btn btn-sm btn-primary" onclick="editInventory(${item.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteInventory(${item.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showInventoryModal(itemId = null) {
    currentEditingId = itemId;
    const modal = document.getElementById('inventoryModal');
    const form = document.getElementById('inventoryForm');
    
    if (itemId) {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
            document.getElementById('inventoryModalTitle').textContent = 'Edit Inventory Item';
            document.getElementById('inventoryId').value = item.id;
            document.getElementById('inventoryName').value = item.item_name;
            document.getElementById('inventoryQuantity').value = item.quantity;
            document.getElementById('inventoryThreshold').value = item.threshold;
            document.getElementById('inventoryUnit').value = item.unit;
            document.getElementById('inventoryCost').value = item.cost_per_unit;
        }
    } else {
        document.getElementById('inventoryModalTitle').textContent = 'Add Inventory Item';
        form.reset();
        document.getElementById('inventoryId').value = '';
        document.getElementById('inventoryUnit').value = 'units';
    }
    
    modal.style.display = 'block';
}

function editInventory(itemId) {
    showInventoryModal(itemId);
}

async function addStock(itemId) {
    const quantity = prompt('Enter quantity to add:');
    if (!quantity || isNaN(quantity) || quantity <= 0) {
        showToast('Please enter a valid quantity', 'warning');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/inventory/${itemId}/add-stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: parseFloat(quantity) })
        });
        
        if (response.ok) {
            showToast('Stock added successfully');
            loadInventory();
        } else {
            throw new Error('Failed to add stock');
        }
    } catch (error) {
        console.error('Error adding stock:', error);
        showToast('Error adding stock', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteInventory(itemId) {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/inventory/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Inventory item deleted successfully');
            loadInventory();
        } else {
            throw new Error('Failed to delete inventory item');
        }
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        showToast('Error deleting inventory item', 'error');
    } finally {
        hideLoading();
    }
}

// Inventory form submission
document.getElementById('inventoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const inventoryData = {
        item_name: document.getElementById('inventoryName').value,
        quantity: parseInt(document.getElementById('inventoryQuantity').value),
        threshold: parseInt(document.getElementById('inventoryThreshold').value),
        unit: document.getElementById('inventoryUnit').value,
        cost_per_unit: parseFloat(document.getElementById('inventoryCost').value) || 0
    };
    
    try {
        showLoading();
        
        const url = currentEditingId ? 
            `${API_BASE}/inventory/${currentEditingId}` : 
            `${API_BASE}/inventory`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inventoryData)
        });
        
        if (response.ok) {
            showToast(currentEditingId ? 'Inventory item updated successfully' : 'Inventory item created successfully');
            closeModal('inventoryModal');
            loadInventory();
        } else {
            throw new Error('Failed to save inventory item');
        }
    } catch (error) {
        console.error('Error saving inventory item:', error);
        showToast('Error saving inventory item', 'error');
    } finally {
        hideLoading();
    }
});

// Billing functions
async function loadBilling() {
    try {
        showLoading();
        
        // Load billing history
        const billingResponse = await fetch(`${API_BASE}/billing/history`);
        const billingData = await billingResponse.json();
        
        // Load billing summary
        const summaryResponse = await fetch(`${API_BASE}/billing/summary?period=today`);
        const summaryData = await summaryResponse.json();
        
        // Update summary
        document.getElementById('today-revenue').textContent = formatCurrency(summaryData.total_revenue || 0);
        document.getElementById('completed-orders').textContent = summaryData.total_orders || 0;
        
        // Display billing history
        displayBillingHistory(billingData);
        
    } catch (error) {
        console.error('Error loading billing data:', error);
        showToast('Error loading billing data', 'error');
    } finally {
        hideLoading();
    }
}

function displayBillingHistory(billingData) {
    const tbody = document.querySelector('#billing-table tbody');
    
    if (billingData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No billing records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = billingData.map(billing => `
        <tr>
            <td>#${billing.order_id}</td>
            <td>${billing.customer_name}</td>
            <td>${formatCurrency(billing.total_amount)}</td>
            <td>${billing.payment_method || 'Cash'}</td>
            <td>${formatDate(billing.payment_date)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="printReceipt(${billing.order_id})">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </td>
        </tr>
    `).join('');
}

// Reports functions
async function loadReports() {
    const period = document.getElementById('report-period').value;
    
    try {
        showLoading();
        
        // Load sales summary
        const salesResponse = await fetch(`${API_BASE}/reports/sales?period=${period}`);
        const salesData = await salesResponse.json();
        
        // Load service types
        const serviceTypesResponse = await fetch(`${API_BASE}/reports/service-types?period=${period}`);
        const serviceTypesData = await serviceTypesResponse.json();
        
        // Load top customers
        const customersResponse = await fetch(`${API_BASE}/reports/customers?period=${period}`);
        const customersData = await customersResponse.json();
        
        // Load order status
        const orderStatusResponse = await fetch(`${API_BASE}/reports/order-status`);
        const orderStatusData = await orderStatusResponse.json();
        
        // Display reports
        displaySalesSummary(salesData);
        displayServiceTypesReport(serviceTypesData);
        displayTopCustomersReport(customersData);
        displayOrderStatusReport(orderStatusData);
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showToast('Error loading reports', 'error');
    } finally {
        hideLoading();
    }
}

function displaySalesSummary(data) {
    const container = document.getElementById('sales-summary');
    
    container.innerHTML = `
        <div class="summary-stats">
            <div class="stat-item">
                <strong>${data.total_orders || 0}</strong>
                <span>Total Orders</span>
            </div>
            <div class="stat-item">
                <strong>${formatCurrency(data.total_revenue || 0)}</strong>
                <span>Total Revenue</span>
            </div>
            <div class="stat-item">
                <strong>${formatCurrency(data.average_order_value || 0)}</strong>
                <span>Average Order Value</span>
            </div>
        </div>
    `;
}

function displayServiceTypesReport(data) {
    const container = document.getElementById('service-types-report');
    
    if (data.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    const html = data.map(item => `
        <div class="report-item">
            <div class="item-name">${item.service_type.replace('_', ' + ')}</div>
            <div class="item-stats">
                <span>${item.order_count} orders</span>
                <span>${formatCurrency(item.total_revenue)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function displayTopCustomersReport(data) {
    const container = document.getElementById('top-customers-report');
    
    if (data.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    const html = data.slice(0, 5).map(customer => `
        <div class="report-item">
            <div class="item-name">${customer.name}</div>
            <div class="item-stats">
                <span>${customer.total_orders} orders</span>
                <span>${formatCurrency(customer.total_spent)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function displayOrderStatusReport(data) {
    const container = document.getElementById('order-status-report');
    
    if (data.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    const html = data.map(item => `
        <div class="report-item">
            <div class="item-name">
                <span class="status-badge status-${item.status}">${item.status}</span>
            </div>
            <div class="item-stats">
                <span>${item.count} orders</span>
                <span>${formatCurrency(item.total_value)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function generateReport() {
    // This would typically generate a PDF or Excel file
    showToast('Report generation feature coming soon!', 'warning');
}

// Event listeners
document.getElementById('report-period').addEventListener('change', loadReports);

// Receipt printing function
async function printReceipt(orderId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/orders/${orderId}`);
        const order = await response.json();
        
        // Create receipt HTML
        const receiptHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
                    <h2>LAUNDRY RECEIPT</h2>
                    <p>Order #${order.id}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${order.customer_name}</p>
                    <p><strong>Contact:</strong> ${order.customer_contact}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>Order Details</h3>
                    <p><strong>Service:</strong> ${order.service_type.replace('_', ' + ')}</p>
                    <p><strong>Weight:</strong> ${order.weight} kg</p>
                    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
                    <p><strong>Date:</strong> ${formatDate(order.order_date)}</p>
                </div>
                
                <div style="border-top: 2px solid #333; padding-top: 10px; margin-top: 20px;">
                    <p style="font-size: 18px; font-weight: bold;">
                        <strong>TOTAL: ${formatCurrency(order.price)}</strong>
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
                    <p>Thank you for your business!</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();
        
    } catch (error) {
        console.error('Error printing receipt:', error);
        showToast('Error printing receipt', 'error');
    } finally {
        hideLoading();
    }
}

// Modal functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentEditingId = null;
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            currentEditingId = null;
        }
    });
});

// Order status filter
document.getElementById('order-status-filter').addEventListener('change', function() {
    const status = this.value;
    const filteredOrders = status ? orders.filter(order => order.status === status) : orders;
    displayOrders(filteredOrders);
});
