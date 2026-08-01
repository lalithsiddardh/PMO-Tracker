# Fluentgrid PMO Tracker — Complete Project Report

## 1. Project Overview

**Project Name**: Fluentgrid PMO Tracker  
**Domain**: Project Management & Cybersecurity Portfolio Tracking  
**Purpose**: A comprehensive web application for managing projects, tracking cybersecurity deliverables (VAPT, patch management, compliance audits), managing risks/incidents/vulnerabilities, and generating portfolio-level reports with role-based access control.

The application supports three primary user roles — **SUPER_ADMIN** (full access), **ADMIN** (operational management), and **PM** (project-level management) — along with team member roles (DEVELOPER, TESTER, BA, QA, DEVOPS, DESIGNER, OTHER) who have read-only access to assigned projects.

---

## 2. Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Programming language |
| Spring Boot | 3.2.0 | Application framework |
| Spring Web (MVC) | (starter) | REST API endpoints |
| Spring Data JPA / Hibernate | (starter) | ORM / database access |
| Spring Security | (starter) | Authentication & RBAC |
| Spring Validation | (starter) | Bean validation |
| MySQL Connector/J | (runtime) | MySQL JDBC driver |
| JJWT (api/impl/jackson) | 0.12.3 | JWT token generation & validation |
| Lombok | (managed) | Boilerplate reduction |
| Apache POI | 5.2.5 | Excel (XLSX) file parsing |
| Apache PDFBox | 3.0.1 | PDF reading capabilities |
| OpenPDF (iText fork) | 1.3.30 | Server-side PDF generation |
| Maven | (build) | Build & dependency management |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI library |
| React DOM | 19.2.6 | DOM rendering |
| React Router DOM | 7.18.0 | Client-side routing |
| Vite | 8.0.12 | Build tool & dev server |
| Tailwind CSS | 4.3.1 | Utility-first CSS framework |
| @tailwindcss/vite | 4.3.1 | Tailwind Vite plugin |
| Axios | 1.18.0 | HTTP client (JWT interceptor) |
| Recharts | 3.8.1 | Charting library (Pie, Bar, Line, Area) |
| Lucide React | 1.21.0 | Icon library |
| MUI Material | 9.1.2 | Material UI components |
| @mui/icons-material | 9.1.1 | MUI icons |
| @emotion/react | 11.14.0 | CSS-in-JS (MUI peer dep) |
| @emotion/styled | 11.14.1 | Styled components (MUI peer dep) |
| jsPDF | 4.2.1 | Client-side PDF generation |
| jspdf-autotable | 5.0.8 | Auto table plugin for jsPDF |
| html2canvas | 1.4.1 | HTML-to-canvas for PDF screenshots |
| xlsx (SheetJS) | 0.18.5 | Client-side Excel file parsing |
| class-variance-authority | 0.7.1 | Variant-based class composition |
| clsx | 2.1.1 | Conditional classnames |
| tailwind-merge | 3.6.0 | Merge Tailwind classes |

### Database

| Technology | Details |
|---|---|
| MySQL | Database: `fluentgrid_pmo`, charset `utf8mb4`, collation `utf8mb4_unicode_ci` |
| Hibernate DDL | `validate` mode — schema managed externally by SQL scripts |

### Architecture Pattern

- **Backend**: RESTful API (JSON over HTTP), stateless JWT authentication, 3-layer architecture (Controller → Service → Repository)
- **Frontend**: Single Page Application (SPA) with lazy-loaded route code-splitting
- **Communication**: Frontend proxies `/api` requests to `localhost:8080` via Vite dev server

---

## 3. Project Structure

```
C:\Fluentgrid Internship\Project Management\
│
├── backend/
│   ├── pom.xml
│   ├── src/main/java/com/fluentgrid/pmo/
│   │   ├── PmoApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   └── CorsConfig.java
│   │   ├── security/
│   │   │   ├── JwtUtil.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── UserDetailsServiceImpl.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── ResourceNotFoundException.java
│   │   ├── dto/
│   │   │   ├── AuthResponse.java
│   │   │   ├── LoginRequest.java
│   │   │   └── RegisterRequest.java
│   │   ├── model/          (16 entities)
│   │   ├── repository/     (16 interfaces)
│   │   ├── service/        (9 classes)
│   │   └── controller/     (18 classes)
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── api/axios.js
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/utils.js
│   │   ├── utils/reportExport.js
│   │   ├── pages/          (16 pages)
│   │   └── components/     (13 components)
│   └── dist/               (production build)
│
├── database/
│   ├── schema.sql          (14 tables DDL)
│   └── seed.sql            (5 users, 37 projects, 3 deliverables)
│
├── filestorage/            (uploaded project files)
│
├── dashboard.html          (legacy standalone prototype)
├── import.html             (legacy standalone prototype)
├── Fluentgrid_PMO_Tracker v1 (1).html  (legacy prototype)
├── fluentgrid_pmo.py       (empty/unused)
├── report 1.md             (implemented features detail)
└── report 2.md             (this document)
```

---

## 4. Database Schema

The database `fluentgrid_pmo` contains **14 tables**:

### 4.1 Users & Authentication

**`users`** — System user accounts with role-based access.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL (BCrypt) |
| name | VARCHAR(255) | NOT NULL |
| role | ENUM(SUPER_ADMIN,ADMIN,PM,TESTER,BA,DEVELOPER,QA,DEVOPS,DESIGNER,OTHER) | NOT NULL |
| status | ENUM(PENDING_APPROVAL,ACTIVE,REJECTED,DISABLED) | DEFAULT PENDING_APPROVAL |
| assigned_pm_id | BIGINT | FK → users(id) |
| created_by | BIGINT | FK → users(id) |
| created_at / updated_at | TIMESTAMP | Auto-managed |

**`registration_requests`** — New user registration approval workflow.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users(id) CASCADE |
| requested_role | VARCHAR(50) | NOT NULL |
| status | ENUM(PENDING,APPROVED,REJECTED) | DEFAULT PENDING |
| reviewed_by | BIGINT | FK → users(id) |
| review_notes | TEXT | |

### 4.2 Project Management

**`projects`** — Core project entities with business unit, type, status, and budget.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT |
| name | VARCHAR(255) | NOT NULL |
| bu | VARCHAR(100) | NOT NULL |
| type | VARCHAR(100) | NOT NULL |
| infra_managed_by | VARCHAR(255) | DEFAULT 'Client' |
| spoc | VARCHAR(255) | NOT NULL |
| progress | INT | DEFAULT 0 |
| status | ENUM(ontrack,atrisk,delayed,onhold,pending,done) | DEFAULT ontrack |
| start_date / end_date | DATE | |
| team_size | INT | DEFAULT 0 |
| budget | DECIMAL(12,2) | DEFAULT 0 |
| created_by | BIGINT | FK → users(id) |
| created_at / updated_at | TIMESTAMP | Auto-managed |

**`project_assignments`** — Maps ADMIN → PM → Project (many-to-many with unique constraint).
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| project_id | BIGINT | FK → projects(id) CASCADE |
| pm_id | BIGINT | FK → users(id) CASCADE |
| assigned_by | BIGINT | FK → users(id) CASCADE |
| UNIQUE(project_id, pm_id) | | |

**`user_project_assignments`** — Maps ADMIN → User → Project for team members.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users(id) CASCADE |
| project_id | BIGINT | FK → projects(id) CASCADE |
| assigned_by | BIGINT | FK → users(id) CASCADE |
| UNIQUE(user_id, project_id) | | |

**`project_assignment_history`** — Audit trail for PM changes.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| project_id | BIGINT | FK → projects(id) CASCADE |
| old_pm_id | BIGINT | FK → users(id) |
| new_pm_id | BIGINT | FK → users(id) CASCADE |
| changed_by | BIGINT | FK → users(id) CASCADE |
| changed_at | TIMESTAMP | CURRENT_TIMESTAMP |

**`delete_project_requests`** — PM-initiated project deletion approval workflow.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| project_id | BIGINT | FK → projects(id) CASCADE |
| project_name | VARCHAR(255) | NOT NULL |
| requested_by | BIGINT | FK → users(id) CASCADE |
| requested_by_name | VARCHAR(255) | NOT NULL |
| status | ENUM(PENDING,APPROVED,REJECTED) | DEFAULT PENDING |
| reviewed_by | BIGINT | FK → users(id) |
| review_notes | TEXT | |

### 4.3 Deliverables & Security Tracking

**`deliverables`** — Recurring cybersecurity deliverables per project.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| project_id | BIGINT | FK → projects(id) CASCADE |
| name | VARCHAR(255) | NOT NULL |
| category | ENUM(external_vapt,internal_vapt,patch_mgmt,discom_audit,dpdp_audit,iso27001_audit,cloud_review,other) | |
| frequency | ENUM(monthly,quarterly,halfyearly,annual,biennial,adhoc) | |
| exec_type | ENUM(internal,thirdparty) | |
| last_date / next_date | DATE | |
| reminder_days | INT | DEFAULT 30 |
| status | ENUM(valid,due_soon,overdue,adhoc) | Computed |

**`security_tasks`** — Security-related tasks with Kanban status.
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| project_id | BIGINT | FK → projects(id) CASCADE |
| title | VARCHAR(255) | NOT NULL |
| status | ENUM(todo,in_progress,done) | DEFAULT todo |
| severity | ENUM(low,medium,high,crit) | DEFAULT medium |
| start_date / due_date / completed_date | DATE | |

**`risks`**, **`incidents`**, **`vulnerabilities`**, **`compliance_items`** — Risk register, security incidents, CVE tracking, and compliance framework tracking tables with severity, status, and owner fields.

### 4.4 Supporting Tables

**`notifications`** — In-app notification system with read/unread tracking.
**`file_documents`** — Document metadata with versioning, storage path, access scope.
**`audit_logs`** — Audit trail for document operations (upload, download, rename, delete).

### 4.5 Seed Data

The `seed.sql` file provides sample data for development and testing:
- **5 users**: SUPER_ADMIN (superadmin@fluentgrid.com), ADMIN (admin@fluentgrid.com), 3 PMs (Harsha V., Aditya Vijay, Murali Baggam) — all with BCrypt-hashed password `demo1234`
- **37 projects**: Across 3 Business Units — CIS (9 projects), AMI (26 projects), ACT (4 projects). Mix of Implementation and Maintenance types. Budgets range from 25–200 (Lakhs).
- **3 sample deliverables** for SBPDCL project: External VAPT (overdue), Internal VAPT (due soon), Patch Management (valid)

---

## 5. Backend Architecture

### 5.1 Entry Point

**`PmoApplication.java`** — Standard Spring Boot entry point with `@SpringBootApplication` annotation.

### 5.2 Configuration Layer

**`SecurityConfig.java`** — Spring Security configuration:
- Stateless session management (no HTTP sessions)
- CORS enabled via bean, CSRF disabled
- `/api/auth/**` endpoints are public; all others require authentication
- Custom `JwtAuthFilter` added before `UsernamePasswordAuthenticationFilter`
- `BCryptPasswordEncoder` for password hashing
- `AuthenticationManager` exposed as bean

**`CorsConfig.java`** — Global CORS configuration:
- Allows all origin patterns (`*`)
- Allows all headers and all HTTP methods
- Credentials enabled

### 5.3 Security Layer

**`JwtUtil.java`** — JWT token utility:
- HMAC-SHA key derived from Base64-decoded secret (`jwt.secret`)
- Token claims: `subject` = email, `role`, `userId`
- 24-hour expiration (`jwt.expiration=86400000`)
- Generates and validates tokens

**`JwtAuthFilter.java`** — Per-request JWT authentication filter:
- Extracts `Bearer` token from `Authorization` header
- Skips filtering for `/api/auth/**` paths
- Validates token via `JwtUtil`, extracts email/role/userId
- Creates `UsernamePasswordAuthenticationToken` with `ROLE_{role}` authority
- Returns 401 JSON response on invalid/expired tokens
- Sets authentication in `SecurityContextHolder`

**`UserDetailsServiceImpl.java`** — Implements Spring Security's `UserDetailsService`:
- Loads user by email from database
- Returns `UserDetails` with `ROLE_{role}` authority
- Used by `AuthenticationManager` during login

### 5.4 Exception Handling

**`GlobalExceptionHandler.java`** — Centralized exception handling with `@RestControllerAdvice`:

| Exception | HTTP Status | Response |
|---|---|---|
| `ResourceNotFoundException` | 404 | `{timestamp, status, error, message}` |
| `BadCredentialsException` | 401 | `{..., message: "Invalid email or password"}` |
| `IllegalArgumentException` | 400 | `{..., message: ex.message}` |
| `MethodArgumentNotValidException` | 400 | `{..., errors: {field: message}}` |
| `AccessDeniedException` / `SecurityException` | 403 | `{..., message: "Access denied"}` |
| Generic `Exception` | 500 | `{..., message: ex.message}` |

### 5.5 DTO Layer

| DTO | Fields | Purpose |
|---|---|---|
| `LoginRequest` | email (@Email @NotBlank), password (@NotBlank) | Login request body |
| `RegisterRequest` | email, password, name, role (all @NotBlank) | Registration request body |
| `AuthResponse` | token, email, role, userId, name | Login response with JWT |

### 5.6 Model Layer (16 Entities)

| Entity | Table | Key Fields | Purpose |
|---|---|---|---|
| **User** | `users` | id, email, passwordHash, name, role (enum), status (enum), assignedPm, createdByUser | System users with 10 roles + 4 statuses |
| **Project** | `projects` | id, name, bu, type, progress, status (enum), budget, startDate, endDate, teamSize | Core projects with unique(name, bu) constraint |
| **Deliverable** | `deliverables` | id, projectId, name, category, frequency, lastDate, nextDate, reminderDays, computedStatus | Recurring cybersecurity deliverables |
| **ProjectAssignment** | `project_assignments` | id, projectId, pmId, assignedBy | Admin→PM→Project mapping |
| **UserProjectAssignment** | `user_project_assignments` | id, userId, projectId, assignedBy | Admin→User→Project mapping |
| **ProjectAssignmentHistory** | `project_assignment_history` | id, projectId, oldPmId, newPmId, changedBy, changedAt | PM change audit trail |
| **DeleteProjectRequest** | `delete_project_requests` | id, projectId, status, requestedBy, reviewedBy | Delete approval workflow |
| **Notification** | `notifications` | id, userId, title, message, type, isRead | In-app notifications |
| **RegistrationRequest** | `registration_requests` | id, userId, status, reviewedBy | Registration approval workflow |
| **Risk** | `risks` | id, projectId, title, impact, probability, mitigationPlan | Risk register |
| **Incident** | `incidents` | id, projectId, title, severity, status, reportedDate | Security incidents |
| **Vulnerability** | `vulnerabilities` | id, projectId, title, severity, status, dueDate | CVE/tracking |
| **SecurityTask** | `security_tasks` | id, projectId, title, status, severity, startDate, dueDate | Kanban security tasks |
| **ComplianceItem** | `compliance_items` | id, projectId, title, category, status, dueDate | Compliance framework tracking |
| **FileDocument** | `file_documents` | id, originalFilename, storedFilename, fileType, fileSize, versionNumber, storagePath, projectId | Document metadata with versioning |
| **AuditLog** | `audit_logs` | id, userId, action, entityType, entityId, projectId, details, timestamp | Audit trail for document ops |

### 5.7 Repository Layer (16 Interfaces)

All repositories extend `JpaRepository<Entity, Long>`.

| Repository | Key Custom Methods |
|---|---|
| **ProjectRepository** | `findByNameNormalized(name)` — JPQL `LOWER(TRIM())` case-insensitive name match |
| **UserRepository** | `findByEmail()`, `existsByEmail()`, `findByRole(Role)` |
| **DeliverableRepository** | `findByProjectId()` |
| **FileDocumentRepository** | `searchDocuments(...)` — 6-parameter dynamic JPQL, version queries |
| **NotificationRepository** | `findByUserIdOrderByCreatedAtDesc()`, `findByUserIdAndIsReadFalse()` |
| **AuditLogRepository** | `findByEntityTypeAndEntityIdOrderByTimestampDesc()`, `findByProjectIdOrderByTimestampDesc()` |
| **ProjectAssignmentRepository** | `findByPmId()`, `findByProjectId()`, `existsByProjectIdAndPmId()` |
| **UserProjectAssignmentRepository** | `findByUserId()`, `findByProjectId()` |
| **RegistrationRequestRepository** | `findByStatus()`, `findByUserId()` |
| **DeleteProjectRequestRepository** | `findByStatus()`, `findByRequestedBy()`, `findByProjectIdAndStatus()` |
| **ProjectAssignmentHistoryRepository** | `findByProjectIdOrderByChangedAtDesc()` |
| **RiskRepository**, **IncidentRepository**, **VulnerabilityRepository**, **ComplianceItemRepository**, **SecurityTaskRepository** | `findByProjectId()` |

### 5.8 Service Layer (9 Classes)

| Service | Key Responsibilities |
|---|---|
| **AuthService** | Login: authenticates via `AuthenticationManager`, checks ACTIVE status, generates JWT. Register: creates user with PENDING_APPROVAL, creates RegistrationRequest, notifies PMs/Admins. |
| **ProjectService** | Role-based project listing (admin sees all, PM sees assigned, user sees assignments). Create with duplicate name+BU validation. Update with partial merge. PM change with history + notifications. Delete request workflow. |
| **UserService** | Registration approval/rejection. PM assignment. Project assignment to users. User deletion. |
| **NotificationService** | CRUD: create, list (all/unread), mark read, delete. |
| **DeliverableService** | CRUD with computed status (overdue/due_soon/valid). Mark done. Renew (auto-calculate next date from frequency). |
| **ReportService** | Generates styled 3-page PDF report (OpenPDF): Page 1 (overview, KPIs, progress, pie chart), Page 2 (team, deliverables, documents, risks), Page 3 (activity/audit log). |
| **FileStorageService** | Physical file storage in `yyyy/MM/UUID.ext` structure. File type validation (12 types). 50MB limit. Path traversal protection. |
| **FileDocumentService** | Document business logic: role-based access, upload with virus scan, versioning, audit logging, download/preview with access check, rename, delete, search/filter. |
| **VirusScanService** | Placeholder — currently passes all files through. Designed for ClamAV/Windows Defender integration. |

### 5.9 Controller Layer (18 Classes)

| Controller | Base URL | Key Endpoints |
|---|---|---|
| **AuthController** | `/api/auth` | POST `/login`, POST `/register` |
| **ProjectController** | `/api` | GET/POST/PATCH/DELETE `/projects`, GET/PUT `/projects/{id}/change-pm`, GET `/projects/check-name`, POST `/projects/{id}/request-delete`, GET/PATCH `/projects/delete-requests` |
| **UserController** | `/api` | GET `/admin/users`, GET `/users`, POST `/admin/assign-pm`, POST `/admin/assign-project`, POST `/admin/assign-user-project`, DELETE `/admin/users/{id}`, GET/PATCH `/pm/pending-requests`, GET/PATCH `/pm/approve-request/{id}`, GET/PATCH `/pm/reject-request/{id}` |
| **DashboardController** | `/api/dashboard` | GET `/dashboard` — role-aware KPI cards, status/type/BU distributions |
| **TeamController** | `/api/team` | GET `/team` — active users with project assignments |
| **ReportController** | `/api/reports` | GET `/reports/project/{id}/pdf` — server-side PDF |
| **RiskController** | `/api/risks` | Full CRUD |
| **IncidentController** | `/api/incidents` | Full CRUD (role-gated write) |
| **VulnerabilityController** | `/api/vulnerabilities` | Full CRUD (role-gated write) |
| **SecurityTaskController** | `/api/security/tasks` | Full CRUD |
| **ComplianceController** | `/api/compliance` | Full CRUD |
| **DeliverableController** | `/api` | GET `/project-deliverables`, GET `/projects/{id}/deliverables`, POST/PATCH/DELETE, POST `/{id}/done`, POST `/{id}/renew` |
| **NotificationController** | `/api/notifications` | GET `/notifications`, GET `/notifications/unread`, PATCH `/{id}/read`, DELETE `/{id}` |
| **ImportController** | `/api/import` | POST `/import/projects-csv`, POST `/import/projects-file` |
| **PortfolioController** | `/api/portfolio` | GET `/portfolio` — BU-grouped project stats |
| **SearchController** | `/api/search` | GET `/search?q=` — cross-entity search |
| **StateController** | `/api/state` | GET `/state` — global project + KPI snapshot |
| **FileDocumentController** | `/api` | POST `/projects/{id}/documents/upload`, GET `/documents/{id}/download`, GET `/documents/{id}/preview`, PATCH `/documents/{id}/rename`, DELETE `/documents/{id}`, GET `/documents/{id}/versions`, GET `/documents/{id}/audit` |

### 5.10 API Endpoint Summary (68 Endpoints)

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/login` | No | Public |
| POST | `/api/auth/register` | No | Public |
| GET | `/api/dashboard` | Yes | All |
| GET | `/api/state` | Yes | All |
| GET | `/api/projects` | Yes | All (role-filtered) |
| POST | `/api/projects` | Yes | ADMIN/SUPER_ADMIN |
| GET | `/api/projects/{id}` | Yes | All |
| PATCH | `/api/projects/{id}` | Yes | ADMIN/SUPER_ADMIN |
| DELETE | `/api/projects/{id}` | Yes | SUPER_ADMIN |
| POST | `/api/projects/{id}/request-delete` | Yes | PM |
| GET | `/api/projects/{id}/delete-request-status` | Yes | All |
| GET | `/api/projects/delete-requests` | Yes | SUPER_ADMIN |
| PATCH | `/api/projects/delete-requests/{id}/approve` | Yes | SUPER_ADMIN |
| PATCH | `/api/projects/delete-requests/{id}/reject` | Yes | SUPER_ADMIN |
| GET | `/api/projects/{id}/assignments` | Yes | All |
| GET | `/api/projects/{id}/pm-assignments` | Yes | All |
| PUT | `/api/projects/{projectId}/change-pm` | Yes | SUPER_ADMIN |
| GET | `/api/projects/check-name` | Yes | All |
| GET | `/api/admin/users` | Yes | ADMIN/SUPER_ADMIN |
| GET | `/api/users` | Yes | All |
| POST | `/api/admin/assign-pm` | Yes | ADMIN/SUPER_ADMIN |
| POST | `/api/admin/assign-project` | Yes | ADMIN/SUPER_ADMIN |
| POST | `/api/admin/assign-user-project` | Yes | ADMIN/SUPER_ADMIN |
| DELETE | `/api/admin/users/{id}` | Yes | ADMIN/SUPER_ADMIN |
| GET | `/api/pm/pending-requests` | Yes | PM/ADMIN/SUPER_ADMIN |
| PATCH | `/api/pm/approve-request/{id}` | Yes | PM/ADMIN/SUPER_ADMIN |
| PATCH | `/api/pm/reject-request/{id}` | Yes | PM/ADMIN/SUPER_ADMIN |
| GET | `/api/team` | Yes | All |
| GET | `/api/reports/project/{id}/pdf` | Yes | All |
| GET/POST/PATCH/DELETE | `/api/risks[/{id}]` | Yes | All (CRUD) |
| GET/POST/PATCH/DELETE | `/api/incidents[/{id}]` | Yes | PM/ADMIN/SUPER_ADMIN (write) |
| GET/POST/PATCH/DELETE | `/api/vulnerabilities[/{id}]` | Yes | PM/ADMIN/SUPER_ADMIN (write) |
| GET/POST/PATCH/DELETE | `/api/security/tasks[/{id}]` | Yes | PM/ADMIN/SUPER_ADMIN (write) |
| GET/POST/PATCH/DELETE | `/api/compliance[/{id}]` | Yes | PM/ADMIN/SUPER_ADMIN (write) |
| GET/POST/PATCH/DELETE | `/api/project-deliverables[/{id}]` | Yes | PM/ADMIN/SUPER_ADMIN (write) |
| GET | `/api/projects/{id}/deliverables` | Yes | All |
| POST | `/api/project-deliverables/{id}/done` | Yes | PM/ADMIN/SUPER_ADMIN |
| POST | `/api/project-deliverables/{id}/renew` | Yes | PM/ADMIN/SUPER_ADMIN |
| GET | `/api/notifications` | Yes | All |
| GET | `/api/notifications/unread` | Yes | All |
| PATCH | `/api/notifications/{id}/read` | Yes | All |
| DELETE | `/api/notifications/{id}` | Yes | All |
| POST | `/api/import/projects-csv` | Yes | All |
| POST | `/api/import/projects-file` | Yes | All |
| GET | `/api/portfolio` | Yes | All |
| GET | `/api/search?q=` | Yes | All |
| POST | `/api/projects/{id}/documents/upload` | Yes | PM/ADMIN/SUPER_ADMIN |
| GET | `/api/documents/{id}/download` | Yes | All (project-scoped) |
| GET | `/api/documents/{id}/preview` | Yes | All (project-scoped) |
| PATCH | `/api/documents/{id}/rename` | Yes | PM/ADMIN/SUPER_ADMIN |
| DELETE | `/api/documents/{id}` | Yes | PM/ADMIN/SUPER_ADMIN |
| GET | `/api/projects/{id}/documents` | Yes | All |
| GET | `/api/documents` | Yes | All (scope-filtered) |
| GET | `/api/documents/{id}` | Yes | All |
| POST | `/api/documents/{id}/version` | Yes | PM/ADMIN/SUPER_ADMIN |
| GET | `/api/documents/{id}/versions` | Yes | All |
| GET | `/api/documents/{id}/audit` | Yes | ADMIN/SUPER_ADMIN |
| GET | `/api/projects/{id}/documents/audit` | Yes | ADMIN/SUPER_ADMIN |

---

## 6. Frontend Architecture

### 6.1 Entry Point & Routing

**`main.jsx`** — Renders `<App />` inside `<StrictMode>`.

**`App.jsx`** — React Router setup with `lazy()` code-splitting for all 16 pages:
```jsx
<AuthProvider>
  <Routes>
    {/* Public */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    
    {/* Protected */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/deliverables" element={<Deliverables />} />
        <Route path="/board" element={<TaskBoard />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/org-security" element={<OrgSecurity />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/import" element={<Import />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/registrations" element={<PendingRegistrations />} />
        <Route path="/documents" element={<DocumentManagement />} />
        <Route path="/team" element={<Team />} />
      </Route>
    </Route>
  </Routes>
</AuthProvider>
```

**`ProtectedRoute.jsx`** — Route guard supporting `adminOnly`, `pmOnly`, `adminOrPm` props. Redirects to `/login` if unauthenticated, to `/dashboard` if unauthorized. Includes 5-second loading timeout with retry.

### 6.2 Authentication

**`AuthContext.jsx`** — React Context providing:
- `login(email, password)` — calls POST `/api/auth/login`, stores JWT in `localStorage` (`fg_token`) and user object (`fg_user`)
- `register(email, password, name, role)` — calls POST `/api/auth/register`
- `logout()` — clears localStorage and redirects to `/login`
- `isAuthenticated` — boolean check for `fg_token`
- `user` — parsed user object `{ token, email, role, userId, name }`

**`api/axios.js`** — Axios instance:
- Base URL: `/api`
- Request interceptor: adds `Authorization: Bearer {token}` header from `localStorage`
- Response interceptor: on 401, clears auth and redirects to `/login`

### 6.3 Layout & Navigation

**`Layout.jsx`** — Main application shell with:
- **Collapsible sidebar**: Navigation links filtered by role (12 items for admin, 6 for PM, 2 for users)
- **Top bar**: Global search (debounced 200ms, keyboard-navigable, categorized results), notification bell with unread count, theme toggle (light/dark), user profile display, logout button
- **Content area**: Renders child routes via `<Outlet />`

### 6.4 Pages (16 Pages)

| Page | Route | Access | Key Features |
|---|---|---|---|
| **Login** | `/login` | Public | Email/password form |
| **Register** | `/register` | Public | Name, email, password, role selection |
| **Dashboard** | `/dashboard` | All | Role-aware KPIs, Recharts (pie/bar/area/line), activity timeline, upcoming deadlines, portfolio health aggregation |
| **Projects** | `/projects` | Admin/PM | Resizable table, sort/filter/paginate, CSV/Excel export, Gantt toggle, CRUD via ProjectWorkspaceDrawer |
| **ProjectDetails** | `/projects/:id` | All | Tabs: overview, deliverables, documents, risks, activity, team + Gantt chart + file upload + PDF report + PM change modal |
| **Deliverables** | `/deliverables` | Admin/PM | Table/Kanban/Timeline views, category filters, mark-done/renew, overdue highlighting |
| **TaskBoard** | `/board` | Admin/PM | Kanban board (todo/in_progress/done columns) |
| **Risk** | `/risk` | Admin/PM | Risk register with severity cards, stacked bar distribution, CRUD modal |
| **OrgSecurity** | `/org-security` | Admin/PM | Tabs: vulnerabilities, incidents, security tasks, compliance items |
| **Reports** | `/reports` | Admin/PM | Per-project reports: radial progress, category distributions, team contribution, storage usage, activity timeline; PDF/Excel/CSV export |
| **Portfolio** | `/portfolio` | Admin | BU-grouped project view with aggregated stats |
| **UserManagement** | `/users` | Admin | User list, role/status management, PM assignment, project assignment, user deletion |
| **PendingRegistrations** | `/registrations` | PM/Admin | Pending approval requests with approve/reject |
| **Import** | `/import` | Admin/PM | CSV paste or XLSX/CSV file upload, duplicate validation |
| **DocumentManagement** | `/documents` | Admin/PM | Document repository grouped by project, search/filter, rename/delete/version upload |
| **Team** | `/team` | Admin | Team directory with metric cards, profile drawer, performance metrics, search/sort/filter |

### 6.5 Components (13 Components)

| Component | Purpose |
|---|---|
| **Layout.jsx** | Application shell: sidebar, top bar, search, notifications, theme toggle |
| **ProtectedRoute.jsx** | Route guard with role checks |
| **Modal.jsx** | Reusable modal dialog |
| **Skeleton.jsx** | Loading skeleton placeholders |
| **GanttChart.jsx** | Interactive Gantt chart with month/week/quarter views, zoom, expand/collapse, progress overlays, tooltips |
| **FileUploadModal.jsx** | Drag-and-drop file upload |
| **ProjectWorkspaceDrawer.jsx** | Slide-out drawer (1462 lines) with tabs: Overview, Documents, Deliverables, Team, Activity, Reports, Settings |
| **ProjectDetailsModal.jsx** | Modal with overview/documents/team tabs, document preview, version history |
| **NotificationDropdown.jsx** | Bell icon dropdown with unread count |
| **NotificationDrawer.jsx** | Full notification panel with type filters, date grouping, mark-read/delete |
| **ui/tabs.jsx** | Custom Tailwind tab component |
| **ui/select.jsx** | Custom dropdown component |
| **ui/card.jsx** | Card layout component |
| **ui/badge.jsx** | Status badge component |

### 6.6 Styling

**`index.css`** — Global CSS with:
- Tailwind CSS v4 imports (`@import "tailwindcss"`)
- CSS custom properties for light/dark theming (background, card, text, primary, accent, border colors)
- `.dark` class selectors for dark mode
- Custom utility classes for badges, progress bars, status dots, matrix cells

---

## 7. Role-Based Access Control (RBAC)

```
SUPER_ADMIN
  - Full access to every feature
  - Direct project deletion
  - PM change on any project
  - View audit logs
  - Approve/reject delete requests

ADMIN
  - Create/edit projects (except direct deletion)
  - Manage users: assign PM, assign projects, delete users
  - Upload/manage documents
  - View audit logs
  - Assign PM only when project has no current PM

PM (Project Manager)
  - Manage assigned projects only
  - Manage deliverables, security tasks, risks for assigned projects
  - Upload/manage documents for assigned projects
  - Approve/reject user registrations
  - Request project deletion (needs SUPER_ADMIN approval)
  - Import data

TEAM MEMBER (DEVELOPER, TESTER, BA, QA, DEVOPS, DESIGNER, OTHER)
  - Read-only access to assigned projects
  - View documents for assigned projects
  - Cannot create/edit/delete anything
```

---

## 8. Implemented Features

### 8.1 Change PM with Audit Trail

- SUPER_ADMIN can reassign any project's PM; ADMIN can assign only when no PM exists
- `ProjectAssignmentHistory` table records old PM, new PM, changed-by user, timestamp
- In-app notifications sent to new PM and relevant admins
- Frontend: searchable PM dropdown → confirmation dialog → API call → project refresh

### 8.2 Duplicate Project Prevention

- Combined (name + BU) duplicate check with case-insensitive, whitespace-insensitive normalization
- Fixed null-BU comparison bug: null BU only matches null BU
- Database-level `UNIQUE(name, bu)` constraint prevents race conditions
- All import paths (CSV, XLSX) use `projectService.createProject()` with duplicate validation
- Frontend: real-time name+BU check, 409 error handling on save

### 8.3 Portfolio Health Chart Revamp

- Project statuses aggregated into 5 categories: On Track, Delayed, At Risk, On Hold, Completed
- Doughnut chart with center total label
- BU bar chart with rounded values
- Fixed TDZ bug (projects state moved above portfolioHealthData computation)

### 8.4 File Management with Versioning

- Upload files to projects (12 supported types)
- Version tracking: each upload creates a new version number
- Download and inline preview (PDF, images, text files)
- Rename and delete with permission checks
- Search/filter documents by name, type, uploader, date range, status
- Audit logs for all document operations

### 8.5 PDF Report Generation

- Server-side 3-page PDF via OpenPDF (iText fork)
- Page 1: Project overview, KPI cards, progress bar, pie chart (drawn via PdfContentByte)
- Page 2: Team members table, deliverables table, documents table, risks table
- Page 3: Activity/audit log timeline
- Color-coded sections, professional styling with header/footer

### 8.6 CSV/XLSX Bulk Import

- Supports CSV text paste and file upload (CSV + XLSX, up to 5MB)
- Parses "PROJECT" and "DELIVERABLE" row types
- Per-row duplicate validation with error reporting
- Returns import summary: projects created, deliverables created, errors

### 8.7 Kanban Task Board

- Security tasks in todo/in_progress/done columns
- Category, severity, assignee, and date tracking
- Status changes for task progression

### 8.8 Gantt Chart

- Interactive Gantt with month/week/quarter views
- Zoom controls and expand/collapse
- Project bars with progress overlay
- Task milestone sub-bars
- Today marker and tooltips
- Drag/resize handles (read-only for team members)

### 8.9 Deliverable Lifecycle Management

- CRUD for recurring cybersecurity deliverables
- Computed status: overdue / due_soon / valid (based on nextDate and reminderDays)
- Mark-done: sets status to "done", updates lastDate
- Renew: auto-calculates nextDate from frequency (daily/weekly/monthly/quarterly/yearly)
- Category-based badges and lifecycle progress bars

### 8.10 Registration Approval Workflow

- New users register with PENDING_APPROVAL status
- PMs/Admins review and approve/reject registrations
- Approved users become ACTIVE; rejected become REJECTED
- Notifications sent on approval/rejection

### 8.11 Delete Project Request Workflow

- PMs request project deletion (cannot delete directly)
- SUPER_ADMIN reviews and approves/rejects
- Project name preserved in request even after deletion

---

## 9. File Storage System

**Storage path**: `C:\Fluentgrid Internship\Project Management\filestorage`

**Directory structure**: `{yyyy}/{MM}/{UUID}.{ext}`

**Allowed file types**: pdf, doc, docx, xls, xlsx, csv, ppt, pptx, txt, png, jpg, jpeg, zip

**Size limit**: 50MB

**Security**: Path traversal protection (validates normalized path starts with storage directory)

**Lifecycle**:
1. Upload → virus scan (placeholder) → store file → create FileDocument record with version number → audit log
2. Access → role-based check → download/preview
3. New version → increments versionNumber, stores new file, old version preserved
4. Delete → removes file from disk + database record (with permission check)

---

## 10. Legacy Prototypes

The project root contains three standalone HTML prototypes that preceded the React/Java rewrite:

- **`dashboard.html`** (772 lines) — Fully functional single-page HTML/CSS/JS dashboard with tabs (Overview, Projects, Matrix, Deliverables, Tasks, Vulns, Incidents, Risks, Compliance), KPI cards, CRUD modals, theme toggle, and localStorage-based auth simulation. Uses `fetch()` with token-based API calls.

- **`import.html`** — Standalone import page for CSV data entry.

- **`Fluentgrid_PMO_Tracker v1 (1).html`** — Earlier prototype version of the PMO tracker.

- **`fluentgrid_pmo.py`** — Empty/unused Python file (no content).

---

## 11. Configuration & Deployment

### Backend (`application.properties`)

```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/fluentgrid_pmo?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
jwt.secret=<base64-encoded-256-bit-key>
jwt.expiration=86400000
file.storage.path=C:/Fluentgrid Internship/Project Management/filestorage
```

### Frontend (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8080' } }
  }
})
```

### Build Commands

| Action | Command |
|---|---|
| Backend compile | `mvn compile` (in `backend/`) |
| Backend run | `mvn spring-boot:run` |
| Frontend dev | `npm run dev` (in `frontend/`) |
| Frontend build | `npm run build` |
| Database setup | `mysql -u root -p < database/schema.sql` then `mysql -u root -p < database/seed.sql` |

---

## 12. Summary

The Fluentgrid PMO Tracker is a full-stack project management application built with Spring Boot 3.2 and React 19. It features role-based access control with 10 user roles, comprehensive project and deliverable management, cybersecurity tracking (risks, incidents, vulnerabilities, compliance), file management with versioning, server-side PDF report generation, bulk CSV/XLSX import, interactive Gantt charts, Kanban task boards, and a notification system — all secured with JWT authentication and a centralized exception handling layer.

The application manages 37 seeded projects across 3 Business Units (CIS, AMI, ACT) with 5 pre-configured users across SUPER_ADMIN, ADMIN, and PM roles, demonstrating a complete project management workflow from registration → project creation → PM assignment → deliverable tracking → reporting.
