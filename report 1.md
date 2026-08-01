## 3. Implemented Features (Last 30 Days)

### Feature A: Change PM with Audit Trail (June 25 – July 2, 2026)

**Objective**: Allow SUPER_ADMIN to reassign Project Managers with a full audit trail; allow ADMIN to assign a PM only when the project has no current PM.

**Backend Changes**:
- **Endpoint**: `PUT /api/projects/{projectId}/change-pm`
- **Access control**: SUPER_ADMIN can change any project's PM; ADMIN can only assign when `currentPmId` is null
- **Audit trail**: On PM change, a `ProjectAssignmentHistory` record is created capturing `oldPmId`, `newPmId`, `changedBy`, and `changedAt` timestamp
- **Notifications**: The new PM and relevant admins receive in-app notifications about the reassignment
- **Service layer**: `ProjectService.changePm()` updates the `ProjectAssignment` row, inserts history, and triggers notifications

**Frontend Changes** (`ProjectDetails.jsx`):
- Current PM name displayed in the project header area, fetched from `fetchPms()`
- Two-step modal workflow:
  1. **Searchable dropdown** — filters users by name or email, displays all available PMs
  2. **Confirmation dialog** — shows "Previous PM → New PM" for review before finalizing
- State management: `confirmPmChange`, `selectedPmName`, `pmSearchQuery`, `currentPmName`
- `handleChangePm()`: calls `PUT /api/projects/{id}/change-pm`, resets modal states on success, calls `fetchProject()` to refresh, clears errors on modal open

**Verification**: Both backend (`mvn compile`) and frontend (`npm run build`) compile successfully.

---

### Feature B: Duplicate Project Prevention (July 3 – July 10, 2026)

**Objective**: Prevent projects with the same name within the same Business Unit from being created. Fix the null-BU comparison bug and eliminate race conditions.

**Problem Analysis**:
- The original `isDuplicateNameAndBu()` method had a **null-BU asymmetry bug**: when `normalizedBu` was null (no BU specified), the check `normalizedBu == null || (p.getBu() != null && ...)` short-circuited to `true`, meaning any project with the same name matched regardless of BU
- The method used `projectRepository.findAll()` and streamed results in Java, **loading all projects into memory** — both inefficient and vulnerable to race conditions
- No **database-level unique constraint** existed on `(name, bu)`, so concurrent requests could both pass the check and create duplicates

**Backend Changes**:

| File | Change |
|------|--------|
| `ProjectRepository.java` | Replaced `findByNameIgnoreCase()` / `findByNameIgnoreCaseAndBuIgnoreCase()` with a single `@Query("SELECT p FROM Project p WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(:name))")` — `findByNameNormalized()` filters at the database level |
| `ProjectService.java` | Rewrote `isDuplicateNameAndBu()`: uses `findByNameNormalized()` instead of `findAll()`; added explicit null-equality logic (null BU only matches null BU) |
| `Project.java` | Added `@UniqueConstraint(columnNames = {"name", "bu"})` to `@Table` for database-level race condition protection |

**Duplicate Detection Logic**:
1. Input name and BU are normalized via `normalizeName()` (trim, collapse multiple spaces, lowercase)
2. The repository query finds all projects with matching normalized name (case-insensitive, trimmed)
3. Results are filtered by exclude ID (for updates) and then checked with proper null-BU equality:
   - null BU matches only null BU
   - non-null BU matches only the same normalized BU
4. The `@UniqueConstraint` acts as a final safety net against concurrent race conditions

**All Import Paths Updated** (`ImportController.java`):
- CSV text import, CSV file upload, and XLSX file upload all now call `projectService.createProject()` instead of `projectRepository.save()` directly
- Duplicate errors are caught per-row and reported in the import results

**Frontend Changes**:
- `ProjectWorkspaceDrawer.jsx`: `checkNameDuplicate()` accepts `bu` parameter; calls `GET /api/projects/check-name?name=...&bu=...`; displays "Project already exists in this Business Unit."; handles HTTP 409 error on save; re-checks when BU field changes

**Database Migration** (required):
```sql
ALTER TABLE projects ADD UNIQUE KEY UK_NAME_BU (name, bu);
```
Alternatively, temporarily set `spring.jpa.hibernate.ddl-auto=update` to let Hibernate apply the constraint automatically.

---

### Feature C: Portfolio Health Chart Revamp (July 11 – July 17, 2026)

**Objective**: Replace the raw status count chart with aggregated portfolio health categories; clean up chart labels and round BU values for a professional presentation.

**Backend Changes**:
- No backend changes required — `DashboardController` already returns project lists with status fields
- All aggregation logic implemented on the frontend

**Frontend Changes** (`Dashboard.jsx`):

**Status Aggregation** — `aggregateProjectStatus()` maps individual project statuses to 5 portfolio health categories:

| Portfolio Category | Mapped Statuses |
|-------------------|-----------------|
| On Track | `ontrack` |
| Delayed | `delayed` |
| At Risk | `atrisk` |
| On Hold | `onhold` |
| Completed | `done`, `pending` |

**Doughnut Chart**:
- Renders using the aggregated category counts instead of raw statuses
- Custom center label shows the total number of projects
- Uses `PORTFOLIO_CATEGORIES` and `PORTFOLIO_COLORS` constants for consistent styling

**Horizontal Bar Chart** (BU-wise):
- Values rounded to whole numbers via `Math.round()` in the data preparation step
- `tickFormatter` ensures Y-axis labels display rounded values
- Cleaned up axis labels and tooltips

**Bug Fix — Temporal Dead Zone (TDZ)**:
- `portfolioHealthData` was computed before `projects` state was declared
- **Fix**: Moved `projects` state declaration above `portfolioHealthData` (line 173 instead of 179)

**Verification**:
- `npm run build` completes successfully (only pre-existing `FileUploadModal.jsx` lint warning)
- Both Admin and PM dashboard views display the aggregated chart
