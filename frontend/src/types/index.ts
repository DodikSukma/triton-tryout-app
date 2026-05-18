export type Role = 'admin' | 'guru' | 'siswa'

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
  avatar_url?: string | null
  bio?: string | null
  created_at: string
  updated_at: string
}

export type TryoutStatus = 'draft' | 'published' | 'closed'

export interface Tryout {
  id: string
  nama_tryout: string
  mata_pelajaran: string
  durasi_menit: number
  dibuat_oleh: string
  status: TryoutStatus
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

export type SoalTipe = 'pilihan_ganda' | 'essay'

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
