---
name: "triton_code_verifier"
description: "Compiles, runs health checks, tests API endpoints, and reviews runtime logs to verify code correctness"
---

# Triton Code Verifier Skill

This skill governs testing, compiling, and validating codebase health across backend microservices and Next.js applications.

## Agent Workflow Instructions:

1. **Compilation Check**:
   * Run the compilation suite:
     ```bash
     make build
     ```
   * Confirm that all TypeScript services (auth, user, sd, smp, sma, gateway) and Next.js frontends compile cleanly without type or build errors.

2. **Service Health Check**:
   * Verify runtime health by executing:
     ```bash
     make health
     ```
   * Confirm that all ports are active and respond with a `Healthy` status.

3. **Log & Exception Audit**:
   * Check error logs for any runtime anomalies:
     * Look for logs in the `logs/` directory.
     * Check if any database connection errors, unhandled promise rejections, or crash loops are printed in `logs/*-error.log`.

4. **API Endpoint Verification**:
   * If new routing logic or controller changes are introduced, construct testing request commands (e.g., using `curl` or writing a lightweight script) to query local ports (e.g., Gateway on port 4000) and verify that status codes (e.g., 200, 201) and JSON schemas match specifications.
