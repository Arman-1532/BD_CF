# BDCF (Crowdfunding Platform)

> **Important:** To run and connect to the project database/services, you must first connect to the **SalesTrace VPN**.

## Prerequisites

- Node.js (v18+ recommended)
- Connected to the **SalesTrace VPN**

---

## Getting Started

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Configure your environment variables in `backend/.env` (ensure database connection details point to the SalesTrace network).

Run the backend development server:

```bash
npm run dev
```

### 2. Frontend Setup

In a separate terminal, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Run the frontend development server:

```bash
npm run dev
```

---

## Testing

### Frontend Linting

To check frontend code quality:

```bash
cd frontend
npm run lint
```
