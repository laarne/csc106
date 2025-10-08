const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET billing history
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        bh.*,
        o.id as order_id,
        o.weight,
        o.service_type,
        o.order_date,
        c.name as customer_name,
        c.contact as customer_contact
      FROM billing_history bh
      JOIN orders o ON bh.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      ORDER BY bh.payment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

// POST create billing record
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { order_id, payment_method } = req.body;
    
    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Get order details
    const orderResult = await client.query(
      'SELECT price, status FROM orders WHERE id = $1',
      [order_id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const { price, status } = orderResult.rows[0];
    
    if (status !== 'ready') {
      return res.status(400).json({ 
        error: 'Order must be ready before billing' 
      });
    }
    
    // Create billing record
    const billingResult = await client.query(`
      INSERT INTO billing_history (order_id, total_amount, payment_method)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [order_id, price, payment_method || 'cash']);
    
    // Update order status to claimed
    await client.query(
      'UPDATE orders SET status = $1, claimed_date = CURRENT_TIMESTAMP WHERE id = $2',
      ['claimed', order_id]
    );
    
    await client.query('COMMIT');
    res.status(201).json(billingResult.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating billing record:', error);
    res.status(500).json({ error: 'Failed to create billing record' });
  } finally {
    client.release();
  }
});

// GET billing summary
router.get('/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    switch (period) {
      case 'today':
        dateFilter = 'DATE(payment_date) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'payment_date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'payment_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'payment_date >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = '1=1';
    }
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        MIN(payment_date) as period_start,
        MAX(payment_date) as period_end
      FROM billing_history
      WHERE ${dateFilter}
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
});

// GET pricing configuration
router.get('/pricing', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pricing WHERE is_active = true ORDER BY service_type'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// PUT update pricing
router.put('/pricing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { price_per_kg, base_price } = req.body;
    
    if (price_per_kg === undefined || base_price === undefined) {
      return res.status(400).json({ 
        error: 'Price per kg and base price are required' 
      });
    }
    
    const result = await pool.query(`
      UPDATE pricing 
      SET price_per_kg = $1, base_price = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [price_per_kg, base_price, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

module.exports = router;
