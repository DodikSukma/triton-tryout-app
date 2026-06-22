You are a world-class frontend developer and UI/UX designer specializing in 
modern educational landing pages. Build a stunning, fully responsive landing 
page for "Bimbel Triton Denpasar" — a tutoring center (bimbingan belajar) in 
Denpasar, Bali, Indonesia serving SD, SMP, and SMA students. The page must 
feel premium, trustworthy, and conversion-focused, highlighting student 
achievements and alumni success stories.

=============================================================
TECH STACK & ASSETS
=============================================================
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Framer Motion (all animations)
- next/image for all images (use dummy placeholder images/URLs)
  * NOTE: To avoid Next.js Image optimization SVG errors with placehold.co, configure `dangerouslyAllowSVG: true` in `next.config.mjs`, OR append `.png` at the end of the placehold.co URLs (e.g. `https://placehold.co/600x400.png?text=...`).
- Logos & Favicon:
  * Use the file `/logo.png` (mapped from `public/logo.png`) for all branding logo image displays.
  * Use `/logo.png` for the web icon / favicon (configure in `/app/layout.tsx` or `/app/favicon.ico`).
- Icons:
  * NEVER use OS emojis / Windows icons for icons (like 🏆, 📚, 👨‍🏫, etc.).
  * Load the FontAwesome CSS stylesheet CDN link (`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css`) in your main layout (`/app/layout.tsx`).
  * Use FontAwesome classes (e.g., `<i className="fas fa-graduation-cap"></i>`, `<i className="fas fa-book-open"></i>`) or Lucide React components for all UI icons.
- Student testimonials loaded from `/data/reviews.json`
- All sections are individual components in `/components/sections/

=============================================================
COLOR SYSTEM & VISUAL IDENTITY
=============================================================
Primary Palette (Custom Theme):
  - Primary Blue:   #0309FF
  - Primary Red:    #FF0303
  - White:          #FFFFFF
  - Navy Dark:      #050A30
  - Soft Blue:      #E8EAFF
  - Soft Red:       #FFE7E7
  - Gray Light:     #F5F7FA

Gradient Rules:
  - Hero: white top fading into soft blue #E8EAFF at bottom
  - CTA buttons: #0309FF, hover state: #FF0303
  - Section accents: thin lines in primary blue to primary red
  - Cards: white bg, #E8EAFF border, soft box-shadow
  - Badge pills: primary red text on soft red bg with light border
  - Footer: #050A30 navy dark with white text

Typography:
  - Font: Inter (Google Fonts)
  - H1: 64px bold, Navy Dark
  - H2: 40px semibold
  - Body: 16px, #475569
  - Labels/badges: 12px uppercase tracking-wide

=============================================================
LAYOUT — ALL SECTIONS (in order)
=============================================================

──────────────────────────────────────────────
SECTION 1: NAVBAR
──────────────────────────────────────────────
- Sticky top, white background, subtle bottom border
- On scroll: add shadow + slight height reduction (Framer Motion)
- Left: Logo — Image using `/logo.png` + "Triton Denpasar" bold text
- Center: Nav links — Beranda, Program, Prestasi, Testimoni, Kontak
- Right: "Hubungi Kami" ghost button + "Daftar Sekarang" filled CTA
- Mobile: hamburger icon → full-screen slide-down drawer with nav links
- Active link: animated blue underline

──────────────────────────────────────────────
SECTION 2: HERO
──────────────────────────────────────────────
Layout: 2 columns (60/40 split)
Background: pure white with very subtle blue grid pattern overlay

LEFT COLUMN:
- Badge pill (top): "#1 Bimbel Terpercaya di Bali" (with FontAwesome trophy icon)
  Style: primary red border, animated shimmer effect
- H1 headline (staggered word-by-word animation on load):
  "Wujudkan Prestasi Terbaik Anak Anda Bersama Triton"
- Subheading: "Bimbingan belajar SD, SMP, SMA terpercaya di Denpasar 
  dengan metode terbukti dan rekam jejak alumni yang membanggakan."
- Two CTA buttons:
  → "Daftar Sekarang" (filled, primary blue bg, primary red hover, scale on hover)
  → "Lihat Program" (outlined primary blue, arrow icon)
- Trust indicators row (FontAwesome check icon + text, inline):
  - [check-icon] 1000+ Siswa Alumni
  - [check-icon] 15+ Tahun Pengalaman
  - [check-icon] 98% Lulus PTN

RIGHT COLUMN:
- Hero illustration (use placeholder)
- Floating achievement cards overlaid on illustration:
  Card 1 (top-right): "Alumni Diterima UI, UGM, ITB" (with FontAwesome graduation cap icon)
  Card 2 (bottom-left): "Nilai rata-rata naik 25 poin" (with FontAwesome line chart icon)
  Cards have entrance animation (slide in from sides) + subtle float loop
- Behind illustration: 2 large blurred gradient circles (primary blue + primary red)

ANIMATION:
- Left column: fade + slide up, staggered per element
- Right column: fade + slide in from right
- Floating cards: independent float keyframe animation

- Hero Illustration: Use a dummy placeholder image `/images/placeholder-hero.png` or URL `https://placehold.co/600x400.png?text=Triton+Hero`.

──────────────────────────────────────────────
SECTION 3: STATS / SOCIAL PROOF BAND
──────────────────────────────────────────────
- Full-width, soft blue background (#E8EAFF)
- 4 animated stat counters in a row, separated by vertical dividers:
  * [trophy icon] 1000+  →  Alumni Sukses
  * [calendar icon] 15+    →  Tahun Pengalaman
  * [chalkboard-teacher icon] 50+   →  Pengajar Berpengalaman
  * [bullseye icon] 98%    →  Tingkat Kelulusan PTN
- Each counter uses count-up animation triggered by scroll into view
- Subtle entrance: each stat fades in with 0.15s stagger

──────────────────────────────────────────────
SECTION 4: PROGRAM UNGGULAN
──────────────────────────────────────────────
Section label: "PROGRAM KAMI"
H2: "Program Belajar untuk Setiap Jenjang"
Subtitle: "Kurikulum terstruktur, guru berpengalaman, dan metode 
belajar yang terbukti meningkatkan nilai siswa."

3-column card grid:

CARD 1 — SD (Sekolah Dasar)
- Icon: FontAwesome `school` or `book-open` icon
- Title: "Program SD"
- Grades: Kelas 1–6
- Description: Membangun fondasi akademik yang kuat dengan 
  metode belajar menyenangkan dan interaktif.
- Subjects: Matematika, IPA, Bahasa Indonesia, Bahasa Inggris
- CTA: "Pelajari →"
- Color accent: primary blue

CARD 2 — SMP (Sekolah Menengah Pertama) — MOST POPULAR badge
- Icon: FontAwesome `book-open` or `graduation-cap` icon
- Title: "Program SMP"
- Grades: Kelas 7–9
- Description: Persiapan intensif menghadapi ujian sekolah 
  dan seleksi masuk SMA favorit.
- Subjects: Matematika, IPA, IPS, Bahasa Inggris, Bahasa Indonesia
- CTA: "Pelajari →"
- Color accent: navy dark, elevated card style

CARD 3 — SMA (Sekolah Menengah Atas)
- Icon: FontAwesome `graduation-cap` icon
- Title: "Program SMA"
- Grades: Kelas 10–12
- Description: Bimbingan intensif persiapan UTBK/SNBT dan 
  ujian sekolah untuk masuk perguruan tinggi impian.
- Subjects: Matematika, Fisika, Kimia, Biologi, Ekonomi, 
  Bahasa Inggris, Geografi
- CTA: "Pelajari →"
- Color accent: primary red

Card animation: staggered fade + scale up on scroll into view
Card hover: lift + blue glow border + arrow icon slides right

- Program Section Illustrations: Use dummy placeholder images `/images/placeholder-sd.png`, `/images/placeholder-smp.png`, and `/images/placeholder-sma.png` or URL `https://placehold.co/300x300.png?text=Program`.

──────────────────────────────────────────────
SECTION 5: PRESTASI & ALUMNI SUCCESS
──────────────────────────────────────────────
[THIS IS THE HERO SECTION — make it visually impressive]

Background: Navy Dark #050A30 with primary blue to primary red accent lines

Section label: "PRESTASI ALUMNI" (primary red text)
H2: "Alumni Triton Diterima di Universitas Terbaik" (white)
Subtitle: "Ribuan siswa kami telah membuktikan — Triton bukan 
sekadar bimbel, ini investasi masa depan." (gray-light)

TOP ROW — University Logo Strip:
Scrolling marquee (auto-scroll, infinite loop) showing logos/names of:
UI, UGM, ITB, UNUD, UNDIP, ITS, IPB, UNAIR, UB, UNHAS
Style: white pill badges with university name, smooth infinite scroll

MIDDLE — Achievement Cards Grid (2x2):
Card 1: "500+ Alumni diterima PTN Top 10 Indonesia (2020–2024)" (with FontAwesome graduation-cap icon)
Card 2: "Rata-rata kenaikan nilai siswa: +25 poin dalam 3 bulan" (with FontAwesome chart-line icon)
Card 3: "Top 3 Bimbel Terbaik di Bali versi survei orang tua 2023" (with FontAwesome trophy icon)
Card 4: "98% siswa kelas 12 lulus UTBK di atas passing grade" (with FontAwesome check-double icon)
Each card: white, rounded, icon + big number + description
Entrance: cards flip in (rotateY) on scroll

BOTTOM ROW — Featured Alumni Spotlight:
3 alumni profile cards, each with:
- Avatar illustration (use placeholder)
- Name: e.g. "I Kadek Arya Wibawa"
- Accepted to: "Teknik Informatika — ITB 2023"
- Quote: short motivational quote about Triton
Cards slide in from bottom on scroll

- Alumni Avatar Illustrations: Use dummy placeholder images `/images/placeholder-alumni-1.png`, `/images/placeholder-alumni-2.png`, and `/images/placeholder-alumni-3.png` or URL `https://placehold.co/150x150.png?text=Alumni`.

──────────────────────────────────────────────
SECTION 6: METODE BELAJAR
──────────────────────────────────────────────
Layout: alternating left-right rows (zigzag layout)
Section label: "METODE KAMI"
H2: "Kenapa Triton Berbeda?"

ROW 1 (image left, text right):
Feature: "Pengajar Berpengalaman & Terseleksi"
Description: Semua pengajar kami adalah lulusan PTN terbaik 
dengan pengalaman mengajar minimal 3 tahun dan terseleksi ketat.
Icon list: [check-icon] Lulusan PTN Top  [check-icon] Terlatih pedagogi  [check-icon] Evaluasi rutin

ROW 2 (text left, image right):
Feature: "Kurikulum Adaptif & Personal"
Description: Setiap siswa mendapat peta belajar yang disesuaikan 
dengan kelemahan dan target nilai masing-masing.
Icon list: [check-icon] Asesmen awal  [check-icon] Rencana belajar personal  [check-icon] Progress report

ROW 3 (image left, text right):
Feature: "Platform Tryout Online Terintegrasi"
Description: Latihan soal CBT online kapan saja dengan 500+ soal, 
nilai instan, dan analisis kesalahan untuk perbaikan berkelanjutan.
Icon list: [check-icon] 500+ Soal  [check-icon] Nilai Otomatis  [check-icon] Analisis Mendalam

- Method Section Illustrations: Use dummy placeholder images `/images/placeholder-method-1.png`, `/images/placeholder-method-2.png`, and `/images/placeholder-method-3.png` or URL `https://placehold.co/400x300.png?text=Method`.

──────────────────────────────────────────────
SECTION 7: STUDENT TESTIMONIALS
──────────────────────────────────────────────
Section label: "TESTIMONI"
H2: "Apa Kata Mereka?"
Subtitle: "Lebih dari 1000 siswa dan orang tua telah mempercayakan 
pendidikan mereka kepada Triton Denpasar."

DATA SOURCE: Load all reviews from /data/reviews.json
JSON structure:
[
  {
    "id": 1,
    "name": "Ni Kadek Ayu Permatasari",
    "role": "Siswa Kelas 12 IPA",
    "program": "Program SMA",
    "avatar_initial": "N",
    "avatar_color": "#0309FF",
    "rating": 5,
    "text": "Berkat Triton, saya diterima di Kedokteran UNUD! 
             Guru-gurunya sabar dan metodenya sangat efektif.",
    "university": "FK UNUD 2024",
    "year": "2024"
  },
  {
    "id": 2,
    "name": "I Made Surya Dharma",
    "role": "Siswa Kelas 9 SMP",
    "program": "Program SMP",
    "avatar_initial": "I",
    "avatar_color": "#FF0303",
    "rating": 5,
    "text": "Nilai matematika saya naik dari 60 ke 92 
             dalam 2 bulan. Triton luar biasa!",
    "university": null,
    "year": "2024"
  }
]

DISPLAY — Auto-scrolling carousel (LEFT ↔ RIGHT):
- Two rows of cards scrolling in OPPOSITE directions simultaneously
  Row 1: scrolls LEFT continuously (infinite loop)
  Row 2: scrolls RIGHT continuously (infinite loop)
- On hover over any card: pause that row's animation
- Each review card contains:
  → Avatar circle (initial + color from JSON)
  → Star rating (filled yellow stars using FontAwesome star icon)
  → Review text (italic)
  → Name + Role
  → Program badge (pill)
  → University tag if applicable (FontAwesome graduation cap icon + university name)
- Card style: white, rounded-2xl, shadow-md, primary blue left border accent
- Smooth CSS animation using Framer Motion (x keyframes, infinite repeat)
- Minimum 8 cards visible across both rows at once

──────────────────────────────────────────────
SECTION 8: GALLERY / SUASANA BELAJAR
──────────────────────────────────────────────
Section label: "GALERI"
H2: "Suasana Belajar di Triton"

Masonry grid layout (3 columns desktop, 2 tablet, 1 mobile)
6 image slots with hover zoom + overlay caption

- Gallery Images: Use dummy placeholder images `/images/placeholder-gallery-1.png` to `/images/placeholder-gallery-6.png` or URL `https://placehold.co/600x450.png?text=Gallery+[1-6]` as placeholders for:
  1. Kelas Modern (bright, clean modern classroom)
  2. Meja Belajar Siswa (close-up student desk, textbooks, notes)
  3. Guru Mengajar Matematika (teacher writing formulas on whiteboard)
  4. Perayaan Lulus UTBK (students celebrating, throwing caps)
  5. Area Belajar Kolaboratif (students studying with laptops)
  6. Konsultasi Akademik (parent, student, advisor consultation)

──────────────────────────────────────────────
SECTION 9: PRICING / PAKET
──────────────────────────────────────────────
Section label: "PAKET BELAJAR"
H2: "Investasi Terbaik untuk Masa Depan"
Toggle: Bulanan / Semester (animated pill toggle, Framer Motion)

3 pricing cards:

STARTER — Rp 350.000/bulan
- 2x pertemuan per minggu
- 1 mata pelajaran
- Akses tryout online
- Progress report bulanan
CTA: "Pilih Paket"

POPULAR (highlighted, elevated) — Rp 600.000/bulan
- 3x pertemuan per minggu
- 3 mata pelajaran
- Akses tryout online unlimited
- Progress report mingguan
- Konsultasi orang tua
CTA: "Pilih Paket" (primary blue button with hover primary red)

INTENSIF — Rp 900.000/bulan
- 5x pertemuan per minggu
- Semua mata pelajaran
- Akses tryout + analisis mendalam
- Progress report harian
- Konsultasi prioritas
- Garansi kenaikan nilai
CTA: "Pilih Paket"

Card animation: stagger scale-up on scroll
Popular card: primary blue glow, "Paling Populer" badge (primary red background)
Semester toggle: multiply prices by 5 with animated number transition

──────────────────────────────────────────────
SECTION 10: FAQ
──────────────────────────────────────────────
Section label: "FAQ"
H2: "Pertanyaan yang Sering Diajukan"
Layout: accordion list, single open at a time

Questions:
1. Apakah ada tes masuk untuk bergabung di Triton?
2. Bagaimana sistem pembayaran dan pendaftaran?
3. Apakah bisa ikut tryout online tanpa daftar kelas?
4. Berapa ukuran kelas bimbel di Triton?
5. Apakah ada garansi kenaikan nilai?
6. Bagaimana jika siswa tertinggal materi?

Animation: smooth height expand/collapse with Framer Motion AnimatePresence
Active item: primary blue left border, question text turns primary blue

──────────────────────────────────────────────
SECTION 11: CTA BANNER
──────────────────────────────────────────────
Full-width section
Background: navy dark (#050A30) with subtle animated floating shapes
H2: "Siap Wujudkan Prestasi Terbaik?" (white, large)
Subtext: "Bergabunglah dengan 1000+ siswa yang telah membuktikan 
bahwa Triton adalah pilihan terbaik untuk masa depan mereka."
Two buttons: "Daftar Sekarang — Gratis!" + "Hubungi Kami via WhatsApp"
WhatsApp button: green accent, FontAwesome WhatsApp icon
Background: animated gradient shift (primary blue → navy dark, looping)

──────────────────────────────────────────────
SECTION 12: FOOTER
──────────────────────────────────────────────
Background: #050A30 navy dark
4-column layout:

COL 1 — Brand:
- Logo image from `/logo.png` + "Triton Denpasar" 
- Tagline: "Bimbel terpercaya sejak 2009"
- FontAwesome social icons: Instagram, Facebook, YouTube, TikTok
- Rating badge: FontAwesome star icon 4.9/5.0

COL 2 — Platform:
Links: Beranda, Program, Prestasi, Testimoni, Tryout Online, Kontak

COL 3 — Program:
Links: Program SD, Program SMP, Program SMA, Tryout Online, 
Jadwal Belajar, Pendaftaran

COL 4 — Kontak:
- FontAwesome map-marker-alt icon: Jl. Raya Kuta No. 88, Denpasar, Bali
- FontAwesome envelope icon: info@tritondenpasar.id
- FontAwesome phone icon: (0361) 888-9999
- FontAwesome whatsapp icon: WhatsApp: wa.me/6281234567890
Jam operasional: Senin–Sabtu, 08.00–20.00 WITA

Bottom bar: "© 2024 Triton Denpasar · Dibuat dengan FontAwesome heart icon di Bali"
+ Privacy Policy + Terms links

=============================================================
GLOBAL ANIMATIONS (Framer Motion)
=============================================================
1. Page load: smooth fade-in overlay that dissolves in 0.5s
2. Scroll-triggered: every section fades + slides up when entering 
   viewport (useInView, once: true, margin: "-100px")
3. Navbar: shrinks on scroll, expands on scroll back to top
4. Floating elements: subtle continuous y-axis float (keyframes)
5. Hover states: scale(1.03) + shadow increase on all cards
6. Button hover: scale(1.05) + gradient shift + glow shadow
7. Counter animation: count up from 0 when entering viewport
8. Marquee/carousel: CSS + Framer Motion infinite translate animation
9. CTA section background: slow gradient color shift loop
10. Accordion: smooth height + opacity transition

=============================================================
RESPONSIVE BREAKPOINTS
=============================================================
- Mobile (< 640px): single column, reduced font sizes, 
  hamburger nav, stacked CTAs
- Tablet (640–1024px): 2 columns where applicable
- Desktop (> 1024px): full layout as described

=============================================================
PERFORMANCE & ACCESSIBILITY
=============================================================
- All images use next/image with proper alt text in Bahasa Indonesia
- Lazy load all images below the fold
- Semantic HTML: header, nav, main, section, footer tags
- ARIA labels on all interactive elements
- Color contrast ratio minimum 4.5:1 for all text
- Font size minimum 16px for body text
- Focus states visible on all interactive elements

=============================================================
FILE STRUCTURE
=============================================================
/app
  layout.tsx
  page.tsx
/components
  /sections
    Navbar.tsx
    Hero.tsx
    StatsBand.tsx
    Programs.tsx
    Alumni.tsx
    Method.tsx
    Testimonials.tsx
    Gallery.tsx
    Pricing.tsx
    FAQ.tsx
    CTABanner.tsx
    Footer.tsx
  /ui
    AnimatedCounter.tsx
    ReviewCard.tsx
    ProgramCard.tsx
    AlumniCard.tsx
    Accordion.tsx
    Marquee.tsx
/data
  reviews.json
/public
  /images (all generated images go here)

Generate all components, the full reviews.json with 10 entries,
and a complete page.tsx that imports and renders all sections in order.
Start with Navbar.tsx and Hero.tsx first, confirm structure, 
then proceed section by section.