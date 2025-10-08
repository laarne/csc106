const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all orders with customer information
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.contact as customer_contact
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.contact as customer_contact,
        c.email as customer_email,
        c.address as customer_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create new order
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { customer_id, weight, service_type, notes } = req.body;
    
    if (!customer_id || !weight || !service_type) {
      return res.status(400).json({ 
        error: 'Customer ID, weight, and service type are required' 
      });
    }
    
    // Get pricing information
    const pricingResult = await client.query(
      'SELECT price_per_kg, base_price FROM pricing WHERE service_type = $1 AND is_active = true',
      [service_type]
    );
    
    if (pricingResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid service type' });
    }
    
    const { price_per_kg, base_price } = pricingResult.rows[0];
    const calculatedPrice = base_price + (weight * price_per_kg);
    
    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (customer_id, weight, service_type, price, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [customer_id, weight, service_type, calculatedPrice, notes || null]);
    
    const newOrder = orderResult.rows[0];
    
    // Deduct inventory based on service type
    await deductInventory(client, service_type, weight);
    
    await client.query('COMMIT');
    res.status(201).json(newOrder);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// PUT update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['received', 'washing', 'ready', 'claimed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    let updateQuery = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status];
    
    // Set appropriate timestamps based on status
    if (status === 'ready') {
      updateQuery += ', ready_date = CURRENT_TIMESTAMP';
    } else if (status === 'claimed') {
      updateQuery += ', claimed_date = CURRENT_TIMESTAMP';
    }
    
    updateQuery += ' WHERE id = $2 RETURNING *';
    params.push(id);
    
    const result = await pool.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PUT update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { weight, service_type, notes } = req.body;
    
    if (!weight || !service_type) {
      return res.status(400).json({ 
        error: 'Weight and service type are required' 
      });
    }
    
    // Get pricing information
    const pricingResult = await pool.query(
      'SELECT price_per_kg, base_price FROM pricing WHERE service_type = $1 AND is_active = true',
      [service_type]
    );
    
    if (pricingResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid service type' });
    }
    
    const { price_per_kg, base_price } = pricingResult.rows[0];
    const calculatedPrice = base_price + (weight * price_per_kg);
    
    const result = await pool.query(`
      UPDATE orders 
      SET weight = $1, service_type = $2, price = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [weight, service_type, calculatedPrice, notes || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Helper function to deduct inventory
async function deductInventory(client, serviceType, weight) {
  const inventoryUsage = {
    'wash': { 'Detergent': weight * 0.05, 'Bleach': weight * 0.01 },
    'dry': {},
    'fold': { 'Starch': weight * 0.02 },
    'wash_dry': { 'Detergent': weight * 0.05, 'Bleach': weight * 0.01 },
    'wash_dry_fold': { 'Detergent': weight * 0.05, 'Bleach': weight * 0.01, 'Fabric Softener': weight * 0.03, 'Starch': weight * 0.02 }
  };
  
  const usage = inventoryUsage[serviceType] || {};
  
  for (const [itemName, quantity] of Object.entries(usage)) {
    if (quantity > 0) {
      await client.query(
        'UPDATE inventory SET quantity = quantity - $1 WHERE item_name = $2',
        [quantity, itemName]
      );
    }
  }
}

module.exports = router;
