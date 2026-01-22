# PLENRO-PTO Backend API

Production-ready Node.js + Express + TypeScript backend with Microsoft SQL Server (MSSQL).

## Features

- 🔐 **Security**: Helmet, CORS, Rate Limiting
- 📦 **Connection Pooling**: Efficient database connections
- ✅ **Validation**: Request validation with express-validator
- 🚀 **TypeScript**: Full type safety
- 📝 **Error Handling**: Consistent error responses
- 📊 **Pagination**: Built-in pagination support

## Project Structure

```
backend/
├── database/
│   └── schema.sql          # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts     # MSSQL connection pool
│   │   ├── env.ts          # Environment configuration
│   │   └── index.ts
│   ├── middleware/
│   │   ├── errorHandler.ts # Error handling middleware
│   │   └── index.ts
│   ├── routes/
│   │   ├── permits.ts      # Permits API
│   │   ├── collections.ts  # Collections API
│   │   ├── dashboard.ts    # Dashboard API
│   │   └── index.ts
│   ├── types/
│   │   ├── entities.ts     # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/
│   │   ├── response.ts     # Response helpers
│   │   └── index.ts
│   └── index.ts            # Server entry point
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── tsconfig.json
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

Run the SQL schema in SQL Server Management Studio (SSMS):

```bash
# Open SSMS and run:
database/schema.sql
```

### 3. Configure Environment

Edit `.env` with your database credentials:

```env
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=Iamgod3875!
DB_NAME=ENRODB
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

### Dashboard
```
GET /api/dashboard          # Get dashboard statistics
GET /api/dashboard/health   # Database health check
```

### Permits
```
GET    /api/permits                    # List permits (paginated)
GET    /api/permits/:id                # Get single permit
GET    /api/permits/summary/barangay   # Barangay share summary
GET    /api/permits/summary/municipal  # Municipal share summary
```

### Collections
```
GET    /api/collections                # List collections (paginated)
GET    /api/collections/:id            # Get single collection
POST   /api/collections                # Create collection
GET    /api/collections/report/summary # Collections summary
```

## Query Parameters

### Pagination
```
?page=1&limit=10
```

### Filtering (Permits)
```
?status=approved
?barangay=Poblacion
```

### Filtering (Collections)
```
?startDate=2024-01-01&endDate=2024-12-31
?paymentMethod=cash
```

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5001 |
| `NODE_ENV` | Environment | development |
| `DB_SERVER` | SQL Server host | localhost |
| `DB_USER` | Database user | sa |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | ENRODB |
| `DB_PORT` | SQL Server port | 1433 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
