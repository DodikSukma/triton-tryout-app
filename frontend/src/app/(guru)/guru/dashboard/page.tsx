'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  BookOpen, Plus, MoreHorizontal, Clock, FileText, Users,
  Pencil, Trash2, AlertTriangle, Loader2, X, ChevronDown, ChevronUp, BarChart2,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import {
  ApiResponse, EducationLevel, HasilRekap, MasterKelas, MasterMataPelajaran,
  MasterSubMataPelajaran, RekapStudent, Tryout,
} from '@/types'
import { getLevel, setLevel, type Level } from '@/lib/level'

const LEVELS: EducationLevel[] = ['SD', 'SMP', 'SMA']

const SUBJECT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Matematika: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'from-blue-400 to-blue-600' },
  Fisika: { bg: 'bg-violet-50', text: 'text-violet-600', bar: 'from-violet-400 to-violet-600' },
  Kimia: { bg: 'bg-green-50', text: 'text-green-600', bar: 'from-green-400 to-green-600' },
  Biologi: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'from-emerald-400 to-emerald-600' },
  'Bahasa Indonesia': { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'from-orange-400 to-orange-600' },
  'Bahasa Inggris': { bg: 'bg-sky-50', text: 'text-sky-600', bar: 'from-sky-400 to-sky-600' },
  Sejarah: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'from-amber-400 to-amber-600' },
  Ekonomi: { bg: 'bg-teal-50', text: 'text-teal-600', bar: 'from-teal-400 to-teal-600' },
}

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? { bg: 'bg-slate-100', text: 'text-slate-600', bar: 'from-slate-400 to-slate-500' }
}

interface TryoutFormState {
  nama_tryout: string
  level: EducationLevel       // routes to sd/smp/sma service (not stored as a column)
  kelas: string               // master_kelas.nama
  mata_pelajaran: string      // master_mata_pelajaran.nama
  sub_mata_pelajaran: string  // master_sub_mata_pelajaran.nama
  durasi_menit: number
  randomize_questions: boolean
  randomize_options: boolean
}

export default function GuruDashboard() {
  const router = useRouter()
  const [tryouts, setTryouts] = useState<Tryout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tryout | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tryout | null>(null)

  const fetchTryouts = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Tryout[]>>('/tryouts')
      const list = res.data.data ?? []

      if (list.length > 0) {
        const ids = list.map((t) => t.id).join(',')
        try {
          const countRes = await api.get<ApiResponse<Record<string, number>>>(
            `/hasil/counts?tryout_ids=${ids}`
          )
          const counts = countRes.data.data ?? {}
          setTryouts(list.map((t) => ({ ...t, jumlah_peserta: counts[t.id] ?? 0 })))
        } catch {
          setTryouts(list)
        }
      } else {
        setTryouts(list)
      }
    } catch {
      toast.error('Gagal memuat data tryout.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTryouts() }, [fetchTryouts])

  const filtered = tryouts.filter((t) => filter === 'all' || t.status === filter)

  const stats = {
    total: tryouts.length,
    soal: tryouts.reduce((s, t) => s + (t.soal_count ?? 0), 0),
    siswa: tryouts.reduce((s, t) => s + (t.jumlah_peserta ?? 0), 0),
  }

  function payload(form: TryoutFormState) {
    return {
      nama_tryout: form.nama_tryout,
      mata_pelajaran: form.mata_pelajaran,
      sub_mata_pelajaran: form.sub_mata_pelajaran || null,
      kelas: form.kelas || null,
      durasi_menit: form.durasi_menit,
      randomize_questions: form.randomize_questions,
      randomize_options: form.randomize_options,
    }
  }

  async function handleCreate(form: TryoutFormState) {
    // Target the chosen level's service before creating, so this tryout (and the
    // soal builder we navigate to next) live in sd/smp/sma consistently.
    setLevel(form.level.toLowerCase() as Level)
    const res = await api.post<ApiResponse<Tryout>>('/tryouts', payload(form))
    const t = res.data.data
    if (t) router.push(`/guru/tryout/${t.id}/soal`)
  }

  async function handleEdit(id: string, form: TryoutFormState) {
    await api.put(`/tryouts/${id}`, payload(form))
    toast.success('Tryout berhasil diperbarui.')
    setEditTarget(null)
    fetchTryouts()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/tryouts/${deleteTarget.id}`)
      toast.success('Tryout berhasil dihapus.')
      setDeleteTarget(null)
      fetchTryouts()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus tryout.'))
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">Dashboard Guru</h1>
          <p className="text-slate-500 mt-1 text-sm">Kelola dan pantau tryout yang Anda buat.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:-translate-y-0.5 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} />
          Buat Tryout Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Tryout Dibuat" value={stats.total} Icon={BookOpen} color="text-blue-500 bg-blue-50" />
        <StatCard label="Total Soal" value={stats.soal} Icon={FileText} color="text-violet-500 bg-violet-50" />
        <StatCard label="Siswa Mengerjakan" value={stats.siswa} Icon={Users} color="text-green-500 bg-green-50" />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900">Tryout Saya</h2>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'published', 'draft', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-4 py-1.5 rounded-xl font-medium transition-colors ${filter === f
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100'
                }`}
            >
              {f === 'all' ? 'Semua' : f === 'published' ? 'Aktif' : f === 'draft' ? 'Draft' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {/* Tryout grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
          <p className="font-semibold text-slate-400">Belum ada tryout</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'all' ? "Klik '+ Buat Tryout Baru' untuk mulai" : `Tidak ada tryout dengan status "${filter}"`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TryoutCard
              key={t.id}
              tryout={t}
              onEdit={() => setEditTarget(t)}
              onDelete={() => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <TryoutFormDialog
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {editTarget && (
        <TryoutFormDialog
          mode="edit"
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(form) => handleEdit(editTarget.id, form)}
        />
      )}

      {deleteTarget && (
        <DeleteTryoutDialog
          tryout={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

// ─── TryoutCard ────────────────────────────────────────────────
function TryoutCard({ tryout: t, onEdit, onDelete }: {
  tryout: Tryout
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [students, setStudents] = useState<RekapStudent[] | null>(null)
  const [loadingStudents, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const colors = getSubjectColor(t.mata_pelajaran)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleToggle() {
    if (!expanded && students === null) {
      setLoading(true)
      try {
        const res = await api.get<ApiResponse<HasilRekap>>(`/hasil/rekap/${t.id}`)
        setStudents(res.data.data?.hasil ?? [])
      } catch {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    setExpanded((v) => !v)
  }

  const statusMap: Record<string, { label: string; cls: string }> = {
    published: { label: 'Aktif', cls: 'bg-green-50 text-green-600 border border-green-200' },
    draft: { label: 'Draft', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
    pending_approval: { label: 'Menunggu Persetujuan', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
    approved: { label: 'Disetujui', cls: 'bg-teal-50 text-teal-600 border border-teal-200' },
    rejected: { label: 'Butuh Revisi', cls: 'bg-red-50 text-red-600 border border-red-200' },
    closed: { label: 'Selesai', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  }
  const status = statusMap[t.status] ?? statusMap.draft
  const peserta = t.jumlah_peserta ?? 0
  const SHOW_MAX = 5
  const visibleRows = students?.slice(0, SHOW_MAX) ?? []
  const hiddenCount = (students?.length ?? 0) - SHOW_MAX

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Subject color bar */}
      <div className={`h-1.5 bg-gradient-to-r ${colors.bar}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-semibold rounded-full px-3 py-1 ${colors.bg} ${colors.text}`}>
            {t.mata_pelajaran}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${status.cls}`}>
              {status.label}
            </span>
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 animate-fade-in">
                  <Link
                    href={`/guru/tryout/${t.id}/soal`}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BookOpen size={14} className="text-blue-500" />
                    Kelola Soal
                  </Link>
                  <Link
                    href={`/guru/tryout/${t.id}/hasil`}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BarChart2 size={14} className="text-violet-500" />
                    Lihat Hasil Siswa
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); onEdit() }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Pencil size={14} className="text-slate-400" />
                    Edit Tryout
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete() }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 size={14} />
                    Hapus Tryout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{t.nama_tryout}</h3>

        {/* Meta */}
        <div className="flex gap-4 mt-2 text-slate-400 text-sm">
          <span className="flex items-center gap-1">
            <Clock size={14} /> {t.durasi_menit} mnt
          </span>
          <span className="flex items-center gap-1">
            <FileText size={14} /> {t.soal_count ?? 0} soal
          </span>
        </div>

        {/* Revision feedback from admin */}
        {t.status === 'rejected' && t.revision_notes && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600"><span className="font-semibold">Catatan revisi:</span> {t.revision_notes}</p>
          </div>
        )}

        {/* Primary action */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <Link
            href={`/guru/tryout/${t.id}/soal`}
            className="flex items-center justify-center gap-1.5 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl py-2 text-sm transition-colors"
          >
            Kelola Soal <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </Link>
        </div>

        {/* ── Peserta toggle row ── */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className={`flex items-center gap-1.5 text-sm ${peserta === 0 ? 'text-slate-300' : 'text-slate-500'}`}>
            <Users size={14} className={peserta === 0 ? 'text-slate-200' : 'text-slate-400'} />
            {peserta === 0 ? 'Belum ada siswa mengerjakan' : `${peserta} siswa selesai`}
          </span>
          {peserta > 0 && (
            <button
              onClick={handleToggle}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors shrink-0 ml-2"
            >
              {expanded ? <><span>Tutup</span><ChevronUp size={14} /></> : <><span>Lihat</span><ChevronDown size={14} /></>}
            </button>
          )}
        </div>

        {/* ── Collapsible student list ── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
        >
          {loadingStudents ? (
            <StudentSkeleton />
          ) : (
            <div className="space-y-0.5 pt-1">
              {visibleRows.map((s, i) => (
                <StudentRow key={i} student={s} />
              ))}
              {hiddenCount > 0 && (
                <Link
                  href={`/guru/tryout/${t.id}/hasil`}
                  className="block text-center text-xs text-blue-500 hover:text-blue-700 font-medium pt-2 pb-0.5 transition-colors"
                >
                  + {hiddenCount} siswa lainnya → Lihat semua
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StudentRow({ student: s }: { student: RekapStudent }) {
  const initial = s.nama_siswa.charAt(0).toUpperCase()
  const badge =
    s.nilai >= 90 ? 'bg-green-100 text-green-700' :
      s.nilai >= 75 ? 'bg-blue-100 text-blue-700' :
        s.nilai >= 60 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {initial}
      </div>
      <span className="text-sm font-medium text-slate-700 flex-1 truncate min-w-0">{s.nama_siswa}</span>
      <span className="text-xs text-slate-400 w-16 shrink-0 truncate">{s.kelas}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${badge}`}>
        {Math.round(s.nilai)}
      </span>
    </div>
  )
}

function StudentSkeleton() {
  return (
    <div className="space-y-2 pt-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
          <div className="flex-1 h-3 bg-slate-100 animate-pulse rounded-lg" />
          <div className="w-12 h-3 bg-slate-100 animate-pulse rounded-lg shrink-0" />
          <div className="w-10 h-5 bg-slate-100 animate-pulse rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─── TryoutFormDialog (cascade: level → kelas / mata pelajaran → sub) ─────────
function TryoutFormDialog({ mode, initial, onClose, onSubmit }: {
  mode: 'create' | 'edit'
  initial?: Tryout
  onClose: () => void
  onSubmit: (form: TryoutFormState) => Promise<void>
}) {
  const defaultLevel = (getLevel().toUpperCase() as EducationLevel)
  const [form, setForm] = useState<TryoutFormState>({
    nama_tryout: initial?.nama_tryout ?? '',
    level: defaultLevel,
    kelas: initial?.kelas ?? '',
    mata_pelajaran: initial?.mata_pelajaran ?? '',
    sub_mata_pelajaran: initial?.sub_mata_pelajaran ?? '',
    durasi_menit: initial?.durasi_menit ?? 90,
    randomize_questions: initial?.randomize_questions ?? true,
    randomize_options: initial?.randomize_options ?? true,
  })
  const [saving, setSaving] = useState(false)

  const [allKelas, setAllKelas] = useState<MasterKelas[]>([])
  const [allMapel, setAllMapel] = useState<MasterMataPelajaran[]>([])
  const [allSub, setAllSub] = useState<MasterSubMataPelajaran[]>([])
  const [loadingMaster, setLoadingMaster] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<ApiResponse<MasterKelas[]>>('/master/kelas'),
      api.get<ApiResponse<MasterMataPelajaran[]>>('/master/mata-pelajaran'),
      api.get<ApiResponse<MasterSubMataPelajaran[]>>('/master/sub-mata-pelajaran'),
    ]).then(([k, m, s]) => {
      if (cancelled) return
      setAllKelas(k.data.data ?? [])
      setAllMapel(m.data.data ?? [])
      setAllSub(s.data.data ?? [])
    }).catch(() => {
      if (!cancelled) toast.error('Gagal memuat master data.')
    }).finally(() => { if (!cancelled) setLoadingMaster(false) })
    return () => { cancelled = true }
  }, [])

  // Cascade-filtered options.
  const kelasOptions = allKelas.filter((k) => k.level === form.level)
  const mapelOptions = allMapel.filter((m) => m.level === form.level)
  const selectedMapel = allMapel.find((m) => m.nama === form.mata_pelajaran && m.level === form.level)
  const subOptions = allSub.filter((s) => s.mata_pelajaran_id === selectedMapel?.id)

  function changeLevel(level: EducationLevel) {
    // Reset dependent selections when the level changes.
    setForm((f) => ({ ...f, level, kelas: '', mata_pelajaran: '', sub_mata_pelajaran: '' }))
    if (mode === 'create') setLevel(level.toLowerCase() as Level)
  }

  function changeMapel(nama: string) {
    setForm((f) => ({ ...f, mata_pelajaran: nama, sub_mata_pelajaran: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama_tryout.trim()) { toast.error('Nama tryout wajib diisi.'); return }
    if (!form.kelas) { toast.error('Pilih kelas.'); return }
    if (!form.mata_pelajaran) { toast.error('Pilih mata pelajaran.'); return }
    setSaving(true)
    try {
      await onSubmit(form)
      if (mode === 'edit') onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan tryout.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'create' ? 'Buat Tryout Baru' : 'Edit Tryout'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nama Tryout <span className="text-red-500">*</span>
            </label>
            <input
              value={form.nama_tryout}
              onChange={(e) => setForm({ ...form, nama_tryout: e.target.value })}
              required
              placeholder="Contoh: Tryout Matematika UN 2024"
              className={inputCls}
            />
          </div>

          {/* Level — locked on edit (a tryout can't move between level services) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Jenjang <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={mode === 'edit'}
                  onClick={() => changeLevel(lvl)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    form.level === lvl ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            {mode === 'edit' && <p className="text-xs text-slate-400 mt-1.5">Jenjang tidak dapat diubah saat mengedit.</p>}
          </div>

          <SelectField
            label="Kelas" required
            value={form.kelas}
            onChange={(v) => setForm({ ...form, kelas: v })}
            placeholder={loadingMaster ? 'Memuat...' : kelasOptions.length ? 'Pilih kelas...' : 'Belum ada kelas untuk jenjang ini'}
            options={kelasOptions.map((k) => ({ value: k.nama, label: k.nama }))}
          />

          <SelectField
            label="Mata Pelajaran" required
            value={form.mata_pelajaran}
            onChange={changeMapel}
            placeholder={loadingMaster ? 'Memuat...' : mapelOptions.length ? 'Pilih mata pelajaran...' : 'Belum ada mata pelajaran untuk jenjang ini'}
            options={mapelOptions.map((m) => ({ value: m.nama, label: m.nama }))}
          />

          <SelectField
            label="Sub Mata Pelajaran"
            value={form.sub_mata_pelajaran}
            onChange={(v) => setForm({ ...form, sub_mata_pelajaran: v })}
            disabled={!form.mata_pelajaran}
            placeholder={!form.mata_pelajaran ? 'Pilih mata pelajaran dulu' : subOptions.length ? 'Pilih sub (opsional)...' : 'Tidak ada sub'}
            options={subOptions.map((s) => ({ value: s.nama, label: s.nama }))}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Durasi</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={15}
                max={300}
                step={5}
                value={form.durasi_menit}
                onChange={(e) => setForm({ ...form, durasi_menit: Number(e.target.value) || 90 })}
                className={`${inputCls} w-28 text-center`}
              />
              <span className="text-sm text-slate-500">menit</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Waktu pengerjaan untuk siswa (15–300 menit)</p>
          </div>

          <div className="space-y-2">
            <ToggleRow
              label="Acak Urutan Soal"
              desc="Setiap siswa mendapat urutan soal berbeda."
              checked={form.randomize_questions}
              onChange={(v) => setForm({ ...form, randomize_questions: v })}
            />
            <ToggleRow
              label="Acak Pilihan Ganda"
              desc="Posisi opsi A–E diacak per siswa."
              checked={form.randomize_options}
              onChange={(v) => setForm({ ...form, randomize_options: v })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Menyimpan...' : mode === 'create' ? 'Buat & Tambah Soal →' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder, required, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} appearance-none pr-10 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

// ─── DeleteTryoutDialog ────────────────────────────────────────
function DeleteTryoutDialog({ tryout, onCancel, onConfirm }: {
  tryout: Tryout
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-3">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center">Hapus Tryout?</h3>
        <p className="text-sm font-semibold text-slate-600 text-center mt-1">"{tryout.nama_tryout}"</p>
        <p className="text-xs text-slate-400 text-center mt-2">
          Tryout beserta semua soalnya akan dihapus permanen.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">Data yang sudah dihapus tidak bisa dikembalikan.</p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors">Batal</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">Ya, Hapus Permanen</button>
        </div>
      </div>
    </div>
  )
}

// ─── StatCard ──────────────────────────────────────────────────
function StatCard({ label, value, Icon, color }: {
  label: string; value: number; Icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-sm transition-all bg-white'
