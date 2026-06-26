import os
import re
import html
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(script_dir)
task_dir = os.path.join(workspace_dir, "task")
docs_dir = os.path.join(workspace_dir, "docs", "docs-task-progress")

os.makedirs(docs_dir, exist_ok=True)

js_file = os.path.join(docs_dir, "tasks-data.js")
html_file = os.path.join(docs_dir, "index.html")

# Indonesian translations mapping for titles and overviews
TRANSLATIONS = {
    "TRN-01": {
        "title": "Pemisahan 3 Microservice untuk Jenjang SD, SMP, SMA",
        "overview": "Mendekonstruksi service soal/jawaban monolitik menjadi 3 microservice terpisah (sd-service, smp-service, sma-service) pada port 4005, 4006, 4007 dengan database terisolasi untuk meningkatkan modularitas dan skalabilitas."
    },
    "TRN-02": {
        "title": "Tema Tampilan Berdasarkan Jenjang & Dummy Data Pengguna",
        "overview": "Mengimplementasikan tema warna dinamis pada dashboard siswa (Merah untuk SD, Biru Navy untuk SMP, Abu-abu untuk SMA) serta menambahkan akun dummy pengujian terarah di database seeder."
    },
    "TRN-03": {
        "title": "Impor Bank Soal dari Berkas MS Word (.docx)",
        "overview": "Membuat parser untuk file Word (.docx) agar guru dapat mengunggah paket soal secara massal menggunakan format khusus, lengkap dengan pendeteksian tipe soal, bobot, kunci jawaban, dan persamaan matematika."
    },
    "TRN-04": {
        "title": "Alur Persetujuan, Pengaturan Acak Soal, dan Tautan Berbagi Langsung",
        "overview": "Membatasi akses tryout siswa agar hanya sesuai jenjang mereka (firewall), menambahkan opsi acak soal/opsi per sesi, serta menyediakan tautan langsung untuk membagikan tryout."
    },
    "TRN-05": {
        "title": "Filter Dashboard Admin, Navigasi Persetujuan, dan Tombol Kembali Builder",
        "overview": "Menyempurnakan filter pencarian kelas/mapel di dashboard admin, merapikan navigasi verifikasi tryout guru, serta menambahkan tombol navigasi kembali pada halaman pembuat soal."
    },
    "TRN-06": {
        "title": "Sistem Log Audit & Dashboard Aktivitas Superuser",
        "overview": "Mencatat seluruh aktivitas penting di platform (login sukses/gagal, pembuatan soal, pengerjaan tryout) ke tabel audit_logs dan menampilkan log tersebut di dasbor admin untuk pelacakan keamanan."
    },
    "TRN-07": {
        "title": "Sistem Ujian CBT & Fitur Keamanan Pencegahan Kecurangan (Proctoring)",
        "overview": "Mengembangkan antarmuka ujian Computer-Based Test (CBT) yang bersih dan bebas distraksi untuk siswa, dengan sistem proctoring otomatis (fullscreen lock, deteksi kehilangan fokus, proteksi copy-paste) dan kontras hasil nilai."
    },
    "TRN-08": {
        "title": "Pembuatan Landing Page Utama Bimbel Triton Denpasar",
        "overview": "Membangun halaman depan (landing page) yang modern, responsif, dan premium untuk Bimbel Triton Denpasar dengan visualisasi jenjang, ulasan testimoni alumni, galeri foto, dan formulir pendaftaran."
    },
    "TRN-09": {
        "title": "Editor Rumus Matematika (KaTeX) & Menonaktifkan Fitur AI",
        "overview": "Mengimplementasikan input rumus matematika dengan preview KaTeX waktu nyata untuk guru dan siswa, serta menyembunyikan tombol pembuat soal otomatis berbasis AI sesuai permintaan klien."
    },
    "TRN-10": {
        "title": "Pembahasan Soal, Kode Soal, Peran Admin Soal & Super Tryout",
        "overview": "Menambahkan input pembahasan soal (penyelesaian), kode soal unik, peran administratif baru 'admin-soal', serta fitur pembuatan 'Super Tryout' yang menggabungkan soal-soal lintas guru/jenjang."
    },
    "TRN-11": {
        "title": "Integrasi Layar Pemuatan (Animated Loading Screen)",
        "overview": "Mengintegrasikan layar pemuatan beranimasi dengan logo dan branding Triton pada frontend Next.js untuk transisi halaman yang lebih mulus dan premium."
    },
    "TRN-12": {
        "title": "Perbaikan Render Persamaan Matematika & Segmentasi Master Data",
        "overview": "Memperbaiki bug rendering formula matematika pasca impor Word, serta memisahkan master data di panel admin berdasarkan tingkat pendidikan (SD, SMP, SMA)."
    },
    "TRN-13": {
        "title": "Sinkronisasi Latar Belakang & Simpan Otomatis Jawaban Ujian Siswa",
        "overview": "Mengembangkan mekanisme penyimpanan jawaban otomatis (auto-save) berbasis IndexedDB/localStorage untuk mencegah hilangnya jawaban siswa jika koneksi internet terputus saat ujian berlangsung."
    },
    "TRN-14": {
        "title": "Penyempurnaan Pembuatan Super Tryout & Pencarian Bank Soal",
        "overview": "Memperhalus pemilihan list data saat menyusun Super Tryout, menambahkan kolom pencarian master data, dan fitur pencarian kode soal pada Bank Soal."
    },
    "TRN-15": {
        "title": "Skenario Urutan Demo & Verifikasi Sistem CBT",
        "overview": "Mengonfigurasi skrip dan alur pengujian demo CBT secara runut untuk memverifikasi kesiapan fitur dari login, pengerjaan ujian, hingga hasil kalkulasi nilai akhir siswa."
    },
    "TRN-16": {
        "title": "Penyelarasan Halaman Mandiri Ujian & Perbaikan Bug Editor LaTeX",
        "overview": "Menyelaraskan tata letak halaman ujian mandiri serta memperbaiki kendala input karakter khusus pada editor persamaan matematika."
    },
    "TRN-17": {
        "title": "Lencana Notifikasi Tryout Menunggu Persetujuan",
        "overview": "Menampilkan lencana (badge) angka notifikasi real-time di sidebar admin dan admin-soal untuk memberi tahu adanya tryout guru baru yang membutuhkan persetujuan/verifikasi."
    },
    "TRN-18": {
        "title": "Inspeksi Soal, Pencarian, & Halaman (Pagination) di Dasbor Admin Soal",
        "overview": "Mengembangkan antarmuka bagi admin-soal untuk menginspeksi rincian soal buatan guru, melakukan pencarian kata kunci, serta menerapkan penomoran halaman pada daftar data."
    },
    "TRN-19": {
        "title": "Peningkatan Alur Kerja Bank Soal Guru",
        "overview": "Menambahkan proteksi hak akses agar guru hanya bisa mengedit Bank Soal miliknya sendiri, sementara guru lain dengan mapel sejenis hanya bisa membacanya sebagai referensi."
    },
    "TRN-20": {
        "title": "Pencatatan Pelanggaran Ujian & Batas Waktu per Soal",
        "overview": "Mengimplementasikan sistem pencatatan otomatis atas pelanggaran ujian (tab-switching) ke database, serta durasi batas waktu pengerjaan per butir soal (timer per soal)."
    },
    "TRN-21": {
        "title": "Pengaturan Visibilitas Tryout & Laporan Rekap Nilai Format Excel",
        "overview": "Menambahkan visibilitas status tryout dan fitur unduh rekap nilai siswa gabungan dalam format spreadsheet Excel (.xlsx)."
    },
    "TRN-22": {
        "title": "Tipe Soal Standar AKM & Pilihan Jawaban Gambar",
        "overview": "Mendukung variasi tipe soal Asesmen Kompetensi Minimum (AKM) seperti pilihan ganda kompleks, isian singkat, dan menjodohkan, serta mendukung gambar sebagai opsi jawaban."
    },
    "TRN-23": {
        "title": "Utilitas Pembersih Database Lokal (Log/Dump Cleaner)",
        "overview": "Membuat perintah otomatis (make logs-clean / db-clear) untuk menghapus riwayat sesi lama, database sampah, atau log aktivitas pengembangan guna menghemat penyimpanan."
    },
    "TRN-24": {
        "title": "Arsitektur Pemisahan Landing Page",
        "overview": "Memisahkan kode frontend landing page utama ke direktori/folder terpisah (landingpage/) agar tidak membebani performa bundle aplikasi ujian utama."
    },
    "TRN-25": {
        "title": "Pengamanan Lanjutan Lingkungan Ujian (Anti-Cheat)",
        "overview": "Mengunci lingkungan peramban siswa dengan lebih ketat (deteksi multi-screen, pemblokiran ekstensi pihak ketiga, re-authentication) demi keabsahan nilai."
    },
    "TRN-26": {
        "title": "Caching Redis untuk Memulai Ujian Bersamaan (Konkurensi Tinggi)",
        "overview": "Memanfaatkan Redis cache untuk menyimpan informasi paket tryout aktif agar server tidak kelebihan beban (overload) saat ratusan siswa memulai ujian secara bersamaan."
    },
    "TRN-27": {
        "title": "Gamifikasi Ujian & Papan Peringkat (Leaderboard) Nasional",
        "overview": "Menyajikan elemen gamifikasi (xp, level, streak) and papan peringkat siswa berdasarkan skor tryout untuk memotivasi daya saing belajar."
    },
    "TRN-28": {
        "title": "Analisis Visual Nilai & Analisis Tingkat Kesulitan Soal",
        "overview": "Menyediakan grafik sebaran nilai siswa serta kalkulasi otomatis tingkat kesulitan soal (mudah, sedang, sukar) untuk mengevaluasi kualitas bank soal."
    },
    "TRN-29": {
        "title": "Pelacakan Kesalahan Otomatis & Pemusatan Log Error",
        "overview": "Mengimplementasikan sistem logging error terpusat yang otomatis menangkap uncaught exceptions dan melaporkannya ke dashboard pengembang."
    },
    "TRN-30": {
        "title": "Pembuatan Aset Gambar Landing Page Utama",
        "overview": "Mendefinisikan prompt AI dan mengintegrasikan aset gambar/ilustrasi (avatar alumni, suasana belajar, ikon program SD/SMP/SMA) pada landing page resmi."
    },
    "TRN-31": {
        "title": "Perbaikan Akses Guru ke Analitik Hasil Super Tryout",
        "overview": "Mengizinkan guru mata pelajaran terkait melihat hasil pengerjaan siswa pada Super Tryout yang dibuat oleh admin-soal, dengan tetap mengunci akses edit/hapus."
    },
    "TRN-32": {
        "title": "Alur Pembatalan (Soft-Delete) Bank Soal Guru",
        "overview": "Mengubah aksi hapus guru menjadi aksi batal (batal = true) agar bank soal tetap tersimpan di database admin dan tidak terhapus permanen jika guru resign."
    },
    "TRN-33": {
        "title": "Integrasi Master Data Dinamis pada Kelola Pengguna & Menu Admin",
        "overview": "Memuat data kelas dan mata pelajaran secara dinamis dari database untuk menggantikan daftar hardcoded, serta menambahkan kartu akses cepat di dasbor admin."
    }
}

tasks_data = []

# List all task files in folder
files = sorted([f for f in os.listdir(task_dir) if f.startswith("task-trn-") and f.endswith(".md")])

for file in files:
    path = os.path.join(task_dir, file)
    with open(path, "r", encoding="utf-8") as f:
        raw_markdown = f.read()
    
    match_id = re.search(r"task-trn-(.*?)\.md", file)
    task_id = f"TRN-{match_id.group(1).upper()}" if match_id else "UNKNOWN"
    
    try:
        task_num = int(match_id.group(1)) if match_id else 99
    except ValueError:
        task_num = 99
    
    # TRN-01 to TRN-25 are marked as completed, TRN-26 to TRN-33 are incomplete
    completed = task_num <= 25
    
    trans = TRANSLATIONS.get(task_id, {})
    title_id = trans.get("title", f"Task {task_id}")
    overview_id = trans.get("overview", "Spesifikasi lengkap dapat dibaca pada detail task.")
    
    tasks_data.append({
        "id": task_id,
        "filename": file,
        "title": title_id,
        "overview": overview_id,
        "markdown": raw_markdown,
        "completed": completed
    })

# Write the data file tasks-data.js to separate data from HTML
js_content = f"window.TRITON_TASKS_DATA = {json.dumps(tasks_data, indent=2)};"
with open(js_file, "w", encoding="utf-8") as f:
    f.write(js_content)

# Write index.html loaded with script referencing tasks-data.js and dynamic rendering
html_content = """<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Triton Denpasar — Dashboard Progress & Spesifikasi Task</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
  <script>
    (function() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    })();
  </script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            mono: ['Fira Code', 'monospace'],
          },
          colors: {
            triton: {
              50: '#f0f5ff',
              100: '#e0ebff',
              500: '#3b82f6',
              600: '#2563eb',
              700: '#1d4ed8',
              800: '#1e40af',
              900: '#1e3a8a',
            }
          }
        },
      },
    }
  </script>
  <style>
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    html.dark ::-webkit-scrollbar-track {
      background: #0f172a;
    }
    html:not(.dark) ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    html.dark ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 3px;
    }
    html:not(.dark) ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    html.dark ::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
    html:not(.dark) ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    .task-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px -10px rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
    }
    .markdown-block {
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.6;
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 font-sans antialiased min-h-screen flex flex-col transition-colors duration-300">

  <!-- Header -->
  <header class="h-[76px] sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-6 flex items-center justify-between shadow-sm dark:shadow-lg transition-colors">
    <div class="flex items-center gap-4">
      <img src="../logo.png" alt="Triton Denpasar" class="h-9 object-contain bg-white rounded p-1 border border-slate-200 dark:border-slate-800 shadow-sm" />
      <div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
      <div>
        <h1 class="text-slate-950 dark:text-white font-extrabold text-sm md:text-base tracking-tight">Triton Denpasar</h1>
        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Dashboard Progress &amp; Spesifikasi Task (TRN)</p>
      </div>
    </div>
    <div class="flex items-center gap-3 flex-wrap md:flex-nowrap">
      <!-- Back to Portal Button -->
      <a href="../index.html" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-250 text-xs font-bold transition-all border border-slate-200 dark:border-slate-800 shadow-sm mr-1">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Beranda
      </a>
      <!-- Theme Toggle -->
      <button onclick="toggleTheme()" class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm" title="Ubah Tema">
        <span id="theme-toggle-icon">
          <!-- Icon will be set dynamically -->
        </span>
      </button>

      <div class="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

      <!-- Progress Roster -->
      <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl text-xs shadow-sm">
        <span class="text-slate-500 dark:text-slate-400 font-medium">Progress:</span>
        <span id="task-progress-text" class="font-extrabold text-triton-600 dark:text-triton-400">0/0 Selesai (0%)</span>
        <div class="w-16 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner ml-1">
          <div id="task-progress-bar" class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
      </div>
    </div>
  </header>

  <div class="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10">
    <div class="mb-8">
      <h2 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Eksplorasi Progress Task TRN</h2>
      <p class="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
        Gunakan kolom pencarian atau filter status untuk mencari modul, alur, atau spesifikasi task secara instan dalam Bahasa Indonesia.
      </p>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8">
      <!-- Search input -->
      <div class="relative flex-1 max-w-xl">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          id="search"
          placeholder="Cari kata kunci, nama task, atau nomor TRN (misal: TRN-01)..."
          class="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-triton-500/20 focus:border-triton-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
          oninput="filterTasks()"
        />
      </div>

      <!-- Status Filters -->
      <div class="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 self-start md:self-auto shadow-sm">
        <button onclick="setStatusFilter('all')" id="filter-all" class="px-4 py-2 text-xs font-bold rounded-lg transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/40 dark:border-slate-700/40">
          Semua
        </button>
        <button onclick="setStatusFilter('completed')" id="filter-completed" class="px-4 py-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          Selesai
        </button>
        <button onclick="setStatusFilter('incomplete')" id="filter-incomplete" class="px-4 py-2 text-xs font-bold rounded-lg transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          Belum Selesai
        </button>
      </div>
    </div>

    <!-- Grid Layout -->
    <div id="tasks-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <!-- Cards rendered dynamically via JS -->
    </div>
    
    <div id="empty-state" class="hidden flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-900 shadow-sm">
      <svg class="w-16 h-16 text-slate-400 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="font-bold text-slate-700 dark:text-slate-400">Tidak ada task yang cocok</p>
      <p class="text-xs text-slate-500 mt-1">Coba masukkan kata kunci pencarian atau filter status yang lain.</p>
    </div>
  </div>

  <!-- Modal Detail -->
  <div id="task-modal" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onclick="closeModal()">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
      
      <!-- Modal Header -->
      <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
        <div class="flex items-center gap-3 flex-wrap md:flex-nowrap" id="modal-header-title-area">
          <span id="modal-task-id" class="text-xs font-black text-triton-600 dark:text-triton-400 bg-triton-500/10 dark:bg-triton-500/10 border border-triton-500/20 px-2.5 py-1 rounded-lg"></span>
          <div id="modal-status-container"></div>
          <h2 id="modal-task-title" class="text-slate-950 dark:text-white font-extrabold text-base md:text-lg tracking-tight"></h2>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <div>
          <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Ringkasan (Bahasa Indonesia)</h4>
          <p id="modal-task-overview" class="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner"></p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Berkas Spesifikasi Asli (Bahasa Inggris)</h4>
            <span id="modal-task-filename" class="text-[10px] font-mono text-slate-400 dark:text-slate-500"></span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-x-auto max-h-[350px] shadow-inner">
            <pre><code id="modal-task-markdown" class="markdown-block font-mono text-slate-800 dark:text-slate-400 text-xs"></code></pre>
          </div>
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
        <button onclick="closeModal()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-xs transition-colors">
          Tutup
        </button>
      </div>
    </div>
  </div>

  <footer class="mt-auto py-6 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-center text-xs text-slate-500 transition-colors">
    <p>&copy; 2026 Triton Denpasar. All rights reserved.</p>
  </footer>

  <!-- Load tasks data script -->
  <script src="./tasks-data.js"></script>

  <script>
    // Safe escape helper for HTML rendering
    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Toggle Theme function
    function toggleTheme() {
      const htmlEl = document.documentElement;
      if (htmlEl.classList.contains('dark')) {
        htmlEl.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        updateThemeToggleIcon(false);
      } else {
        htmlEl.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        updateThemeToggleIcon(true);
      }
    }

    function updateThemeToggleIcon(isDark) {
      const iconContainer = document.getElementById('theme-toggle-icon');
      if (!iconContainer) return;
      if (isDark) {
        // Show Sun icon (switch to light)
        iconContainer.innerHTML = `<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>`;
      } else {
        // Show Moon icon (switch to dark)
        iconContainer.innerHTML = `<svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>`;
      }
    }

    let currentStatusFilter = 'all';

    function setStatusFilter(status) {
      currentStatusFilter = status;
      
      const buttons = {
        all: document.getElementById('filter-all'),
        completed: document.getElementById('filter-completed'),
        incomplete: document.getElementById('filter-incomplete')
      };
      
      Object.keys(buttons).forEach(key => {
        const btn = buttons[key];
        if (!btn) return;
        if (key === status) {
          btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'border', 'border-slate-200/40', 'dark:border-slate-700/40');
          btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-white');
        } else {
          btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'border', 'border-slate-200/40', 'dark:border-slate-700/40');
          btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-white');
        }
      });
      
      filterTasks();
    }

    // Render cards dynamically on load
    function init() {
      const data = window.TRITON_TASKS_DATA || [];
      const grid = document.getElementById('tasks-grid');
      const progressText = document.getElementById('task-progress-text');
      const progressBar = document.getElementById('task-progress-bar');
      
      const total = data.length;
      const completedCount = data.filter(t => t.completed).length;
      const percentage = total > 0 ? ((completedCount / total) * 100).toFixed(1) : 0;
      
      if (progressText) {
        progressText.textContent = `${completedCount}/${total} Selesai (${percentage}%)`;
      }
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }

      // Initialize Theme Icon
      const isDark = document.documentElement.classList.contains('dark');
      updateThemeToggleIcon(isDark);
      
      let html = '';
      data.forEach(t => {
        const statusBadge = t.completed 
          ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm transition-all duration-300">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Selesai
             </span>`
          : `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm transition-all duration-300">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Belum Selesai
             </span>`;

        html += `
          <div class="task-card flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 shadow-sm transition-all" 
               data-id="${t.id.toLowerCase()}" 
               data-title="${t.title.toLowerCase()}" 
               data-overview="${t.overview.toLowerCase()}"
               data-completed="${t.completed}">
            <div class="flex items-center justify-between mb-3.5 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-triton-600 dark:text-triton-400 bg-triton-500/10 dark:bg-triton-500/10 border border-triton-500/20 px-2.5 py-1 rounded-lg">
                  ${t.id}
                </span>
                ${statusBadge}
              </div>
              <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">${t.filename}</span>
            </div>
            <h3 class="text-slate-950 dark:text-white font-extrabold text-base leading-snug line-clamp-2 mb-2.5">${escapeHtml(t.title)}</h3>
            <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed flex-1 line-clamp-4">${escapeHtml(t.overview)}</p>
            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-900/60 flex justify-end">
              <button onclick="openModal('${t.id}')" class="text-xs font-bold text-triton-600 dark:text-triton-400 hover:text-triton-700 dark:hover:text-triton-300 transition-colors inline-flex items-center gap-1 group">
                Selengkapnya / Lihat Detail
                <span class="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>
        `;
      });
      grid.innerHTML = html;
    }

    function filterTasks() {
      const q = document.getElementById('search').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.task-card');
      let visibleCount = 0;
      
      cards.forEach(card => {
        const id = card.getAttribute('data-id');
        const title = card.getAttribute('data-title');
        const overview = card.getAttribute('data-overview');
        const completed = card.getAttribute('data-completed') === 'true';
        
        // Match Search Query
        const matchesSearch = !q || id.includes(q) || title.includes(q) || overview.includes(q);
        
        // Match Status Filter
        let matchesStatus = true;
        if (currentStatusFilter === 'completed') {
          matchesStatus = completed;
        } else if (currentStatusFilter === 'incomplete') {
          matchesStatus = !completed;
        }
        
        if (matchesSearch && matchesStatus) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });
      
      const emptyState = document.getElementById('empty-state');
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }

    function openModal(taskId) {
      const data = window.TRITON_TASKS_DATA || [];
      const task = data.find(t => t.id === taskId);
      if (!task) return;

      const statusBadge = task.completed 
        ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Selesai
           </span>`
        : `<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Belum Selesai
           </span>`;

      document.getElementById('modal-task-id').textContent = task.id;
      
      const modalStatusContainer = document.getElementById('modal-status-container');
      if (modalStatusContainer) {
        modalStatusContainer.innerHTML = statusBadge;
      }
      
      document.getElementById('modal-task-title').textContent = task.title;
      document.getElementById('modal-task-overview').textContent = task.overview;
      document.getElementById('modal-task-filename').textContent = task.filename;
      
      // Load raw specification text (escape HTML to prevent rendering bugs)
      document.getElementById('modal-task-markdown').textContent = task.markdown;

      // Show modal
      const modal = document.getElementById('task-modal');
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeModal() {
      const modal = document.getElementById('task-modal');
      modal.classList.add('hidden');
      document.body.style.overflow = ''; // Restore scroll
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Run initialization
    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
"""

with open(html_file, "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML template output completed successfully.")
