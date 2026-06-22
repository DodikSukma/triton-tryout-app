'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, X, Layers, BookOpen, GraduationCap, ChevronDown, Search } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import TritonLoader from '@/components/common/TritonLoader'
import {
  ApiResponse, EducationLevel, MasterKelas, MasterMataPelajaran, MasterSubMataPelajaran,
} from '@/types'

const LEVELS: EducationLevel[] = ['SD', 'SMP', 'SMA']
const LEVEL_BADGE: Record<EducationLevel, string> = {
  SD: 'bg-red-50 text-red-600 border border-red-200',
  SMP: 'bg-blue-50 text-blue-700 border border-blue-200',
  SMA: 'bg-slate-100 text-slate-600 border border-slate-200',
}

// Per-level tab styling (SD red / SMP blue / SMA slate) — matches Triton branding.
const LEVEL_TAB: Record<EducationLevel, { active: string; idle: string }> = {
  SD:  { active: 'bg-red-500 text-white shadow-sm',  idle: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' },
  SMP: { active: 'bg-blue-600 text-white shadow-sm', idle: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
  SMA: { active: 'bg-slate-600 text-white shadow-sm', idle: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700' },
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 text-sm transition-all bg-white dark:bg-slate-700 dark:placeholder:text-slate-500'

export default function AdminMasterPage() {
  const [kelas, setKelas] = useState<MasterKelas[]>([])
  const [mapel, setMapel] = useState<MasterMataPelajaran[]>([])
  const [sub, setSub] = useState<MasterSubMataPelajaran[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<null | 'kelas' | 'mapel' | 'sub'>(null)
  const [activeLevel, setActiveLevel] = useState<EducationLevel>('SD')
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    try {
      const [k, m, s] = await Promise.all([
        api.get<ApiResponse<MasterKelas[]>>('/master/kelas'),
        api.get<ApiResponse<MasterMataPelajaran[]>>('/master/mata-pelajaran'),
        api.get<ApiResponse<MasterSubMataPelajaran[]>>('/master/sub-mata-pelajaran'),
      ])
      setKelas(k.data.data ?? [])
      setMapel(m.data.data ?? [])
      setSub(s.data.data ?? [])
    } catch {
      toast.error('Gagal memuat master data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function remove(kind: 'kelas' | 'mata-pelajaran' | 'sub-mata-pelajaran', id: string) {
    try {
      await api.delete(`/master/${kind}/${id}`)
      toast.success('Data dihapus.')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus data.'))
    }
  }

  if (loading) {
    return <TritonLoader fullScreen={false} />
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredKelas = kelas
    .filter((k) => k.level === activeLevel)
    .filter((k) => !q || k.nama.toLowerCase().includes(q))
  const filteredMapel = mapel
    .filter((m) => m.level === activeLevel)
    .filter((m) => !q || m.nama.toLowerCase().includes(q))
  const filteredSub = sub
    .filter((s) => s.level === activeLevel)
    .filter((s) => !q || s.nama.toLowerCase().includes(q) || (s.mata_pelajaran_nama?.toLowerCase().includes(q) ?? false))

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">Master Data</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Kelola kelas, mata pelajaran, dan sub mata pelajaran yang dipakai guru saat membuat tryout.
        </p>
      </header>

      {/* Level tabs (SD / SMP / SMA) */}
      <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 mb-6">
        {LEVELS.map((lv) => (
          <button
            key={lv}
            onClick={() => setActiveLevel(lv)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeLevel === lv ? LEVEL_TAB[lv].active : LEVEL_TAB[lv].idle}`}
          >
            {lv}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari kelas, mata pelajaran, atau sub-mata pelajaran..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Kelas ── */}
        <Section
          title="Kelas"
          icon={<GraduationCap size={18} className="text-red-500" />}
          onAdd={() => setDialog('kelas')}
          count={filteredKelas.length}
        >
          {filteredKelas.length === 0 ? <Empty /> : filteredKelas.map((k) => (
            <Row key={k.id} onDelete={() => remove('kelas', k.id)}>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{k.nama}</span>
              <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${LEVEL_BADGE[k.level]}`}>{k.level}</span>
            </Row>
          ))}
        </Section>

        {/* ── Mata Pelajaran ── */}
        <Section
          title="Mata Pelajaran"
          icon={<BookOpen size={18} className="text-blue-500" />}
          onAdd={() => setDialog('mapel')}
          count={filteredMapel.length}
        >
          {filteredMapel.length === 0 ? <Empty /> : filteredMapel.map((m) => (
            <Row key={m.id} onDelete={() => remove('mata-pelajaran', m.id)}>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{m.nama}</span>
              <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${LEVEL_BADGE[m.level]}`}>{m.level}</span>
            </Row>
          ))}
        </Section>

        {/* ── Sub Mata Pelajaran ── */}
        <Section
          title="Sub Mata Pelajaran"
          icon={<Layers size={18} className="text-violet-500" />}
          onAdd={() => filteredMapel.length === 0 ? toast.error('Tambah mata pelajaran dulu.') : setDialog('sub')}
          count={filteredSub.length}
        >
          {filteredSub.length === 0 ? <Empty /> : filteredSub.map((s) => (
            <Row key={s.id} onDelete={() => remove('sub-mata-pelajaran', s.id)}>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{s.nama}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{s.mata_pelajaran_nama}</span>
              </div>
            </Row>
          ))}
        </Section>
      </div>

      {dialog === 'kelas' && (
        <FormDialog
          title={`Tambah Kelas — ${activeLevel}`}
          fields={['nama', 'level']}
          lockedLevel={activeLevel}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => { await api.post('/master/kelas', { nama: v.nama, level: v.level }); load() }}
        />
      )}
      {dialog === 'mapel' && (
        <FormDialog
          title={`Tambah Mata Pelajaran — ${activeLevel}`}
          fields={['nama', 'level']}
          lockedLevel={activeLevel}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => { await api.post('/master/mata-pelajaran', { nama: v.nama, level: v.level }); load() }}
        />
      )}
      {dialog === 'sub' && (
        <FormDialog
          title={`Tambah Sub Mata Pelajaran — ${activeLevel}`}
          fields={['nama', 'mapel']}
          mapelOptions={filteredMapel}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => { await api.post('/master/sub-mata-pelajaran', { nama: v.nama, mata_pelajaran_id: v.mapel }); load() }}
        />
      )}
    </div>
  )
}

function Section({ title, icon, count, onAdd, children }: {
  title: string; icon: React.ReactNode; count: number; onAdd: () => void; children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">({count})</span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <Plus size={13} /> Tambah
        </button>
      </div>
      <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">{children}</div>
    </div>
  )
}

function Row({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">{children}</div>
      <button
        onClick={onDelete}
        className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0"
        title="Hapus"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function Empty() {
  return <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Belum ada data.</p>
}

function FormDialog({ title, fields, mapelOptions, lockedLevel, onClose, onSubmit }: {
  title: string
  fields: ('nama' | 'level' | 'mapel')[]
  mapelOptions?: MasterMataPelajaran[]
  /** When set, the level is fixed to the active tab and the picker is hidden. */
  lockedLevel?: EducationLevel
  onClose: () => void
  onSubmit: (v: { nama: string; level: EducationLevel; mapel: string }) => Promise<void>
}) {
  const [nama, setNama] = useState('')
  const [level, setLevel] = useState<EducationLevel>(lockedLevel ?? 'SD')
  const [mapel, setMapel] = useState(mapelOptions?.[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { toast.error('Nama wajib diisi.'); return }
    if (fields.includes('mapel') && !mapel) { toast.error('Pilih mata pelajaran.'); return }
    setSaving(true)
    try {
      await onSubmit({ nama: nama.trim(), level, mapel })
      toast.success('Berhasil ditambahkan.')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama <span className="text-red-500">*</span></label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} autoFocus placeholder="Contoh: 6 SD / Matematika / Aljabar" className={inputCls} />
          </div>

          {fields.includes('level') && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Jenjang <span className="text-red-500">*</span></label>
              {lockedLevel ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 px-4 py-3">
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${LEVEL_BADGE[lockedLevel]}`}>{lockedLevel}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Terkunci sesuai tab aktif</span>
                </div>
              ) : (
                <div className="relative">
                  <select value={level} onChange={(e) => setLevel(e.target.value as EducationLevel)} className={`${inputCls} appearance-none pr-10`}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {fields.includes('mapel') && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mata Pelajaran <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={mapel} onChange={(e) => setMapel(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
                  {(mapelOptions ?? []).map((m) => <option key={m.id} value={m.id}>{m.nama} ({m.level})</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
