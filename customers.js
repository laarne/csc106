const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST create new customer
router.post('/', async (req, res) => {
  try {
    const { name, contact, email, address } = req.body;
    
    if (!name || !contact) {
      return res.status(400).json({ error: 'Name and contact are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO customers (name, contact, email, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, contact, email || null, address || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, address } = req.body;
    
    if (!name || !contact) {
      return res.status(400).json({ error: 'Name and contact are required' });
    }
    
    const result = await pool.query(
      'UPDATE customers SET name = $1, contact = $2, email = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, contact, email || null, address || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM customers WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// GET customer orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT o.*, c.name as customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.customer_id = $1 ORDER BY o.created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

module.exports = router;
