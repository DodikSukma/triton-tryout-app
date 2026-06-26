---
name: "triton_ui_stylist"
description: "Enforces UI theme guidelines (SD red, SMP navy, SMA slate gradients), Inter typography, custom icon packs, and high contrast standards"
---

# Triton UI/UX Stylist Skill

This skill governs styling and design consistency on the Next.js frontend application. It ensures all UI elements conform to the client's premium visual guidelines.

## Agent Workflow Instructions:

1. **Level-Specific UI Themes**:
   * Enforce the level gradients in student dashboards based on their classes:
     * **SD (Elementary)**: Red highlights. Background: `bg-gradient-to-br from-red-600/10 via-red-50/50 to-white`. Buttons: `bg-red-600 hover:bg-red-700 text-white`.
     * **SMP (Junior High)**: Navy blue highlights. Background: `bg-gradient-to-br from-blue-900/10 via-blue-50/50 to-white`. Buttons: `bg-blue-900 hover:bg-blue-950 text-white`.
     * **SMA (Senior High)**: Slate gray highlights. Background: `bg-gradient-to-br from-slate-600/10 via-slate-50/50 to-white`. Buttons: `bg-slate-600 hover:bg-slate-700 text-white`.

2. **Typography & Styling Standards**:
   * Always configure and use the **Inter** font family (Google Fonts).
   * Ensure components look premium: utilize glassmorphism (e.g. `bg-white/80 dark:bg-slate-900/80 backdrop-blur-md`), smooth transition speeds (`transition-all duration-300`), and subtle shadows (`shadow-sm` or `shadow-md`).

3. **Strict Icon Policy**:
   * **NEVER** use raw system emojis (e.g., 📝, ❌, ✅) in main UI views or buttons.
   * Use **Lucide React** components or **FontAwesome** classes (e.g. `<i className="fas fa-graduation-cap"></i>`) for all UI icons.

4. **Legibility & Contrast Guard**:
   * Do not place white text on light backgrounds (e.g., white text on a light blue or gray gradient).
   * Overlay text using deep colors (`text-slate-900`, `text-slate-800`, or `text-navy-900`) or wrap text in high-contrast solid cards with solid dark borders (`border-slate-100` or `border-slate-200`).
