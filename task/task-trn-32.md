# 🤖 AI Task: Execute Task TRN-32 - Soft-Delete / Cancellation Flow for Teacher's Bank Soal

## 🎯 Task Objective
Implement a "Soft-Delete" (Cancellation) workflow for tryouts (Bank Soal) created by teachers. This prevents teachers from permanently deleting content (e.g., if a teacher resigns and attempts to wipe their questions). Instead of hard-deleting the tryout, deleting it as a teacher marks it as cancelled (`batal = true`). The tryout immediately disappears from the teacher's dashboard but remains visible to `admin-soal` users, who hold sole authorization to delete it permanently.

---

## 📂 Target Files & Impact Areas

### 1. Database & Migrations
- `services/sd-service/src/db/schema.sql` (SD database schema alter)
- `services/smp-service/src/db/schema.sql` (SMP database schema alter)
- `services/sma-service/src/db/schema.sql` (SMA database schema alter)

### 2. Backend Services
- `services/sd-service/src/routes/tryout.routes.ts` (List & delete route modifications)
- `services/smp-service/src/routes/tryout.routes.ts` (List & delete route modifications)
- `services/sma-service/src/routes/tryout.routes.ts` (List & delete route modifications)

### 3. Frontend Client
- `frontend/src/types/index.ts` (Updating `Tryout` type definition)
- `frontend/src/app/(admin-soal)/admin-soal/dashboard/page.tsx` (Displaying cancelled tryouts and permanent deletion flow)

---

## ⚙️ Detailed Specifications

### 1. Database Schema Migration
- In `schema.sql` for SD, SMP, and SMA services, add the column `batal`:
  ```sql
  ALTER TABLE tryouts ADD COLUMN IF NOT EXISTS batal BOOLEAN NOT NULL DEFAULT false;
  ```

### 2. Backend Route Handling (`tryout.routes.ts` in Level Services)
- **`GET /` (List Tryouts)**:
  - If the user role is `guru`, filter the SQL query to exclude cancelled tryouts:
    ```sql
    -- If subjects are present:
    SELECT * FROM tryouts 
     WHERE (dibuat_oleh = $1 OR mata_pelajaran = ANY($2::text[])) 
       AND (batal = false) 
     ORDER BY created_at DESC
    ```
  - For administrative roles (`admin`, `admin-soal`), continue to fetch all tryouts including those where `batal = true`.
- **`DELETE /:id` (Delete Tryout)**:
  - If the requesting user's role is `guru`:
    - Intercept the hard delete and instead soft-delete the tryout by setting `batal = true` and `status = 'closed'`:
      ```sql
      UPDATE tryouts SET batal = true, status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *
      ```
    - Log the action in the audit logs as `'TRYOUT_CANCEL'`.
  - If the requesting user's role is `'admin-soal'` or `'admin'`:
    - Perform a permanent hard delete of the tryout record from the database:
      ```sql
      DELETE FROM tryouts WHERE id = $1 RETURNING *
      ```

### 3. Frontend Client Adjustments
- **Types**: Update the `Tryout` interface in `frontend/src/types/index.ts` to include `batal?: boolean`.
- **Admin Soal Dashboard**:
  - In `frontend/src/app/(admin-soal)/admin-soal/dashboard/page.tsx`:
    - In the **Tryout Guru Menunggu Persetujuan** list, check if `t.batal` is true.
    - If `t.batal === true`, render a distinctive badge: **"Dibatalkan Guru"** (using a red badge layout).
    - Disable the "Setujui & Publikasi" and "Tolak / Revisi" buttons for cancelled tryouts.
    - Show a **Trash / Delete** button next to the tryout name if `t.batal === true` (similar to the trash button on Super Try Outs). Clicking this triggers the permanent deletion confirmation modal and calls the API to delete the tryout permanently.

---

## ⚡ Verification & Acceptance Criteria
1. **Database Update Verification**:
   - Run `make db-init` to execute migration alters.
   - Inspect the databases (`db_sd`, `db_smp`, `db_sma`) and verify that the `batal` column exists with default `false`.
2. **Soft-Delete (Cancellation) Test**:
   - Log in as a teacher (e.g. `guru1@triton.id`).
   - Click "Hapus Tryout" on one of your owned Bank Soal tryouts.
   - Confirm deletion. Verify that the tryout is immediately removed from the teacher's dashboard.
   - Query the database to verify that the row still exists but with `batal = true` and `status = 'closed'`.
3. **Admin-Soal Monitoring & Hard-Delete Test**:
   - Log in as `adminsoal1@triton.id`.
   - Verify that the cancelled tryout is listed under "Tryout Guru Menunggu Persetujuan" marked with the red badge **"Dibatalkan Guru"**.
   - Verify that you cannot approve or reject this cancelled tryout.
   - Click the Trash icon next to the cancelled tryout and confirm deletion.
   - Query the database and verify that the tryout row is now permanently deleted.
