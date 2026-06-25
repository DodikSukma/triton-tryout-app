# Task TRN-28: Visual Analytics & Item Difficulty Analysis

## Overview
This task empowers Teachers and Admins with actionable data. By visualizing Try Out results and calculating the difficulty of specific questions (Item Response Analysis), educators can identify learning gaps and evaluate the quality of their question banks.

## 📂 Target Files & Impact Areas

### Frontend Client
- `frontend/src/app/(guru)/guru/analytics/page.tsx` (New Analytics Dashboard)
- Integration of `recharts` or `chart.js` library.

### Backend Services
- `services/api-gateway/controllers/AnalyticsController.go`
- Complex SQL aggregation queries for statistical analysis.

## ⚙️ Detailed Specifications

### 1. Visual Charts Dashboard
- **Score Distribution (Histogram):** A bar chart showing how many students scored between 0-20, 21-40, 41-60, 61-80, and 81-100.
- **Average Trend (Line Chart):** A chart tracking the average score of all Try Outs over the last 6 months to measure overall progress.

### 2. Item Difficulty Index
- Calculate the difficulty of every question based on the percentage of students who answered it incorrectly.
  - *Formula:* `(Number of Incorrect Answers / Total Participants) * 100`
- Categorize difficulty:
  - `> 70% incorrect` = Hard (Sukar)
  - `30% - 70% incorrect` = Medium (Sedang)
  - `< 30% incorrect` = Easy (Mudah)

### 3. "Needs Attention" UI Widget
- Display a widget on the Teacher's dashboard titled "Soal Perlu Evaluasi" (Questions Needing Evaluation).
- List the Top 5 Hardest Questions. Include a button to quickly view the question details so the teacher can determine if the question was ambiguous or if the topic simply needs to be retaught.

## ⚡ Verification Plan
1. **Data Generation:** Ensure multiple students have submitted answers to a Try Out.
2. **Chart Rendering:** Log in as a Teacher. Verify the Histogram and Line Charts render correctly and match the raw database aggregates.
3. **Difficulty Logic:** Locate a question that was purposefully failed by the majority of test students. Verify it appears in the "Needs Attention" widget classified as "Hard".
