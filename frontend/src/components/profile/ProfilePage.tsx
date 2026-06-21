'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Camera, Loader2, User, Lock, Eye, EyeOff, Save, X, CheckCircle2, AlertCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, Profile, Role } from '@/types'

const SUBJECTS = [
  'Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia',
  'Bahasa Inggris', 'Sejarah', 'Ekonomi', 'Geografi', 'Sosiologi',
  'Akuntansi', 'PKN', 'Seni Budaya', 'PJOK', 'TIK', 'Bahasa Bali',
]

const KELAS_OPTIONS = [
  'Kelas 10 IPA', 'Kelas 10 IPS',
  'Kelas 11 IPA', 'Kelas 11 IPS',
  'Kelas 12 IPA', 'Kelas 12 IPS',
  'Kelas 10 (SMK)', 'Kelas 11 (SMK)', 'Kelas 12 (SMK)',
]

interface ProfilePageProps {
  role: Role
  email: string
}

export default function ProfilePage({ role, email }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'info' | 'security'>('info')

  useEffect(() => {
    let cancelled = false
    api.get<ApiResponse<Profile>>('/users/profile/me')
      .then((r) => { if (!cancelled) setProfile(r.data.data ?? null) })
      .catch(() => { if (!cancelled) toast.error('Gagal memuat profil.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-triton-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Profil Saya</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT CARD — avatar + identity */}
        <aside className="lg:col-span-1">
          <AvatarCard profile={profile} role={role} email={email} onUpdate={(p) => setProfile(p)} />
        </aside>

        {/* RIGHT CARD — tabs */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

          <div className="border-b border-slate-100 dark:border-slate-700 flex">
            <TabButton active={tab === 'info'} onClick={() => setTab('info')} Icon={User} label="Informasi Pribadi" />
            <TabButton active={tab === 'security'} onClick={() => setTab('security')} Icon={Lock} label="Keamanan" />
          </div>

          {tab === 'info' ? (
            <InfoTab role={role} profile={profile} email={email} onUpdate={setProfile} />
          ) : (
            <SecurityTab />
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Avatar Card ───────────────────────────────────────────────
function AvatarCard({ profile, role, email, onUpdate }: {
  profile: Profile | null; role: Role; email: string; onUpdate: (p: Profile) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const name = profile?.nama_lengkap || email.split('@')[0]
  const initial = name.charAt(0).toUpperCase()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB.')
      return
    }
    setUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await api.post<ApiResponse<{ avatar_url: string }>>('/users/profile/avatar', {
        avatar_base64: base64,
        mime_type: file.type,
      })
      if (profile && res.data.data) {
        onUpdate({ ...profile, avatar_url: res.data.data.avatar_url })
      } else {
        // No profile yet — refetch
        const fresh = await api.get<ApiResponse<Profile>>('/users/profile/me')
        if (fresh.data.data) onUpdate(fresh.data.data)
      }
      toast.success('Foto profil berhasil diperbarui.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengupload foto.'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 text-center sticky top-6">

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className="relative w-32 h-32 mx-auto cursor-pointer group"
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={name}
            fill
            unoptimized
            className="rounded-full object-cover ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-triton-blue-500 to-triton-blue-700 text-white flex items-center justify-center text-5xl font-black shadow-md">
            {initial}
          </div>
        )}

        <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <>
              <Loader2 size={28} className="text-white animate-spin" />
              <span className="text-white text-xs mt-1 font-medium">Mengupload...</span>
            </>
          ) : (
            <>
              <Camera size={28} className="text-white" />
              <span className="text-white text-xs mt-1 font-medium">Ganti Foto</span>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-6">{name}</h2>
      <span className="inline-block bg-triton-blue-50 text-triton-blue-600 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider mt-2">
        {role}
      </span>
      <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{email}</p>

      {profile?.bio && (
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 italic border-t border-slate-100 dark:border-slate-700 pt-4">
          {profile.bio}
        </p>
      )}

      {role === 'siswa' && profile?.kelas && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Kelas</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">{profile.kelas}</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab Button ────────────────────────────────────────────────
function TabButton({ active, onClick, Icon, label }: {
  active: boolean; onClick: () => void; Icon: React.ElementType; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-5 py-4 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 ${
        active
          ? 'text-triton-blue-600 border-b-2 border-triton-blue-500 -mb-px bg-white dark:bg-slate-800'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

// ─── Info Tab ──────────────────────────────────────────────────
function InfoTab({ role, profile, email, onUpdate }: {
  role: Role; profile: Profile | null; email: string; onUpdate: (p: Profile) => void
}) {
  const [form, setForm] = useState({
    nama_lengkap: profile?.nama_lengkap ?? '',
    no_telepon: profile?.no_telepon ?? '',
    kelas: profile?.kelas ?? '',
    mata_pelajaran: profile?.mata_pelajaran ?? '',
    bio: profile?.bio ?? '',
  })
  const [saving, setSaving] = useState(false)

  // Mata pelajaran as comma-separated string in DB → array on UI
  const subjectTags = form.mata_pelajaran
    ? form.mata_pelajaran.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  function addSubject(s: string) {
    if (subjectTags.includes(s)) return
    setForm((f) => ({ ...f, mata_pelajaran: [...subjectTags, s].join(', ') }))
  }
  function removeSubject(s: string) {
    setForm((f) => ({ ...f, mata_pelajaran: subjectTags.filter((x) => x !== s).join(', ') }))
  }

  async function handleSave() {
    if (!form.nama_lengkap.trim()) {
      toast.error('Nama lengkap tidak boleh kosong.')
      return
    }
    setSaving(true)
    try {
      const res = await api.put<ApiResponse<Profile>>('/users/profile/me', {
        nama_lengkap: form.nama_lengkap,
        no_telepon: form.no_telepon || null,
        kelas: form.kelas || null,
        mata_pelajaran: form.mata_pelajaran || null,
        bio: form.bio || null,
      })
      if (res.data.data) onUpdate(res.data.data)
      toast.success('Profil berhasil diperbarui.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan profil.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-5">
      <Field label="Nama Lengkap" required>
        <input
          value={form.nama_lengkap}
          onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
          placeholder="Nama lengkap Anda"
          className={inputCls}
        />
      </Field>

      <Field label="Email" hint="Email tidak dapat diubah">
        <input
          value={email}
          disabled
          className={`${inputCls} bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed`}
        />
      </Field>

      <Field label="No. Telepon">
        <input
          type="tel"
          value={form.no_telepon}
          onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
          placeholder="08xxxxxxxxxx"
          className={inputCls}
        />
      </Field>

      {role === 'guru' && (
        <Field label="Mata Pelajaran yang Diajar">
          <div className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl p-3 min-h-[48px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-triton-blue-500/20 focus-within:border-triton-blue-500 transition-all">
            {subjectTags.map((s) => (
              <span key={s} className="bg-triton-blue-50 text-triton-blue-600 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1.5">
                {s}
                <button type="button" onClick={() => removeSubject(s)} className="hover:bg-triton-blue-100 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            ))}
            <select
              value=""
              onChange={(e) => { if (e.target.value) { addSubject(e.target.value); e.target.value = '' } }}
              className="bg-transparent outline-none text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
            >
              <option value="">+ Tambah mata pelajaran</option>
              {SUBJECTS.filter((s) => !subjectTags.includes(s)).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </Field>
      )}

      {role === 'siswa' && (
        <Field label="Kelas">
          <select
            value={form.kelas}
            onChange={(e) => setForm({ ...form, kelas: e.target.value })}
            className={inputCls}
          >
            <option value="">Pilih kelas...</option>
            {KELAS_OPTIONS.map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
        </Field>
      )}

      <Field label="Bio / Catatan">
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={3}
          placeholder="Tuliskan sesuatu tentang diri Anda (opsional)..."
          className={`${inputCls} resize-none`}
        />
      </Field>

      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-triton-blue-500 hover:bg-triton-blue-600 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors inline-flex items-center gap-2 shadow-sm"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  )
}

// ─── Security Tab ──────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)

  const strength = computeStrength(form.new)
  const matchError = !!form.confirm && form.new !== form.confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.new.length < 8) {
      toast.error('Password baru minimal 8 karakter.')
      return
    }
    if (form.new !== form.confirm) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        oldPassword: form.current,
        newPassword: form.new,
      })
      toast.success('Password berhasil diubah.')
      setForm({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengubah password.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
      <PasswordField
        label="Password Saat Ini"
        value={form.current}
        onChange={(v) => setForm({ ...form, current: v })}
        show={show.current}
        onToggle={() => setShow({ ...show, current: !show.current })}
        placeholder="Masukkan password saat ini"
      />

      <PasswordField
        label="Password Baru"
        value={form.new}
        onChange={(v) => setForm({ ...form, new: v })}
        show={show.new}
        onToggle={() => setShow({ ...show, new: !show.new })}
        placeholder="Minimal 8 karakter"
      />

      {form.new && (
        <div className="-mt-3">
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((seg) => (
              <span
                key={seg}
                className={`h-1.5 rounded-full transition-colors ${
                  seg <= strength.score ? strength.barColor : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs mt-2 font-medium ${strength.textColor}`}>{strength.label}</p>
        </div>
      )}

      <PasswordField
        label="Konfirmasi Password Baru"
        value={form.confirm}
        onChange={(v) => setForm({ ...form, confirm: v })}
        show={show.confirm}
        onToggle={() => setShow({ ...show, confirm: !show.confirm })}
        placeholder="Ulangi password baru"
        error={matchError ? 'Password tidak cocok' : undefined}
      />

      <button
        type="submit"
        disabled={saving || !form.current || !form.new || !form.confirm || matchError}
        className="bg-triton-red-500 hover:bg-triton-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors inline-flex items-center gap-2 shadow-sm"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
        {saving ? 'Memproses...' : 'Ubah Password'}
      </button>
    </form>
  )
}

// ─── Subcomponents ─────────────────────────────────────────────
const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 text-slate-900 dark:text-slate-100 text-sm transition-all bg-white dark:bg-slate-700 dark:placeholder:text-slate-500'

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>}
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; placeholder?: string; error?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputCls} pr-11 ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 inline-flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function computeStrength(pw: string) {
  if (!pw) return { score: 0, label: '', barColor: 'bg-slate-200', textColor: 'text-slate-400' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^\w\s]/.test(pw)) score++
  if (pw.length >= 12 && score >= 3) score = 4
  const map = [
    { label: 'Sangat Lemah',  barColor: 'bg-red-400',   textColor: 'text-red-500' },
    { label: 'Lemah',         barColor: 'bg-red-400',   textColor: 'text-red-500' },
    { label: 'Cukup',         barColor: 'bg-orange-400', textColor: 'text-orange-500' },
    { label: 'Baik',          barColor: 'bg-yellow-400', textColor: 'text-yellow-600' },
    { label: 'Kuat',          barColor: 'bg-green-500', textColor: 'text-green-600' },
  ]
  return { score, ...map[score] }
}
