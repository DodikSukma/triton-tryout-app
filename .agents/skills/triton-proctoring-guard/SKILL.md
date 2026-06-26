---
name: "triton_proctoring_guard"
description: "Verifies and protects CBT examination page security restrictions (fullscreen force, tab focus loss, right-click, selection blocks)"
---

# Triton CBT Proctoring Guard Skill

This skill outlines instructions for auditing, implementing, and verifying browser-based anti-cheating rules on the CBT exam workstation page.

## Agent Workflow Instructions:

1. **Anti-Cheating Mechanisms Verification**:
   * When working with the exam cockpit page (`frontend/src/app/(siswa)/siswa/tryout/[id]/kerjakan/page.tsx`), inspect the following proctoring rules:
     * **Fullscreen Lock**: The user must be forced into fullscreen mode to start. Exiting fullscreen must show a blocking modal overlay that disables all question actions.
     * **Focus Loss & Tab Switch Warnings**: Track visible/invisible and blur/focus events. Increment warning count. Trigger auto-submission (`POST /sesi/:sesiId/selesai` with status `timeout`/disqualified) if warnings exceed `3`.
     * **Interaction Blocks**: Disable context menus (`contextmenu`), text selections, copy (`copy`), cut (`cut`), and paste (`paste`) actions.
     * **Selection Blocker Classes**: Ensure the question and option card container has `select-none pointer-events-none` classes to lock highlight drag inputs.

2. **Auditing Changes**:
   * Ensure that adding new features to the exam page (e.g., question navigation, timers) does not accidentally remove, block, or bypass these security listeners.
   * If modifying exam routes, double check that the backend is updated to log the cheat violation details.
