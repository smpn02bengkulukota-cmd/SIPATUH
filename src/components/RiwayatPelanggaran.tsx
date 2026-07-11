/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PelanggaranJoined, Siswa, JenisPelanggaran, User } from '../types';
import { 
  History, Search, Calendar, Filter, Download, Printer, 
  Trash2, Edit2, AlertCircle, Phone, FileSpreadsheet, X, Check 
} from 'lucide-react';

interface RiwayatPelanggaranProps {
  pelanggaran: PelanggaranJoined[];
  siswaList: Siswa[];
  jenisPelanggaran: JenisPelanggaran[];
  users: User[];
  currentUser: User;
  onSavePelanggaran: (p: any) => Promise<any>;
  onDeletePelanggaran: (id: number) => Promise<any>;
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

export default function RiwayatPelanggaran({
  pelanggaran,
  siswaList,
  jenisPelanggaran,
  users,
  currentUser,
  onSavePelanggaran,
  onDeletePelanggaran,
  schoolName
}: RiwayatPelanggaranProps) {
  const isAdmin = currentUser.level === 'admin';

  // Search & Filter States
  const [searchSiswa, setSearchSiswa] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterGuru, setFilterGuru] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Editing States (Admin only)
  const [editingItem, setEditingItem] = useState<PelanggaranJoined | null>(null);
  const [editSiswaId, setEditSiswaId] = useState<number | ''>('');
  const [editPelanggaranId, setEditPelanggaranId] = useState<number | ''>('');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editError, setEditError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  // 1. Get unique classes and recorders for filter dropdowns
  const uniqueClasses = Array.from(new Set(siswaList.map(s => s.kelas))).sort();
  const recorders = users.filter(u => u.status === 'aktif');

  // 2. Multi-criteria Filtering
  const filteredRecords = pelanggaran.filter(rec => {
    // Student fuzzy match (name/nisn)
    const matchesSiswa = 
      !searchSiswa || 
      rec.nama_siswa?.toLowerCase().includes(searchSiswa.toLowerCase()) ||
      String(rec.nisn_siswa || '').includes(searchSiswa);

    // Class match
    const matchesClass = !filterKelas || rec.kelas_siswa === filterKelas;

    // Guru match
    const matchesGuru = !filterGuru || rec.guru_id === Number(filterGuru);

    // Date range match
    const matchesStartDate = !startDate || rec.tanggal >= startDate;
    const matchesEndDate = !endDate || rec.tanggal <= endDate;

    return matchesSiswa && matchesClass && matchesGuru && matchesStartDate && matchesEndDate;
  });

  // 3. Actions: Delete Log Entry
  const handleDelete = async (id: number, studentName: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus catatan pelanggaran untuk "${studentName}"? Poin yang dikurangi akan dikembalikan.`)) {
      try {
        await onDeletePelanggaran(id);
        setEditSuccess('Catatan pelanggaran berhasil dihapus!');
        setTimeout(() => setEditSuccess(''), 3000);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus catatan.');
      }
    }
  };

  // 4. Actions: Edit Log Entry (Admin Only)
  const handleOpenEdit = (rec: PelanggaranJoined) => {
    setEditingItem(rec);
    setEditSiswaId(rec.siswa_id);
    setEditPelanggaranId(rec.pelanggaran_id);
    setEditKeterangan(rec.keterangan);
    setEditTanggal(rec.tanggal);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editSiswaId || !editPelanggaranId || !editTanggal) {
      setEditError('Semua field wajib diisi.');
      return;
    }

    const selectedViolation = jenisPelanggaran.find(v => v.id === Number(editPelanggaranId));
    if (!selectedViolation) {
      setEditError('Jenis pelanggaran tidak valid.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError('');

    try {
      await onSavePelanggaran({
        id: editingItem.id,
        tanggal: editTanggal,
        siswa_id: Number(editSiswaId),
        pelanggaran_id: selectedViolation.id,
        guru_id: editingItem.guru_id, // preserve original recorder
        point: selectedViolation.point,
        keterangan: editKeterangan.trim() || selectedViolation.nama_pelanggaran
      });

      setEditSuccess('Catatan pelanggaran berhasil diperbarui!');
      setEditingItem(null);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err: any) {
      setEditError(err.message || 'Gagal memperbarui catatan.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 5. Export to Excel/CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data yang dapat diekspor dengan filter saat ini.');
      return;
    }

    // Construct CSV Header
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,Tanggal,NISN,Nama Siswa,Kelas,Pelanggaran,Poin,Keterangan,Guru BK\n';

    // Construct Rows
    filteredRecords.forEach((rec, idx) => {
      const row = [
        idx + 1,
        rec.tanggal,
        `"${rec.nisn_siswa}"`,
        `"${rec.nama_siswa}"`,
        `"${rec.kelas_siswa}"`,
        `"${rec.nama_pelanggaran}"`,
        rec.point,
        `"${rec.keterangan || '-'}"`,
        `"${rec.nama_guru}"`
      ].join(',');
      csvContent += row + '\n';
    });

    // Create Download Link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pelanggaran_${schoolName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. Print Report (opens system browser print dialog)
  const handlePrint = () => {
    window.print();
  };

  // 7. WhatsApp sharing direct link trigger
  const handleSendWhatsAppDirect = (rec: PelanggaranJoined) => {
    // Sum total points of this student
    const studentRecords = pelanggaran.filter(p => p.siswa_id === rec.siswa_id);
    const cumulative = studentRecords.reduce((sum, p) => sum + (p.point || 0), 0);

    const listString = studentRecords
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
${cumulative} Point

Mohon kerja sama Bapak/Ibu dalam memberikan pembinaan kepada putra/putrinya.
Terima kasih.

Guru BK
${rec.nama_guru || currentUser.nama}
${schoolName}`;

    const url = `https://api.whatsapp.com/send?phone=${rec.wa_ortu}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:bg-white">
      {/* Header and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Riwayat & Laporan Pelanggaran
          </h2>
          <p className="text-gray-500 text-sm">
            {isAdmin 
              ? 'Kelola data pelanggaran siswa secara menyeluruh. Lakukan edit, hapus, maupun ekspor laporan.'
              : 'Daftar semua pelanggaran yang tercatat di sekolah beserta total poin akumulasi.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {editSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 print:hidden">
          <Check className="w-4 h-4 text-emerald-600" /> {editSuccess}
        </div>
      )}

      {/* Printable Report Header */}
      <div className="hidden print:block text-center space-y-2 border-b border-gray-300 pb-5 mb-6">
        <h1 className="text-xl font-extrabold text-black uppercase tracking-wider">Laporan Poin Pelanggaran Siswa</h1>
        <h2 className="text-base font-bold text-gray-800 uppercase">{schoolName}</h2>
        <p className="text-xs text-gray-500">
          Dicetak pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {(startDate || endDate) && (
          <p className="text-xs font-semibold text-gray-600">
            Periode: {startDate || 'Awal'} s.d. {endDate || 'Hari ini'}
          </p>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 print:hidden">
        <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide text-gray-400">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          Filter & Pencarian Laporan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Student fuzzy Search */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Cari Siswa</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nama atau NISN..."
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Kelas</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium text-gray-700"
            >
              <option value="">Semua Kelas</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Recorder Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Guru Pencatat</label>
            <select
              value={filterGuru}
              onChange={(e) => setFilterGuru(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium text-gray-700"
            >
              <option value="">Semua Guru</option>
              {recorders.map(u => (
                <option key={u.id} value={u.id}>{u.nama}</option>
              ))}
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
              />
            </div>
          </div>

          {/* Tanggal Selesai */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Tanggal Selesai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse print:text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/20 print:bg-transparent print:text-black print:border-gray-300">
                <th className="py-3 px-4 text-center w-12 print:px-2">No</th>
                <th className="py-3 px-4 print:px-2">Tanggal</th>
                <th className="py-3 px-4 print:px-2">Siswa</th>
                <th className="py-3 px-4 print:px-2">Kelas</th>
                <th className="py-3 px-4 print:px-2">Bentuk Pelanggaran</th>
                <th className="py-3 px-4 text-center print:px-2">Poin</th>
                <th className="py-3 px-4 print:px-2">Keterangan</th>
                <th className="py-3 px-4 print:px-2">Pencatat</th>
                <th className="py-3 px-4 text-center print:hidden">Laporan</th>
                {isAdmin && <th className="py-3 px-4 text-center print:hidden w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 print:divide-y print:divide-gray-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="text-center py-12 text-xs text-gray-400">
                    Tidak ada catatan pelanggaran yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className="text-xs text-gray-600 hover:bg-gray-50/40 transition-colors print:text-black">
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-gray-400 print:px-2">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] print:px-2 whitespace-nowrap">
                      {rec.tanggal}
                    </td>
                    <td className="py-3.5 px-4 print:px-2">
                      <div>
                        <p className="font-bold text-gray-900 print:text-black">{rec.nama_siswa}</p>
                        <p className="text-[9px] text-gray-400 font-mono print:hidden">NISN: {rec.nisn_siswa}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 print:px-2 font-semibold">
                      {rec.kelas_siswa}
                    </td>
                    <td className="py-3.5 px-4 print:px-2 font-medium">
                      {rec.nama_pelanggaran}
                    </td>
                    <td className="py-3.5 px-4 text-center print:px-2">
                      <span className={`px-2 py-0.5 rounded-sm font-bold font-mono text-[10px] ${
                        rec.point >= 50 
                          ? 'bg-red-50 text-red-700' 
                          : rec.point >= 25 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-emerald-50 text-emerald-700'
                      } print:bg-transparent print:text-black print:p-0 print:font-bold`}>
                        {rec.point}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 print:px-2 text-gray-500 max-w-xs truncate" title={rec.keterangan}>
                      {rec.keterangan || '-'}
                    </td>
                    <td className="py-3.5 px-4 print:px-2 text-gray-400 print:text-black">
                      {rec.nama_guru}
                    </td>
                    <td className="py-3.5 px-4 text-center print:hidden">
                      {rec.wa_ortu ? (
                        <button
                          onClick={() => handleSendWhatsAppDirect(rec)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-2 py-1 rounded-lg cursor-pointer"
                        >
                          <Phone className="w-3 h-3" /> Ortu
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Catatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id, rec.nama_siswa || '')}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Penalty Log Modal (Admin Only) */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-150 shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                Ubah Catatan Pelanggaran
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nama Siswa</label>
                <select
                  required
                  value={editSiswaId}
                  onChange={(e) => setEditSiswaId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {siswaList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas}) - NISN: {s.nisn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tanggal Kejadian</label>
                <input
                  type="date"
                  required
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Bentuk Pelanggaran</label>
                <select
                  required
                  value={editPelanggaranId}
                  onChange={(e) => setEditPelanggaranId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="">-- Pilih Pelanggaran --</option>
                  {jenisPelanggaran.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nama_pelanggaran} ({v.point} Poin)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Keterangan Khusus</label>
                <textarea
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500"
                  placeholder="Misal: Keterangan tambahan..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
