const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all inventory items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory ORDER BY item_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM inventory WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// POST create new inventory item
router.post('/', async (req, res) => {
  try {
    const { item_name, quantity, threshold, unit, cost_per_unit } = req.body;
    
    if (!item_name || quantity === undefined || threshold === undefined) {
      return res.status(400).json({ 
        error: 'Item name, quantity, and threshold are required' 
      });
    }
    
    const result = await pool.query(`
      INSERT INTO inventory (item_name, quantity, threshold, unit, cost_per_unit)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [item_name, quantity, threshold, unit || 'units', cost_per_unit || 0.00]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Item with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create inventory item' });
    }
  }
});

// PUT update inventory item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity, threshold, unit, cost_per_unit } = req.body;
    
    if (!item_name || quantity === undefined || threshold === undefined) {
      return res.status(400).json({ 
        error: 'Item name, quantity, and threshold are required' 
      });
    }
    
    const result = await pool.query(`
      UPDATE inventory 
      SET item_name = $1, quantity = $2, threshold = $3, unit = $4, cost_per_unit = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [item_name, quantity, threshold, unit || 'units', cost_per_unit || 0.00, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// PUT add stock to inventory
router.put('/:id/add-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
    
    const result = await pool.query(`
      UPDATE inventory 
      SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [quantity, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

// DELETE inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM inventory WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// GET low stock alerts
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM inventory 
      WHERE quantity <= threshold 
      ORDER BY (quantity - threshold) ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

module.exports = router;
