# 🤖 AI Prompt: Execute Task TRN-06 - Audit Logging System & Superuser Activity Dashboard

Your task is to execute **Task TRN-06: Sistem Pencatatan Aktivitas (Audit Logging & Superuser Dashboard)**. You will design and implement a platform-wide user activity audit log database, expose internal logging endpoints for microservices, and build a real-time filterable log viewer in the Admin dashboard.

---

## 🎯 Task Objectives

1.  **Centralized Audit Logs Table**:
    *   Create an `audit_logs` table in the centralized `db_user` database to record critical actions across all services.
2.  **Microservices Log Sync Pipeline**:
    *   Expose an internal logging API in `user-service`.
    *   Whenever any microservice (`auth-service`, `sd-service`, `smp-service`, `sma-service`) executes an audit-worthy action, it must fire a request to log the activity.
3.  **Real-Time Admin Logs Terminal / Dashboard (`/admin/logs`)**:
    *   Create a filterable user interface in the Admin portal to inspect active session logins, tryout configurations, and user modifications.

---

## 🗄️ Database Schema Update (`db_user`)

Create the `audit_logs` table to trace user footprints:

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,                       -- References users(id) in db_auth (nullable for failed logins)
  email         VARCHAR(255) NOT NULL,      -- User email associated with the action
  role          VARCHAR(20) NOT NULL,       -- Role of the actor: 'admin' | 'guru' | 'siswa' | 'system'
  action        VARCHAR(100) NOT NULL,      -- E.g. 'LOGIN', 'LOGOUT', 'USER_CREATE', 'TRYOUT_PUBLISH', 'EXAM_SUBMIT'
  target_id     UUID,                       -- ID of the affected entity (user, tryout, question, session)
  description   TEXT NOT NULL,              -- Human-readable detail (e.g. 'Guru Dewi published Tryout Fisika SMA')
  ip_address    VARCHAR(50),                -- Actor's IP address
  user_agent    TEXT,                       -- Browser user agent string
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-performance timeline queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(email);
```

---

## 🏗️ Technical Implementation Details

### 1. Loggable Actions Directory
Ensure the following events trigger logging requests:

| Category | Action Key | Description Template |
| :--- | :--- | :--- |
| **Authentication** | `AUTH_LOGIN_SUCCESS` | `"User {email} logged in successfully"` |
| | `AUTH_LOGIN_FAILED` | `"Failed login attempt for email {email}"` |
| | `AUTH_LOGOUT` | `"User {email} logged out"` |
| **User Management** | `USER_CREATE` | `"Admin created user {target_email} with role {role}"` |
| | `USER_UPDATE` | `"Admin updated profile for user {target_email}"` |
| | `USER_DELETE` | `"Admin deleted user account {target_email}"` |
| | `USER_TOGGLE_ACTIVE` | `"Admin updated status of user {target_email} to active={state}"` |
| **Tryout Lifecycle** | `TRYOUT_CREATE` | `"Guru created draft tryout '{nama}'"` |
| | `TRYOUT_SUBMIT_REVIEW` | `"Guru submitted tryout '{nama}' for approval"` |
| | `TRYOUT_APPROVE` | `"Admin approved tryout '{nama}'"` |
| | `TRYOUT_REJECT` | `"Admin requested revisions for tryout '{nama}': {notes}"` |
| | `TRYOUT_PUBLISH` | `"Admin/Guru published tryout '{nama}'"` |
| | `TRYOUT_UNPUBLISH` | `"Admin/Guru unpublished tryout '{nama}'"` |
| **Exam Activity** | `EXAM_SESSION_START` | `"Siswa {email} started tryout '{nama}'"` |
| | `EXAM_SESSION_SUBMIT` | `"Siswa {email} submitted tryout '{nama}' with score {nilai}"` |

### 2. Internal Logging Pipeline API (`user-service` / Port 4002)
*   **Method & Route**: `POST /internal/audit-logs` (Accessible only inside the docker network, or validated via Gateway).
*   **Payload (JSON)**:
    ```json
    {
      "user_id": "optional-uuid",
      "email": "user@triton.id",
      "role": "guru",
      "action": "TRYOUT_PUBLISH",
      "target_id": "tryout-uuid",
      "description": "Guru Ibu Dewi published Tryout Fisika SMA",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0..."
    }
    ```
*   **Action Dispatcher Utility**: Create a helper class/function `logger.audit(req, data)` in the backend services that extracts the client IP (`req.ip`), User Agent (`req.headers['user-agent']`), session user ID, and sends a fire-and-forget asynchronous POST request to the log pipeline.

---

## 💻 Frontend Implementation Specifications

### 🖥️ Admin Audit Logs Dashboard (`/admin/logs`)
*   **Visual Layout**: Build a clean, terminal-style feed or a professional data table.
*   **Data Columns**:
    *   **Timestamp**: Rendered in a localized format (e.g. `YYYY-MM-DD HH:mm:ss`).
    *   **User/Actor**: Renders the Email address and a color-coded role badge (Red for `admin`, Blue for `guru`, Green for `siswa`).
    *   **Action**: A badge highlighting the event category.
    *   **Description**: The human-readable string.
    *   **Meta Details**: Context tooltip displaying the IP address, Target UUID, and User Agent details.
*   **Roster Filtering & Controls**:
    *   *Search*: Real-time search matching User Email or Description text.
    *   *Filter by Role*: Dropdown selecting All, Admin, Guru, or Siswa logs.
    *   *Filter by Action*: Dropdown to search by event categories (Auth, Users, Tryout, Exam).
    *   *Date Range Selector*: Quick pickers for "Today", "Last 3 Days", "Last 7 Days".
    *   *Clear Filter*: Resets the dashboard filter states.
*   **Pagination**: Server-side pagination handling high-traffic logging streams.

---

## 🔍 Verification & Acceptance Criteria

1.  **Trace Authentication Footprints**:
    *   Log in, log out, and trigger a failed login. Go to the Database table or Admin logs view and verify the logs display matching timestamps, client IP addresses, and browsers.
2.  **Verify Administrative Records**:
    *   Create a user as Admin, submit a tryout for review as Guru, reject it as Admin, and take the test as Siswa.
    *   Verify each action generates a matching row in `audit_logs` describing the context correctly.
3.  **Confirm Filters**:
    *   Ensure that selecting filters (such as date ranges, roles, or action types) updates the log results correctly.
