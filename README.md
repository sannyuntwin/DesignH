# Design Editor - Web + Server Architecture

This project has been restructured into a modern full-stack architecture with separate frontend and backend services.

## Project Structure

```
d:\ForHtet\
├── web/                    # Next.js Frontend (React + TypeScript)
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   ├── public/            # Static assets
│   ├── store/             # Zustand state management
│   └── package.json       # Frontend dependencies
│
├── server/                # FastAPI Backend (Python)
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── core/         # Configuration and security
│   │   ├── models/       # SQLAlchemy database models
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Business logic layer
│   │   └── main.py       # FastAPI application entry point
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Server Docker configuration
│
├── database/             # PostgreSQL schema files
├── docker-compose.yml    # Docker orchestration
└── package.json          # Root development scripts
```

## Tech Stack

### Frontend (web/)
- **Framework**: Next.js 14.0.4 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Canvas**: Fabric.js
- **Internationalization**: next-i18next

### Backend (server/)
- **Framework**: FastAPI 0.109.0
- **Language**: Python 3.11
- **Database ORM**: SQLAlchemy 2.0 (async)
- **Database**: PostgreSQL 15
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose (optional)

### Development Mode (Local)

1. **Install dependencies**:
   ```bash
   # Frontend
   cd web
   npm install
   
   # Backend
   cd server
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   
   **web/.env.local**:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
   
   **server/.env**:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/designh
   JWT_SECRET=your-secret-key-change-in-production
   ```

3. **Start PostgreSQL database**:
   ```bash
   docker-compose up -d postgres
   ```

4. **Run the application**:
   
   Option 1: Run both services separately
   ```bash
   # Terminal 1 - Backend
   cd server
   uvicorn app.main:app --reload --port 8000
   
   # Terminal 2 - Frontend
   cd web
   npm run dev
   ```
   
   Option 2: Use root package.json (requires `concurrently`)
   ```bash
   npm install
   npm run dev
   ```

### Development Mode (Docker)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## API Documentation

Once the server is running, you can access:
- **API Base URL**: http://localhost:8000
- **Interactive API Docs (Swagger)**: http://localhost:8000/docs
- **Alternative API Docs (ReDoc)**: http://localhost:8000/redoc

## Available Scripts

### Root Level
```bash
npm run dev           # Start both frontend and backend
npm run dev:web       # Start frontend only
npm run dev:server    # Start backend only
npm run build:web     # Build frontend for production
npm run docker:up     # Start Docker services
npm run docker:down   # Stop Docker services
```

### Frontend (web/)
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

### Backend (server/)
```bash
uvicorn app.main:app --reload    # Start development server
uvicorn app.main:app             # Start production server
```

## Database Migration

The database schema is automatically initialized when PostgreSQL starts for the first time using the SQL files in the `database/` directory.

Schema files:
- `database/schema.sql` - Core tables (users, designs)
- `database/extended-schema.sql` - Extended features (templates, collaborations, comments, etc.)
- `database/brand-kits-schema.sql` - Brand kit functionality
- `database/seed.sql` - Sample data

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Designs
- `GET /api/designs` - List user designs
- `POST /api/designs` - Create new design
- `GET /api/designs/{id}` - Get design details
- `PUT /api/designs/{id}` - Update design
- `DELETE /api/designs/{id}` - Delete design

### Other Endpoints
- `/api/teams` - Team management
- `/api/templates` - Template gallery
- `/api/assets` - Asset library
- `/api/files` - File management
- `/api/comments` - Comments system
- `/api/export` - Export functionality
- `/api/analytics` - Analytics data
- `/api/search` - Search functionality
- `/api/profile` - User profile

See full API documentation at http://localhost:8000/docs

## Architecture Notes

1. **CORS**: The FastAPI server is configured to accept requests from the Next.js frontend (localhost:3000)
2. **Authentication**: JWT-based authentication with Bearer tokens
3. **Database**: Async database operations using SQLAlchemy with asyncpg
4. **File Uploads**: Handled via FastAPI's UploadFile with multipart form data

## Future Enhancements

- [ ] Implement remaining API route handlers (currently stubs)
- [ ] Add file storage integration (AWS S3, Cloudinary, etc.)
- [ ] Implement WebSocket for real-time collaboration
- [ ] Add rate limiting and advanced security features
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive test coverage

## License

Private project - All rights reserved
