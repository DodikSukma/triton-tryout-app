export type Role = 'admin' | 'guru' | 'siswa' | 'admin-soal'

export interface SessionUser {
  userId: string
  role: Role
  email: string
}

export interface Profile {
  id: string
  user_id: string
  nama_lengkap: string
  no_telepon?: string | null
  kelas?: string | null
  mata_pelajaran?: string | null
  education_level?: EducationLevel | null
  avatar_url?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

export type EducationLevel = 'SD' | 'SMP' | 'SMA'

export interface MasterKelas {
  id: string
  nama: string
  level: EducationLevel
}

export interface MasterMataPelajaran {
  id: string
  nama: string
  level: EducationLevel
}

export interface MasterSubMataPelajaran {
  id: string
  mata_pelajaran_id: string
  nama: string
  mata_pelajaran_nama?: string
  level?: EducationLevel
}

export type TryoutStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published' | 'closed'

export interface Tryout {
  id: string
  nama_tryout: string
  mata_pelajaran: string
  sub_mata_pelajaran?: string | null
  kelas?: string | null
  durasi_menit: number
  dibuat_oleh: string
  status: TryoutStatus
  revision_notes?: string | null
  randomize_questions?: boolean
  randomize_options?: boolean
  is_super_tryout?: boolean
  is_per_question_timer_enabled?: boolean
  soal_count?: number
  total_bobot?: number
  jumlah_peserta?: number
  created_at: string
  updated_at: string
}

export interface RekapStudent {
  nama_siswa: string
  kelas: string
  nilai: number
  selesai_at: string | null
}

export interface OpsiJawaban {
  id: string
  soal_id?: string
  huruf: string
  teks: string
  teks_html?: string | null
  is_benar?: boolean
}

// TRN-22: AKM question types.
//  pilihan_ganda  — single correct option (radio)
//  pg_kompleks    — complex MC, one or more correct options (checkbox)
//  menjodohkan    — matching: pair left[i] ↔ right[i]
//  isian_singkat  — short answer keyword
//  essay          — free text, manually graded
export type SoalTipe =
  | 'pilihan_ganda'
  | 'pg_kompleks'
  | 'menjodohkan'
  | 'isian_singkat'
  | 'essay'

// TRN-22: menjodohkan answer key — left[i] is matched to right[i].
export interface MatchingPairs {
  left: string[]
  right: string[]
}

// Human-readable labels for the question-type dropdowns.
export const SOAL_TIPE_LABELS: Record<SoalTipe, string> = {
  pilihan_ganda: 'Pilihan Ganda',
  pg_kompleks: 'Pilihan Ganda Kompleks',
  menjodohkan: 'Menjodohkan',
  isian_singkat: 'Isian Singkat',
  essay: 'Esai',
}

export interface Soal {
  id: string
  tryout_id: string
  nomor_soal: number
  tipe: SoalTipe
  pertanyaan: string
  pertanyaan_html?: string | null
  gambar_url?: string | null
  gambar_base64?: string | null
  equation?: string | null
  equation_latex?: string | null
  panduan_essay?: string | null
  bobot: number
  // TRN-10: question code + solution/explanation
  kode_soal?: string | null
  penyelesaian?: string | null
  penyelesaian_html?: string | null
  penyelesaian_gambar_url?: string | null
  penyelesaian_gambar_base64?: string | null
  time_limit_seconds?: number | null
  // TRN-22: AKM answer keys
  jawaban_benar?: string | null     // isian_singkat: accepted keywords (newline-separated)
  matching_pairs?: MatchingPairs | null // menjodohkan
  opsi?: OpsiJawaban[]
  created_at: string
}

export interface TryoutDetail extends Tryout {
  soal: Soal[]
}

export interface SesiTryout {
  id: string
  siswa_id: string
  tryout_id: string
  mulai_at: string
  selesai_at?: string | null
  status: 'berlangsung' | 'selesai' | 'timeout'
  question_order?: string[] | null
  option_order?: Record<string, string[]> | null
}

export interface Jawaban {
  id: string
  sesi_id: string
  soal_id: string
  jawaban_teks?: string | null
  opsi_id?: string | null
}

export interface Hasil {
  id: string
  sesi_id: string
  siswa_id: string
  tryout_id: string
  total_benar: number
  total_soal: number
  nilai: number | string
  dihitung_at: string
}

export interface HasilRekapItem {
  sesi_id: string
  siswa_id: string
  nama_siswa: string
  kelas: string
  nilai: number
  total_benar: number
  total_soal: number
  selesai_at: string | null
  durasi_menit: number | null
}

export interface HasilRekapMeta {
  nama_tryout: string
  mata_pelajaran: string
  total_soal: number
}

export interface HasilRekap {
  tryout?: HasilRekapMeta
  summary: {
    total_peserta: number
    rata_rata_nilai: number
    nilai_tertinggi: number
    nilai_terendah: number
  }
  hasil: HasilRekapItem[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  email: string
  role: string
  action: string
  target_id: string | null
  description: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Paginated<T> {
  success: boolean
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
