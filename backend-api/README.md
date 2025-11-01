# SAP Backend API

Django REST Framework API for the SAP (Sales & Inventory) Platform.

## Features

- **User Management**: Multi-role authentication (cashier, stock_staff, manager, customer, admin)
- **Product Management**: Product catalog with categories
- **Inventory Management**: Real-time stock tracking with audit trail
- **POS Transactions**: Complete sales workflow with discounts, tax, and payments
- **Returns & Refunds**: Return processing with inventory restoration
- **Loyalty Program**: Customer loyalty points and discounts
- **Reporting**: Daily sales reports, product analytics, inventory health

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/register` - Customer registration

### Products
- `GET /api/products` - List products with search/filter
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (manager/admin only)
- `GET /api/products/by_barcode?barcode=XYZ` - POS barcode lookup

### Inventory
- `GET /api/inventory/` - List inventory
- `GET /api/inventory/low-stock` - Low stock alerts
- `POST /api/inventory/adjust` - Manual inventory adjustment
- `GET /api/inventory/transactions` - Audit trail

### Sales (POS)
- `POST /api/sales/create_transaction` - Create POS sale
- `GET /api/sales` - List sales
- `GET /api/sales/{id}` - Sale details
- `POST /api/sales/{id}/void` - Void sale (manager only)
- `POST /api/sales/{id}/refund` - Process refund
- `GET /api/sales/{id}/receipt` - Get receipt data

### Customers & Loyalty
- `GET /api/customers/search?phone=XXX` - Search customers
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}/loyalty-status` - Loyalty info
- `GET /api/discounts` - Available discounts
- `POST /api/discounts/validate` - Validate discount code

### Returns
- `POST /api/returns/create_return` - Initiate return
- `GET /api/returns` - List returns
- `POST /api/returns/{id}/approve` - Approve return (manager only)
- `POST /api/returns/{id}/reject` - Reject return

### Reports
- `GET /api/reports/daily_sales?date=YYYY-MM-DD` - Daily sales
- `GET /api/reports/products?metric=best_sellers` - Product analytics
- `GET /api/reports/inventory_status` - Inventory health

## Setup

### Prerequisites
- Python 3.9+
- PostgreSQL (optional - uses SQLite by default)
- pip

### Installation

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create superuser (admin):
```bash
python manage.py createsuperuser
```

5. Run development server:
```bash
python manage.py runserver
```

Server will be available at `http://localhost:8000`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
USE_POSTGRES=False  # Set to True to use PostgreSQL
DB_NAME=sap_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=your-secret-key-change-in-production

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Cache
USE_REDIS=False  # Set to True to use Redis
REDIS_URL=redis://127.0.0.1:6379/1

# Business Settings
CURRENCY=USD
```

## Authentication

The API uses JWT (JSON Web Tokens) for stateless authentication.

**Getting a token:**
```bash
POST /api/auth/login
{
  "username": "username",
  "password": "password"
}
```

**Using the token:**
Include in request headers:
```
Authorization: Bearer <access_token>
```

## Database Models

- **Store**: Multi-store support
- **User**: Users with role-based access (cashier, stock_staff, manager, customer, admin)
- **Product**: Product catalog with SKU/barcode
- **Category**: Product categories
- **Inventory**: Current stock levels
- **InventoryTransaction**: Audit trail of all inventory changes
- **Sale**: Completed POS transactions
- **SaleLineItem**: Items in a sale
- **Payment**: Payment records (split payment support)
- **Return**: Customer returns
- **ReturnLineItem**: Items being returned
- **Customer**: Loyalty program customers
- **Discount**: Promotional discounts
- **Layaway**: Layaway/hold on items
- **DailySalesReport**: Denormalized sales summary

## API Response Format

### Success Response
```json
{
  "id": "uuid",
  "field": "value",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "errors": {
    "field": ["Error detail"]
  }
}
```

## Testing

Run tests:
```bash
python manage.py test
```

## Deployment

### Production Settings
- Set `DEBUG=False`
- Change `SECRET_KEY`
- Use PostgreSQL database
- Set `ALLOWED_HOSTS`
- Use HTTPS
- Configure Stripe production keys

### Docker Deployment
```bash
docker build -t sap-backend .
docker run -p 8000:8000 -e DEBUG=False sap-backend
```

## Documentation

API documentation available at `/api/docs/` (when configured with drf-spectacular)

## License

Copyright © 2025 SAP Platform. All rights reserved.
