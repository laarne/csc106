# Laundry Billing + Inventory Management System

A comprehensive web-based laundry management system built with Node.js, Express, PostgreSQL, and vanilla HTML/CSS/JavaScript.

## 🎯 Features

### Core Features
- **Customer Management**: Add, edit, delete, and view customer records
- **Order Management**: Create laundry orders with service types (wash, dry, fold)
- **Order Status Tracking**: Track orders through Received → Washing → Ready → Claimed
- **Automatic Billing**: Auto-compute bills based on weight and service type
- **Receipt Printing**: Generate and print simple receipts

### Extra Features
- **Inventory Management**: Track detergent, softener, and other supplies
- **Stock Alerts**: Low-stock notifications and inventory tracking
- **Billing History**: Complete payment and billing records
- **Reports & Analytics**: Daily/weekly sales reports with income and order counts
- **Dashboard**: Real-time overview of business metrics

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### 1. Clone and Setup
```bash
# Navigate to the project directory
cd laundry-app

# Install dependencies
npm install
```

### 2. Database Setup

#### Create PostgreSQL Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE laundry_db;
CREATE USER laundry_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE laundry_db TO laundry_user;
```

#### Run Database Schema
```bash
# Connect to your PostgreSQL database and run:
psql -U laundry_user -d laundry_db -f database/schema.sql
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=laundry_db
DB_USER=laundry_user
DB_PASSWORD=your_password
PORT=3000
```

### 4. Start the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 🗄️ Database Schema

### Tables Overview
- **customers**: Customer information (id, name, contact, email, address)
- **orders**: Laundry orders (id, customer_id, weight, service_type, price, status, dates)
- **inventory**: Stock management (id, item_name, quantity, threshold, unit, cost)
- **billing_history**: Payment records (id, order_id, total_amount, payment_method, date)
- **pricing**: Service pricing configuration (service_type, price_per_kg, base_price)
- **order_items**: Inventory usage tracking

### Key Features
- Automatic timestamps with triggers
- Foreign key constraints for data integrity
- Status validation with CHECK constraints
- Indexes for optimal performance

## 🔌 API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/orders` - Get customer orders

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `PUT /api/inventory/:id/add-stock` - Add stock to item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/alerts/low-stock` - Get low stock alerts

### Billing
- `GET /api/billing/history` - Get billing history
- `POST /api/billing` - Create billing record
- `GET /api/billing/summary` - Get billing summary
- `GET /api/billing/pricing` - Get pricing configuration
- `PUT /api/billing/pricing/:id` - Update pricing

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/daily` - Daily sales breakdown
- `GET /api/reports/service-types` - Service type analysis
- `GET /api/reports/customers` - Customer analysis
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/order-status` - Order status summary

## 📖 Usage Guide

### 1. Customer Management
- Navigate to the Customers section
- Click "Add Customer" to create new customer records
- Edit or delete existing customers as needed
- View customer order history

### 2. Order Processing
- Go to the Orders section
- Click "New Order" to create a laundry order
- Select customer, enter weight, choose service type
- Price is automatically calculated
- Track order status through the workflow

### 3. Inventory Management
- Access the Inventory section
- Add new inventory items with quantities and thresholds
- Add stock when new supplies arrive
- Monitor low-stock alerts on the dashboard

### 4. Billing & Payments
- Process payments when orders are ready
- View billing history and summaries
- Print receipts for customers

### 5. Reports & Analytics
- Generate sales reports for different time periods
- Analyze service type popularity
- View customer spending patterns
- Monitor order status distribution

## 💰 Service Types & Pricing

The system supports the following service types:
- **Wash Only**: Basic washing service
- **Dry Only**: Drying service
- **Fold Only**: Folding service
- **Wash + Dry**: Combined wash and dry
- **Wash + Dry + Fold**: Complete service

Pricing is automatically calculated based on:
- Base price for the service type
- Price per kilogram of laundry
- Total weight of the order

## 📦 Inventory Usage

The system automatically deducts inventory when orders are processed:
- **Detergent**: Used for wash services
- **Bleach**: Used for wash services
- **Fabric Softener**: Used for complete services
- **Starch**: Used for folding services

## 🎨 UI/UX Features

- **Modern Design**: Gradient themes and professional styling
- **Intuitive Navigation**: Sidebar navigation with icons
- **Responsive Layout**: Mobile-first design approach
- **Interactive Elements**: Hover effects, animations, and transitions
- **Status Indicators**: Color-coded status badges
- **Modal Dialogs**: Clean form interfaces
- **Toast Notifications**: User feedback system

## 🔧 Customization

### Adding New Service Types
1. Update the `pricing` table with new service types
2. Modify the inventory usage logic in `routes/orders.js`
3. Update the frontend dropdown options

### Modifying Pricing
1. Access the Billing section
2. Update pricing configuration
3. Changes apply to new orders immediately

### Customizing Inventory Items
1. Add new items through the Inventory section
2. Configure usage rates in the order processing logic
3. Set appropriate low-stock thresholds

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists and user has permissions

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill existing processes on port 3000

3. **Module Not Found Errors**
   - Run `npm install` to install dependencies
   - Check Node.js version compatibility

4. **Frontend Not Loading**
   - Ensure server is running on correct port
   - Check browser console for JavaScript errors
   - Verify static file serving is working

### Database Issues
```sql
-- Reset database (WARNING: This will delete all data)
DROP DATABASE laundry_db;
CREATE DATABASE laundry_db;

-- Recreate schema
psql -U laundry_user -d laundry_db -f database/schema.sql
```

## 📁 Project Structure
```
laundry-app/
├── config/
│   └── database.js          # Database configuration
├── database/
│   └── schema.sql           # Database schema
├── routes/
│   ├── customers.js         # Customer API routes
│   ├── orders.js            # Order API routes
│   ├── inventory.js         # Inventory API routes
│   ├── billing.js           # Billing API routes
│   └── reports.js           # Reports API routes
├── public/
│   ├── index.html           # Main application page
│   ├── styles.css           # Application styles
│   └── script.js            # Frontend JavaScript
├── package.json             # Dependencies and scripts
├── server.js                # Main server file
├── env.example              # Environment variables example
└── README.md                # This file
```

## 🚀 Development

### Adding New Features
1. Create new route files in `routes/` directory
2. Add corresponding frontend pages and JavaScript
3. Update navigation and routing
4. Test thoroughly before deployment

### Code Structure
- **Backend**: RESTful API with Express.js
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Database**: PostgreSQL with proper relationships and constraints
- **Styling**: Custom CSS with responsive design patterns

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console for errors
4. Verify database connectivity

## 🔄 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This is a complete laundry management system designed for small to medium laundry businesses. It includes all the core features needed for day-to-day operations with room for customization and expansion.

## 🎉 Quick Start Summary

1. **Install**: `npm install`
2. **Database**: Create PostgreSQL database and run schema
3. **Configure**: Set up `.env` file with database credentials
4. **Start**: `npm start`
5. **Access**: Open `http://localhost:3000`

The system is ready to use with sample data and default configurations!
