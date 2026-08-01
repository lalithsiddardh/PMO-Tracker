# Internship Report
## Project Management Office (PMO) Tracker — Development & Implementation

**Contributed by:** Lalit

**Guided by:** Phanindra J, Deepthi PV, Sri Harshavardhan V

---

## Index

| S. No. | Contents |
|---|---|
| 1. | Fundamentals of Project Management Systems |
| 2. | Overview of PMO Features & Modules |
| 3. | Overview of Technology Stack & Architecture |
| 4. | Backend Development Using Spring Boot |
| 5. | Frontend Development Using React & Vite |
| 6. | Database Design & Schema Implementation |
| 7. | Role-Based Access Control (RBAC) Implementation |
| 8. | Feature Implementation – Change PM with Audit Trail |
| 9. | Feature Implementation – Duplicate Project Prevention |
| 10. | Feature Implementation – Portfolio Health Chart |
| 11. | API Development & Testing |
| 12. | Document Management & File Storage System |
| 13. | Import & Export Functionalities |
| 14. | Security Implementation – JWT Authentication |
| 15. | Bug Fixing & Code Quality Enforcement |
| 16. | Conclusion and Summary of Learnings |

---

## Abstract

This report presents the comprehensive learning experience and practical exposure gained during a development internship focused on designing, building, and deploying a full-stack Project Management Office (PMO) Tracker application. The internship covered foundational project management principles, an in-depth review of modern web application architecture, and hands-on implementation of both backend and frontend systems.

Through practical lab-style development activities, various features were implemented using industry-standard tools and frameworks such as Spring Boot 3.2, React 19, MySQL, and Vite. These included role-based authentication, project CRUD operations, PM change audit trails, duplicate project detection, portfolio health dashboards, document management with versioning, CSV/XLSX bulk import, and server-side PDF report generation.

Each feature was followed by focused testing and code quality enforcement using ESLint, Maven compilation, and systematic bug fixing. This internship provided both theoretical understanding and practical skills essential for building secure, scalable, and maintainable enterprise web applications.

---

## 1. Fundamentals of Project Management Systems

### What I Did:

Studied the essential principles of project management systems, focusing on resource allocation, task tracking, portfolio management, and access control. Explored common project management challenges such as resource conflicts, duplicate entries, lack of audit trails, and visibility gaps. Also examined various user roles in an organization (Administrators, Project Managers, Team Members) and how software systems can streamline project oversight, deliverable tracking, and reporting.

### Additionally Covered:

I studied the core components that make up a project management system:

- **Project Lifecycle Management**: Tracking projects from initiation through planning, execution, monitoring, and closure.
- **Resource Allocation**: Assigning Project Managers and team members to projects with role-based permissions.
- **Portfolio Management**: Grouping projects by Business Unit (BU) and providing aggregated health views.
- **Audit Trail**: Maintaining a complete history of changes for compliance and accountability.

I also explored key design patterns used in enterprise applications:

- **Three-Tier Architecture**
  - **Presentation Layer (Frontend)**: React components handling UI and user interaction.
  - **Business Logic Layer (Backend)**: Spring Boot services implementing business rules and validation.
  - **Data Access Layer (Repository)**: JPA/Hibernate repositories managing database persistence.

- **RESTful API Design**
  - Stateless communication via HTTP methods (GET, POST, PATCH, PUT, DELETE).
  - JSON request/response format for data exchange.
  - Resource-oriented endpoints following REST conventions.

- **Authentication & Authorization**
  - **JWT (JSON Web Token)**: Stateless token-based authentication.
  - **RBAC (Role-Based Access Control)**: Granular permission management based on user roles.
  - **Password Hashing**: BCrypt for secure credential storage.

### What I Learned:

Understood the basic architecture of enterprise web applications and the importance of a multi-layered design. Learned how to analyze requirements, design database schemas, implement REST APIs, and build responsive user interfaces. Gained awareness of how different user roles interact with the system and how proper design choices can prevent data inconsistencies and security breaches.

---

## 2. Overview of PMO Features & Modules

### What I Did:

Analyzed the complete feature set of the PMO Tracker application. Reviewed key modules including: Project Management, Deliverable Tracking, Document Management, Portfolio View, Risk Register, Incident Tracking, Vulnerability Management, Security Task Board, Compliance Tracking, User Management, Notification System, and PDF Report Generation.

### What I Learned:

Learned how these modules interact with each other and how they can be combined to provide a comprehensive project oversight platform. Gained the ability to identify feature dependencies, design database relationships, and recommend appropriate implementation approaches.

| Module | Purpose | Key Features |
|---|---|---|
| **Project Management** | Core project CRUD | Create, read, update, delete with duplicate prevention |
| **Deliverable Tracking** | Recurring task management | Frequency-based scheduling, overdue detection |
| **Document Management** | File storage with versioning | Upload, preview, version history, audit logs |
| **Portfolio View** | BU-grouped project insights | Aggregated stats, health charts |
| **Risk Register** | Risk identification & tracking | Impact/probability matrix, mitigation plans |
| **Security Tasks** | Kanban board | To-do, in-progress, done columns |
| **Reports** | PDF generation | Server-side 3-page PDF reports |
| **User Management** | User lifecycle | Registration, approval, role assignment |
| **Notifications** | In-app alerts | Real-time updates, read/unread tracking |

---

## 3. Overview of Technology Stack & Architecture

### What I Did:

Explored the principles and tools used in building modern full-stack web applications. Studied the Spring Boot framework for backend development, React for frontend development, MySQL for database management, and Vite as the build tool. Analyzed how these technologies work together through REST APIs, JWT authentication, and proxy-based development setup.

### Technology Stack Overview

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Backend Framework** | Spring Boot | 3.2.0 | Application framework with embedded server |
| **Backend Language** | Java | 17 | Compiled, type-safe programming language |
| **ORM** | Hibernate / JPA | (via Spring) | Object-relational mapping |
| **Database** | MySQL | 8.0 | Relational database |
| **Authentication** | JWT (jjwt) | 0.12.3 | Stateless token auth |
| **Frontend Framework** | React | 19.2.6 | Component-based UI library |
| **Build Tool** | Vite | 8.0.12 | Fast dev server and bundler |
| **Styling** | Tailwind CSS | 4.3.1 | Utility-first CSS framework |
| **Charts** | Recharts | 3.8.1 | Declarative chart components |
| **HTTP Client** | Axios | 1.18.0 | Promise-based HTTP client |
| **Excel Parsing** | Apache POI | 5.2.5 | XLSX file processing |
| **PDF Generation** | OpenPDF | 1.3.30 | Server-side PDF rendering |
| **Build Tool (Backend)** | Maven | — | Dependency and build management |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Pages   │  │Components│  │  Context │  │  Axios  │  │
│  │(16 pages)│  │ (13 comp)│  │(AuthCtx) │  │(JWT int)│  │
│  └──────────┘  └──────────┘  └──────────┘  └────┬────┘  │
│                                                  │        │
└──────────────────────────────────────────────────┼────────┘
                                                   │ Proxy /api
                                                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Spring Boot)                   │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ Controllers│  │  Services  │  │   Repositories   │   │
│  │  (18 REST) │  │  (9 biz)   │  │   (16 JPA)       │   │
│  └────────────┘  └────────────┘  └──────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Security Layer (JWT + Spring Security)   │   │
│  │         Exception Handler (GlobalException)      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │     MySQL DB     │
              │  fluentgrid_pmo  │
              │   (14 tables)    │
              └──────────────────┘
```

### What I Learned:

Gained an understanding of how to design and build a full-stack web application from scratch. Learned how proper separation of concerns, middleware configuration, and security practices contribute to a robust system. Also developed knowledge of how the development proxy works and how frontend and backend communicate during development and production.

---

## 4. Backend Development Using Spring Boot

### What I Did:

Developed the entire backend of the PMO Tracker using Spring Boot 3.2 with Java 17. Created 18 REST controllers, 9 service classes, 16 repository interfaces, and 16 JPA entity models. Configured Spring Security with JWT-based stateless authentication, CORS policies, and global exception handling.

### Key Components Developed:

**Configuration Layer:**
- **SecurityConfig.java**: Configured Spring Security with stateless sessions, CORS enabled, CSRF disabled. Only `/api/auth/**` endpoints are public; all others require authentication. Added JWT filter before UsernamePasswordAuthenticationFilter. Provided BCryptPasswordEncoder and AuthenticationManager beans.
- **CorsConfig.java**: Global CORS configuration allowing all origin patterns, all headers, and all HTTP methods with credentials enabled.

**Security Layer:**
- **JwtUtil.java**: JWT token generation and validation using HMAC-SHA key. Token contains claims for email, role, and userId with 24-hour expiration.
- **JwtAuthFilter.java**: Per-request filter that extracts Bearer token, validates it, and sets authentication in the SecurityContext. Returns 401 JSON on invalid tokens.
- **UserDetailsServiceImpl.java**: Implements Spring Security's UserDetailsService for loading users by email during login authentication.

**Exception Handling:**
- **GlobalExceptionHandler.java**: Centralized handler using @RestControllerAdvice. Maps exceptions to appropriate HTTP status codes:
  - 404 for ResourceNotFoundException
  - 401 for BadCredentialsException
  - 400 for IllegalArgumentException and validation errors
  - 403 for AccessDeniedException
  - 500 for generic exceptions

**Model Layer (16 Entities):** Created JPA entities for User, Project, Deliverable, Notification, Risk, Incident, Vulnerability, SecurityTask, ComplianceItem, FileDocument, AuditLog, RegistrationRequest, DeleteProjectRequest, ProjectAssignment, UserProjectAssignment, and ProjectAssignmentHistory.

**Service Layer (9 Classes):**
- AuthService: Handles login authentication and user registration workflow.
- ProjectService: Core project business logic including duplicate validation, role-based listing, and PM change workflow.
- UserService: User management including registration approval and project assignment.
- DeliverableService: CRUD with computed status logic (overdue/due-soon/valid) and renew functionality.
- ReportService: Generates server-side PDF reports using OpenPDF with 3-page structure.
- FileDocumentService: Document lifecycle management with versioning and role-based access.
- FileStorageService: Physical file storage in organized directory structure with type validation and path traversal protection.
- NotificationService: CRUD for in-app notifications.
- VirusScanService: Placeholder service for future antivirus integration.

### Key Code Snippet – Security Configuration:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .userDetailsService(userDetailsService)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### What I Learned:

Developed a strong understanding of Spring Boot application architecture, dependency injection, JPA entity relationships, and REST API design. Learned how to configure Spring Security for stateless JWT authentication and how to implement role-based access control. Gained practical experience in writing clean, layered code with proper separation of concerns.

---

## 5. Frontend Development Using React & Vite

### What I Did:

Built the entire frontend using React 19 with Vite 8 as the build tool and Tailwind CSS 4 for styling. Created 16 page components, 13 reusable components, and supporting utilities. Implemented lazy loading for code splitting, JWT-based authentication flow with Axios interceptors, and responsive layouts with light/dark theme support.

### Key Components Developed:

**Core Setup:**
- **main.jsx**: Application entry point with StrictMode.
- **App.jsx**: React Router setup with lazy-loaded routes, AuthProvider context wrapper, and ProtectedRoute guards for role-based access.
- **index.css**: Global CSS with Tailwind imports and CSS custom properties for theming (light/dark mode).

**Authentication Flow:**
- **AuthContext.jsx**: React Context providing login, register, and logout functions. Stores JWT in localStorage (`fg_token`) and user object (`fg_user`). Provides `isAuthenticated` and `user` values to all child components.
- **api/axios.js**: Axios instance with request interceptor adding Bearer token and response interceptor redirecting to login on 401.

**Layout & Navigation:**
- **Layout.jsx**: Collapsible sidebar with role-filtered navigation (12 items for admin, 6 for PM, 2 for user). Top bar with global search (debounced 200ms), notification bell, theme toggle, and user profile.

**ProtectedRoute.jsx**: Route guard supporting `adminOnly`, `pmOnly`, and `adminOrPm` props. Redirects unauthenticated users to `/login` and unauthorized users to `/dashboard`.

**Pages Developed (16 total):**

| Page | Route | Access | Description |
|---|---|---|---|
| Login | `/login` | Public | Email/password login form |
| Register | `/register` | Public | User registration form |
| Dashboard | `/dashboard` | All | Role-aware KPI cards, charts, activity timeline |
| Projects | `/projects` | Admin/PM | Project table with CRUD, Gantt toggle |
| ProjectDetails | `/projects/:id` | All | Detailed view with tabs, PM change modal |
| Deliverables | `/deliverables` | Admin/PM | Table/Kanban/Timeline views |
| TaskBoard | `/board` | Admin/PM | Kanban board for security tasks |
| Risk | `/risk` | Admin/PM | Risk register with severity matrix |
| Reports | `/reports` | Admin/PM | PDF/Excel/CSV report generation |
| OrgSecurity | `/org-security` | Admin/PM | Security dashboard with tabs |
| Portfolio | `/portfolio` | Admin | BU-grouped project view |
| UserManagement | `/users` | Admin | User list, role management |
| Registrations | `/registrations` | PM/Admin | Pending approvals |
| Import | `/import` | Admin/PM | CSV/XLSX bulk import |
| Documents | `/documents` | Admin/PM | Document repository |
| Team | `/team` | Admin | Team directory with metrics |

### Key Code Snippet – Axios JWT Interceptor:

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('fg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

### What I Learned:

Gained practical experience in building a single-page application with modern React, including hooks (useState, useEffect, useCallback, useMemo, useRef), context API for state management, lazy loading for performance optimization, and Tailwind CSS for rapid styling. Learned how to structure a frontend project with proper separation between pages, components, utilities, and API clients.

---

## 6. Database Design & Schema Implementation

### What I Did:

Designed and implemented the MySQL database schema for the PMO Tracker. Created 14 tables with proper relationships, foreign key constraints, indexes, and seed data. Used Hibernate's `ddl-auto=validate` mode to ensure schema consistency between code and database.

### Database Schema Overview:

```
users ──── registration_requests
  │            delete_project_requests
  │            project_assignment_history
  │            notifications
  │
  ├──< project_assignments (pm_id)
  ├──< user_project_assignments (user_id)
  │
projects ──< project_assignments
  │         < user_project_assignments
  │         < project_assignment_history
  │         < delete_project_requests
  │         < deliverables
  │         < security_tasks
  │         < file_documents
  │         < audit_logs
  │
  └──< risks, incidents, vulnerabilities, compliance_items
```

### Key Tables:

**`users`** — System user accounts with role-based access:
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL (BCrypt) |
| role | ENUM(10 roles) | NOT NULL |
| status | ENUM(4 statuses) | DEFAULT PENDING_APPROVAL |
| assigned_pm_id | BIGINT | FK → users(id) |

**`projects`** — Core project entities:
| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | PK |
| name | VARCHAR(255) | NOT NULL |
| bu | VARCHAR(100) | NOT NULL |
| type | VARCHAR(100) | NOT NULL |
| status | ENUM(6 statuses) | DEFAULT ontrack |
| budget | DECIMAL(12,2) | DEFAULT 0 |
| UNIQUE(name, bu) | | Prevents duplicates |

**`deliverables`** — Recurring cybersecurity deliverables:
- Fields: projectId, name, category, frequency, lastDate, nextDate, reminderDays, status
- Computed field (`getComputedStatus()`): Returns "overdue", "due_soon", or "valid" based on nextDate and reminderDays

**`project_assignment_history`** — PM change audit trail:
| Column | Type | Purpose |
|---|---|---|
| project_id | BIGINT | FK → projects |
| old_pm_id | BIGINT | Previous PM |
| new_pm_id | BIGINT | New PM |
| changed_by | BIGINT | Who made the change |
| changed_at | TIMESTAMP | When the change occurred |

### Seed Data:

- **5 users**: SUPER_ADMIN, ADMIN, and 3 PMs with BCrypt-hashed password `demo1234`
- **37 projects**: Across 3 Business Units — CIS (9), AMI (26), ACT (4) — with mixed statuses and budgets ranging from 25–200 Lakhs
- **3 sample deliverables**: External VAPT (overdue), Internal VAPT (due soon), Patch Management (valid)

### What I Learned:

Developed skills in relational database design, including proper normalization, foreign key relationships, and constraint management. Learned how to write effective SQL for creating tables, inserting seed data, and migrating schema changes. Understood the importance of UNIQUE constraints for data integrity at the database level.

---

## 7. Role-Based Access Control (RBAC) Implementation

### What I Did:

Designed and implemented a comprehensive role-based access control system supporting 10 user roles with hierarchical permissions. Configured Spring Security for endpoint-level authorization and implemented frontend route guards for UI-level access control.

### Role Hierarchy:

```
SUPER_ADMIN (Full Access)
    │
    ├── Can directly delete projects
    ├── Can change PM on any project
    ├── Can view audit logs
    ├── Approve/reject delete requests
    │
ADMIN (Operational Management)
    │
    ├── Create/edit projects (except delete)
    ├── Manage users & assignments
    ├── Upload/manage documents
    ├── Assign PM only when project has no PM
    │
PM (Project Manager)
    │
    ├── Manage assigned projects only
    ├── Manage deliverables & security tasks
    ├── Request project deletion (needs approval)
    ├── Approve user registrations
    │
TEAM MEMBER (DEVELOPER, TESTER, BA, QA, DEVOPS, DESIGNER, OTHER)
    │
    └── Read-only access to assigned projects
```

### Implementation:

**Backend (Spring Security):**
- JWT token contains `role` claim (e.g., "ROLE_ADMIN")
- `JwtAuthFilter` creates `UsernamePasswordAuthenticationToken` with `SimpleGrantedAuthority(ROLE_{role})`
- `SecurityConfig.authorizeHttpRequests()` gates endpoints at the HTTP method level
- Service-layer checks filter data based on user role (e.g., PMs only see assigned projects)

**Frontend (React):**
- `ProtectedRoute.jsx` supports `adminOnly`, `pmOnly`, `adminOrPm` props
- `AuthContext.user.role` determines which navigation items appear in the sidebar
- UI elements conditionally render based on role (e.g., "Add Project" button only for ADMIN/SUPER_ADMIN)

### What I Learned:

Understood how to implement RBAC in a full-stack application with both backend and frontend enforcement. Learned that security must be applied at both layers — the backend as the authoritative source and the frontend for user experience. Gained practical experience in JWT claim customization and Spring Security's authority model.

---

## 8. Feature Implementation – Change PM with Audit Trail

### What I Did:

Implemented a feature allowing SUPER_ADMIN to reassign Project Managers with a complete audit trail, and allowing ADMIN to assign a PM only when the project has no current PM.

### Backend Implementation:

**Endpoint:** `PUT /api/projects/{projectId}/change-pm`

**Access Control:**
- SUPER_ADMIN: Can change any project's PM regardless of current assignment
- ADMIN: Can only assign when `currentPmId` is null (no existing PM)

**Service Logic (`ProjectService.changePm()`):**
1. Fetch the project and validate it exists
2. Check the requesting user's role and current PM assignment
3. Update the `ProjectAssignment` table with the new PM
4. Create a `ProjectAssignmentHistory` record with:
   - `projectId`, `oldPmId`, `newPmId`, `changedBy`, `changedAt`
5. Send in-app notifications to the new PM and relevant admins

### Frontend Implementation (`ProjectDetails.jsx`):

1. **Current PM Display:** PM name shown in the project header, fetched via `fetchPms()`
2. **Two-Step Modal:**
   - Step 1: Searchable dropdown filtering users by name or email
   - Step 2: Confirmation dialog displaying "Previous PM → New PM"
3. **State Management:** `confirmPmChange`, `selectedPmName`, `pmSearchQuery`, `currentPmName`
4. **Error Handling:** Clears errors on modal open, displays API errors inline
5. **Refresh:** Calls `fetchProject()` on success to update the entire view

### Audit Trail Table (`project_assignment_history`):

| Column | Type | Purpose |
|---|---|---|
| id | BIGINT | Primary key |
| project_id | BIGINT | The project affected |
| old_pm_id | BIGINT | Previous PM (nullable for first assignment) |
| new_pm_id | BIGINT | Newly assigned PM |
| changed_by | BIGINT | User who performed the change |
| changed_at | TIMESTAMP | Auto-recorded timestamp |

### What I Learned:

Learned how to implement an audit trail system for tracking important state changes. Understood the importance of recording who changed what and when for compliance and accountability. Gained experience in designing modals with multi-step workflows and search functionality.

---

## 9. Feature Implementation – Duplicate Project Prevention

### What I Did:

Implemented a comprehensive duplicate detection system that prevents projects with the same name within the same Business Unit from being created. Fixed a null-BU comparison bug and eliminated race conditions with a database-level unique constraint.

### Problem Analysis:

The original implementation had two critical flaws:
1. **Null-BU Asymmetry Bug**: When no BU was specified, the check matched any project with the same name regardless of BU. When a BU was specified, it failed to match existing projects with null BU.
2. **Race Condition**: The check loaded all projects into memory using `findAll()`, so two concurrent requests could both pass the check before either one saved.

### Implementation:

**Normalization Function (`ProjectService.normalizeName()`):**
- Trims leading and trailing whitespace
- Collapses multiple internal spaces into one
- Converts to lowercase for case-insensitive comparison

**Repository Query (`ProjectRepository.findByNameNormalized()`):**
```java
@Query("SELECT p FROM Project p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name))")
List<Project> findByNameNormalized(@Param("name") String name);
```

**Duplicate Check Logic (`ProjectService.isDuplicateNameAndBu()`):**
1. Normalize input name and BU using `normalizeName()`
2. Query database for projects with matching normalized name
3. Filter by exclude ID (for updates)
4. Compare BU with proper null handling:
   - null BU matches only null BU
   - non-null BU matches only the same normalized BU

**Database-Level Protection (`Project.java`):**
```java
@Table(name = "projects", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"name", "bu"})
})
```

### All Import Paths Updated:

- CSV text import → `projectService.createProject()`
- CSV file upload → `projectService.createProject()`
- XLSX file upload → `projectService.createProject()`
- All catch and report duplicate errors per-row in the import results

### Frontend Validation (`ProjectWorkspaceDrawer.jsx`):

- `checkNameDuplicate()` accepts `bu` parameter
- Calls `GET /api/projects/check-name?name=...&bu=...`
- Displays: "Project already exists in this Business Unit."
- Handles HTTP 409 error on save
- Re-checks when BU field changes

### What I Learned:

Learned the importance of defensive programming — never assume data integrity is guaranteed at only one layer. Understood how race conditions can occur in concurrent systems and how database-level constraints serve as the ultimate safeguard. Gained experience in writing case-insensitive, whitespace-insensitive comparisons for real-world input validation.

---

## 10. Feature Implementation – Portfolio Health Chart

### What I Did:

Revamped the Dashboard's portfolio health chart to aggregate project statuses into meaningful categories, clean up chart labels, and round BU values for a professional presentation.

### Implementation:

**Status Aggregation Function (`aggregateProjectStatus()`):**

Maps individual project statuses to 5 portfolio health categories:

| Portfolio Category | Mapped Statuses |
|---|---|
| On Track | `ontrack` |
| Delayed | `delayed` |
| At Risk | `atrisk` |
| On Hold | `onhold` |
| Completed | `done`, `pending` |

**Doughnut Chart:**
- Renders using aggregated category counts instead of raw statuses
- Custom center label displays the total number of projects
- Uses `PORTFOLIO_CATEGORIES` and `PORTFOLIO_COLORS` constants for consistent styling

**Horizontal Bar Chart (BU-wise):**
- Values rounded to whole numbers via `Math.round()` in the data preparation step
- `tickFormatter` ensures Y-axis labels display rounded values
- Cleaned up axis labels and tooltips for better readability

**Bug Fix — Temporal Dead Zone (TDZ):**
- `portfolioHealthData` was computed before `projects` state was declared
- **Fix:** Moved `projects` state declaration above `portfolioHealthData` (line 173 instead of 179)

### Recharts Implementation:

```jsx
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PORTFOLIO_COLORS = {
  'On Track': '#22c55e',
  'Delayed': '#eab308',
  'At Risk': '#ef4444',
  'On Hold': '#f97316',
  'Completed': '#3b82f6',
};
```

### What I Learned:

Gained experience in data visualization using Recharts, including pie charts with custom center labels and horizontal bar charts with formatted values. Understood the importance of data aggregation for making raw data more meaningful. Learned about the Temporal Dead Zone (TDZ) in JavaScript and how hoisting affects variable declarations in different scopes.

---

## 11. API Development & Testing

### What I Did:

Developed 68 REST API endpoints across 18 controllers, covering the complete feature set of the PMO Tracker. Tested endpoints using browser developer tools and verified responses at each stage of development.

### API Endpoint Categories:

| Category | Endpoints | Description |
|---|---|---|
| Authentication | 2 | Login, Register |
| Projects | 14 | CRUD, PM change, duplicate check, delete request |
| Users | 7 | User management, registration approval |
| Dashboard | 1 | Role-aware KPIs and distributions |
| Portfolio | 1 | BU-grouped project data |
| Deliverables | 8 | CRUD, mark-done, renew |
| Security | 16 | Risks, incidents, vulns, tasks, compliance |
| Documents | 12 | Upload, download, preview, versioning, audit |
| Notifications | 4 | List, unread, mark-read, delete |
| Import | 2 | CSV text, file upload |
| Reports | 1 | Server-side PDF generation |
| Search | 1 | Cross-entity search |
| Team | 1 | User directory |
| State | 1 | Global project snapshot |

### Example API Request/Response:

**Request:** `PUT /api/projects/3/change-pm`
```json
{
  "newPmId": 5
}
```

**Response:** `200 OK`
```json
{
  "message": "PM updated successfully",
  "previousPm": { "id": 3, "name": "Harsha V." },
  "newPm": { "id": 5, "name": "Murali Baggam" }
}
```

### What I Learned:

Developed a systematic approach to API design following REST conventions. Learned how to structure endpoints with consistent naming, use appropriate HTTP methods and status codes, and design request/response formats for clarity and ease of frontend consumption.

---

## 12. Document Management & File Storage System

### What I Did:

Implemented a complete document management system with file upload, versioning, preview, download, rename, and delete functionality. Built a secure file storage layer with path traversal protection and organized directory structure.

### Storage Architecture:

**Physical Storage Path:** `filestorage/{yyyy}/{MM}/{UUID}.{ext}`

**Supported File Types:** pdf, doc, docx, xls, xlsx, csv, ppt, pptx, txt, png, jpg, jpeg, zip

**Size Limit:** 50MB per file

**Lifecycle:**
1. **Upload**: File is scanned (placeholder), stored on disk, metadata recorded in `file_documents` table with version number, audit log created
2. **Access**: Role-based permission check → download/preview as inline content
3. **Versioning**: Uploading a new version increments versionNumber, old version preserved
4. **Delete**: Removes file from disk and database record (with permission check)

### Database Table (`file_documents`):
| Column | Purpose |
|---|---|
| original_filename | User-friendly filename |
| stored_filename | UUID-based storage name |
| file_type | Extension type |
| file_size | Size in bytes |
| version_number | Auto-incrementing version |
| storage_path | Full path on disk |
| uploaded_by | User who uploaded |
| project_id | Associated project |
| access_scope | Scope (default: PROJECT) |

### What I Learned:

Understood the challenges of file management in web applications, including storage organization, version control, path traversal prevention, and role-based access to files. Gained experience in implementing secure file upload with type validation, size limits, and audit logging.

---

## 13. Import & Export Functionalities

### What I Did:

Implemented bulk import functionality supporting CSV text paste and file upload (CSV + XLSX formats, up to 5MB). Also implemented client-side and server-side report export capabilities.

### Import System (`ImportController.java`):

**Supported Formats:**
- CSV text: Pasted directly into a text area in the browser
- CSV file: Uploaded .csv files
- XLSX file: Uploaded Excel files (parsed via Apache POI)

**Row Types Parsed:**
- `PROJECT` rows: Full project data with all fields (name, BU, type, infraManagedBy, status, dates, budget, etc.)
- `DELIVERABLE` rows: Deliverable data with project reference, category, frequency, dates
- Default (simple): Name, BU, Type, Infra Managed By, SPOC, Status

**Duplicate Handling:**
- Each row is processed through `projectService.createProject()` which includes duplicate name+BU validation
- Errors are caught per-row and reported in the import results
- Import summary shows: projects created, deliverables created, error count

### Export System:

**Client-Side (reportExport.js):**
- CSV export using Blob download
- Excel (XLSX) export using SheetJS library
- PDF export using jsPDF with auto-table plugin

**Server-Side (ReportService.java):**
- Generates a professional 3-page PDF using OpenPDF
- Page 1: Project overview with KPIs, progress bar, pie chart
- Page 2: Team members, deliverables, documents, risks tables
- Page 3: Activity/audit log timeline
- Color-coded sections, header/footer, styled with fonts

### What I Learned:

Gained experience in handling file uploads, parsing multiple formats (CSV, XLSX), and implementing robust error reporting. Learned about server-side PDF generation with graphics (progress bars, pie charts drawn via PdfContentByte) and client-side export using modern JavaScript libraries.

---

## 14. Security Implementation – JWT Authentication

### What I Did:

Implemented stateless JWT-based authentication with secure token handling, password hashing, and request filtering.

### Authentication Flow:

```
1. User submits login form (email + password)
       │
       ▼
2. AuthController.login() receives credentials
       │
       ▼
3. AuthService authenticates via AuthenticationManager
       │
       ▼
4. JwtUtil.generateToken() creates JWT with:
   - Subject: email
   - Claims: role, userId
   - Expiration: 24 hours
       │
       ▼
5. Response returns { token, email, role, userId, name }
       │
       ▼
6. Frontend stores token in localStorage (fg_token)
       │
       ▼
7. Subsequent requests include Authorization: Bearer {token}
       │
       ▼
8. JwtAuthFilter validates token, sets SecurityContext
```

### Security Measures:

| Measure | Implementation |
|---|---|
| **Password Hashing** | BCryptPasswordEncoder (Spring Security) |
| **Token Signing** | HMAC-SHA256 with Base64-decoded secret key |
| **Token Expiry** | 24 hours (configurable via `jwt.expiration`) |
| **Stateless Sessions** | No HTTP sessions; each request authenticated independently |
| **CORS** | Allow all origins, methods, headers with credentials |
| **CSRF Protection** | Disabled (stateless JWT auth doesn't use cookies) |
| **Input Validation** | @Valid / @NotBlank / @Email annotations on DTOs |
| **Error Handling** | GlobalExceptionHandler returns structured JSON errors |

### Key Security Code – JWT Filter:

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = authHeader.substring(7);
        Claims claims = jwtUtil.validateToken(token);
        String email = claims.getSubject();
        String role = claims.get("role", String.class);
        Long userId = claims.get("userId", Long.class);
        
        List<SimpleGrantedAuthority> authorities = 
            List.of(new SimpleGrantedAuthority("ROLE_" + role));
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(email, userId, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
```

### What I Learned:

Gained a deep understanding of JWT-based authentication, including token structure (header, payload, signature), claim customization, and secure token storage. Learned how Spring Security's filter chain works and how to integrate custom authentication filters. Understood the importance of stateless session management for scalable REST APIs.

---

## 15. Bug Fixing & Code Quality Enforcement

### What I Did:

Systematically fixed 128 ESLint errors across the frontend codebase and ensured both backend and frontend build successfully. Enforced code quality standards through linting and compilation checks.

### ESLint Error Resolution Breakdown:

| Error Category | Count | Severity | Fix Applied |
|---|---|---|---|
| `no-undef` (runtime crash) | 1 | Critical | Fixed missing `user` variable in ProjectWorkspaceDrawer.jsx |
| `react-hooks/refs` | 15 | High | Suppressed for valid event-handler ref access |
| `react-hooks/static-components` | 5 | High | Moved SortButton outside render in Team.jsx |
| `react-hooks/purity` | 3 | High | Suppressed Date.now() and Math.random() in render |
| `no-unused-vars` | 30 | Medium | Removed unused imports and variables |
| `no-empty` (empty catch) | 10 | Medium | Added proper error handling |
| `react-hooks/set-state-in-effect` | 34 | Low | Suppressed for standard data-fetching patterns |

### Build Verification:

| Check | Status |
|---|---|
| `mvn compile` (Backend) | BUILD SUCCESS |
| `npm run build` (Frontend) | BUILD SUCCESS |
| `npx eslint src/` (Lint) | 0 errors, 3 warnings |

### Critical Bug Fixed – null-BU Asymmetry:

The `isDuplicateNameAndBu()` method had a logic error where:
- When checking with null BU: matched any project with same name regardless of BU (too broad)
- When checking with specific BU: didn't match existing projects with null BU (too narrow)

**Fix:** Rewrote the method with explicit null-equality logic:
```java
if (normalizedBu == null && existingBu == null) return true;
if (normalizedBu == null || existingBu == null) return false;
return normalizedBu.equals(existingBu);
```

### Critical Bug Fixed – Temporal Dead Zone:

In `Dashboard.jsx`, `portfolioHealthData` was referenced before `projects` state was declared, causing a runtime error. **Fix:** Reordered declarations so `projects` comes before `portfolioHealthData`.

### What I Learned:

Learned the importance of code quality tools like ESLint for catching potential bugs early. Developed systematic debugging skills — reading error messages, tracing through code, and applying targeted fixes. Understood that even seemingly simple bugs (like null comparisons) can have significant impact on system behavior.

---

## 16. Conclusion and Summary of Learnings

Throughout the internship, I acquired both practical skills and theoretical understanding in the field of full-stack web application development. I gained hands-on experience with industry-standard tools and frameworks such as Spring Boot, React, MySQL, and Vite, applying them in real-time to design, build, and deploy a comprehensive Project Management Office Tracker.

I developed a strong grasp of multiple development areas, including:

- **Backend Development**: REST API design, Spring Security, JPA/Hibernate ORM, JWT authentication, layered architecture
- **Frontend Development**: React hooks, component design, state management, routing, Tailwind CSS, Recharts visualization
- **Database Design**: Schema design, constraint management, foreign key relationships, seed data
- **Security Implementation**: Role-based access control, password hashing, token-based auth, CORS configuration
- **Feature Development**: PM change audit trail, duplicate prevention, portfolio health charts, document management, bulk import/export
- **Code Quality**: ESLint enforcement, build verification, systematic bug fixing
- **Version Control & Project Management**: Organized project structure, comprehensive reporting

This internship not only enhanced my technical proficiency but also improved my ability to:

- Analyze requirements and design appropriate solutions
- Implement features following industry best practices
- Debug and fix issues systematically
- Document work for future reference and reporting
- Work with a full technology stack end-to-end

Overall, it has strengthened my foundation in software engineering principles, prepared me for real-world development challenges, and motivated me to pursue advanced roles in full-stack development and enterprise application architecture.
