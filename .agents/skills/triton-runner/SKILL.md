---
name: "triton_task_runner"
description: "Automatically read, execute, and update the progress of Triton task-trn-XX modules"
---

# Triton Task Runner Skill

This skill automates reading, implementing, and tracking task specifications matching `task-trn-XX` for the Triton App project.

## Agent Workflow Instructions:

1. **Task Identification**:
   * Identify the specific task number `XX` requested by the user (e.g., `task-trn-31`).
   * Open and read the task specification file located at `task/task-trn-XX.md` to understand requirements, files to modify, and acceptance criteria.

2. **Planning & Execution**:
   * Create an implementation plan or outline the changes required by the task.
   * Modify backend/frontend source files in the codebase as guided by the task requirements.

3. **Rebuild Progress Dashboard**:
   * Once implementation is complete and verified, you **MUST** update the task progress dashboard.
   * Run the following command in the terminal from the workspace root:
     ```bash
     python3 scripts/parse_tasks_id.py
     ```
   * Confirm that the script exits successfully and prints `"HTML template output completed successfully."`

4. **Verify & Inform**:
   * Verify that the dashboard data files (`docs/docs-task-progress/index.html` and `docs/docs-task-progress/tasks-data.js`) have been updated.
   * Report completion to the user, highlighting that the task status is now updated in the progress landing page at `/docs/docs-task-progress/index.html`.
