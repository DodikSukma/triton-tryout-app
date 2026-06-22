# Task TRN-17: Notification Badges for Pending Tryout Approvals

## Overview
This task implements live notification badges in the navigation sidebar for **Admin** and **Admin Soal** roles. The badge will display the total number of teacher tryouts that are currently in the `pending_approval` state, ensuring administrators are immediately notified of pending items that require verification.

---

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/components/layout/Sidebar.tsx` (Global Navigation Sidebar)

---

## ⚙️ Detailed Specifications

### 1. Fetching Pending Approval Counts
- In `Sidebar.tsx`, add a state variable:
  `const [pendingCount, setPendingCount] = useState<number | null>(null)`
- Create a helper hook or `useEffect` that triggers if the current role is `'admin'` or `'admin-soal'`.
- To get the count of tryouts waiting for approval:
  - **For Admin**: The sidebar level is dynamic, so we can either fetch the count for the *current active level* or fetch *globally* across all levels (`sd`, `smp`, `sma`) for a complete overview. Fetching globally is recommended to ensure the admin doesn't miss pending tryouts on other levels.
  - **For Admin Soal**: Fetch globally across all levels since Admin Soal reviews tryouts globally on their dashboard.
- Example fetching logic:
  ```typescript
  const fetchPendingCounts = useCallback(async () => {
    if (role !== 'admin' && role !== 'admin-soal') return
    try {
      // Option: Fetch from all three education levels to get a global pending count
      const levels: ('sd' | 'smp' | 'sma')[] = ['sd', 'smp', 'sma']
      const results = await Promise.all(
        levels.map(async (lv) => {
          try {
            const res = await api.get(`/tryouts?level=${lv}`) // or levelPath('/tryouts', lv)
            const list = res.data?.data ?? []
            return list.filter((t: any) => t.status === 'pending_approval' && !t.is_super_tryout).length
          } catch {
            return 0
          }
        })
      )
      const totalPending = results.reduce((sum, count) => sum + count, 0)
      setPendingCount(totalPending)
    } catch {
      // fallback silently
    }
  }, [role])

  useEffect(() => {
    fetchPendingCounts()
    // Optional: Refresh counts every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchPendingCounts])
  ```

### 2. Sidebar Navigation Badge UI
- Modify the navigation rendering loop in `Sidebar.tsx` (around lines 133-152) to support display badges.
- When mapping over `navItems`:
  - Check if the item's label is `'Persetujuan'` (for Admin) or `'Dashboard'` (for Admin Soal).
  - If the match is found and `pendingCount` is greater than `0`, append a notification badge at the right end of the item link container.
- **Badge Styling**:
  - Use a modern, premium red indicator matching the Triton design language.
  - Tailwind example:
    ```tsx
    {item.label === 'Persetujuan' && pendingCount !== null && pendingCount > 0 && (
      <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center justify-center min-w-[20px] h-5 shadow-sm animate-pulse">
        {pendingCount}
      </span>
    )}
    ```
  - For Admin Soal, display it similarly next to the `'Dashboard'` link.

---

## ⚡ Verification Plan
1. **Admin Sidebar Badge Check**: Log in as `admin@triton.id`. Create a pending tryout as a teacher (or seed data with pending status). Verify that a red badge appears next to the **Persetujuan** link showing the correct count.
2. **Admin Soal Sidebar Badge Check**: Log in as `adminsoal1@triton.id`. Confirm that the badge displays next to the **Dashboard** link showing the count of pending approvals.
3. **Auto-refresh Verification**: Keep the dashboard open, submit a new tryout from another browser/profile as a teacher, and verify that the count increases automatically or on refresh.
4. **Visual Layout Verification**: Ensure the badge aligns correctly within the navigation row and does not overlap with labels or break responsiveness.
