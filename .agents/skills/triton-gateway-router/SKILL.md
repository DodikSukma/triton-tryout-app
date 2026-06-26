---
name: "triton_gateway_router"
description: "Coordinates routing proxy rules and role-based firewall checks inside the api-gateway"
---

# Triton API Gateway Router Skill

This skill governs routing proxy and firewall verification in the centralized `api-gateway` (Port 4000).

## Agent Workflow Instructions:

1. **Gateway Configuration Checks**:
   * When creating or modifying backend controller endpoints:
     * Check if the API Gateway needs rules updated in `services/api-gateway/src/index.ts`.
     * Verify that level routing prefixes (`/sd`, `/smp`, `/sma`) correctly proxy requests to their corresponding service ports (4005, 4006, 4007) with path rewrites.

2. **Access Control & Level Firewall**:
   * Verify that student roles can only reach microservices matching their profile `education_level` (e.g., SMP students can only query `/smp/*` routes).
   * Confirm that request headers forward class (`x-user-class`) and subject details properly to backend controllers for DB query filters.

3. **Routing Configuration Audits**:
   * If adding routes, check that the Gateway does not block legitimate cross-service requests needed for Super Tryouts or Admin logs syncing.
