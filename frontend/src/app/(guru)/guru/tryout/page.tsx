'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import {
  ApiResponse, EducationLevel, MasterKelas, MasterMataPelajaran, MasterSubMataPelajaran, Tryout,
} from '@/types'
import { getLevel, setLevel, type Level } from '@/lib/level'

const LEVELS: EducationLevel[] = ['SD', 'SMP', 'SMA']

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 text-sm transition-all bg-white dark:bg-slate-700 dark:placeholder:text-slate-500'

interface FormState {
  nama_tryout: string
  level: EducationLevel
  kelas: string
  mata_pelajaran: string
  sub_mata_pelajaran: string
  durasi_menit: number
  randomize_questions: boolean
  randomize_options: boolean
}

export default function BuatTryoutPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    nama_tryout: '',
    level: getLevel().toUpperCase() as EducationLevel,
    kelas: '',
    mata_pelajaran: '',
    sub_mata_pelajaran: '',
    durasi_menit: 90,
    randomize_questions: true,
    randomize_options: true,
  })
  const [saving, setSaving] = useState(false)

  const [allKelas, setAllKelas] = useState<MasterKelas[]>([])
  const [allMapel, setAllMapel] = useState<MasterMataPelajaran[]>([])
  const [allSub, setAllSub] = useState<MasterSubMataPelajaran[]>([])
  const [loadingMaster, setLoadingMaster] = useState(true)

  // ─── Fetch master reference data on mount ───
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

  // ─── Cascade-filtered options ───
  const kelasOptions = allKelas.filter((k) => k.level === form.level)
  const mapelOptions = allMapel.filter((m) => m.level === form.level)
  const selectedMapel = allMapel.find((m) => m.nama === form.mata_pelajaran && m.level === form.level)
  const subOptions = allSub.filter((s) => s.mata_pelajaran_id === selectedMapel?.id)

  function changeLevel(level: EducationLevel) {
    // Reset dependent selections when the level changes.
    setForm((f) => ({ ...f, level, kelas: '', mata_pelajaran: '', sub_mata_pelajaran: '' }))
    setLevel(level.toLowerCase() as Level)
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
      // Route the request to the matching level service before posting.
      setLevel(form.level.toLowerCase() as Level)
      const res = await api.post<ApiResponse<Tryout>>('/tryouts', {
        nama_tryout: form.nama_tryout.trim(),
        mata_pelajaran: form.mata_pelajaran,
        sub_mata_pelajaran: form.sub_mata_pelajaran || null,
        kelas: form.kelas || null,
        durasi_menit: form.durasi_menit,
        randomize_questions: form.randomize_questions,
        randomize_options: form.randomize_options,
      })
      const t = res.data.data
      if (t) router.push(`/guru/tryout/${t.id}/soal`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal membuat tryout.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in-up pb-10 mt-8 max-w-2xl mx-auto px-4">
      <Link href="/guru/dashboard" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-triton-blue-600 transition-colors mb-6 font-medium">
        <ArrowLeft size={18} />
        Kembali ke Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Buat Tryout Baru</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Isi detail tryout di bawah ini untuk mulai menambahkan soal.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-5">
        {/* Nama */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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

        {/* Jenjang */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Jenjang <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => changeLevel(lvl)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  form.level === lvl
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
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

        {/* Durasi */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Durasi</label>
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
            <span className="text-sm text-slate-500 dark:text-slate-400">menit</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Waktu pengerjaan untuk siswa (15–300 menit)</p>
        </div>

        {/* Randomization */}
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

        <button
          type="submit"
          disabled={saving}
          className="w-full mt-2 py-3.5 bg-gradient-to-r from-triton-blue-600 to-triton-blue-500 hover:from-triton-blue-700 hover:to-triton-blue-600 disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-glow hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</> : 'Buat & Tambah Soal →'}
        </button>
      </form>
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
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} appearance-none pr-10 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
