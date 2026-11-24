# CrimeGraph Web Frontend

Modern intelligence & link-analysis frontend for CrimeGraph. Provides forensic case management, automated document extraction, entity resolution & duplicate matching, Cytoscape-powered link-analysis graph, network centrality metrics, shortest path analysis, tactical alerts, and audit logging.

## Prerequisites

- **Node.js**: v18+ (Node 20+ recommended)
- **CrimeGraph Backend Gateway**: Running on `http://localhost:5000`
- **CrimeGraph Graph Service** (optional/recommended for analytics & shortest path): Running on port `8001`
- **CrimeGraph NLP Service** (optional; gateway falls back to local regex/pdf-parse): Running on port `8002`

---

## How to Start the Backend Services

1. **Gateway (Node.js/Express 5)**:
   ```bash
   cd backend/gateway
   npm install
   npm run dev
   ```
   Runs at: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)

2. **Graph Service (FastAPI)**:
   ```bash
   cd backend/graph-service
   pip install -r requirements.txt
   uvicorn app.main:app --port 8001
   ```
   Runs at: `http://localhost:8001`

3. **NLP Service (FastAPI)**:
   ```bash
   cd backend/nlp-service
   pip install -r requirements.txt
   uvicorn app.main:app --port 8002
   ```
   Runs at: `http://localhost:8002`

---

## Frontend Setup & Execution

1. **Environment Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cd frontend
   cp .env.example .env
   ```
   Default content:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The Vite dev server will start at `http://localhost:5173`.

4. **Production Build & Preview**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 7 Core Functional Modules

- **01 Dashboard (`/`)**: 5 KPI metrics from `/dashboard/stats`, entities distribution by type, alerts distribution by severity and status, pending duplicate candidates queue link, recent entities & alerts.
- **02 Case Management**:
  - **Investigations (`/cases`, `/cases/:id`)**: Case dossiers, multi-tab overview (overview, entities, documents, sources, alerts), entity linking.
  - **Sources (`/sources`)**: Evidentiary data origins, custody references.
  - **Call Records (`/call-records`)**: Telecommunication CDR logs with formatted duration (mm:ss) and entity mapping.
  - **Transactions (`/transactions`)**: Money transfers, hawala movements, and currency totals calculation.
- **03 Document Intelligence (`/documents`, `/documents/:id`)**: PDF/TXT upload (max 10 MB) or text paste, in-text search, forensic regex entity extraction, mention confidence badges.
- **04 Entity Matching**:
  - **Entities (`/entities`, `/entities/:id`)**: Suspects, phones, vehicles, aliases management, relationship evidence drawer.
  - **Match Review (`/match-review`)**: Pending duplicate queue, side-by-side attribute diffing with match/conflict highlighting, acceptance/rejection decisions.
- **05 Network Explorer**:
  - **Link Analysis (`/graph`, `/cases/:id/graph`)**: Interactive Cytoscape link graph, degree centrality analytics, cluster highlighting, and shortest path finder.
  - **Relationships (`/relationships`)**: Entity connections with evidence drawer.
- **06 Alerts & Analytics (`/alerts`)**: Tactical alerts table, filtering, status transitions, and case network metrics panel.
- **07 Audit & Administration (`/audit-logs`)**: Read-only immutable audit trail with table/user filtering and JSON payload inspector.
