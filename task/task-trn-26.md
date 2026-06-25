# Task TRN-26: Redis Caching for High-Concurrency Exam Starts

## Overview
To handle massive traffic spikes when thousands of students start a National Super Try Out simultaneously, this task implements a caching layer using Redis. By caching static exam data, we drastically reduce the I/O load on the primary PostgreSQL database.

## 📂 Target Files & Impact Areas

### Backend Services
- `services/sma-service/controllers/TryOutController.go` (and equivalents in SD/SMP services)
- `services/sma-service/repositories/QuestionRepository.go`
- `services/shared/cache/redis.go` (Redis connection utility)

## ⚙️ Detailed Specifications

### 1. Cache Exam Details & Question Bank
- When a request is made to fetch the details of a Try Out (`GET /api/v1/tryouts/:id`), first check the Redis cache using a key format like `tryout_detail:{id}`.
- When fetching the list of questions for an exam (`GET /api/v1/tryouts/:id/questions`), check the Redis cache using `tryout_questions:{id}`.
- If a cache miss occurs, fetch from PostgreSQL, then store the result in Redis with an expiration time (e.g., `TTL = 2 hours`).

### 2. Cache Invalidation Logic
- Ensure that if an `admin-soal` edits a question or updates the Try Out settings, the backend automatically deletes/invalidates the relevant Redis keys (`DEL tryout_detail:{id}`).
- This guarantees that students always receive the most up-to-date questions if a last-minute correction is made.

### 3. Connection Pooling
- Optimize the Redis connection pool in the Go backend to handle thousands of concurrent read requests without socket exhaustion.

## ⚡ Verification Plan
1. **Cache Miss Test:** Hit the API to fetch a Try Out. Verify the SQL query executes via application logs.
2. **Cache Hit Test:** Hit the exact same API again immediately. Verify NO SQL query is executed and the response time drops significantly (e.g., from 50ms to 2ms).
3. **Invalidation Test:** Update a question via the Admin dashboard. Fetch the Try Out again. Verify the SQL query runs once to repopulate the cache with the new data.
