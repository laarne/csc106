const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET sales report
router.get('/sales', async (req, res) => {
  try {
    const { period = 'today', start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'DATE(o.order_date) BETWEEN $1 AND $2';
      params = [start_date, end_date];
    } else {
      switch (period) {
        case 'today':
          dateFilter = 'DATE(o.order_date) = CURRENT_DATE';
          break;
        case 'week':
          dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'month':
          dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case 'year':
          dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'1 year\'';
          break;
        default:
          dateFilter = '1=1';
      }
    }
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(o.price) as total_revenue,
        AVG(o.price) as average_order_value,
        COUNT(CASE WHEN o.status = 'claimed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN o.status = 'ready' THEN 1 END) as ready_orders,
        COUNT(CASE WHEN o.status = 'washing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN o.status = 'received' THEN 1 END) as pending_orders
      FROM orders o
      WHERE ${dateFilter}
    `, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});

// GET daily sales breakdown
router.get('/daily', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        DATE(o.order_date) as date,
        COUNT(*) as order_count,
        SUM(o.price) as daily_revenue,
        AVG(o.price) as avg_order_value
      FROM orders o
      WHERE o.order_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(o.order_date)
      ORDER BY date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({ error: 'Failed to fetch daily sales' });
  }
});

// GET service type analysis
router.get('/service-types', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'DATE(o.order_date) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = '1=1';
    }
    
    const result = await pool.query(`
      SELECT 
        o.service_type,
        COUNT(*) as order_count,
        SUM(o.price) as total_revenue,
        AVG(o.price) as avg_order_value,
        SUM(o.weight) as total_weight
      FROM orders o
      WHERE ${dateFilter}
      GROUP BY o.service_type
      ORDER BY total_revenue DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service type analysis:', error);
    res.status(500).json({ error: 'Failed to fetch service type analysis' });
  }
});

// GET customer analysis
router.get('/customers', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'DATE(o.order_date) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = '1=1';
    }
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.contact,
        COUNT(o.id) as total_orders,
        SUM(o.price) as total_spent,
        AVG(o.price) as avg_order_value,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND ${dateFilter}
      GROUP BY c.id, c.name, c.contact
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer analysis:', error);
    res.status(500).json({ error: 'Failed to fetch customer analysis' });
  }
});

// GET inventory usage report
router.get('/inventory', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'DATE(o.order_date) = CURRENT_DATE';
        break;
      case 'week':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        dateFilter = 'o.order_date >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = '1=1';
    }
    
    const result = await pool.query(`
      SELECT 
        i.item_name,
        i.quantity as current_stock,
        i.threshold,
        CASE 
          WHEN i.quantity <= i.threshold THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM inventory i
      ORDER BY i.quantity ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
});

// GET order status summary
router.get('/order-status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(price) as total_value
      FROM orders
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'received' THEN 1
          WHEN 'washing' THEN 2
          WHEN 'ready' THEN 3
          WHEN 'claimed' THEN 4
        END
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order status summary:', error);
    res.status(500).json({ error: 'Failed to fetch order status summary' });
  }
});

module.exports = router;
