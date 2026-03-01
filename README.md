# AI Invoice Automation SaaS Application

Production-style full-stack SaaS app for:
- Uploading CSV/XLSX customer sales data
- AI-assisted data validation
- Bulk invoice PDF generation
- Automated invoice email delivery
- Invoice tracking and export

## Tech Stack

- Frontend: React (Vite), TypeScript, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, JWT, Multer, Nodemailer, PDFKit
- Database: MongoDB Atlas + Mongoose

## Project Structure

```txt
client/
  src/
    components/
    context/
    hooks/
    pages/
    services/
server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
```

## Setup

## 1) Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

## 2) Configure environment variables

Copy:
- `server/.env.example` -> `server/.env`
- `client/.env.example` -> `client/.env`

Set at least:
- MongoDB Atlas URI (`MONGO_URI`)
- JWT secret (`JWT_SECRET`)
- SMTP credentials for real email delivery (`SMTP_*`)

## 3) Run in development

Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Profile
- `GET /api/profile` (protected)
- `PUT /api/profile` (protected, optional logo upload)

### Upload + Invoice Sending
- `POST /api/upload/parse` (protected, CSV/XLSX file)
- `PUT /api/upload/customers` (protected, edit table data)
- `PUT /api/upload/advanced-settings` (protected)
- `POST /api/upload/send` (protected)

### Records Dashboard
- `GET /api/invoices/records` (protected)
- `DELETE /api/invoices/records/:customerId` (protected)
- `GET /api/invoices/records/:customerId/export?format=csv|xlsx` (protected)

## Notes

- Sales data validation enforces required fields:
  - Customer Name
  - Customer Email
  - Product Name
  - Quantity
  - Price
- Invalid uploads return:
  - `Provide only customer sales data to generate invoices.`
- PDF invoices are stored under `server/uploads/invoices/`.
- Uploaded logos are stored under `server/uploads/logos/`.
- If SMTP is not configured, backend falls back to JSON transport for development.

