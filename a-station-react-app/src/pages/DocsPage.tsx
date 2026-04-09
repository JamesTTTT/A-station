import { useState } from "react";

interface DocSection {
  id: string;
  title: string;
  content: string;
}

interface DocCategory {
  label: string;
  sections: DocSection[];
}

const categories: DocCategory[] = [
  {
    label: "Overview",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: `## Introduction

A-Station is a visual platform for managing, visualizing, and executing Ansible playbooks. It provides a web-based interface where teams can connect to Git repositories, browse Ansible project files, render playbooks as interactive node graphs on a canvas, and execute them against inventories with real-time log streaming.

### Key Features

- **Visual Playbook Canvas** — Ansible playbooks are parsed and rendered as directed acyclic graphs (DAGs). Each play becomes a head node and each task becomes a connected task node, giving you an at-a-glance view of your automation flow.
- **Git Source Integration** — Connect your workspaces to Git repositories. A-Station clones the repo, displays the file tree, and keeps it in sync with pull operations.
- **Local Source Support** — Point A-Station at a local directory containing Ansible projects for environments where Git is not available.
- **Real-Time Execution** — Run playbooks directly from the canvas. Task and play nodes update their status live as execution progresses. Logs stream in real time via WebSocket.
- **Team Workspaces** — Organize work into workspaces with role-based access control. Invite team members as Viewers, Members, Admins, or Owners.
- **Inventory Auto-Detection** — A-Station scans your source tree for inventory files and lets you select which one to use when executing a playbook.

### Architecture

A-Station consists of three main services:

- **Frontend** — React single-page application (this app). Communicates with the backend over REST and WebSocket.
- **Backend** — FastAPI application providing REST endpoints for authentication, workspaces, sources, and jobs. Dispatches execution tasks to Celery workers and streams output via Redis pub/sub.
- **Ansible Workers** — Celery workers that run \`ansible-playbook\` commands. Each worker subscribes to a version-specific queue (e.g. \`ansible_2_17\`) so multiple Ansible versions can be supported simultaneously.

Supporting infrastructure includes PostgreSQL for persistent storage, Redis for the Celery broker, result backend, and WebSocket pub/sub.`,
      },
      {
        id: "getting-started",
        title: "Getting Started",
        content: `## Getting Started

### Prerequisites

- A running A-Station backend instance with PostgreSQL and Redis
- Docker and Docker Compose (for the recommended setup)
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Git installed on the backend host (for Git source cloning)

### Quick Start

1. **Start the backend services** — Run \`docker-compose up\` from the backend directory. This starts the FastAPI server, PostgreSQL, Redis, Celery beat scheduler, and the Ansible worker.
2. **Start the frontend** — From the \`a-station-react-app\` directory, run \`npm install\` then \`npm run dev\`. The app runs on \`http://localhost:5173\` by default.
3. **Create an account** — Navigate to the app and click **Sign In**, then register a new account with your email, username, and password.
4. **Create a workspace** — After logging in, you will be taken to the workspace selection page. Click **Create** to make your first workspace.
5. **Add a source** — In the dashboard, use the file tree panel on the left to add a Git repository or local path as a source.
6. **Open a playbook** — Browse the file tree and click on a YAML playbook file. It will be parsed and rendered on the canvas.
7. **Execute** — Select an inventory from the dropdown in the top-right of the canvas, then click the **Play** button to run the playbook. Watch the logs stream in the right panel.

### Environment Configuration

The frontend requires one environment variable:

\`\`\`
VITE_BASE_URL=http://localhost:8000/api/v1
\`\`\`

The backend is configured via a \`.env\` file with the following key variables:

- \`SECRET_KEY\` — JWT signing key (generate with \`openssl rand -hex 32\`)
- \`DATABASE_URL\` — PostgreSQL connection string
- \`SOURCE_STORAGE_PATH\` — Filesystem path where cloned sources are stored (default: \`/data/a-station/sources\`)
- \`BACKEND_CORS_ORIGINS\` — Allowed frontend origins for CORS
- \`ACCESS_TOKEN_EXPIRE_MINUTES\` — JWT access token lifetime (default: 15)
- \`REFRESH_TOKEN_EXPIRE_DAYS\` — Refresh token lifetime (default: 30)`,
      },
    ],
  },
  {
    label: "Core Concepts",
    sections: [
      {
        id: "authentication",
        title: "Authentication",
        content: `## Authentication

A-Station uses JWT-based authentication with a secure refresh token rotation scheme.

### Registration

Create an account by providing an email address, username (3-50 characters), and password (8-72 characters). After registration, you are automatically logged in and redirected to the workspace selection page.

### Login

Sign in with your email and password. On success, the backend returns:

- **Access token** — A short-lived JWT (15 minutes by default) sent in the response body. The frontend stores it in memory and includes it as a \`Bearer\` token in the \`Authorization\` header of all API requests.
- **Refresh token** — A long-lived opaque token (30 days by default) set as an \`httpOnly\` cookie. It is used to obtain new access tokens without re-entering credentials.

### Token Refresh

When the access token expires, the frontend automatically calls the refresh endpoint. The backend verifies the refresh token cookie, issues a new access token and a new refresh token, and revokes the old refresh token. This rotation scheme means each refresh token can only be used once.

A 30-second grace period handles race conditions where multiple requests may attempt to refresh simultaneously.

### Token Families

Each login session creates a token "family." All refresh tokens in a family are linked together. If a revoked token is reused (indicating potential theft), the entire family can be invalidated.

### Logout

Logging out revokes the current refresh token. The **Logout All** option revokes every refresh token for the user across all devices and sessions.

### Expired Token Cleanup

A scheduled Celery task runs daily at 3:00 AM UTC to clean up expired refresh tokens from the database. Revoked tokens are kept for 7 days for auditing before deletion.`,
      },
      {
        id: "workspaces",
        title: "Workspaces",
        content: `## Workspaces

Workspaces are the top-level organizational unit in A-Station. Each workspace has its own set of sources, playbooks, jobs, and team members.

### Creating a Workspace

From the workspace selection page, click the **Create** button and enter a name. You automatically become the workspace owner.

### Workspace Roles

A-Station uses a four-tier role hierarchy:

- **Owner** — Full control. Can update or delete the workspace, manage all members, and perform any action. Each workspace has exactly one owner (the creator). The owner role cannot be changed or removed.
- **Admin** — Can add and remove members, change member roles (except the owner), and perform all member-level actions.
- **Member** — Can use the workspace: browse sources, view playbooks on the canvas, and execute jobs.
- **Viewer** — Read-only access to workspace content. Cannot execute jobs or modify sources.

### Managing Members

Admins and owners can add members by user ID and assign a role. Members can be removed or have their role changed at any time, with the exception of the workspace owner.

### Switching Workspaces

Click the **A-Station** breadcrumb in the dashboard top bar to return to the workspace selection page. Selecting a different workspace clears the current source and canvas state.`,
      },
      {
        id: "sources",
        title: "Sources",
        content: `## Sources

Sources connect A-Station to your Ansible content. A source points to a directory of Ansible files, either cloned from a Git repository or referenced as a local path on the backend host.

### Source Types

- **Git** — Provide a repository URL and an optional branch (defaults to \`main\`). A-Station clones the repository to an isolated directory on the backend at \`{SOURCE_STORAGE_PATH}/{workspace_id}/{source_id}\`. SSH keys are mounted from the host's \`~/.ssh\` directory for private repository access.
- **Local** — Provide an absolute path to a directory on the backend host. The directory must exist. A-Station reads files directly from this path without copying.

### Adding a Source

1. In the dashboard, open the **Add Source** dialog from the file tree panel.
2. Enter a name for the source.
3. Select **Git** or **Local**.
4. For Git: enter the repository URL and optionally a branch name.
5. For Local: enter the absolute path to the Ansible project directory.
6. Click **Add**. For Git sources, the repository will be cloned, which may take a moment.

### Syncing a Git Source

Click the **Sync** button (refresh icon) in the file tree panel header to pull the latest changes from the remote repository. This runs \`git pull\` on the cloned directory.

### File Tree

Once a source is active, the file tree panel displays the directory structure. Hidden files (starting with \`.\`) are excluded. Directories are sorted before files. Click on any file to view its contents.

### Deleting a Source

Removing a source deletes it from the workspace. For Git sources, the cloned directory is also removed from disk.`,
      },
    ],
  },
  {
    label: "Using the Dashboard",
    sections: [
      {
        id: "canvas",
        title: "Canvas",
        content: `## Canvas

The canvas is the visual core of A-Station. It renders Ansible playbooks as interactive directed acyclic graphs using React Flow.

### Loading a Playbook

Click on a YAML file in the file tree. A-Station's parser reads the file and produces two types of nodes:

- **Head Nodes** — Represent plays. Display the play name, target hosts, become settings, gather_facts, tags, and variables. Head nodes can be expanded or collapsed.
- **Task Nodes** — Represent individual tasks within a play. Display the task name and the Ansible module being used (e.g. \`apt\`, \`copy\`, \`shell\`).

Nodes are connected by edges showing the execution order. Each play's tasks flow downward from its head node.

### Navigating the Canvas

- **Pan** — Click and drag on the background.
- **Zoom** — Scroll to zoom in and out.
- **Select** — Click on a node to highlight it. Selected nodes show a ring outline.
- **Minimap** — A minimap in the bottom-right corner shows an overview of the entire graph. Node colors in the minimap reflect execution state.

### Head Node Details

Click the chevron on a head node to expand it and see:

- **Hosts** — The target host or group pattern.
- **Become** — Whether privilege escalation is enabled, and which user.
- **Gather Facts** — Whether the play gathers facts before running tasks.
- **Tags** — Any tags applied to the play, shown as pill badges.
- **Variables** — Play-level variables displayed in a formatted code block.

### Module Detection

The parser identifies the Ansible module for each task by finding the first key that is not a meta key (such as \`name\`, \`when\`, \`register\`, \`tags\`, \`become\`, \`loop\`, \`with_items\`, etc.). If no module is found, the task is labeled \`unknown\`.

### Clearing the Canvas

Click the **Clear** button in the top-left panel to remove all nodes and edges.`,
      },
      {
        id: "execution",
        title: "Executing Playbooks",
        content: `## Executing Playbooks

A-Station can run Ansible playbooks directly from the canvas and stream results back in real time.

### Prerequisites

Before executing a playbook, ensure:

1. A playbook is loaded on the canvas (click a YAML file in the file tree).
2. An inventory file is selected. A-Station auto-detects inventory files from the source tree and presents them in a dropdown. You can also manually select a different inventory.
3. You have at least **Member** role in the workspace.

### Inventory Auto-Detection

A-Station scans the file tree for inventory files using these heuristics:

- Files inside directories named \`inventory\` or \`inventories\`
- Files named \`hosts\`, \`inventory\`, \`hosts.yml\`, \`hosts.yaml\`, or any \`.ini\` file

Both INI and YAML inventory formats are supported for parsing.

### Starting Execution

Click the **Play** button in the top-right canvas panel. This:

1. Sends a job request to the backend with the workspace ID, source ID, playbook path, inventory path, and Ansible version.
2. The backend validates that the paths exist on disk, creates a job record, and dispatches the task to the appropriate Celery queue (e.g. \`ansible_2_17\`).
3. A WebSocket connection is opened to \`ws://{host}/ws/jobs/{jobId}\` to receive real-time events.

### Real-Time Node Updates

As the playbook executes, canvas nodes update their visual state:

- **Running** — Blue border with a pulsing glow and spinning icon. Appears when a task or play starts.
- **Success** — Green border with a checkmark icon. Appears when a task completes successfully.
- **Failed** — Red border with an X icon. Appears when a task fails or a host is unreachable.
- **Skipped** — Yellow border with a skip icon. Appears when a task is skipped due to conditions.

Head nodes also update: they turn blue when their play starts and red if any task within the play fails.

### Job Lifecycle

Jobs move through these statuses:

- **Pending** — Job created, waiting for a worker to pick it up.
- **Running** — Worker is executing the playbook.
- **Completed** — Playbook finished successfully.
- **Failed** — Playbook finished with errors.

### Ansible Version Routing

Each job specifies an Ansible version. The backend routes the task to a version-specific Celery queue. This allows running multiple Ansible versions in parallel with dedicated workers for each version.`,
      },
      {
        id: "logs",
        title: "Execution Logs",
        content: `## Execution Logs

The right panel of the dashboard contains the execution logs viewer, accessible via the **Logs** tab in the secondary toolbar.

### Real-Time Streaming

Logs stream in real time via WebSocket as the playbook runs. The viewer auto-scrolls to the latest output. Each line of Ansible output is displayed as it arrives from the worker.

### Syntax Highlighting

Log lines are color-coded to match familiar Ansible output patterns:

- **PLAY [...]** — Purple, indicating a play is starting.
- **TASK [...]** — Lighter purple, indicating a task is starting.
- **ok:** — Green, indicating a successful task result.
- **changed:** — Yellow, indicating a task made changes.
- **failed:** and **fatal:** — Red (bold for fatal), indicating errors.
- **skipped:** — Muted, indicating a skipped task.
- **WARN / WARNING** — Orange, indicating warnings.
- **--- / ...** — Muted, for YAML document separators in output.

### Log Controls

- **Copy** — Copy the entire log output to your clipboard.
- **Clear** — Clear the current log display.

### YAML Viewer

The **YAML** tab in the secondary toolbar shows the raw YAML content of the currently selected file, rendered with CodeMirror and YAML syntax highlighting. This is read-only.`,
      },
      {
        id: "file-tree",
        title: "File Tree",
        content: `## File Tree

The file tree panel on the left side of the dashboard provides a file browser for the active source.

### Selecting a Source

If your workspace has multiple sources, use the dropdown at the top of the file tree panel to switch between them. Changing the active source loads that source's file tree and clears the canvas.

### Browsing Files

- **Directories** — Click to expand or collapse. An open folder icon indicates an expanded directory.
- **Files** — Click to select. The file's content is fetched from the backend and loaded into the YAML viewer and (if it's a playbook) onto the canvas.
- **YAML files** — Files ending in \`.yml\` or \`.yaml\` are highlighted with a blue file icon to indicate they can be loaded onto the canvas.

### Syncing

For Git sources, click the **Sync** button (refresh icon) next to the source dropdown to pull the latest changes from the remote repository. The file tree refreshes automatically after sync.`,
      },
    ],
  },
  {
    label: "API Reference",
    sections: [
      {
        id: "api-reference",
        title: "API Documentation",
        content: `## API Reference

A-Station's backend exposes a fully documented REST API. The interactive API documentation is auto-generated from the FastAPI source and is the authoritative reference for all endpoints, request/response schemas, and authentication requirements.

### Accessing the Docs

The OpenAPI documentation is available at the \`/docs\` path on your backend instance:

\`\`\`
http://localhost:8000/docs
\`\`\`

The documentation is powered by Scalar and provides an interactive interface where you can explore all endpoints, view request and response schemas, and try out API calls directly from the browser.

### API Base Path

All REST endpoints are prefixed with \`/api/v1\`. The main endpoint groups are:

- **Auth** (\`/api/v1/auth\`) — Registration, login, token refresh, and logout.
- **Workspaces** (\`/api/v1/workspaces\`) — Workspace CRUD and member management.
- **Sources** (\`/api/v1/workspaces/{id}/sources\`) — Git and local source management, file tree browsing, and inventory parsing.
- **Jobs** (\`/api/v1/jobs\`) — Playbook execution and status polling.
- **WebSocket** (\`/api/v1/ws/jobs/{id}\`) — Real-time job event streaming.

### Authentication

Most endpoints require a valid JWT access token in the \`Authorization\` header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Access tokens are obtained via the login endpoint and are short-lived (15 minutes by default). Use the refresh endpoint to obtain new tokens without re-authenticating.`,
      },
    ],
  },
  {
    label: "Deployment",
    sections: [
      {
        id: "docker",
        title: "Docker Setup",
        content: `## Docker Setup

A-Station's backend services are containerized with Docker Compose.

### Services

- **web** — The FastAPI application server running on port 8000 via Uvicorn.
- **db** — PostgreSQL 17 database on port 5432.
- **redis** — Valkey 7 (Redis-compatible) on port 6379. Used as the Celery broker (queue 0), result backend (queue 1), and WebSocket pub/sub channel (queue 2).
- **celery-beat** — Celery beat scheduler for periodic tasks (e.g. expired token cleanup at 3 AM daily).
- **worker-2-17** — Ansible 2.17 worker. Subscribes to the \`ansible_2_17\` Celery queue and executes playbooks.

### Volumes

- \`~/.ssh\` is mounted into the web and worker containers for Git SSH access to private repositories.
- Source storage directory is shared between the web and worker containers so workers can access cloned repositories.

### Starting the Stack

\`\`\`
cd a-station-fast-api
cp example.env .env    # Edit with your settings
docker-compose up -d
\`\`\`

### Database Migrations

After starting the stack, run Alembic migrations to initialize the database schema:

\`\`\`
docker-compose exec web alembic upgrade head
\`\`\`

### Adding Ansible Workers

To support additional Ansible versions, add a new worker service to \`docker-compose.yml\` that subscribes to the corresponding queue. For example, an Ansible 2.16 worker would subscribe to queue \`ansible_2_16\`.`,
      },
      {
        id: "configuration",
        title: "Configuration Reference",
        content: `## Configuration Reference

### Backend Environment Variables

| Variable | Default | Description |
|---|---|---|
| \`SECRET_KEY\` | (required) | JWT signing key. Generate with \`openssl rand -hex 32\`. |
| \`DATABASE_URL\` | (required) | PostgreSQL connection string. |
| \`SOURCE_STORAGE_PATH\` | \`/data/a-station/sources\` | Where cloned Git sources are stored on disk. |
| \`BACKEND_CORS_ORIGINS\` | \`["http://localhost:5173"]\` | Allowed frontend origins for CORS. |
| \`ACCESS_TOKEN_EXPIRE_MINUTES\` | \`15\` | JWT access token lifetime in minutes. |
| \`REFRESH_TOKEN_EXPIRE_DAYS\` | \`30\` | Refresh token lifetime in days. |
| \`COOKIE_SECURE\` | \`true\` | Set to \`false\` for local HTTP development. |

### Frontend Environment Variables

| Variable | Description |
|---|---|
| \`VITE_BASE_URL\` | Backend API base URL (e.g. \`http://localhost:8000/api/v1\`). |

### Celery Configuration

| Setting | Value | Description |
|---|---|---|
| Broker | \`redis://redis:6379/0\` | Task queue. |
| Result Backend | \`redis://redis:6379/1\` | Task result storage. |
| WebSocket Redis | \`redis://redis:6379/2\` | Pub/sub for real-time event streaming. |
| Prefetch | \`1\` | One task per worker at a time. |
| Ack Policy | Late | Tasks acknowledged after completion, not on receipt. |`,
      },
    ],
  },
];

const allSections = categories.flatMap((c) => c.sections);

export const DocsPage = () => {
  const [activeSection, setActiveSection] = useState(allSections[0].id);

  const currentSection = allSections.find((s) => s.id === activeSection);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <nav className="w-56 shrink-0 h-full overflow-y-auto border-r border-border p-4">
        {categories.map((category) => (
          <div key={category.label} className="mb-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">
              {category.label}
            </h2>
            <ul className="space-y-0.5">
              {category.sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl">
          {currentSection && (
            <div className="space-y-4">
              {currentSection.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-3xl font-bold text-foreground mt-0"
                    >
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                if (block.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="text-xl font-semibold text-foreground mt-6"
                    >
                      {block.replace("### ", "")}
                    </h3>
                  );
                }
                if (block.startsWith("```")) {
                  const lines = block.split("\n");
                  const code = lines.slice(1, -1).join("\n");
                  return (
                    <pre
                      key={i}
                      className="bg-muted rounded-lg p-4 overflow-x-auto"
                    >
                      <code className="text-sm text-foreground">{code}</code>
                    </pre>
                  );
                }
                if (block.startsWith("| ")) {
                  const rows = block.split("\n").filter((r) => r.trim());
                  const headerCells = rows[0]
                    .split("|")
                    .filter((c) => c.trim())
                    .map((c) => c.trim());
                  const dataRows = rows.slice(2);
                  return (
                    <div key={i} className="overflow-x-auto mt-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            {headerCells.map((cell, ci) => (
                              <th
                                key={ci}
                                className="text-left py-2 px-3 font-semibold text-foreground"
                                dangerouslySetInnerHTML={{
                                  __html: cell
                                    .replace(
                                      /`(.+?)`/g,
                                      '<code class="bg-muted px-1 rounded text-sm">$1</code>'
                                    ),
                                }}
                              />
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataRows.map((row, ri) => {
                            const cells = row
                              .split("|")
                              .filter((c) => c.trim())
                              .map((c) => c.trim());
                            return (
                              <tr
                                key={ri}
                                className="border-b border-border/50"
                              >
                                {cells.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className="py-2 px-3 text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                      __html: cell
                                        .replace(
                                          /`(.+?)`/g,
                                          '<code class="bg-muted px-1 rounded text-sm">$1</code>'
                                        ),
                                    }}
                                  />
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                if (block.startsWith("1. ") || block.startsWith("- ")) {
                  const isOrdered = block.startsWith("1. ");
                  const items = block
                    .split("\n")
                    .map((line) => line.replace(/^(\d+\.\s|-\s)/, ""));
                  const ListTag = isOrdered ? "ol" : "ul";
                  return (
                    <ListTag
                      key={i}
                      className={`space-y-2 text-muted-foreground ${isOrdered ? "list-decimal" : "list-disc"} pl-6`}
                    >
                      {items.map((item, j) => (
                        <li
                          key={j}
                          dangerouslySetInnerHTML={{
                            __html: item
                              .replace(
                                /\*\*(.+?)\*\*/g,
                                '<strong class="text-foreground">$1</strong>'
                              )
                              .replace(
                                /`(.+?)`/g,
                                '<code class="bg-muted px-1 rounded text-sm">$1</code>'
                              ),
                          }}
                        />
                      ))}
                    </ListTag>
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-muted-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: block
                        .replace(
                          /\*\*(.+?)\*\*/g,
                          '<strong class="text-foreground">$1</strong>'
                        )
                        .replace(
                          /`(.+?)`/g,
                          '<code class="bg-muted px-1 rounded text-sm">$1</code>'
                        ),
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
