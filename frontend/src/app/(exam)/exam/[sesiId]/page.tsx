'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Flag, AlertTriangle, Loader2, Send, ChevronLeft, ChevronRight, Save,
  Maximize2, ShieldAlert, Ban, Sigma, Eye, EyeOff, Wifi, WifiOff, RefreshCw, Timer, Check,
} from 'lucide-react'
import katex from 'katex'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, SesiTryout, Soal, SOAL_TIPE_LABELS, TryoutDetail } from '@/types'
import RenderHTML from '@/components/shared/RenderHTML'
import TritonLoader from '@/components/common/TritonLoader'
import { useLevelTheme } from '@/components/shared/LevelTheme'

interface SesiWithAnswers {
  sesi: SesiTryout
  answers: Record<string, { opsi_id: string | null; jawaban_teks: string | null }>
}

// ─── Offline-first answer backup (TRN-13) ──────────────────────────────────────
type LocalAnswer = {
  opsi_id: string | null
  jawaban_teks: string | null
  synced: boolean
  timestamp: number
}
type ExamBackup = Record<string, LocalAnswer> // keyed by soalId

function readBackup(key: string): ExamBackup {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}') as ExamBackup
  } catch {
    return {}
  }
}

function writeBackup(key: string, data: ExamBackup): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* storage quota / private mode — best effort */
  }
}

function countPending(backup: ExamBackup): number {
  return Object.values(backup).filter((a) => !a.synced).length
}

// Common equation templates offered in the student essay helper (TRN-09 Feature 3).
const FORMULA_TEMPLATES: { label: string; latex: string }[] = [
  { label: 'Pecahan',  latex: '\\frac{a}{b}' },
  { label: 'Pangkat',  latex: 'x^{2}' },
  { label: 'Akar',     latex: '\\sqrt{x}' },
  { label: 'Integral', latex: '\\int_{a}^{b}' },
  { label: 'Sigma',    latex: '\\sum_{i=1}^{n}' },
]

// Escape user text so it can be handed to RenderHTML safely; newlines → <br>
// so the live preview preserves the student's line breaks while KaTeX renders $…$.
function escapeForPreview(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

// Two-tone warning beep via the Web Audio API (TRN-20). No asset needed; the page
// already has user activation from the fullscreen start gate, so playback is allowed.
function playViolationSound(): void {
  if (typeof window === 'undefined') return
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    gain.gain.value = 0.12
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.setValueAtTime(620, t + 0.18)
    osc.start(t)
    osc.stop(t + 0.42)
    osc.onended = () => ctx.close()
  } catch {
    /* audio unavailable — fail silently */
  }
}

function fmtClock(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60)
  const s = Math.max(0, totalSeconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ExamPage() {
  const { sesiId } = useParams<{ sesiId: string }>()
  const router = useRouter()
  const { theme } = useLevelTheme()

  const [sesi, setSesi] = useState<SesiTryout | null>(null)
  const [tryout, setTryout] = useState<TryoutDetail | null>(null)
  const [answers, setAnswers] = useState<Record<string, { opsi_id?: string | null; jawaban_teks?: string | null }>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingIndicator, setSavingIndicator] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const submittedRef = useRef(false)

  // ─── Anti-cheating proctoring (TRN-07) ───────────────────
  const MAX_WARNINGS = 3
  const [examStarted, setExamStarted] = useState(false)
  const [warnings, setWarnings] = useState(0)
  const [fsExited, setFsExited] = useState(false)
  const [disqualified, setDisqualified] = useState(false)
  const examStartedRef = useRef(false)
  const disqualifiedRef = useRef(false)
  const warningsRef = useRef(0)
  const lastViolationRef = useRef(0)
  const doSubmitRef = useRef<(opts?: { disqualified?: boolean }) => void>(() => {})

  // ─── Essay equation helper (TRN-09 Feature 3) ────────────
  const essayRef = useRef<HTMLTextAreaElement>(null)
  const [formulaOpen, setFormulaOpen] = useState(false)
  const [customLatex, setCustomLatex] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // ─── Violation modal + per-question timers (TRN-20) ──────
  const [violation, setViolation] = useState<{ msg: string; count: number } | null>(null)
  const [qRemaining, setQRemaining] = useState<Record<string, number>>({})
  const [lockedQ, setLockedQ] = useState<Set<string>>(new Set())

  // ─── Offline-first auto-save + sync (TRN-13) ─────────────
  const backupKey = `triton-exam-backup-${sesiId}`
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  // 'idle' = normal; 'syncing' = flushing before submit; 'error' = sync/submit failed.
  const [submitState, setSubmitState] = useState<'idle' | 'syncing' | 'error'>('idle')

  // Write an answer to the local backup immediately (primary, offline-safe store).
  const writeLocalAnswer = useCallback(
    (soalId: string, payload: { opsi_id?: string | null; jawaban_teks?: string | null }, synced: boolean) => {
      const backup = readBackup(backupKey)
      backup[soalId] = {
        opsi_id: payload.opsi_id ?? null,
        jawaban_teks: payload.jawaban_teks ?? null,
        synced,
        timestamp: Date.now(),
      }
      writeBackup(backupKey, backup)
      setPendingCount(countPending(backup))
    },
    [backupKey]
  )

  const markSynced = useCallback((soalId: string) => {
    const backup = readBackup(backupKey)
    if (backup[soalId]) {
      backup[soalId].synced = true
      writeBackup(backupKey, backup)
      setPendingCount(countPending(backup))
    }
  }, [backupKey])

  // Push every locally-unsynced answer to the server. Returns true if all succeeded.
  const syncPending = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false
    const backup = readBackup(backupKey)
    const pending = Object.entries(backup).filter(([, a]) => !a.synced)
    if (pending.length === 0) return true
    let allOk = true
    for (const [soalId, a] of pending) {
      try {
        await api.post(`/sesi/${sesiId}/jawab`, {
          soal_id: soalId,
          opsi_id: a.opsi_id ?? undefined,
          jawaban_teks: a.jawaban_teks ?? undefined,
        })
        markSynced(soalId)
      } catch {
        allOk = false
      }
    }
    return allOk
  }, [sesiId, backupKey, markSynced])

  // ─── Load sesi + tryout ──────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const sRes = await api.get<ApiResponse<SesiWithAnswers>>(`/sesi/${sesiId}`)
        if (cancelled) return
        const s = sRes.data.data
        if (!s) throw new Error('Sesi tidak ditemukan')

        if (s.sesi.status === 'selesai') {
          toast.info('Tryout sudah selesai.')
          router.replace(`/siswa/hasil/${sesiId}`)
          return
        }

        setSesi(s.sesi)

        // Merge backend answers with any unsynced local backup (offline recovery).
        const merged: Record<string, { opsi_id?: string | null; jawaban_teks?: string | null }> = { ...(s.answers ?? {}) }
        const backup = readBackup(backupKey)
        for (const [soalId, la] of Object.entries(backup)) {
          // Unsynced local edits are the student's latest intent (newer / not on server yet).
          if (!la.synced) merged[soalId] = { opsi_id: la.opsi_id, jawaban_teks: la.jawaban_teks }
        }
        setAnswers(merged)
        setPendingCount(countPending(backup))

        const tRes = await api.get<ApiResponse<TryoutDetail>>(`/tryouts/${s.sesi.tryout_id}`)
        if (cancelled) return
        setTryout(tRes.data.data ?? null)

        // Restore flagged from sessionStorage
        const flaggedKey = `triton-flagged-${sesiId}`
        const savedFlagged = typeof window !== 'undefined' ? window.sessionStorage.getItem(flaggedKey) : null
        if (savedFlagged) {
          try { setFlagged(new Set(JSON.parse(savedFlagged))) } catch { /* ignore */ }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Gagal memuat sesi tryout.'))
          router.replace('/siswa/tryout')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [sesiId, router, backupKey])

  // ─── Persist flagged ─────────────────────────────────────
  useEffect(() => {
    if (sesiId && typeof window !== 'undefined') {
      window.sessionStorage.setItem(`triton-flagged-${sesiId}`, JSON.stringify(Array.from(flagged)))
    }
  }, [flagged, sesiId])

  // ─── Network status + background sync (TRN-13) ───────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)
    const onOnline = () => { setIsOnline(true); syncPending() }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    // Flush leftovers shortly after mount, then poll every 8s while online.
    if (navigator.onLine) syncPending()
    const id = setInterval(() => { if (navigator.onLine) syncPending() }, 8000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(id)
    }
  }, [syncPending])

  // ─── Timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!sesi || !tryout) return
    const start = new Date(sesi.mulai_at).getTime()
    const deadline = start + tryout.durasi_menit * 60_000

    function tick() {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0 && !submittedRef.current) {
        submittedRef.current = true
        autoSubmit()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi, tryout])

  // Apply this session's frozen randomized layout (TRN-04): question_order
  // reorders the questions, option_order reorders each question's options.
  const soalList: Soal[] = useMemo(() => {
    const all = tryout?.soal ?? []
    if (!sesi || all.length === 0) return all

    const byId = new Map(all.map((s) => [s.id, s]))
    let ordered = sesi.question_order?.length
      ? (sesi.question_order.map((id) => byId.get(id)).filter(Boolean) as Soal[])
      : all
    if (ordered.length !== all.length) {
      const seen = new Set(ordered.map((s) => s.id))
      ordered = [...ordered, ...all.filter((s) => !seen.has(s.id))]
    }

    const optMap = sesi.option_order ?? {}
    return ordered.map((s) => {
      const order = optMap[s.id]
      if (!order || !s.opsi) return s
      const byHuruf = new Map(s.opsi.map((o) => [o.huruf, o]))
      const reordered = order.map((h) => byHuruf.get(h)).filter(Boolean) as NonNullable<Soal['opsi']>
      const seen = new Set(reordered.map((o) => o.huruf))
      const extra = s.opsi.filter((o) => !seen.has(o.huruf))
      return { ...s, opsi: [...reordered, ...extra] }
    })
  }, [tryout, sesi])

  const currentSoal: Soal | undefined = soalList[currentIdx]
  const total = soalList.length
  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => !!a.opsi_id || (a.jawaban_teks && a.jawaban_teks.trim() !== '')).length,
    [answers]
  )
  const unanswered = total - answeredCount

  // ─── Per-question timer engine (TRN-20) ──────────────────
  const perQuestionEnabled = !!tryout?.is_per_question_timer_enabled

  // Seed each question's remaining time once the soal list is available.
  useEffect(() => {
    if (!perQuestionEnabled || soalList.length === 0) return
    setQRemaining((prev) => {
      const next = { ...prev }
      for (const s of soalList) {
        if (next[s.id] === undefined && s.time_limit_seconds && s.time_limit_seconds > 0) {
          next[s.id] = s.time_limit_seconds
        }
      }
      return next
    })
  }, [perQuestionEnabled, soalList])

  // Count down the ACTIVE question (pauses when navigating away; resumes on return).
  useEffect(() => {
    if (!perQuestionEnabled || !currentSoal) return
    const id = currentSoal.id
    const limit = currentSoal.time_limit_seconds
    if (!limit || limit <= 0 || lockedQ.has(id)) return
    const interval = setInterval(() => {
      setQRemaining((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? limit) - 1) }))
    }, 1000)
    return () => clearInterval(interval)
  }, [perQuestionEnabled, currentSoal, lockedQ])

  // Lock + auto-advance the moment the active question's time hits 0.
  useEffect(() => {
    if (!perQuestionEnabled || !currentSoal) return
    const id = currentSoal.id
    const limit = currentSoal.time_limit_seconds
    if (!limit || limit <= 0 || lockedQ.has(id)) return
    if ((qRemaining[id] ?? limit) <= 0) {
      setLockedQ((s) => { const ns = new Set(s); ns.add(id); return ns })
      toast.info('Waktu untuk soal ini habis.')
      setCurrentIdx((i) => (i < total - 1 ? i + 1 : i))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perQuestionEnabled, currentSoal, qRemaining, lockedQ, total])

  // ─── Save one answer ─────────────────────────────────────
  const saveAnswer = useCallback(async (soalId: string, payload: { opsi_id?: string; jawaban_teks?: string }) => {
    // 1. Primary backup: write to localStorage immediately (unsynced).
    writeLocalAnswer(soalId, payload, false)
    setSavingIndicator('saving')

    // 2. Offline → keep local only; the background sync will upload later.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSavingIndicator('saved')
      setTimeout(() => setSavingIndicator('idle'), 1200)
      return
    }

    // 3. Online → push to the server; mark synced on success, stay silent on failure.
    try {
      await api.post(`/sesi/${sesiId}/jawab`, { soal_id: soalId, ...payload })
      markSynced(soalId)
      setSavingIndicator('saved')
      setTimeout(() => setSavingIndicator('idle'), 1200)
    } catch {
      // Network error/timeout — answer is safe locally; no disruptive popup.
      setSavingIndicator('saved')
      setTimeout(() => setSavingIndicator('idle'), 1200)
    }
  }, [sesiId, writeLocalAnswer, markSynced])

  function pickOpsi(opsiId: string) {
    if (!currentSoal || lockedQ.has(currentSoal.id)) return // TRN-20: locked when its timer expired
    setAnswers((prev) => ({ ...prev, [currentSoal.id]: { ...prev[currentSoal.id], opsi_id: opsiId, jawaban_teks: null } }))
    saveAnswer(currentSoal.id, { opsi_id: opsiId })
  }

  function setEssay(text: string) {
    if (!currentSoal || lockedQ.has(currentSoal.id)) return // TRN-20: locked when its timer expired
    setAnswers((prev) => ({ ...prev, [currentSoal.id]: { ...prev[currentSoal.id], jawaban_teks: text, opsi_id: null } }))
  }

  async function blurEssay() {
    if (!currentSoal) return
    const text = answers[currentSoal.id]?.jawaban_teks ?? ''
    if (text.trim()) {
      await saveAnswer(currentSoal.id, { jawaban_teks: text })
    }
  }

  // ─── TRN-22: AKM answer widgets ──────────────────────────────
  // New types persist their answer in jawaban_teks (the backend grader reads it):
  //   pg_kompleks  → JSON array of selected opsi ids
  //   menjodohkan  → JSON array; chosen[i] is the right-column text picked for left[i]
  //   isian_singkat→ plain text (reuses setEssay/blurEssay)
  function parseAnswerArray(soalId: string): string[] {
    try {
      const v = JSON.parse(answers[soalId]?.jawaban_teks ?? '[]')
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  }

  function toggleKompleks(opsiId: string) {
    if (!currentSoal || lockedQ.has(currentSoal.id)) return
    const cur = parseAnswerArray(currentSoal.id)
    const next = cur.includes(opsiId) ? cur.filter((x) => x !== opsiId) : [...cur, opsiId]
    const teks = next.length ? JSON.stringify(next) : '' // empty → counts as unanswered
    setAnswers((prev) => ({ ...prev, [currentSoal.id]: { ...prev[currentSoal.id], jawaban_teks: teks, opsi_id: null } }))
    saveAnswer(currentSoal.id, { jawaban_teks: teks })
  }

  function setMatch(leftIndex: number, rightValue: string) {
    if (!currentSoal || lockedQ.has(currentSoal.id)) return
    const left = currentSoal.matching_pairs?.left ?? []
    const chosen = left.map((_, i) => parseAnswerArray(currentSoal.id)[i] ?? '')
    chosen[leftIndex] = rightValue
    const teks = chosen.some((c) => c && c.trim() !== '') ? JSON.stringify(chosen) : ''
    setAnswers((prev) => ({ ...prev, [currentSoal.id]: { ...prev[currentSoal.id], jawaban_teks: teks, opsi_id: null } }))
    saveAnswer(currentSoal.id, { jawaban_teks: teks })
  }

  // Live KaTeX preview for the custom-LaTeX box in the essay helper.
  const customPreview = useMemo(() => {
    if (!customLatex.trim()) return { html: '', error: false }
    try {
      return { html: katex.renderToString(customLatex, { throwOnError: true, displayMode: false, strict: 'ignore' }), error: false }
    } catch {
      return { html: '', error: true }
    }
  }, [customLatex])

  // Insert a formula at the textarea cursor, wrapped in single $…$ delimiters.
  function insertFormula(latex: string) {
    if (!currentSoal || !latex.trim()) return
    const wrapped = `$${latex.trim()}$`
    const ta = essayRef.current
    const current = answers[currentSoal.id]?.jawaban_teks ?? ''
    let next: string
    let caret: number
    if (ta && typeof ta.selectionStart === 'number') {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      next = current.slice(0, start) + wrapped + current.slice(end)
      caret = start + wrapped.length
    } else {
      next = current + wrapped
      caret = next.length
    }
    setEssay(next)
    saveAnswer(currentSoal.id, { jawaban_teks: next })
    requestAnimationFrame(() => {
      const el = essayRef.current
      if (el) { el.focus(); el.setSelectionRange(caret, caret) }
    })
  }

  function toggleFlag(soalId: string) {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(soalId)) next.delete(soalId)
      else next.add(soalId)
      return next
    })
  }

  // ─── Submit ──────────────────────────────────────────────
  async function autoSubmit() {
    toast.warning('Waktu habis! Jawaban dikumpulkan otomatis.', { duration: 5000 })
    await doSubmit()
  }

  async function doSubmit(opts?: { disqualified?: boolean }) {
    setSubmitting(true)

    // Submission guard: flush unsynced local answers before finishing. A forced
    // disqualification submits best-effort and skips the blocking sync.
    if (!opts?.disqualified && countPending(readBackup(backupKey)) > 0) {
      setSubmitState('syncing')
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        ok = await syncPending()
        if (!ok && attempt < 2) await new Promise((r) => setTimeout(r, 1500))
      }
      if (!ok) { setSubmitState('error'); setSubmitting(false); return }
      setSubmitState('idle')
    }

    submittedRef.current = true
    try {
      await api.post<ApiResponse<unknown>>(
        `/sesi/${sesiId}/selesai`,
        opts?.disqualified ? { disqualified: true } : undefined
      )
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(backupKey)
        window.sessionStorage.removeItem(`triton-flagged-${sesiId}`)
      }
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      setSubmitState('idle')
      if (opts?.disqualified) {
        setDisqualified(true)
        disqualifiedRef.current = true
      } else {
        toast.success('Jawaban berhasil dikumpulkan!')
        router.replace(`/siswa/hasil/${sesiId}`)
      }
    } catch (err) {
      submittedRef.current = false
      setSubmitting(false)
      if (opts?.disqualified) {
        toast.error(getErrorMessage(err, 'Gagal mengumpulkan jawaban. Silakan coba lagi.'))
      } else {
        setSubmitState('error') // retryable via the sync/submit overlay
      }
    }
  }

  // ─── Anti-cheating proctoring ────────────────────────────
  // Keep a live ref to doSubmit so the once-attached listeners call the latest.
  useEffect(() => { doSubmitRef.current = doSubmit })

  async function enterFullscreen() {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch { /* fullscreen may be blocked — degrade gracefully */ }
    examStartedRef.current = true
    setExamStarted(true)
    setFsExited(false)
  }

  useEffect(() => {
    function registerViolation(msg: string) {
      if (!examStartedRef.current || submittedRef.current || disqualifiedRef.current) return
      const now = Date.now()
      if (now - lastViolationRef.current < 1000) return // de-dupe blur+visibility for one switch
      lastViolationRef.current = now
      warningsRef.current += 1
      const n = warningsRef.current
      setWarnings(n)
      if (n > MAX_WARNINGS) {
        disqualifiedRef.current = true
        playViolationSound()
        doSubmitRef.current({ disqualified: true })
      } else {
        // Large centered warning modal + audio alert (TRN-20).
        playViolationSound()
        setViolation({ msg, count: n })
      }
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') registerViolation('Anda dilarang berpindah tab selama ujian!')
    }
    function onBlur() { registerViolation('Layar ujian kehilangan fokus!') }
    function onFsChange() {
      if (!document.fullscreenElement) {
        if (examStartedRef.current && !submittedRef.current && !disqualifiedRef.current) setFsExited(true)
      } else {
        setFsExited(false)
      }
    }
    const prevent = (e: Event) => e.preventDefault()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('copy', prevent)
    document.addEventListener('cut', prevent)
    document.addEventListener('paste', prevent)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('copy', prevent)
      document.removeEventListener('cut', prevent)
      document.removeEventListener('paste', prevent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return <TritonLoader />
  }

  if (!tryout || !currentSoal) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Soal tidak tersedia untuk tryout ini.
      </div>
    )
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isRed = timeLeft <= 600 && timeLeft > 0
  const isCritical = timeLeft <= 60 && timeLeft > 0

  // Per-question timer state for the active question (TRN-20).
  const qLimit = currentSoal.time_limit_seconds ?? 0
  const showQTimer = perQuestionEnabled && qLimit > 0
  const currentLocked = showQTimer && lockedQ.has(currentSoal.id)
  const qLeft = qRemaining[currentSoal.id] ?? qLimit

  return (
    <div className="min-h-screen bg-slate-50 select-none">

      {/* ─── HEADER (fixed) ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-24 h-8 relative shrink-0">
              <Image src="/logo.png" alt="Triton Denpasar" fill className="object-contain" />
            </div>
            <div className="w-px h-6 bg-slate-200 hidden md:block" />
            <p className="font-semibold text-slate-800 text-sm truncate hidden md:block max-w-[260px]">
              {tryout.nama_tryout}
            </p>
          </div>

          <div className={`px-5 py-2 rounded-full font-mono font-bold text-base md:text-lg tabular-nums transition-colors ${
            isRed ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'
          } ${isCritical ? 'animate-pulse' : ''}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div className="flex items-center gap-3">
            {/* Network status (TRN-13) */}
            {isOnline ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <Wifi size={13} /> Terkoneksi
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                    · <Loader2 size={10} className="animate-spin" /> {pendingCount}
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-2.5 py-1.5">
                <WifiOff size={13} /> <span className="hidden sm:inline">Offline · Tersimpan Lokal</span><span className="sm:hidden">Offline</span>
              </span>
            )}
            <span className="hidden sm:block text-sm text-slate-500 tabular-nums">
              <strong className="text-slate-900">{answeredCount}</strong>/{total} dijawab
            </span>
            <button
              onClick={() => setShowSubmit(true)}
              className={`${theme.button} rounded-xl px-4 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1.5 shadow-sm`}
            >
              <Send size={14} />
              Kumpulkan
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">

        {/* ─── Navigation Panel ─── */}
        <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-30">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 text-sm">Navigasi Soal</h2>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-triton-blue-500 transition-all duration-300"
                style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{answeredCount}/{total} dijawab</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {soalList.map((s, idx) => {
                const ans = answers[s.id]
                const isAnswered = !!ans?.opsi_id || !!(ans?.jawaban_teks && ans.jawaban_teks.trim())
                const isCurrent = idx === currentIdx
                const isFlag = flagged.has(s.id)
                let cls = 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                if (isAnswered) cls = 'bg-triton-blue-500 text-white shadow-sm hover:bg-triton-blue-600'
                if (isCurrent) cls += ' ring-2 ring-offset-2 ring-triton-blue-500'
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`relative w-10 h-10 rounded-xl text-sm font-bold transition-all ${cls}`}
                  >
                    {idx + 1}
                    {isFlag && (
                      <Flag size={9} className="absolute top-0.5 right-0.5 text-orange-400 fill-orange-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
              Belum dijawab
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-3 h-3 rounded bg-triton-blue-500" />
              Sudah dijawab
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Flag size={11} className="text-orange-400 fill-orange-400" />
              Ditandai ragu-ragu
            </div>
          </div>
        </aside>

        {/* ─── Main exam content ─── */}
        <main className="flex-1 lg:ml-64 pb-24 px-4 md:px-8">
          <div className="max-w-3xl mx-auto py-8">

            <article className="bg-white rounded-2xl border border-slate-100 shadow-sm">

              <header className="px-6 md:px-8 pt-7 pb-4 border-b border-slate-50 flex flex-wrap items-center gap-3">
                <span className="bg-triton-blue-500 text-white rounded-full px-3.5 py-1.5 text-xs font-bold">
                  Soal {currentIdx + 1}
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-md px-2 py-1">
                  {SOAL_TIPE_LABELS[currentSoal.tipe] ?? 'Soal'}
                </span>
                <span className="text-xs text-slate-400">Bobot: {currentSoal.bobot}</span>
                {showQTimer && (
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold tabular-nums ${
                    currentLocked
                      ? 'bg-red-100 text-red-600'
                      : qLeft <= 10
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Timer size={12} /> {currentLocked ? 'Waktu Habis' : fmtClock(qLeft)}
                  </span>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => toggleFlag(currentSoal.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    flagged.has(currentSoal.id)
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Flag size={12} className={flagged.has(currentSoal.id) ? 'fill-orange-500' : ''} />
                  {flagged.has(currentSoal.id) ? 'Ditandai' : 'Tandai Ragu'}
                </button>
              </header>

              <div className="px-6 md:px-8 py-6">
                <RenderHTML
                  html={currentSoal.pertanyaan_html || currentSoal.pertanyaan}
                  className="text-base leading-relaxed text-slate-800"
                />
              </div>

              {/* Answer section */}
              <div className="px-6 md:px-8 pb-8">
                {currentLocked && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
                    <Timer size={15} /> Waktu untuk soal ini telah habis — jawaban dikunci.
                  </div>
                )}
                {currentSoal.tipe === 'pilihan_ganda' ? (
                  <div className="space-y-3">
                    {(currentSoal.opsi ?? []).map((opsi, optIndex) => {
                      const selected = answers[currentSoal.id]?.opsi_id === opsi.id
                      // Display position letter (A, B, …) so shuffled options read cleanly.
                      const displayHuruf = String.fromCharCode(65 + optIndex)
                      return (
                        <button
                          key={opsi.id}
                          onClick={() => pickOpsi(opsi.id)}
                          disabled={currentLocked}
                          className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
                            selected
                              ? 'border-triton-blue-500 bg-triton-blue-50'
                              : 'border-slate-200 bg-white hover:border-triton-blue-300 hover:bg-triton-blue-50/40'
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 transition-all ${
                            selected
                              ? 'bg-triton-blue-500 text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-triton-blue-100 group-hover:text-triton-blue-700'
                          }`}>
                            {displayHuruf}
                          </span>
                          <div className="flex-1">
                            <RenderHTML
                              html={opsi.teks_html || opsi.teks}
                              className="text-sm text-slate-700 leading-relaxed"
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : currentSoal.tipe === 'pg_kompleks' ? (
                  /* ─── Pilihan Ganda Kompleks: multi-select checkboxes ─── */
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 mb-1">Pilih satu atau lebih jawaban yang benar.</p>
                    {(() => {
                      const selectedIds = parseAnswerArray(currentSoal.id)
                      return (currentSoal.opsi ?? []).map((opsi, optIndex) => {
                        const selected = selectedIds.includes(opsi.id)
                        const displayHuruf = String.fromCharCode(65 + optIndex)
                        return (
                          <button
                            key={opsi.id}
                            onClick={() => toggleKompleks(opsi.id)}
                            disabled={currentLocked}
                            className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
                              selected
                                ? 'border-triton-blue-500 bg-triton-blue-50'
                                : 'border-slate-200 bg-white hover:border-triton-blue-300 hover:bg-triton-blue-50/40'
                            }`}
                          >
                            <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 transition-all ${
                              selected
                                ? 'bg-triton-blue-500 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-triton-blue-100 group-hover:text-triton-blue-700'
                            }`}>
                              {selected ? <Check size={16} /> : displayHuruf}
                            </span>
                            <div className="flex-1">
                              <RenderHTML
                                html={opsi.teks_html || opsi.teks}
                                className="text-sm text-slate-700 leading-relaxed"
                              />
                            </div>
                          </button>
                        )
                      })
                    })()}
                  </div>
                ) : currentSoal.tipe === 'isian_singkat' ? (
                  /* ─── Isian Singkat: single short-answer input ─── */
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Jawaban Anda:</label>
                    <input
                      type="text"
                      value={answers[currentSoal.id]?.jawaban_teks ?? ''}
                      onChange={(e) => setEssay(e.target.value)}
                      onBlur={blurEssay}
                      disabled={currentLocked}
                      placeholder="Ketik jawaban singkat Anda..."
                      className="w-full border-2 border-slate-200 rounded-xl p-4 text-slate-800 text-base outline-none focus:border-triton-blue-500 focus:ring-4 focus:ring-triton-blue-500/10 transition-all disabled:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <p className="mt-2 text-xs text-slate-400">Periksa ejaan Anda. Huruf besar/kecil tidak berpengaruh.</p>
                  </div>
                ) : currentSoal.tipe === 'menjodohkan' ? (
                  /* ─── Menjodohkan: pair each left item with a right item ─── */
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 mb-1">Pasangkan setiap pernyataan di kiri dengan jawaban yang tepat.</p>
                    {(() => {
                      const left = currentSoal.matching_pairs?.left ?? []
                      const right = currentSoal.matching_pairs?.right ?? []
                      const chosen = parseAnswerArray(currentSoal.id)
                      return left.map((leftItem, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border-2 border-slate-200 bg-white">
                          <div className="flex-1 flex items-start gap-3">
                            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-700 leading-relaxed">{leftItem}</span>
                          </div>
                          <span className="hidden sm:block text-slate-300">→</span>
                          <select
                            value={chosen[i] ?? ''}
                            onChange={(e) => setMatch(i, e.target.value)}
                            disabled={currentLocked}
                            className="sm:w-56 border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-triton-blue-500 focus:ring-2 focus:ring-triton-blue-500/10 transition-all disabled:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            <option value="">— Pilih —</option>
                            {right.map((r, ri) => (
                              <option key={ri} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      ))
                    })()}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Jawaban Anda:</label>

                    {/* ─── Equation helper toolbar ─── */}
                    <div className="relative mb-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormulaOpen((o) => !o)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <Sigma size={13} /> Sisipkan Formula
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Tulis matematika dalam format <code className="bg-slate-100 px-1 rounded">$rumus$</code>
                      </span>

                      {formulaOpen && (
                        <>
                          {/* click-away backdrop */}
                          <div className="fixed inset-0 z-[60]" onClick={() => setFormulaOpen(false)} />
                          <div className="absolute top-full left-0 mt-1 z-[70] w-72 rounded-xl border border-slate-200 bg-white shadow-xl p-3">
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Template Umum</p>
                            <div className="flex flex-wrap gap-1.5">
                              {FORMULA_TEMPLATES.map((t) => (
                                <button
                                  key={t.label}
                                  type="button"
                                  onClick={() => { insertFormula(t.latex); setFormulaOpen(false) }}
                                  className="rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 px-2.5 py-1.5 text-xs font-medium transition-colors"
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 border-t border-slate-100 pt-3">
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">LaTeX Custom</p>
                              <input
                                value={customLatex}
                                onChange={(e) => setCustomLatex(e.target.value)}
                                placeholder="Contoh: \frac{a}{b}"
                                className="w-full font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                              />
                              <div className={`mt-2 min-h-[40px] rounded-lg border p-2 flex items-center justify-center text-center ${
                                customPreview.error ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'
                              }`}>
                                {!customLatex.trim() ? (
                                  <span className="text-[11px] italic text-slate-400">Preview muncul di sini</span>
                                ) : customPreview.error ? (
                                  <span className="text-[11px] text-red-500">Sintaks tidak valid</span>
                                ) : (
                                  <span dangerouslySetInnerHTML={{ __html: customPreview.html }} />
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={!customLatex.trim() || customPreview.error}
                                onClick={() => { insertFormula(customLatex); setCustomLatex(''); setFormulaOpen(false) }}
                                className="mt-2 w-full rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 transition-colors"
                              >
                                Sisipkan
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <textarea
                      ref={essayRef}
                      value={answers[currentSoal.id]?.jawaban_teks ?? ''}
                      onChange={(e) => setEssay(e.target.value)}
                      onBlur={blurEssay}
                      disabled={currentLocked}
                      placeholder="Tuliskan jawaban lengkap Anda di sini..."
                      rows={8}
                      className="w-full min-h-[200px] border-2 border-slate-200 rounded-xl p-4 text-slate-800 text-base leading-relaxed resize-y outline-none focus:border-triton-blue-500 focus:ring-4 focus:ring-triton-blue-500/10 transition-all disabled:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400 tabular-nums">
                        {(answers[currentSoal.id]?.jawaban_teks ?? '').trim().split(/\s+/).filter(Boolean).length} kata
                      </span>
                      <span className={`text-xs inline-flex items-center gap-1 transition-opacity ${
                        savingIndicator === 'idle' ? 'opacity-0' : 'opacity-100 text-slate-500'
                      }`}>
                        {savingIndicator === 'saving' ? (
                          <><Loader2 size={11} className="animate-spin" /> Menyimpan...</>
                        ) : (
                          <><Save size={11} className="text-green-500" /> Tersimpan</>
                        )}
                      </span>
                    </div>

                    {/* ─── Answer preview (renders $…$ via KaTeX) ─── */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowPreview((p) => !p)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-triton-blue-600 hover:text-triton-blue-700 transition-colors"
                      >
                        {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showPreview ? 'Sembunyikan Pratinjau' : 'Pratinjau Jawaban'}
                      </button>
                      {showPreview && (
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pratinjau Jawaban</p>
                          {(answers[currentSoal.id]?.jawaban_teks ?? '').trim() ? (
                            <RenderHTML
                              html={escapeForPreview(answers[currentSoal.id]?.jawaban_teks ?? '')}
                              className="text-sm text-slate-800 leading-relaxed"
                            />
                          ) : (
                            <span className="text-sm italic text-slate-400">Belum ada jawaban untuk ditampilkan.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>

          </div>
        </main>
      </div>

      {/* ─── Bottom Navigation (fixed) ─── */}
      <footer className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-100 shadow-lg z-40">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>

          <span className="text-sm font-semibold text-slate-600 tabular-nums">
            {currentIdx + 1} / {total}
          </span>

          {currentIdx < total - 1 ? (
            <button
              onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
              className="inline-flex items-center gap-1.5 bg-triton-blue-500 hover:bg-triton-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors shadow-sm"
            >
              Berikutnya
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmit(true)}
              className={`inline-flex items-center gap-1.5 ${theme.button} rounded-xl px-5 py-2.5 text-sm font-bold transition-colors shadow-sm`}
            >
              Selesai & Kumpulkan
              <Send size={14} />
            </button>
          )}
        </div>
      </footer>

      {/* ─── Submit Dialog ─── */}
      {showSubmit && (
        <SubmitDialog
          total={total}
          answered={answeredCount}
          unanswered={unanswered}
          flagged={flagged.size}
          onCancel={() => setShowSubmit(false)}
          onConfirm={doSubmit}
          submitting={submitting}
          accentClass={theme.button}
        />
      )}

      {/* Small hidden link for routing back to dashboard */}
      <Link href="/siswa/dashboard" className="sr-only">dashboard</Link>

      {/* ─── Anti-cheat: fullscreen start gate ─── */}
      {!examStarted && !disqualified && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Maximize2 size={26} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Mode Ujian Aman</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Untuk memulai ujian, Anda harus masuk ke mode layar penuh. Berpindah tab,
              keluar dari layar penuh, atau menyalin teks akan tercatat sebagai pelanggaran.
            </p>
            <button
              onClick={enterFullscreen}
              className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-3 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Maximize2 size={16} /> Masuk Layar Penuh &amp; Mulai
            </button>
          </div>
        </div>
      )}

      {/* ─── Anti-cheat: fullscreen-exit blocking overlay ─── */}
      {examStarted && fsExited && !disqualified && (
        <div className="fixed inset-0 z-[300] bg-red-900/95 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <ShieldAlert size={56} className="mx-auto text-red-300 mb-4" />
            <h2 className="text-2xl font-black text-white">Anda Keluar dari Layar Penuh</h2>
            <p className="text-red-100 mt-2 text-sm leading-relaxed">
              Ujian terkunci. Kembali ke mode layar penuh untuk melanjutkan. Pelanggaran berulang akan menghentikan ujian.
            </p>
            <p className="text-red-200 text-xs mt-3 font-semibold">Peringatan fokus: {warnings}/{MAX_WARNINGS}</p>
            <button
              onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
              className="mt-6 bg-white text-red-700 font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2 hover:bg-red-50 transition-colors"
            >
              <Maximize2 size={16} /> Kembali ke Layar Penuh
            </button>
          </div>
        </div>
      )}

      {/* ─── Anti-cheat: disqualified notice ─── */}
      {disqualified && (
        <div className="fixed inset-0 z-[300] bg-slate-900/[0.97] flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <Ban size={56} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-2xl font-black text-white">Ujian Dihentikan</h2>
            <p className="text-slate-300 mt-2 text-sm leading-relaxed">
              Anda melebihi batas pelanggaran proktor ({MAX_WARNINGS} peringatan). Jawaban Anda telah
              dikumpulkan otomatis dan sesi ini dikunci.
            </p>
            <button
              onClick={() => router.replace(`/siswa/hasil/${sesiId}`)}
              className="mt-6 bg-white text-slate-900 font-bold rounded-xl px-6 py-3 hover:bg-slate-100 transition-colors"
            >
              Lihat Hasil
            </button>
          </div>
        </div>
      )}

      {/* ─── Proctor violation warning (TRN-20) ─── */}
      {violation && !disqualified && (
        <div className="fixed inset-0 z-[200] bg-red-900/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
              <ShieldAlert size={32} />
            </div>
            <h2 className="mt-4 text-2xl font-black text-red-600">PERINGATAN PELANGGARAN!</h2>
            <p className="mt-2 text-sm text-slate-600">{violation.msg}</p>
            <p className="mt-3 inline-block rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
              Peringatan {violation.count} / {MAX_WARNINGS}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Pelanggaran berikutnya dapat menghentikan ujian Anda secara otomatis.
            </p>
            <button
              onClick={() => setViolation(null)}
              className="mt-5 w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-3 transition-colors"
            >
              Saya Mengerti, Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}

      {/* ─── Offline sync / submit guard (TRN-13) ─── */}
      {submitState !== 'idle' && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            {submitState === 'syncing' ? (
              <>
                <Loader2 size={40} className="mx-auto text-triton-blue-500 animate-spin" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">Menyinkronkan Jawaban</h3>
                <p className="mt-1.5 text-sm text-slate-500">Menyinkronkan sisa jawaban ke server, mohon tunggu...</p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <WifiOff size={26} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">Koneksi Gagal</h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  Koneksi gagal. Periksa internet Anda untuk mengumpulkan jawaban.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => { setSubmitState('idle'); setSubmitting(false) }}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => doSubmit()}
                    className="flex-1 bg-triton-blue-500 hover:bg-triton-blue-600 text-white font-semibold rounded-xl py-2.5 text-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw size={14} /> Coba Lagi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Submit Dialog ──────────────────────────────────────────
function SubmitDialog({ total, answered, unanswered, flagged, onCancel, onConfirm, submitting, accentClass }: {
  total: number; answered: number; unanswered: number; flagged: number
  onCancel: () => void; onConfirm: () => void; submitting: boolean; accentClass: string
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={submitting ? undefined : onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Kumpulkan Jawaban?</h3>
            <p className="text-sm text-slate-500">Setelah dikumpulkan, jawaban tidak dapat diubah.</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 space-y-2.5 text-sm">
          <Row label="Total soal" value={total} valueClass="text-slate-900" />
          <Row label="Sudah dijawab" value={answered} valueClass="text-green-600" />
          <Row label="Belum dijawab" value={unanswered} valueClass={unanswered > 0 ? 'text-red-500' : 'text-slate-400'} />
          <Row label="Ditandai ragu-ragu" value={flagged} valueClass={flagged > 0 ? 'text-orange-500' : 'text-slate-400'} />
        </div>

        {unanswered > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>Masih ada <strong>{unanswered}</strong> soal yang belum dijawab. Jawaban yang belum diisi akan dihitung salah.</span>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            Periksa Lagi
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={`flex-1 ${accentClass} font-bold rounded-xl py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-70`}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Mengumpulkan...' : 'Kumpulkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: number; valueClass: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${valueClass}`}>{value}</span>
    </div>
  )
}
