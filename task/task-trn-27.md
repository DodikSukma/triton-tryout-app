# Task TRN-27: Gamification & National Leaderboard

## Overview
This task introduces a Gamification element to the platform by creating a Leaderboard system. Allowing students to see their ranking globally (National) or locally (School/Region) increases engagement, competitiveness, and retention.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(siswa)/siswa/leaderboard/page.tsx` (New Leaderboard Page)
- `frontend/src/components/ui/Podium.tsx` (New visual component for Top 3)

### Backend Services
- `services/api-gateway/controllers/LeaderboardController.go`
- `services/api-gateway/repositories/ScoreRepository.go`

## ⚙️ Detailed Specifications

### 1. Leaderboard Calculation API
- Create a new endpoint `GET /api/v1/leaderboards?tryout_id={id}&limit=100`.
- The backend queries the `student_scores` table, aggregating total scores across all subjects for a specific Try Out.
- Results must be sorted in descending order by `total_score`. If scores tie, sort by `completion_time` (faster time ranks higher).

### 2. Student Context Rank
- Alongside the Top 100 list, the API must return the current logged-in student's absolute rank (e.g., "Your Rank: 1,452 out of 5,000").
- If the student is not in the Top 100, pin their ranking row at the bottom of the UI so they always know where they stand.

### 3. Podium UI
- Build an attractive "Podium" UI component for Ranks 1, 2, and 3 (Gold, Silver, Bronze aesthetics).
- Below the podium, render a standard data table for Ranks 4-100 showing Avatar, Name, School, and Total Score.

## ⚡ Verification Plan
1. **Data Seed:** Run a seeder to generate 50 dummy scores for a Try Out.
2. **UI Verification:** Log in as a student and navigate to the Leaderboard. Verify the Top 3 are highlighted on the podium.
3. **Tie-Breaker:** Manipulate the database so two students have the exact same score, but different completion times. Verify the faster student is ranked higher.
4. **Context Rank:** Verify that the logged-in student's rank is displayed correctly at the bottom of the screen if they are not in the top tier.
