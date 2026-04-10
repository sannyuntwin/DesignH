# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Python 3.11+ installed
- ✅ Docker installed (for PostgreSQL)

---

## Step 1: Start PostgreSQL Database

```bash
docker-compose up -d postgres
```

Verify it's running:
```bash
docker-compose ps
```

---

## Step 2: Setup Backend (FastAPI Server)

Open a terminal and run:

```bash
cd server
pip install -r requirements.txt
```

Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

✅ Test it: Open http://localhost:8000/health in your browser

---

## Step 3: Setup Frontend (Next.js)

Open **another terminal** and run:

```bash
cd web
npm install
```

Start the frontend:
```bash
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ Test it: Open http://localhost:3000 in your browser

---

## Step 4: Verify Everything Works

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000
3. **API Docs**: http://localhost:8000/docs

Try the API:
```bash
# Test health endpoint
curl http://localhost:8000/health

# View interactive API docs
# Open http://localhost:8000/docs in browser
```

---

## Alternative: Run Both with One Command

From the root directory:

```bash
# Install concurrently (one-time)
npm install

# Run both services together
npm run dev
```

This starts both the frontend and backend simultaneously!

---

## Common Issues & Solutions

### ❌ "Module not found" errors in server
```bash
cd server
pip install -r requirements.txt
```

### ❌ "Cannot find module" errors in web
```bash
cd web
npm install
```

### ❌ Database connection error
Make sure PostgreSQL is running:
```bash
docker-compose up -d postgres
```

### ❌ Frontend can't reach backend
1. Check server is running on port 8000
2. Verify `web/.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## What's Next?

1. ✅ Explore the API documentation at http://localhost:8000/docs
2. ✅ Test the authentication endpoints
3. ✅ Complete the stub API implementations in `server/app/api/`
4. ✅ Add your business logic

---

## Project Structure

```
d:\ForHtet\
├── web/              ← Next.js Frontend (http://localhost:3000)
├── server/           ← FastAPI Backend (http://localhost:8000)
├── database/         ← SQL schema files
├── docker-compose.yml
└── package.json      ← Root scripts
```

---

## Useful Commands

```bash
# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart PostgreSQL
docker-compose restart postgres

# Run frontend only
cd web && npm run dev

# Run backend only
cd server && uvicorn app.main:app --reload --port 8000
```

---

**Need Help?**
- Full documentation: `README.md`
- Restructure details: `RESTRUCTURE-COMPLETE.md`
- API documentation: http://localhost:8000/docs
