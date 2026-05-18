// ─── PROGRESS TRACKING ────────────────────────────────────────────────────────

const ALL_PAGES = ['overview', 'setup', 'flow', 'auth', 'database', 'api', 'frontend']

function initProgress() {
  const currentPage = document.body.dataset.page
  if (!currentPage) return

  // Mark current page as read
  const read = JSON.parse(localStorage.getItem('triton_docs_read') || '[]')
  if (!read.includes(currentPage)) {
    read.push(currentPage)
    localStorage.setItem('triton_docs_read', JSON.stringify(read))
  }

  // Update checkmarks
  ALL_PAGES.forEach(page => {
    const checkEl = document.getElementById('check-' + page)
    if (checkEl && read.includes(page)) {
      checkEl.textContent = '✓'
      checkEl.classList.add('done')
    }
    // Highlight active nav item
    const navItem = document.querySelector('[data-page="' + page + '"]')
    if (navItem && page === currentPage) navItem.classList.add('active')
  })

  // Update progress bar
  const pct = Math.round((read.length / ALL_PAGES.length) * 100)
  const bar = document.getElementById('progress-bar')
  const txt = document.getElementById('progress-text')
  if (bar) bar.style.width = pct + '%'
  if (txt) txt.textContent = pct + '%'
}

// ─── CHATBOT ──────────────────────────────────────────────────────────────────

let docsData = null
const dataPath = document.body.dataset.dataPath || '../data/content.json'
fetch(dataPath).then(r => r.json()).then(d => { docsData = d }).catch(() => {})

function toggleChatbot() {
  const el = document.getElementById('chatbot')
  if (!el) return
  const isOpen = el.style.display === 'flex'
  el.style.display = isOpen ? 'none' : 'flex'
  if (!isOpen) document.getElementById('chat-input')?.focus()
}

function askQuestion(q) {
  const input = document.getElementById('chat-input')
  if (input) input.value = q
  sendMessage()
}

function sendMessage() {
  const input = document.getElementById('chat-input')
  if (!input) return
  const q = input.value.trim()
  if (!q) return
  input.value = ''

  addMessage(q, 'user')

  // Typing indicator
  const typingEl = document.createElement('div')
  typingEl.className = 'bot-msg'
  typingEl.id = 'typing-indicator'
  typingEl.textContent = '...'
  document.getElementById('chat-messages')?.appendChild(typingEl)
  typingEl.scrollIntoView({ behavior: 'smooth' })

  setTimeout(() => {
    const indicator = document.getElementById('typing-indicator')
    if (indicator) indicator.remove()
    const answer = getAnswer(q)
    addMessage(answer, 'bot')
  }, 500)
}

function addMessage(text, type) {
  const messages = document.getElementById('chat-messages')
  if (!messages) return
  const el = document.createElement('div')
  el.className = type === 'user' ? 'user-msg' : 'bot-msg'
  el.innerHTML = text
  messages.appendChild(el)
  el.scrollIntoView({ behavior: 'smooth' })
}

function getAnswer(q) {
  if (!docsData) return 'Data sedang dimuat, coba lagi sebentar.'
  const lower = q.toLowerCase()

  // Search FAQ — exact keyword match
  for (const faq of docsData.faq) {
    const keywords = faq.q.toLowerCase().split(' ').filter(w => w.length > 3)
    const matchCount = keywords.filter(k => lower.includes(k)).length
    if (matchCount >= 2) return faq.a
  }

  // API endpoints
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('route')) {
    const apis = docsData.api.slice(0, 6)
      .map(a => `<b>${a.method}</b> <code>${a.path}</code> — ${a.description}`)
      .join('<br/>')
    return `Beberapa endpoint yang tersedia:<br/><br/>${apis}<br/><br/>
      Lihat semua di halaman <a href="api.html" style="color:#3B82F6;font-weight:600">API Endpoints →</a>`
  }

  // Database / table
  if (lower.includes('tabel') || lower.includes('database') || lower.includes(' db') || lower.includes('schema')) {
    const tables = docsData.database
      .map(s => `<b>${s.db}</b>: ${s.tables.map(t => `<code>${t.name}</code>`).join(', ')}`)
      .join('<br/>')
    return `Tabel per service:<br/><br/>${tables}<br/><br/>
      Detail kolom di <a href="database.html" style="color:#3B82F6;font-weight:600">Database Schema →</a>`
  }

  // Flow / role-specific
  if (lower.includes('flow') || lower.includes('alur')) {
    return `<b>Flow Admin:</b> Login → Dashboard → Kelola Guru/Siswa<br/>
      <b>Flow Guru:</b> Login → Buat Tryout → Tambah Soal → Publish → Rekap<br/>
      <b>Flow Siswa:</b> Login → Pilih Tryout → Kerjakan → Lihat Hasil<br/><br/>
      Detail di <a href="flow.html" style="color:#3B82F6;font-weight:600">User Flow →</a>`
  }

  // Role-specific flow
  if (lower.includes('admin')) {
    return docsData.flows.admin.map(s => `• ${s}`).join('<br/>') +
      `<br/><br/><a href="flow.html" style="color:#3B82F6;font-weight:600">Lihat diagram flow →</a>`
  }
  if (lower.includes('guru')) {
    return docsData.flows.guru.map(s => `• ${s}`).join('<br/>') +
      `<br/><br/><a href="flow.html" style="color:#3B82F6;font-weight:600">Lihat diagram flow →</a>`
  }
  if (lower.includes('siswa') || lower.includes('student')) {
    return docsData.flows.siswa.map(s => `• ${s}`).join('<br/>') +
      `<br/><br/><a href="flow.html" style="color:#3B82F6;font-weight:600">Lihat diagram flow →</a>`
  }

  // Pages
  if (lower.includes('halaman') || lower.includes('page') || lower.includes('route')) {
    const pages = docsData.pages.slice(0, 7)
      .map(p => `<b>${p.path}</b> [${p.role}] — ${p.description.slice(0, 60)}...`)
      .join('<br/>')
    return `Beberapa halaman yang ada:<br/><br/>${pages}<br/><br/>
      Detail di <a href="frontend.html" style="color:#3B82F6;font-weight:600">Frontend Pages →</a>`
  }

  // Stack/tech/setup/port
  if (lower.includes('stack') || lower.includes('teknologi') || lower.includes('tech')) {
    const s = docsData.project.stack
    return `Stack Triton Denpasar:<br/>
      • <b>Frontend:</b> ${s.frontend}<br/>
      • <b>Backend:</b> ${s.backend}<br/>
      • <b>Database:</b> ${s.database}<br/>
      • <b>Auth:</b> ${s.auth}<br/><br/>
      <a href="overview.html" style="color:#3B82F6;font-weight:600">Lihat Overview →</a>`
  }

  if (lower.includes('port')) {
    const p = docsData.project.stack.ports
    return `Port masing-masing service:<br/>
      • Frontend: <b>${p.frontend}</b><br/>
      • API Gateway: <b>${p.gateway}</b><br/>
      • Auth Service: <b>${p.auth_service}</b><br/>
      • User Service: <b>${p.user_service}</b><br/>
      • Soal Service: <b>${p.soal_service}</b><br/>
      • Jawaban Service: <b>${p.jawaban_service}</b>`
  }

  if (lower.includes('setup') || lower.includes('install') || lower.includes('jalankan') || lower.includes('run')) {
    return `Cara setup project:<br/>
      1. <code>docker compose up -d postgres redis</code><br/>
      2. Buat 4 database (db_auth, db_user, db_soal, db_jawaban)<br/>
      3. Jalankan schema migration tiap service<br/>
      4. <code>cd scripts && npm run seed</code><br/>
      5. <code>make dev</code> (jalankan semua service)<br/>
      6. <code>cd frontend && npm run dev</code><br/><br/>
      <a href="setup.html" style="color:#3B82F6;font-weight:600">Panduan Setup Lengkap →</a>`
  }

  if (lower.includes('akun') || lower.includes('password') || lower.includes('seed') || lower.includes('default')) {
    return docsData.seed_accounts
      .map(a => `• <b>${a.email}</b> / ${a.password} [${a.role}]`)
      .join('<br/>') +
      `<br/><br/><a href="setup.html" style="color:#3B82F6;font-weight:600">Lihat Setup →</a>`
  }

  if (lower.includes('auth') || lower.includes('session') || lower.includes('cookie') || lower.includes('login')) {
    const af = docsData.auth_flow
    return `Auth menggunakan <b>${af.type}</b>.<br/>
      Cookie: <code>${af.cookie_name}</code><br/><br/>
      Flow: ${af.gateway_flow.slice(0, 3).join(' → ')}<br/><br/>
      <a href="auth.html" style="color:#3B82F6;font-weight:600">Detail Auth Flow →</a>`
  }

  if (lower.includes('nilai') || lower.includes('score') || lower.includes('hitung')) {
    return `Nilai dihitung otomatis saat <code>POST /sesi/:sesiId/selesai</code>.<br/><br/>
      Formula: <b>Nilai = (total bobot benar / total bobot semua soal) × 100</b><br/><br/>
      Soal essay tidak dihitung otomatis — panduan tersedia untuk guru saja.`
  }

  if (lower.includes('komponen') || lower.includes('component')) {
    return docsData.components
      .map(c => `• <code>${c.file.split('/').pop()}</code> — ${c.description}`)
      .join('<br/>') +
      `<br/><br/><a href="frontend.html" style="color:#3B82F6;font-weight:600">Lihat Frontend Pages →</a>`
  }

  // Default fallback
  return `Maaf, saya belum punya jawaban spesifik untuk "<em>${q}</em>".<br/><br/>
    Coba cek halaman:<br/>
    • <a href="overview.html" style="color:#3B82F6">Overview & Stack</a><br/>
    • <a href="api.html" style="color:#3B82F6">API Endpoints</a><br/>
    • <a href="database.html" style="color:#3B82F6">Database Schema</a><br/>
    • <a href="flow.html" style="color:#3B82F6">User Flow</a><br/>
    • <a href="setup.html" style="color:#3B82F6">Setup</a>`
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[data-tabs]')
      if (!group) return
      const target = btn.dataset.tab
      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
      btn.classList.add('active')
      const panel = group.querySelector('[data-tab-panel="' + target + '"]')
      if (panel) panel.classList.add('active')
    })
  })
}

// ─── API FILTER ────────────────────────────────────────────────────────────────

function filterEndpoints(service) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  const activeBtn = document.querySelector('[data-filter="' + service + '"]')
  if (activeBtn) activeBtn.classList.add('active')

  document.querySelectorAll('.endpoint-card').forEach(card => {
    if (service === 'all' || card.dataset.service === service) {
      card.style.display = 'block'
    } else {
      card.style.display = 'none'
    }
  })
}

// ─── ENDPOINT EXPAND ──────────────────────────────────────────────────────────

function toggleEndpoint(id) {
  const body = document.getElementById('ep-body-' + id)
  if (!body) return
  body.classList.toggle('open')
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initProgress()
  initTabs()

  // Enter key on chat input
  const chatInput = document.getElementById('chat-input')
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage()
    })
  }
})
