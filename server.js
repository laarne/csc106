const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const billingRoutes = require('./routes/billing');
const reportRoutes = require('./routes/reports');

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Laundry Management System running on http://localhost:${PORT}`);
});
