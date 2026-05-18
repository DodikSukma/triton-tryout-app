# DESIGN SYSTEM — Triton Denpasar
# Single source of truth for all UI decisions. Every developer must follow this.

---

## 1. BRAND IDENTITY

### Logo
```
File: public/logo.png
Usage rules:
  - ALWAYS use the actual file — never recreate, never use text fallback
  - Navbar (public): width=140 height=48
  - Sidebar (dashboard): width=120 height=40
  - Login left panel: width=48 height=48 with white filter
  - Footer: width=120 with style={{ filter: 'brightness(0) invert(1)' }}
  - Never stretch, never add border-radius to logo itself
```

---

## 2. COLOR PALETTE

### Primary Colors
```css
--blue-50:  #EFF6FF   /* page backgrounds, card tints */
--blue-100: #DBEAFE   /* borders, dividers */
--blue-200: #BFDBFE   /* hover states */
--blue-400: #60A5FA   /* icons, secondary elements */
--blue-500: #3B82F6   /* PRIMARY BLUE — buttons, links, active states */
--blue-600: #2563EB   /* hover on blue-500 */
--blue-700: #1D4ED8   /* headings, emphasis */
--blue-800: #1E40AF   /* dark backgrounds */
--blue-900: #1E3A8A   /* hero gradients */

--red-400:  #F87171   /* soft warnings */
--red-500:  #EF4444   /* PRIMARY RED — CTA buttons, destructive actions */
--red-600:  #DC2626   /* hover on red-500 */
--red-700:  #B91C1C   /* headings on red bg */

--slate-50:  #F8FAFC  /* page bg */
--slate-100: #F1F5F9  /* card bg, input bg */
--slate-200: #E2E8F0  /* borders */
--slate-400: #94A3B8  /* placeholder text */
--slate-500: #64748B  /* secondary text */
--slate-600: #475569  /* body text */
--slate-700: #334155  /* label text */
--slate-800: #1E293B  /* strong text */
--slate-900: #0F172A  /* headings */
```

### Semantic Colors
```
Success:  green-500 (#22C55E) bg: green-50  border: green-200
Warning:  amber-500 (#F59E0B) bg: amber-50  border: amber-200
Error:    red-500   (#EF4444) bg: red-50    border: red-200
Info:     blue-500  (#3B82F6) bg: blue-50   border: blue-200
```

### Subject Color Map (consistent across all pages)
```
Matematika:       blue-500   bg-blue-50   text-blue-600
Fisika:           violet-500 bg-violet-50 text-violet-600
Kimia:            green-500  bg-green-50  text-green-600
Biologi:          emerald-500 bg-emerald-50 text-emerald-600
Bahasa Indonesia: orange-500 bg-orange-50 text-orange-600
Bahasa Inggris:   sky-500    bg-sky-50    text-sky-600
Sejarah:          amber-500  bg-amber-50  text-amber-600
Ekonomi:          teal-500   bg-teal-50   text-teal-600
Default:          slate-500  bg-slate-100 text-slate-600
```

---

## 3. TYPOGRAPHY

### Font
```
Family: Plus Jakarta Sans (Google Fonts via next/font/google)
Import: import { Plus_Jakarta_Sans } from 'next/font/google'
Config: { subsets: ['latin'], weight: ['400','500','600','700','800'] }
Apply: className={font.className} on <html> tag in layout.tsx
```

### Scale
```
Display (hero):  text-6xl / text-7xl — font-black  (900) — line-height: 1.1
H1 (page title): text-4xl / text-5xl — font-black  (900)
H2 (section):    text-3xl / text-4xl — font-bold   (700)
H3 (card title): text-xl  / text-2xl — font-bold   (700)
H4 (label):      text-base / text-lg  — font-semibold (600)
Body Large:      text-lg             — font-normal  (400) — leading-relaxed
Body:            text-base           — font-normal  (400) — leading-relaxed
Body Small:      text-sm             — font-normal  (400)
Caption:         text-xs             — font-medium  (500)
Overline:        text-xs font-bold tracking-[0.15em] uppercase
```

---

## 4. SPACING SYSTEM

```
Use Tailwind spacing scale consistently:
  xs: 4px  (p-1, gap-1)
  sm: 8px  (p-2, gap-2)
  md: 16px (p-4, gap-4)  ← base unit
  lg: 24px (p-6, gap-6)
  xl: 32px (p-8, gap-8)
  2xl: 48px (p-12)
  3xl: 64px (p-16)
  4xl: 96px (p-24)

Page padding:  px-4 (mobile) → px-6 (tablet) → px-8 (desktop)
Section padding: py-16 (mobile) → py-24 (desktop)
Card padding: p-4 (mobile) → p-6 (tablet) → p-8 (desktop)
```

---

## 5. BORDER RADIUS

```
xs:  rounded     (4px)   — tags, small badges
sm:  rounded-lg  (8px)   — inputs, small buttons
md:  rounded-xl  (12px)  — buttons, form elements
lg:  rounded-2xl (16px)  — cards, modals
xl:  rounded-3xl (24px)  — hero elements, large containers
full: rounded-full       — avatars, pills, circular buttons
```

---

## 6. SHADOWS

```
Card default:   shadow-sm  (0 1px 2px rgba(0,0,0,0.05))
Card hover:     shadow-md  (0 4px 6px rgba(0,0,0,0.07))
Card elevated:  shadow-lg  (0 10px 15px rgba(0,0,0,0.10))
Button primary: shadow-lg shadow-blue-200/60
Button red CTA: shadow-lg shadow-red-200/60
Modal:          shadow-2xl
```

---

## 7. COMPONENTS

### 7.1 Buttons

```
PRIMARY (blue):
  bg-blue-500 hover:bg-blue-600 text-white font-semibold
  rounded-xl px-5 py-2.5 text-sm
  hover:shadow-md transition-all duration-200
  Active: scale-95

PRIMARY LARGE (CTA):
  rounded-full px-8 py-4 text-base font-bold
  shadow-lg shadow-blue-200/60 hover:shadow-xl
  hover:scale-105 transition-all duration-200

DESTRUCTIVE (red):
  bg-red-500 hover:bg-red-600 text-white font-semibold
  rounded-xl px-5 py-2.5
  Same shadow as primary

OUTLINE:
  border-2 border-blue-500 text-blue-600
  hover:bg-blue-50 rounded-xl px-5 py-2.5 font-semibold

GHOST:
  text-slate-600 hover:bg-slate-100 rounded-xl px-4 py-2

DISABLED state (all):
  opacity-50 cursor-not-allowed pointer-events-none

LOADING state:
  flex items-center gap-2
  Loader2 icon animate-spin w-4 h-4
  Text: "Memproses..." / "Menyimpan..."
```

### 7.2 Form Inputs

```
Base input style:
  w-full px-4 py-3 rounded-xl border border-slate-200
  text-slate-900 placeholder:text-slate-400
  bg-white outline-none text-base
  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
  transition-all duration-200

With left icon:
  pl-11 (icon: absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400)

With right element:
  pr-11

Disabled:
  bg-slate-50 text-slate-400 cursor-not-allowed

Error state:
  border-red-400 focus:ring-red-500/20 focus:border-red-400

Textarea:
  Same base + resize-none min-h-[100px]

Select (shadcn):
  Same visual as input

Label:
  text-sm font-semibold text-slate-700 block mb-2

Helper text:
  text-xs text-slate-400 mt-1.5

Error text:
  text-xs text-red-500 mt-1.5 flex items-center gap-1
  AlertCircle w-3 h-3
```

### 7.3 Cards

```
Default card:
  bg-white rounded-2xl border border-slate-100 shadow-sm
  hover:shadow-md hover:-translate-y-0.5 transition-all duration-300

Stat card:
  bg-white rounded-2xl border border-slate-100 p-6
  flex items-center gap-4

Icon container in stat card:
  w-12 h-12 rounded-xl flex items-center justify-center
  bg-{color}-50 (icon: text-{color}-500 w-6 h-6)

Number: text-3xl font-black text-slate-900
Label: text-slate-500 text-sm mt-0.5
```

### 7.4 Badges / Pills

```
Role badge:
  rounded-full px-3 py-1 text-xs font-semibold
  Guru:  bg-blue-50  text-blue-600
  Siswa: bg-green-50 text-green-600
  Admin: bg-red-50   text-red-600

Status badge (tryout):
  rounded-full px-3 py-1 text-xs font-semibold
  Published/Aktif: bg-green-50  text-green-600
  Draft:           bg-amber-50  text-amber-600
  Closed:          bg-slate-100 text-slate-500

Subject badge:
  rounded-full px-3 py-1 text-xs font-medium
  Use subject color map from section 2
```

### 7.5 Navigation / Sidebar

```
Width: w-64 (256px) fixed
Background: white
Border: border-r border-slate-100

Nav item:
  flex items-center gap-3 px-4 py-2.5 rounded-xl
  text-sm font-medium cursor-pointer transition-all duration-150
  Icon: w-5 h-5

  Inactive: text-slate-500 hover:bg-blue-50 hover:text-blue-600
            hover: icon color changes to blue-500

  Active: text-blue-600 bg-blue-50 font-semibold
          position: relative
          ::before pseudo: absolute left-0 top-0 bottom-0 w-1
                           bg-blue-500 rounded-r-full

Section divider:
  border-t border-slate-100 my-2 mx-2
```

### 7.6 Tables

```
Container: bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden

Header: bg-slate-50 px-6 py-3
  text-xs font-semibold text-slate-400 uppercase tracking-wider

Row: px-6 py-4 border-b border-slate-50
  hover:bg-slate-50/50 transition-colors

Last row: no border-b

Actions column: flex gap-2 items-center
  Action button: w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center
                 text-slate-400 hover:text-{color} hover:border-{color}-200 hover:bg-{color}-50
```

### 7.7 Toasts

```
Position: bottom-right (Toaster)
Duration:
  success: 3000ms — CheckCircle2 text-green-500
  error:   5000ms — XCircle text-red-500
  warning: 4000ms — AlertTriangle text-amber-500
  info:    3000ms — Info text-blue-500

Style: rounded-xl shadow-lg border
```

### 7.8 Empty States

```
Container: flex flex-col items-center justify-center text-center py-16

Icon: w-16 h-16 text-slate-200 mb-4
  (use Lucide icon relevant to the context)

Title: text-lg font-semibold text-slate-400
Sub: text-sm text-slate-400 mt-1 max-w-[280px]
Action button (optional): mt-6
```

---

## 8. LAYOUT SYSTEM

### 8.1 Dashboard Layout

```
Structure:
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <Sidebar />                              // fixed w-64
    <main class="flex-1 overflow-y-auto">   // takes remaining width
      <TopBar />                            // sticky top, h-16
      <div class="p-6 md:p-8">             // page content
        {children}
      </div>
    </main>
  </div>

TopBar:
  sticky top-0 z-40 bg-white border-b border-slate-100
  h-16 px-6 flex items-center justify-between
  
  Left: page title (text-xl font-bold text-slate-900)
  Right: notification bell + user avatar dropdown

Mobile adaptation:
  Sidebar hidden by default → hamburger button in topbar
  Sidebar overlays content when open (z-50 with backdrop)
```

### 8.2 Public Layout

```
Structure:
  <Navbar />           // sticky
  <main>{children}</main>
  <Footer />
```

### 8.3 Exam Layout

```
Structure:
  <ExamHeader />       // fixed top h-16
  <QuestionNav />      // fixed left w-64 (desktop), bottom drawer (mobile)
  <main class="ml-64 pt-16 pb-20"> // scrollable
    {question content}
  </main>
  <ExamBottomNav />    // fixed bottom h-16
```

### 8.4 Responsive Breakpoints

```
Mobile first approach. Use Tailwind breakpoints:
  default: 0px+    (mobile — stack everything)
  sm:      640px+  (large mobile / small tablet)
  md:      768px+  (tablet — 2 columns start)
  lg:      1024px+ (desktop — sidebar visible, full layout)
  xl:      1280px+ (large desktop)

Key responsive rules:
  - Sidebar: hidden on < lg, shown on lg+
  - Grid: grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3
  - Text: smaller on mobile (text-4xl → lg:text-6xl)
  - Padding: p-4 → md:p-6 → lg:p-8
  - Tables: scroll horizontally on mobile (overflow-x-auto)
  - Modals: full screen on mobile (bottom sheet style)
```

---

## 9. ANIMATION RULES

```
Page transitions: none (avoid for performance)

Micro-interactions:
  Button hover:   duration-200 ease-out
  Card hover:     duration-300 ease-out
  Sidebar items:  duration-150 ease-out
  Input focus:    duration-200 ease-out

Custom keyframes (add to tailwind.config.ts):
  fadeInUp:   opacity 0→1, translateY 16px→0
  fadeInDown: opacity 0→1, translateY -16px→0
  fadeInLeft: opacity 0→1, translateX -16px→0
  slideIn:    translateX -100%→0 (sidebar mobile)
  pulse:      standard Tailwind
  shake:      translateX -4px → 4px → -4px (for timer warning)

Count-up animation:
  Use IntersectionObserver + requestAnimationFrame
  Duration: 1500ms, easing: easeOutCubic
  Only on stats/numbers sections

Loading skeleton:
  bg-slate-100 animate-pulse rounded-xl
  Use for async data loading states
```

---

## 10. ICON USAGE

```
Library: lucide-react (ONLY — no other icon libraries)
Default size: w-5 h-5
Small: w-4 h-4
Large: w-6 h-6
XL (empty states): w-16 h-16

Sidebar icons (w-5 h-5):
  Dashboard: LayoutDashboard
  Tryout: BookOpen
  Users (Admin): Users
  Guru: GraduationCap
  Siswa: Users
  Profile: User
  History: BarChart2
  Logout: LogOut

Action icons (w-4 h-4):
  Edit: Pencil
  Delete: Trash2
  View: Eye
  Add: Plus
  Close: X
  Back: ArrowLeft
  Next: ArrowRight
  Save: Save
  Upload: Upload
  Download: Download
  Search: Search
  Filter: Filter
  Sort: ArrowUpDown
  More options: MoreHorizontal (⋯)
  Drag: GripVertical

Status icons (w-4 h-4):
  Success: CheckCircle2 text-green-500
  Error: XCircle text-red-500
  Warning: AlertTriangle text-amber-500
  Info: Info text-blue-500
  Loading: Loader2 animate-spin

Exam icons:
  Timer: Timer
  Flag: Flag
  Trophy: Trophy
  Star: Star
```

---

## 11. DATA & STATE PATTERNS

### Loading State
```tsx
// Always show skeleton or spinner during data fetch
// Never show empty state AND loading at same time

// Skeleton example:
<div className="bg-slate-100 animate-pulse rounded-xl h-8 w-48" />

// Full card skeleton:
<div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
  <div className="bg-slate-100 animate-pulse rounded-lg h-4 w-32" />
  <div className="bg-slate-100 animate-pulse rounded-lg h-4 w-full" />
  <div className="bg-slate-100 animate-pulse rounded-lg h-4 w-3/4" />
</div>
```

### Error State
```tsx
// Show inline error with retry button
<div className="flex flex-col items-center py-12 text-center">
  <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
  <p className="text-slate-500">Gagal memuat data</p>
  <button onClick={retry} className="mt-4 text-blue-500 text-sm hover:underline">
    Coba lagi
  </button>
</div>
```

### Confirmation Pattern
```
Always use AlertDialog (shadcn) for destructive actions:
  - Delete user
  - Delete tryout
  - Delete question
  - Submit exam

Never use browser confirm()
```
