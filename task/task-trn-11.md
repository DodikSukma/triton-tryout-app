# Task TRN-11: Integrate Triton Brand Animated Loading Screen in Next.js Frontend

## Overview
This task aims to implement a unified, branded loading animation across the entire Triton CBT application. Instead of basic text loaders or standard spinners, we will use the custom animated Triton Logo loader (using the provided HTML/CSS animation styling). This should be integrated globally using Next.js App Router's `loading.tsx` conventions and locally inside components/pages during client-side data fetching.

---

## 📂 Target Files & Impact Areas

### 1. New Core Loader Component
- `frontend/src/components/common/TritonLoader.tsx` [NEW] (React component wrapping the HTML layout)
- `frontend/src/components/common/TritonLoader.module.css` [NEW] (CSS module containing the animation keyframes)

### 2. Next.js Routing Loaders
- `frontend/src/app/loading.tsx` [NEW] (Global router loading screen)

### 3. Existing Page Loading States (To replace with TritonLoader)
- `frontend/src/app/(siswa)/siswa/hasil/[sesiId]/page.tsx` (Replace generic loading state)
- `frontend/src/app/(siswa)/siswa/riwayat/page.tsx` (Replace generic loading state)
- `frontend/src/app/(siswa)/siswa/tryout/page.tsx` (Replace generic loading state)
- `frontend/src/app/(exam)/exam/[sesiId]/page.tsx` (Replace generic loading state)
- `frontend/src/app/(guru)/guru/tryout/[id]/soal/page.tsx` (Replace generic loading state)
- `frontend/src/app/(admin)/admin/approvals/page.tsx` (Replace generic loading state)
- `frontend/src/app/(admin)/admin/master/page.tsx` (Replace generic loading state)

---

## ⚙️ Detailed Specifications

### 1. The `TritonLoader` Component

Create `frontend/src/components/common/TritonLoader.tsx` exporting a React functional component:
- It should render the full animated stage centering the Triton Logo.
- Add a prop `fullScreen?: boolean` (default: `true`) to allow rendering inside small container blocks/cards or covering the entire viewport.
- CSS styling must be isolated using CSS modules to prevent collision with other parts of the application.

#### Animation CSS Integration
Inject the following styling keyframes and CSS custom properties inside `TritonLoader.module.css`:
```css
.container {
  --red: #ff0808;
  --blue: #072cff;
  --white: #ffffff;
  --dur: 3.2s;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  background:
    radial-gradient(ellipse 800px 600px at 50% 35%, rgba(255, 8, 8, 0.07), transparent 60%),
    radial-gradient(ellipse 700px 500px at 50% 70%, rgba(7, 44, 255, 0.05), transparent 60%),
    radial-gradient(ellipse at center, #15151e 0%, #07070c 75%);
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.fullscreen {
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.embed {
  min-height: 300px;
  width: 100%;
  border-radius: 8px;
}

.loaderWrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loaderWrap::before {
  content: '';
  position: absolute;
  inset: -60px;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%);
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  animation: ambientPulse var(--dur) var(--ease) infinite;
}

@keyframes ambientPulse {
  0%, 70% { opacity: 0.4; transform: scale(0.9); }
  82% { opacity: 1; transform: scale(1.15); }
  90% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0.4; transform: scale(0.9); }
}

.loader {
  position: relative;
  width: 260px;
  height: 260px;
  overflow: hidden;
  background: var(--red);
  border-radius: 4px;
  transform-origin: center;
  animation: redBaseIn var(--dur) var(--ease) infinite;
  z-index: 1;
}

@media (max-width: 480px) {
  .loader { width: 180px; height: 180px; }
}

@keyframes redBaseIn {
  0% {
    opacity: 0;
    transform: scale(0.85);
    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(255,8,8,0.15);
  }
  10% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(255,8,8,0.15);
  }
  75% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(255,8,8,0.15);
  }
  82% {
    transform: scale(1.025);
    box-shadow: 0 30px 80px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.25), 0 0 90px rgba(255,8,8,0.45);
  }
  90% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(255,8,8,0.15);
  }
  100% {
    opacity: 0;
    transform: scale(0.95);
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0), 0 0 0 rgba(255,8,8,0);
  }
}

.blueLeft {
  position: absolute;
  left: 0;
  top: 0;
  width: 12%;
  height: 72%;
  background: var(--blue);
  transform-origin: left center;
  animation: slideInLeft var(--dur) var(--ease) infinite;
  z-index: 2;
}

@keyframes slideInLeft {
  0%, 8% { transform: translateX(-110%); opacity: 1; }
  22% { transform: translateX(0); opacity: 1; }
  90% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(0); opacity: 0; }
}

.whiteStrokeLeft {
  position: absolute;
  left: 12%;
  top: 0;
  width: 9%;
  height: 72%;
  background: var(--white);
  transform-origin: top center;
  transform: scaleY(0);
  animation: strokeGrowLeft var(--dur) var(--ease) infinite;
  z-index: 3;
}

@keyframes strokeGrowLeft {
  0%, 26% { transform: scaleY(0); opacity: 1; }
  42% { transform: scaleY(1); opacity: 1; }
  90% { transform: scaleY(1); opacity: 1; }
  100% { transform: scaleY(0.4); opacity: 0; }
}

.blueRight {
  position: absolute;
  right: 0;
  top: 24%;
  width: 13%;
  height: 76%;
  background: var(--blue);
  transform-origin: right center;
  animation: slideInRight var(--dur) var(--ease) infinite;
  z-index: 2;
}

@keyframes slideInRight {
  0%, 12% { transform: translateX(110%); opacity: 1; }
  26% { transform: translateX(0); opacity: 1; }
  90% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(0); opacity: 0; }
}

.whiteStrokeRight {
  position: absolute;
  right: 13%;
  top: 38%;
  width: 9%;
  height: 62%;
  background: var(--white);
  transform-origin: top center;
  transform: scaleY(0);
  animation: strokeGrowRight var(--dur) var(--ease) infinite;
  z-index: 3;
}

@keyframes strokeGrowRight {
  0%, 32% { transform: scaleY(0); opacity: 1; }
  48% { transform: scaleY(1); opacity: 1; }
  90% { transform: scaleY(1); opacity: 1; }
  100% { transform: scaleY(0.4); opacity: 0; }
}

.diagonal {
  position: absolute;
  left: -22.5%;
  top: 50%;
  width: 145%;
  height: 12%;
  background: var(--white);
  transform: translateY(-50%) rotate(-34deg);
  transform-origin: center center;
  z-index: 10;
  clip-path: inset(0 100% 0 0);
  animation: slashDraw var(--dur) var(--ease) infinite;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.35));
}

@keyframes slashDraw {
  0%, 46% { clip-path: inset(0 100% 0 0); opacity: 1; }
  68% { clip-path: inset(0 0% 0 0); opacity: 1; }
  90% { clip-path: inset(0 0% 0 0); opacity: 1; }
  100% { clip-path: inset(0 0% 0 0); opacity: 0; }
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .loader, .blueLeft, .whiteStrokeLeft, .blueRight,
  .whiteStrokeRight, .diagonal, .loaderWrap::before {
    animation: none !important;
  }
  .loader {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(255,8,8,0.15);
  }
  .blueLeft, .blueRight {
    transform: translateX(0);
    opacity: 1;
  }
  .whiteStrokeLeft, .whiteStrokeRight {
    transform: scaleY(1);
    opacity: 1;
  }
  .diagonal {
    transform: translateY(-50%) rotate(-34deg);
    clip-path: inset(0 0 0 0);
    opacity: 1;
  }
  .loaderWrap::before {
    opacity: 0.6;
    transform: scale(1);
  }
}
```

---

### 2. Next.js Routing Loader
- Place a new file `frontend/src/app/loading.tsx`.
- This page must simply render the `<TritonLoader fullScreen={true} />` component.
- Next.js will automatically stream this component as a fallback UI during nested route resolution or route segments mounting.

---

### 3. Replace Local Component & Page Loaders
Search the pages mentioned in the impact areas and find blocks that check for state-based loading flags:
- **Example pattern**:
  ```tsx
  if (loading) {
    return <div className="text-center p-8">Loading...</div>
  }
  ```
- **Action**: Import `TritonLoader` and replace the loading placeholder with:
  ```tsx
  if (loading) {
    return <TritonLoader fullScreen={false} />
  }
  ```
  *(Set `fullScreen={true}` for page-level blocking or `fullScreen={false}` for section-level loaders).*

---

## ⚡ Verification Plan
1. **Routing Verification**: Navigate between different dashboards (e.g. guru, siswa, admin) and confirm the global loading screen flashes briefly during route transitions.
2. **Page Loading Verification**: Force delay on API response and verify the page-level loading state renders the fully responsive animated Triton brand logo (Red base, blue panels, white stroke, and diagonal slash).
3. **Accessibility**: Toggle "Reduce Motion" in system settings and verify that the loader layout remains static but fully rendered.
