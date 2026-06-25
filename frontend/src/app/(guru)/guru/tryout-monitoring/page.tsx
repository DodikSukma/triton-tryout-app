'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, BarChart2, Users, ChevronRight, X, CheckCircle2, XCircle, MinusCircle, ArrowLeft,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { LEVELS, LEVEL_LABELS, levelPath, type Level } from '@/lib/level'
import RenderHTML from '@/components/shared/RenderHTML'
import TritonLoader from '@/components/common/TritonLoader'
import {
  ApiResponse, Hasil, HasilRekap, HasilRekapItem, OpsiJawaban, SesiTryout, Soal, Tryout,
} from '@/types'

type MonitoredTryout = Tryout & { level: Level }

interface HasilDetailItem {
  soal: Soal
  student_answer: { opsi_id: string | null; jawaban_teks: string | null } | null
  student_opsi: OpsiJawaban | null
  correct_opsi: OpsiJawaban | null
  is_correct: boolean
  is_skipped: boolean
}
interface HasilResponse {
  hasil: Hasil
  sesi: SesiTryout
  tryout: Tryout | null
  detail: HasilDetailItem[]
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', pending_approval: 'Menunggu', approved: 'Disetujui',
  rejected: 'Revisi', published: 'Aktif', closed: 'Selesai',
}

export default function GuruMonitoringPage() {
  const [tryouts, setTryouts] = useState<MonitoredTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MonitoredTryout | null>(null)
  const [rekap, setRekap] = useState<HasilRekapItem[] | null>(null)
  const [rekapLoading, setRekapLoading] = useState(false)
  const [detailFor, setDetailFor] = useState<HasilRekapItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const lists = await Promise.all(
        LEVELS.map(async (lv) => {
          try {
            const r = await api.get<ApiResponse<Tryout[]>>(levelPath('/tryouts', lv))
            return (r.data.data ?? []).map((t) => ({ ...t, level: lv }))
          } catch {
            return [] as MonitoredTryout[]
          }
        })
      )
      setTryouts(lists.flat())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function openTryout(t: MonitoredTryout) {
    setSelected(t)
    setRekap(null)
    setRekapLoading(true)
    try {
      const r = await api.get<ApiResponse<HasilRekap>>(levelPath(`/hasil/rekap/${t.id}`, t.level))
      setRekap(r.data.data?.hasil ?? [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat peserta.'))
      setRekap([])
    } finally {
      setRekapLoading(false)
    }
  }

  if (loading) return <TritonLoader fullScreen={false} />

  // ─── Detail of one tryout (respondents) ───
  if (selected) {
    return (
      <div className="p-4 md:p-6 lg:p-10 max-w-5xl mx-auto">
        <button onClick={() => { setSelected(null); setRekap(null) }} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4">
          <ArrowLeft size={15} /> Kembali ke daftar
        </button>

        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{selected.nama_tryout}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {LEVEL_LABELS[selected.level]} · {selected.mata_pelajaran}{selected.kelas ? ` · ${selected.kelas}` : ''}
        </p>

        <div className="mt-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-500">
            <Users size={15} className="text-blue-500" /> Peserta yang Mengerjakan
          </div>
          {rekapLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : !rekap || rekap.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">Belum ada siswa yang mengerjakan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Nama Siswa</th>
                    <th className="text-left px-4 py-3">Kelas</th>
                    <th className="text-center px-4 py-3">Nilai</th>
                    <th className="text-center px-4 py-3">Benar</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rekap.map((s) => (
                    <tr key={s.sesi_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{s.nama_siswa}</td>
                      <td className="px-4 py-2.5 text-slate-500">{s.kelas}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-bold tabular-nums ${s.nilai >= 75 ? 'text-green-600' : s.nilai >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{Math.round(s.nilai)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500 tabular-nums">{s.total_benar}/{s.total_soal}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => setDetailFor(s)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                          Lihat Jawaban <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {detailFor && selected && (
          <AnswerDetailModal student={detailFor} level={selected.level} onClose={() => setDetailFor(null)} />
        )}
      </div>
    )
  }

  // ─── Tryout list ───
  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart2 size={24} className="text-blue-500" /> Monitoring Tryout
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Pantau peserta dan jawaban pada tryout mata pelajaran Anda (termasuk Super Try Out).
        </p>
      </header>

      {tryouts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-sm text-slate-400">
          Belum ada tryout untuk dipantau.
        </div>
      ) : (
        <div className="space-y-3">
          {tryouts.map((t) => (
            <button
              key={`${t.level}-${t.id}`}
              onClick={() => openTryout(t)}
              className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm hover:border-blue-200 transition-colors flex items-center gap-3"
            >
              <span className="text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 rounded px-2 py-0.5">{LEVEL_LABELS[t.level]}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                  {t.nama_tryout}
                  {t.is_super_tryout && <span className="text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5">Super</span>}
                </p>
                <p className="text-xs text-slate-500">{t.mata_pelajaran}{t.kelas ? ` · ${t.kelas}` : ''} · {t.soal_count ?? 0} soal</p>
              </div>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{STATUS_LABEL[t.status] ?? t.status}</span>
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Per-student answer detail modal ───
function AnswerDetailModal({ student, level, onClose }: { student: HasilRekapItem; level: Level; onClose: () => void }) {
  const [data, setData] = useState<HasilResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get<ApiResponse<HasilResponse>>(levelPath(`/hasil/${student.sesi_id}`, level))
      .then((r) => { if (!cancelled) setData(r.data.data ?? null) })
      .catch((err) => { if (!cancelled) toast.error(getErrorMessage(err, 'Gagal memuat jawaban.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [student.sesi_id, level])

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{student.nama_siswa}</h3>
            <p className="text-xs text-slate-400">Nilai {Math.round(student.nilai)} · {student.total_benar}/{student.total_soal} benar</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : !data || data.detail.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Tidak ada detail jawaban.</p>
          ) : (
            data.detail.map((item, i) => {
              const isPG = item.soal.tipe === 'pilihan_ganda'
              const status = item.is_skipped
                ? { Icon: MinusCircle, cls: 'text-slate-400', label: 'Tidak Dijawab' }
                : item.is_correct
                  ? { Icon: CheckCircle2, cls: 'text-green-500', label: 'Benar' }
                  : { Icon: XCircle, cls: 'text-red-500', label: isPG ? 'Salah' : 'Perlu Penilaian' }
              return (
                <div key={item.soal.id} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5 bg-slate-100 text-slate-500">{isPG ? 'PG' : 'Essay'}</span>
                    <span className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold ${status.cls}`}>
                      <status.Icon size={14} /> {status.label}
                    </span>
                  </div>
                  <RenderHTML html={item.soal.pertanyaan_html || item.soal.pertanyaan || ''} className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed" />

                  {isPG ? (
                    <div className="mt-2 space-y-1.5">
                      {item.student_opsi && (
                        <div className={`rounded-lg border px-3 py-2 text-sm ${item.is_correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          <span className="text-[11px] font-bold uppercase mr-2">Jawaban Siswa</span>
                          <strong>{item.student_opsi.huruf}.</strong> <RenderHTML className="inline" html={item.student_opsi.teks_html || item.student_opsi.teks} />
                        </div>
                      )}
                      {!item.is_correct && item.correct_opsi && (
                        <div className="rounded-lg border border-green-300 bg-green-50 text-green-700 px-3 py-2 text-sm">
                          <span className="text-[11px] font-bold uppercase mr-2">Jawaban Benar</span>
                          <strong>{item.correct_opsi.huruf}.</strong> <RenderHTML className="inline" html={item.correct_opsi.teks_html || item.correct_opsi.teks} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Jawaban Siswa</p>
                      {item.student_answer?.jawaban_teks
                        ? <RenderHTML html={item.student_answer.jawaban_teks} className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap" />
                        : <p className="text-sm italic text-slate-400">(tidak ada jawaban)</p>}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
