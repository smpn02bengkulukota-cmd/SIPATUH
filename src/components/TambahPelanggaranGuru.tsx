/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Siswa, JenisPelanggaran, PelanggaranJoined, User } from '../types';
import { Search, UserCheck, ShieldAlert, Calendar, FileText, Check, AlertCircle, Phone, ArrowLeft, Send } from 'lucide-react';

interface TambahPelanggaranProps {
  siswaList: Siswa[];
  jenisPelanggaran: JenisPelanggaran[];
  pelanggaranList: PelanggaranJoined[];
  currentUser: User;
  onSavePelanggaran: (p: any) => Promise<any>;
  onNavigateToHistory: () => void;
  schoolName: string;
}

const formatTanggal = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export default function TambahPelanggaranGuru({
  siswaList,
  jenisPelanggaran,
  pelanggaranList,
  currentUser,
  onSavePelanggaran,
  onNavigateToHistory,
  schoolName
}: TambahPelanggaranProps) {
  // 1. Student Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);

  // 2. Penalty Entry States
  const [pelanggaranId, setPelanggaranId] = useState<number | ''>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successRecord, setSuccessRecord] = useState<PelanggaranJoined | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fuzz search students by name or NISN
  const matchingSiswa = siswaList.filter(
    s =>
      searchQuery.trim().length > 0 &&
      (s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || String(s.nisn || '').includes(searchQuery))
  );

  // Calculate selected student's previous point accumulation (excluding the newly created one if shown)
  const previousRecords = selectedSiswa
    ? pelanggaranList.filter(p => p.siswa_id === selectedSiswa.id && (!successRecord || p.id !== successRecord.id))
    : [];
  
  const previousPoints = previousRecords.reduce((sum, p) => sum + (p.point || 0), 0);

  // Accumulated points is previous points plus the new violation point (if saved)
  const accumulatedPoints = successRecord 
    ? previousPoints + successRecord.point 
    : previousPoints;

  const handleSelectSiswa = (s: Siswa) => {
    setSelectedSiswa(s);
    setSearchQuery('');
    setPelanggaranId('');
    setKeterangan('');
    setSuccessRecord(null);
    setErrorMsg('');
  };

  const handleResetSiswa = () => {
    setSelectedSiswa(null);
    setSuccessRecord(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa || !pelanggaranId) {
      setErrorMsg('Harap pilih siswa dan jenis pelanggaran.');
      return;
    }

    const selectedViolation = jenisPelanggaran.find(v => v.id === Number(pelanggaranId));
    if (!selectedViolation) {
      setErrorMsg('Jenis pelanggaran tidak valid.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const saved = await onSavePelanggaran({
        tanggal,
        siswa_id: selectedSiswa.id,
        pelanggaran_id: selectedViolation.id,
        guru_id: currentUser.id,
        point: selectedViolation.point,
        keterangan: keterangan.trim() || selectedViolation.nama_pelanggaran
      });

      // Construct a joined object to display success info
      const joinedSuccess: PelanggaranJoined = {
        ...saved,
        nama_siswa: selectedSiswa.nama,
        nisn_siswa: selectedSiswa.nisn,
        kelas_siswa: selectedSiswa.kelas,
        nama_ortu: selectedSiswa.nama_ortu,
        wa_ortu: selectedSiswa.wa_ortu,
        nama_pelanggaran: selectedViolation.nama_pelanggaran,
        nama_guru: currentUser.nama
      };

      setSuccessRecord(joinedSuccess);
      setPelanggaranId('');
      setKeterangan('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan catatan pelanggaran.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate WhatsApp notification text matching the format exactly
  const generateWhatsAppText = (rec: PelanggaranJoined, accumulated: number) => {
    // Collect other violations of this student (excluding the newly added one)
    const otherViolations = pelanggaranList.filter(p => p.siswa_id === rec.siswa_id && p.id !== rec.id);
    
    // Combine with the new record at the end of the list
    const studentViolations = [...otherViolations, rec];

    const listString = studentViolations
      .map((p, idx) => `${idx + 1}. ${p.nama_pelanggaran} (${p.point} Point) pada ${formatTanggal(p.tanggal)}`)
      .join('\n');

    const text = `Yth. Bapak/Ibu Orang Tua/Wali
Kami memberitahukan bahwa:
Nama : ${rec.nama_siswa}
NISN : ${rec.nisn_siswa}
Kelas : ${rec.kelas_siswa}

Telah melakukan pelanggaran sebagai berikut:
${listString}

Pelanggaran terbaru:
${rec.nama_pelanggaran} (${rec.point} Point) pada tanggal ${formatTanggal(rec.tanggal)}

Akumulasi Point:
${accumulated} Point

Mohon kerja sama Bapak/Ibu dalam memberikan pembinaan kepada putra/putrinya.
Terima kasih.

Guru BK
${currentUser.nama}
${schoolName}`;

    return encodeURIComponent(text);
  };

  const handleSendWhatsApp = (rec: PelanggaranJoined) => {
    const encodedText = generateWhatsAppText(rec, accumulatedPoints);
    const url = `https://api.whatsapp.com/send?phone=${rec.wa_ortu}&text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Catat Pelanggaran Baru</h2>
          <p className="text-gray-500 text-sm">Alur pencatatan poin pelanggaran siswa dan pengiriman laporan WhatsApp orang tua.</p>
        </div>
      </div>

      {/* STEP 1: Search and Select Student */}
      {!selectedSiswa ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Search className="w-4 h-4 text-emerald-600" />
            Langkah 1: Cari & Pilih Siswa
          </h3>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik Nama Siswa atau NISN (Contoh: Andi Saputra atau 00991)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              autoFocus
            />
          </div>

          {searchQuery.trim().length > 0 && matchingSiswa.length === 0 && (
            <p className="text-xs text-rose-500 font-medium">Siswa tidak ditemukan. Silakan masukkan kata kunci nama lain atau NISN yang sesuai.</p>
          )}

          {matchingSiswa.length > 0 && (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden shadow-2xs">
              {matchingSiswa.map(s => {
                // Calculate their points to show in search
                const points = pelanggaranList
                  .filter(p => p.siswa_id === s.id)
                  .reduce((sum, p) => sum + (p.point || 0), 0);

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSiswa(s)}
                    className="w-full px-4 py-3 text-left hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{s.nama}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">NISN: {s.nisn} | Kelas: {s.kelas}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {points > 0 ? (
                        <span className="text-[10px] font-extrabold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">
                          Terakumulasi: {points} Poin
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">
                          0 Poin (Bersih)
                        </span>
                      )}
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: Input Penalty detail for Selected Student */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Student Identity Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <button
              onClick={handleResetSiswa}
              className="text-xs font-semibold text-gray-500 hover:text-emerald-600 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Cari Siswa Lain
            </button>

            <div className="border-b border-gray-100 pb-4">
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">Profil Siswa Terpilih</span>
              <h3 className="font-extrabold text-gray-900 text-base mt-2">{selectedSiswa.nama}</h3>
              <p className="text-xs text-gray-400 font-medium">NISN: {selectedSiswa.nisn}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Kelas</span>
                <span className="font-bold text-gray-800">{selectedSiswa.kelas}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Nama Orang Tua / Wali</span>
                <span className="font-bold text-gray-800">{selectedSiswa.nama_ortu}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Nomor WhatsApp Ortu</span>
                <span className="font-bold text-emerald-600 font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  +{selectedSiswa.wa_ortu}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <span className="text-gray-400 font-semibold block uppercase text-[10px] mb-1">Status Akumulasi Poin Saat Ini</span>
                <span className={`inline-block font-extrabold text-sm px-3 py-1 rounded-xl ${
                  accumulatedPoints >= 50 ? 'bg-red-50 text-red-700' : accumulatedPoints >= 25 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {accumulatedPoints} Poin Pelanggaran
                </span>
              </div>
            </div>
          </div>

          {/* Center & Right panel: Input Form and WhatsApp Trigger */}
          <div className="lg:col-span-2 space-y-6">
            {!successRecord ? (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-emerald-600" />
                  Langkah 2: Isi Formulir Pelanggaran
                </h3>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" /> {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tanggal Kejadian</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Jenis Pelanggaran Tata Tertib</label>
                  <select
                    required
                    value={pelanggaranId}
                    onChange={(e) => setPelanggaranId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium text-gray-700"
                  >
                    <option value="">-- Pilih Peraturan Yang Dilanggar --</option>
                    {jenisPelanggaran.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.nama_pelanggaran} ({v.point} Poin)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Keterangan Tambahan (Tempat/Kejadian)</label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="Contoh: Terlambat di gerbang sekolah jam 07.25, tidak memakai atribut lengkap dasi."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSaving ? 'Menyimpan Catatan...' : 'Simpan & Catat Pelanggaran'}
                </button>
              </form>
            ) : (
              /* Success Page & WhatsApp Share Trigger */
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 text-center animate-scale-up">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <Check className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Pelanggaran Berhasil Dicatat!</h3>
                  <p className="text-gray-500 text-xs mt-1">Data pelanggaran telah diunggah ke database (Google Spreadsheet/Lokal).</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left text-xs max-w-md mx-auto space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Siswa:</span>
                    <span className="font-bold text-gray-950">{successRecord.nama_siswa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Tanggal Pelanggaran:</span>
                    <span className="font-bold text-gray-950">{formatTanggal(successRecord.tanggal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Pelanggaran:</span>
                    <span className="font-bold text-gray-950 text-right">{successRecord.nama_pelanggaran}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Poin Pelanggaran:</span>
                    <span className="font-bold text-rose-600 font-mono">+{successRecord.point} Poin</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-150 pt-2 mt-1">
                    <span className="text-gray-400 font-bold">Akumulasi Baru:</span>
                    <span className="font-extrabold text-rose-600 font-mono text-sm">{accumulatedPoints} Poin</span>
                  </div>
                </div>

                {/* WhatsApp Action Area */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 max-w-md mx-auto space-y-3">
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 justify-center">
                    <Send className="w-4 h-4 text-emerald-600" />
                    Kirim Notifikasi Laporan ke Orang Tua
                  </h4>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Kirim rangkuman pelanggaran dan akumulasi total poin langsung ke WhatsApp Orang Tua (<strong>{successRecord.nama_ortu}</strong>) dengan teks yang sudah terformat rapi.
                  </p>
                  <button
                    onClick={() => handleSendWhatsApp(successRecord)}
                    className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    Kirim Laporan via WhatsApp
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleResetSiswa}
                    className="px-4 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-xl cursor-pointer"
                  >
                    Input Siswa Lain
                  </button>
                  <button
                    onClick={onNavigateToHistory}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Lihat Semua Riwayat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
