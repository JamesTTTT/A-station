# A-Station

A lightweight, visual execution layer for Ansible. Point it at your playbooks, run them, and watch the results in real-time through a DAG visualization.

A-Station doesn't try to replace Ansible's native file-based workflow — it wraps it. Playbooks and inventory stay where they belong (in your repos, on your filesystem). A-Station handles **execution, visualization, and monitoring**.

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
    classDef primary fill:#5b6fd8,stroke:#4757b8,stroke-width:2px,color:#ffffff
    classDef secondary fill:#e8eaf6,stroke:#7986e0,stroke-width:2px,color:#1a1a2e
    classDef tertiary fill:#f5f5f7,stroke:#9ca4e8,stroke-width:2px,color:#333333
    classDef source fill:#e8f5e9,stroke:#66bb6a,stroke-width:2px,color:#1b5e20

    subgraph Client["Browser"]
        React["**React App**<br/>DAG Visualization + File Browser"]:::secondary
    end

    subgraph API_Layer["FastAPI — Port 8000"]
        Auth["Auth & Workspaces"]:::primary
        SourceAPI["Source Management<br/>CRUD · Sync · File Browser · Inventory Parser"]:::primary
        JobAPI["Job Execution<br/>Create · Status · History"]:::primary
    end

    subgraph Data["Data Layer"]
        PG[("**PostgreSQL**<br/>Users · Workspaces<br/>ProjectSources · Jobs")]:::secondary
        Redis[("**Valkey**<br/>Task Queue · Pub/Sub")]:::secondary
    end

    subgraph Sources["Project Sources on Disk"]
        GitClone["**Git Clones**<br/>cloned to /data/a-station/sources/"]:::source
        LocalDir["**Local Directories**<br/>mounted at /data/ansible-projects/"]:::source
    end

    subgraph Workers["Celery Workers"]
        W15["**Ansible 2.15**<br/>ansible-runner"]:::tertiary
        W16["**Ansible 2.16**<br/>ansible-runner"]:::tertiary
        W17["**Ansible 2.17**<br/>ansible-runner"]:::tertiary
    end

    React -->|REST| Auth
    React -->|REST| SourceAPI
    React -->|REST| JobAPI
    React <-.->|WebSocket<br/>live events| Redis

    SourceAPI -->|"git clone / pull"| GitClone
    SourceAPI -->|"read files"| LocalDir
    SourceAPI <--> PG

    JobAPI -->|"create job record"| PG
    JobAPI -->|"dispatch task"| Redis

    Redis -->|"versioned queues"| W15
    Redis -->|"versioned queues"| W16
    Redis -->|"versioned queues"| W17

    W15 & W16 & W17 -->|"read playbooks<br/>& inventory"| Sources
    W15 & W16 & W17 -->|"stream events"| Redis
```

## Core Concepts

- **Project Source**: A pointer to a git repo or local directory containing your Ansible playbooks and inventory. A-Station reads from the source — it doesn't store your YAML.
- **Job**: A single execution of a playbook against an inventory. Jobs are queued via Celery, executed by ansible-runner, and streamed to the browser in real-time.
- **Workspace**: Multi-tenant isolation. Each workspace has its own project sources, jobs, and members.

## Features

- Real-time DAG visualization of playbook execution (React Flow)
- Live log streaming via WebSocket
- Multi-version Ansible worker support (2.15, 2.16, 2.17)
- Job history and status tracking
- JWT authentication with refresh token rotation
- Multi-workspace support with role-based access

## Technology Stack

### Frontend (`a-station-react-app/`)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Visualization**: React Flow
- **UI**: Tailwind CSS v4 + shadcn/ui
- **State Management**: Zustand

### Backend (`a-station-fast-api/`)
- **API**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 17 (via SQLAlchemy)
- **Task Queue**: Celery + Valkey (Redis-compatible)
- **Auth**: JWT with refresh token rotation
- **Migrations**: Alembic

### Ansible Worker (`ansible-worker/`)
- **Execution**: ansible-runner
- **Task Processing**: Celery
- **Streaming**: Redis pub/sub → WebSocket

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Docker & Docker Compose**

### Quick Start

```bash
# Backend + Infrastructure
cd a-station-fast-api
cp .env.example .env
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
