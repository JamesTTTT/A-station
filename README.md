# A-Station

Web-based Ansible automation platform with real-time playbook execution, workspace management, and WebSocket log streaming.

## Architecture

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#f5f5f7',
    'primaryTextColor': '#333333',
    'primaryBorderColor': '#5b6fd8',
    'lineColor': '#7986e0'
  }
}}%%

flowchart TB
    %% Definitions using classDef for cleaner styling %%
    classDef primary fill:#5b6fd8,stroke:#4757b8,stroke-width:2px,color:#ffffff
    classDef secondary fill:#e8eaf6,stroke:#7986e0,stroke-width:2px,color:#1a1a2e
    classDef tertiary fill:#f5f5f7,stroke:#9ca4e8,stroke-width:2px,color:#333333
    classDef plain fill:none,stroke:none,color:#333333

    subgraph Client
        Browser["**React App**<br/>Port 5173"]:::secondary
    end

    subgraph Server
        API["**FastAPI**<br/>Port 8000"]:::primary
    end

    subgraph Database
        PG[("PostgreSQL")]:::secondary
        Redis[("Valkey")]:::secondary
    end

    subgraph Workers
        W1["Ansible 2.15"]:::tertiary
        W2["Ansible 2.16"]:::tertiary
        W3["Ansible 2.17"]:::tertiary
    end

    %% Connections %%
    Browser -->|REST API| API
    Browser <-->|WebSocket| API
    API <--> PG
    API <--> Redis
    Redis --> W1
    Redis --> W2
    Redis --> W3
```

## Technology Stack

### Frontend (`a-station-react-app/`)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router (with context-based auth)
- **UI Library**: Tailwind CSS v4 + shadcn/ui (Radix UI components)
- **Icons**: Lucide React
- **State Management**: React Context API

### Backend (`a-station-fast-api/`)
- **API Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 17 (via SQLAlchemy ORM)
- **Task Queue**: Celery + Valkey (Redis-compatible)
- **Authentication**: JWT (access tokens + refresh tokens with rotation)
- **Migrations**: Alembic
- **WebSockets**: FastAPI WebSocket support for real-time updates

### Ansible Worker (`ansible-worker/`)
- **Execution Engine**: Ansible Runner
- **Task Processing**: Celery worker
- **Event Streaming**: Real-time log streaming via WebSocket

## Features

- JWT authentication with refresh token rotation
- Multi-workspace support with role-based access
- Async Ansible playbook execution via Celery
- Real-time log streaming via WebSocket
- Multi-version Ansible worker support (2.15, 2.16, 2.17)
- Job history and status tracking
- React-based dashboard with protected routing

## Getting Started

### Prerequisites

- **Node.js** 20+ (for frontend)
- **Python** 3.11+ (for backend)
- **Docker & Docker Compose** (for infrastructure)
- **Git**

### Quick Start

```bash
# Backend + Infrastructure
cd a-station-fast-api
cp .env.example .env  # Configure environment
docker-compose up -d

# Frontend
cd a-station-react-app
npm install
npm run dev
```

**URLs**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup (without Docker)

```bash
# Infrastructure
cd a-station-fast-api
docker-compose up -d db redis

# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Celery worker (separate terminal)
celery -A app.celery_app.celery_config worker --loglevel=info

# Frontend (separate terminal)
cd a-station-react-app
npm install && npm run dev
```

## Development Notes

- API documentation available at http://localhost:8000/docs
- Frontend uses custom Tailwind theme and shadcn/ui components
- Backend uses FastAPI with SQLAlchemy ORM and Pydantic validation
- JWT authentication with bcrypt password hashing
- Celery workers handle async Ansible playbook execution