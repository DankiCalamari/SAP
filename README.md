# SAP Platform - Sales & Inventory Management

A comprehensive full-stack SaaS platform for retail management with Point-of-Sale (POS) terminal, mobile inventory management, and admin dashboard.

## Platform Overview

The SAP Platform consists of three main applications:

1. **Backend API** (`backend-api/`) - Django REST Framework
2. **POS Terminal** (`frontend-pos/`) - Electron + React desktop app for cashiers
3. **Mobile Stock App** (`app-mobile/`) - React Native (planned)
4. **Admin Dashboard** (`admin-dashboard/`) - React web app (planned)

## Quick Start

### Backend API

```bash
cd backend-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API available at `http://localhost:8000`

### POS Terminal

```bash
cd frontend-pos
npm install
npm run dev
```

## Key Features Implemented

### Backend API (COMPLETE)
- ✓ 13 data models with relationships
- ✓ JWT authentication with role-based access
- ✓ 40+ REST API endpoints
- ✓ POS transaction processing
- ✓ Inventory management with audit trail
- ✓ Returns and refunds
- ✓ Loyalty program integration
- ✓ Business reporting system
- ✓ PostgreSQL/SQLite support

### POS Terminal (FOUNDATION)
- ✓ Electron desktop app setup
- ✓ React 18 + Zustand state management
- ✓ API client with JWT auth
- ✓ Basic styling framework
- ⏳ Screens (in README with implementation guide)
- ⏳ Components (documented for implementation)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    SAP Platform                      │
├─────────────┬──────────────────┬───────────────────┤
│   POS       │   Mobile App     │   Admin           │
│  Terminal   │   (React Native) │  Dashboard        │
│ (Electron)  │                  │  (React)          │
├─────────────┴──────────────────┴───────────────────┤
│         Backend API (Django REST)                   │
│  ├─ Authentication (JWT)                           │
│  ├─ Product Management                            │
│  ├─ Inventory System                              │
│  ├─ Sales Transactions                            │
│  ├─ Returns & Refunds                             │
│  ├─ Loyalty Program                               │
│  └─ Reporting & Analytics                         │
├─────────────────────────────────────────────────────┤
│    Database (PostgreSQL/SQLite)                     │
│    19 Models, 40+ API Endpoints                     │
└─────────────────────────────────────────────────────┘
```

## Documentation

- **Full Backend Docs**: `backend-api/README.md`
- **POS Terminal Docs**: `frontend-pos/README.md` (with implementation guide)
- **Planning**: `planning.md`
- **Research**: `research.md`

## Technology Stack

### Backend
- Django 5.2 + Django REST Framework
- PostgreSQL / SQLite
- JWT Authentication
- Bcrypt password hashing

### Frontend - POS
- Electron 27
- React 18
- Zustand state management
- Axios HTTP client

### Frontend - Mobile (Planned)
- React Native
- SQLite/Realm database
- Redux state management

### Frontend - Admin (Planned)
- React 18 + TypeScript
- Material-UI components
- Recharts visualizations

## Project Structure

```
SAP/
├── backend-api/          # Django REST API (COMPLETE)
│   ├── apps/
│   │   ├── authentication/    # JWT & User management
│   │   ├── products/         # Product catalog
│   │   ├── inventory/        # Stock tracking
│   │   ├── sales/            # POS transactions
│   │   ├── returns/          # Returns/refunds
│   │   ├── loyalty/          # Customers & discounts
│   │   └── reporting/        # Analytics & reports
│   ├── config/               # Django settings & URLs
│   ├── requirements.txt
│   ├── manage.py
│   └── README.md
│
├── frontend-pos/         # Electron POS Terminal (FOUNDATION)
│   ├── src/
│   │   ├── screens/          # Screen components (template)
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api.js            # API client
│   │   ├── store.js          # Zustand stores
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── main.js               # Electron main
│   ├── preload.js            # IPC bridge
│   ├── package.json
│   └── README.md (with full implementation guide)
│
├── planning.md           # Complete project specification
├── research.md           # Research & analysis
└── README.md (this file)
```

## Key Implementation Details

### Database Models (19 total)
All models include UUID primary keys, timestamps, and multi-store support:
- Store, User, Category, Product
- Inventory, InventoryTransaction
- Sale, SaleLineItem, Payment
- Return, ReturnLineItem
- Customer, Discount, Layaway, LayawayItem
- DailySalesReport

### API Endpoints (40+)
Organized by feature:
- Authentication: login, logout, refresh-token, register
- Products: CRUD + barcode search + low-stock
- Inventory: levels, adjustments, transactions, audit trail
- Sales: create, list, details, void, refund
- Returns: create, approve, reject
- Customers: search, loyalty-status
- Discounts: available, validate, CRUD
- Reports: daily-sales, products, inventory-status

### Authentication Flow
1. Cashier logs in with username/password
2. Backend validates credentials
3. Returns JWT access token + refresh token
4. Client stores tokens in localStorage (via Zustand)
5. All API calls include Authorization header
6. Auto-refresh on token expiry

### POS Transaction Flow
1. Cashier searches products by barcode/name
2. Click to add items to cart (Zustand state)
3. Optional: lookup customer for loyalty
4. Optional: apply discount code (validated server-side)
5. Select payment method
6. Submit to backend (POST /api/sales/create_transaction)
7. Backend validates inventory availability
8. Creates Sale, SaleLineItem, Payment records
9. Updates Inventory (decrements stock)
10. Creates InventoryTransaction (audit)
11. Returns receipt data to client
12. Print receipt (window.print or thermal printer)

## Setup Instructions

### Prerequisites
- Python 3.9+ (backend)
- Node.js 14+ (frontend)
- PostgreSQL 12+ (production)

### Backend Setup
```bash
cd backend-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Create admin account
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend-pos
npm install
npm run dev  # Development
# or
npm run build  # Production build
```

### Configuration
Create `.env` files:

**Backend** (`backend-api/.env`)
```
USE_POSTGRES=False
DEBUG=True
JWT_SECRET=dev-secret-key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

**Frontend** (`frontend-pos/.env`)
```
REACT_APP_API_URL=http://localhost:8000/api
```

## Testing

### Backend
```bash
cd backend-api
python manage.py test
```

### Frontend (when components are added)
```bash
cd frontend-pos
npm test
```

## Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Generate secure `SECRET_KEY`
- [ ] Use PostgreSQL database
- [ ] Configure SSL/HTTPS
- [ ] Set `ALLOWED_HOSTS`
- [ ] Configure static files
- [ ] Setup email for notifications
- [ ] Configure Stripe production keys
- [ ] Enable rate limiting
- [ ] Setup logging and monitoring

### Docker Deployment
```bash
# Backend
docker build -f backend-api/Dockerfile -t sap-backend .
docker run -d -p 8000:8000 sap-backend

# Frontend
npm run build
docker build -t sap-pos .
docker run -d -p 5000:5000 sap-pos
```

## User Roles & Permissions

| Role | POS | Inventory | Reports | Settings |
|------|-----|-----------|---------|----------|
| Cashier | Full | Read | - | - |
| Stock Staff | - | Full | - | - |
| Manager | Full | Full | Full | Full |
| Customer | - | Browse | - | Own data |
| Admin | Full | Full | Full | Full |

## Performance Targets

- POS transaction: < 2 seconds
- Product search: < 500ms
- Report generation: < 1 second
- API response: < 200ms (95th percentile)

## Security Features

- JWT tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Passwords hashed with bcrypt
- SQL injection prevention (Django ORM)
- CORS configured
- Rate limiting by role
- Full audit trail
- Role-based access control

## Next Steps for Implementation

### Phase 1 (Current)
✓ Backend API complete
✓ POS Terminal foundation

### Phase 2 (Screens & Components)
- Implement login screen
- Implement main POS screen
- Create all UI components
- Add payment processing
- Receipt printing

### Phase 3 (Mobile)
- React Native app
- Staff inventory dashboard
- Customer browsing
- Push notifications

### Phase 4 (Admin)
- React dashboard
- Analytics visualizations
- User management
- Store configuration

## Support & Troubleshooting

**Backend won't start**
- Ensure PostgreSQL/SQLite is accessible
- Check database migrations: `python manage.py migrate`
- Verify all dependencies: `pip install -r requirements.txt`

**API connection errors**
- Check CORS settings in backend
- Verify `REACT_APP_API_URL` in frontend .env
- Ensure backend is running on correct port

**Token expiration**
- Frontend should auto-refresh via refresh_token endpoint
- Check token storage in localStorage

## License

Copyright © 2025 SAP Platform. All rights reserved.

---

**Status**: Foundation Complete (v1.0.0)
**Last Updated**: October 31, 2025
