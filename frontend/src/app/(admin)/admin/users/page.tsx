'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Search, GraduationCap, Users as UsersIcon,
  CheckCircle2, XCircle, Loader2, X, Mail, Lock, Eye, EyeOff, AlertTriangle,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, EducationLevel, Role } from '@/types'
import { formatTanggal } from '@/lib/utils'

const EDU_LEVELS: EducationLevel[] = ['SD', 'SMP', 'SMA']

interface UserRow {
  id: string
  email: string
  role: Role
  is_active: boolean
  created_at: string
  profile: {
    user_id: string
    nama_lengkap: string
    no_telepon: string | null
    kelas: string | null
    mata_pelajaran: string | null
    education_level: EducationLevel | null
    avatar_url: string | null
    bio: string | null
  } | null
}

const KELAS_OPTIONS = [
  'Kelas 10 IPA', 'Kelas 10 IPS', 'Kelas 11 IPA', 'Kelas 11 IPS',
  'Kelas 12 IPA', 'Kelas 12 IPS', 'Kelas 10 (SMK)', 'Kelas 11 (SMK)', 'Kelas 12 (SMK)',
]

const MAPEL_OPTIONS = [
  'Matematika', 'Fisika', 'Kimia', 'Biologi', 'Bahasa Indonesia',
  'Bahasa Inggris', 'Sejarah', 'Ekonomi', 'Geografi', 'Sosiologi',
  'Akuntansi', 'PKN', 'Seni Budaya', 'PJOK', 'TIK', 'Bahasa Bali',
]

function AdminUsersInner() {
  const searchParams = useSearchParams()
  const role = (searchParams?.get('role') ?? 'guru') as 'guru' | 'siswa'
  const isGuru = role === 'guru'

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; user: UserRow } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<UserRow[]>>(`/users?role=${role}`)
      setUsers(res.data.data ?? [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat data pengguna.'))
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    fetchUsers()
    setSearch('')
  }, [fetchUsers, role])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
  }), [users])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const haystack = `${u.email} ${u.profile?.nama_lengkap ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [users, search])

  async function toggleActive(u: UserRow) {
    try {
      await api.patch(`/users/${u.id}/active`, { is_active: !u.is_active })
      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, is_active: !u.is_active } : x)))
      toast.success(`Akun ${!u.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengubah status akun.'))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/users/${deleteTarget.id}`)
      setUsers((arr) => arr.filter((u) => u.id !== deleteTarget.id))
      toast.success(`${isGuru ? 'Guru' : 'Siswa'} berhasil dihapus.`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus pengguna.'))
    }
  }

  const title = isGuru ? 'Kelola Guru' : 'Kelola Siswa'
  const subtitle = isGuru
    ? 'Daftar guru yang terdaftar di platform Triton Denpasar.'
    : 'Daftar siswa yang terdaftar di platform Triton Denpasar.'

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
        </div>
        <button
          onClick={() => setDialog({ mode: 'add' })}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 font-semibold text-sm inline-flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={16} /> Tambah {isGuru ? 'Guru' : 'Siswa'}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label={`Total ${isGuru ? 'Guru' : 'Siswa'}`}
          value={stats.total}
          Icon={isGuru ? GraduationCap : UsersIcon}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard label={`${isGuru ? 'Guru' : 'Siswa'} Aktif`} value={stats.active} Icon={CheckCircle2} color="text-green-600 bg-green-50" />
        <StatCard label={`${isGuru ? 'Guru' : 'Siswa'} Nonaktif`} value={stats.inactive} Icon={XCircle} color="text-slate-500 bg-slate-100" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Cari nama atau email ${isGuru ? 'guru' : 'siswa'}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 size={24} className="mx-auto animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isGuru
                ? <GraduationCap size={28} className="text-slate-300" />
                : <UsersIcon size={28} className="text-slate-300" />}
            </div>
            <p className="text-slate-400 font-semibold text-sm">
              {search ? 'Tidak ada yang cocok.' : `Belum ada ${isGuru ? 'guru' : 'siswa'} terdaftar.`}
            </p>
            {!search && (
              <button
                onClick={() => setDialog({ mode: 'add' })}
                className="mt-4 text-blue-500 text-sm hover:underline"
              >
                + Tambah {isGuru ? 'guru' : 'siswa'} pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-sm min-w-[580px]">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 md:px-5 py-3">Nama Lengkap</th>
                  <th className="text-left px-4 md:px-5 py-3">{isGuru ? 'Mata Pelajaran' : 'Kelas'}</th>
                  <th className="text-left px-4 md:px-5 py-3">Status</th>
                  <th className="text-left px-4 md:px-5 py-3 hidden md:table-cell">Bergabung</th>
                  <th className="text-right px-4 md:px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 md:px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.profile.avatar_url}
                            alt={u.profile.nama_lengkap}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {(u.profile?.nama_lengkap ?? u.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{u.profile?.nama_lengkap ?? '—'}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-4">
                      {isGuru ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.profile?.mata_pelajaran
                            ? u.profile.mata_pelajaran.split(',').slice(0, 3).map((m) => (
                              <span key={m} className="bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-medium">{m.trim()}</span>
                            ))
                            : <span className="text-slate-400 text-xs">—</span>}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">{u.profile?.kelas ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-4">
                      <button
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors ${u.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${u.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-4 md:px-5 py-4 text-slate-500 text-xs hidden md:table-cell">
                      {formatTanggal(u.created_at)}
                    </td>
                    <td className="px-4 md:px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setDialog({ mode: 'edit', user: u })}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialog && (
        <UserDialog
          mode={dialog.mode}
          role={role}
          initialUser={dialog.mode === 'edit' ? dialog.user : null}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); fetchUsers() }}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          isGuru={isGuru}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    }>
      <AdminUsersInner />
    </Suspense>
  )
}

function StatCard({ label, value, Icon, color }: {
  label: string; value: number; Icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function UserDialog({ mode, role, initialUser, onClose, onSaved }: {
  mode: 'add' | 'edit'
  role: 'guru' | 'siswa'
  initialUser: UserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const isGuru = role === 'guru'
  const [nama, setNama] = useState(initialUser?.profile?.nama_lengkap ?? '')
  const [email, setEmail] = useState(initialUser?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [kelas, setKelas] = useState(initialUser?.profile?.kelas ?? '')
  const [eduLevel, setEduLevel] = useState<string>(initialUser?.profile?.education_level ?? '')
  const [mapel, setMapel] = useState<string[]>(
    initialUser?.profile?.mata_pelajaran
      ? initialUser.profile.mata_pelajaran.split(',').map((m) => m.trim()).filter(Boolean)
      : []
  )
  const [saving, setSaving] = useState(false)

  function toggleMapel(m: string) {
    setMapel((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { toast.error('Nama lengkap wajib diisi.'); return }
    if (!email.trim()) { toast.error('Email wajib diisi.'); return }
    if (mode === 'add' && password.length < 6) { toast.error('Password minimal 6 karakter.'); return }

    setSaving(true)
    try {
      if (mode === 'add') {
        await api.post('/users', {
          email,
          password,
          role,
          nama_lengkap: nama,
          kelas: !isGuru ? kelas || null : null,
          mata_pelajaran: isGuru ? mapel.join(', ') || null : null,
          education_level: eduLevel || null,
        })
        toast.success(`${isGuru ? 'Guru' : 'Siswa'} berhasil ditambahkan.`)
      } else if (initialUser) {
        await api.put(`/users/${initialUser.id}`, {
          nama_lengkap: nama,
          kelas: !isGuru ? kelas || null : null,
          mata_pelajaran: isGuru ? mapel.join(', ') || null : null,
          education_level: eduLevel || null,
        })
        toast.success('Data berhasil diperbarui.')
      }
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'add' ? `Tambah ${isGuru ? 'Guru' : 'Siswa'} Baru` : `Edit ${isGuru ? 'Guru' : 'Siswa'}`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nama Lengkap" required>
            <input value={nama} onChange={(e) => setNama(e.target.value)} required className={inputCls} placeholder="Nama lengkap" />
          </Field>

          <Field label="Email" required>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mode === 'edit'}
                required
                className={`${inputCls} pl-10 ${mode === 'edit' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                placeholder="email@contoh.com"
              />
            </div>
          </Field>

          {mode === 'add' && (
            <Field label="Password" required hint="Minimal 6 karakter">
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pl-10 pr-11`}
                  placeholder="Password awal"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
          )}

          {!isGuru && (
            <Field label="Kelas">
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} className={inputCls}>
                <option value="">Pilih kelas...</option>
                {KELAS_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
          )}

          <Field label="Jenjang Pendidikan" hint={isGuru ? 'Opsional untuk guru.' : 'Menentukan tryout jenjang mana yang dapat diakses siswa.'}>
            <select value={eduLevel} onChange={(e) => setEduLevel(e.target.value)} className={inputCls}>
              <option value="">Pilih jenjang...</option>
              {EDU_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          {isGuru && (
            <Field label="Mata Pelajaran">
              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 min-h-[52px]">
                {MAPEL_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMapel(m)}
                    className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                      mapel.includes(m)
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {mapel.length > 0 && (
                <p className="text-xs text-slate-400 mt-1.5">{mapel.length} mapel dipilih</p>
              )}
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteDialog({ user, isGuru, onCancel, onConfirm }: {
  user: UserRow
  isGuru: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-3">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center">Hapus {isGuru ? 'Guru' : 'Siswa'}?</h3>
        <p className="text-sm text-slate-600 font-semibold text-center mt-1">{user.profile?.nama_lengkap ?? user.email}</p>
        <p className="text-xs text-slate-400 text-center mt-2">
          {isGuru
            ? 'Semua tryout dan soal yang dibuat oleh guru ini tidak akan terhapus.'
            : 'Semua riwayat tryout siswa ini tidak akan terhapus.'}
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors">
            Batal
          </button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-sm transition-all bg-white'

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
  )
}
