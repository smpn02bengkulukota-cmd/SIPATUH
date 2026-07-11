/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Siswa } from '../types';
import { Plus, Edit2, Trash2, Search, Check, AlertCircle, X, GraduationCap, Phone } from 'lucide-react';

interface KelolaSiswaProps {
  siswa: Siswa[];
  onSaveSiswa: (s: Omit<Siswa, 'id'> & { id?: number }) => Promise<any>;
  onDeleteSiswa: (id: number) => Promise<any>;
}

export default function KelolaSiswa({ siswa, onSaveSiswa, onDeleteSiswa }: KelolaSiswaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [id, setId] = useState<number | undefined>(undefined);
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [kelas, setKelas] = useState('');
  const [namaOrtu, setNamaOrtu] = useState('');
  const [waOrtu, setWaOrtu] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredSiswa = siswa.filter(
    s =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.nisn || '').includes(searchTerm) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setId(undefined);
    setNama('');
    setNisn('');
    setKelas('');
    setNamaOrtu('');
    setWaOrtu('');
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (s: Siswa) => {
    setId(s.id);
    setNama(s.nama);
    setNisn(s.nisn);
    setKelas(s.kelas);
    setNamaOrtu(s.nama_ortu);
    setWaOrtu(s.wa_ortu);
    setError('');
    setShowModal(true);
  };

  const formatWhatsAppNumber = (phoneStr: string): string => {
    let clean = phoneStr.replace(/\D/g, ''); // strip non-numeric
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    if (!clean.startsWith('62') && clean.length > 0) {
      clean = '62' + clean;
    }
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!nama.trim() || !nisn.trim() || !kelas.trim() || !namaOrtu.trim() || !waOrtu.trim()) {
      setError('Semua field wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    const formattedWa = formatWhatsAppNumber(waOrtu);
    if (formattedWa.length < 10) {
      setError('Format Nomor WhatsApp orang tua tidak valid (misal: 08123456789 atau 628123456789).');
      setIsSubmitting(false);
      return;
    }

    // Duplicate NISN check
    const duplicate = siswa.find(s => s.nisn === nisn.trim() && s.id !== id);
    if (duplicate) {
      setError('NISN sudah terdaftar pada siswa lain.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSaveSiswa({
        id,
        nama: nama.trim(),
        nisn: nisn.trim(),
        kelas: kelas.trim().toUpperCase(),
        nama_ortu: namaOrtu.trim(),
        wa_ortu: formattedWa
      });

      setSuccess(id ? 'Data siswa berhasil diperbarui!' : 'Siswa baru berhasil ditambahkan!');
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data siswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: Siswa) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus siswa "${s.nama}"? Semua riwayat poin siswa ini mungkin kehilangan relasi nama.`)) {
      try {
        await onDeleteSiswa(s.id);
        setSuccess('Data siswa berhasil dihapus!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus siswa.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            Kelola Roster Siswa
          </h2>
          <p className="text-gray-500 text-sm">Kelola data induk siswa beserta kontak WhatsApp orang tua wali kelas.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-xs flex items-center gap-1.5 shadow-sm self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-scale-up">
          <Check className="w-4 h-4 text-emerald-600" /> {success}
        </div>
      )}

      {/* Filter and List Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NISN, atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-semibold uppercase tracking-wider bg-gray-50/20">
                <th className="py-3 px-6">NISN</th>
                <th className="py-3 px-6">Nama Siswa</th>
                <th className="py-3 px-6">Kelas</th>
                <th className="py-3 px-6">Orang Tua / Wali</th>
                <th className="py-3 px-6">No. WA Orang Tua</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-gray-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map(s => (
                  <tr key={s.id} className="text-xs text-gray-600 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-gray-900">{s.nisn}</td>
                    <td className="py-4 px-6 font-semibold text-gray-950">{s.nama}</td>
                    <td className="py-4 px-6">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-md text-[10px] font-mono">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{s.nama_ortu}</td>
                    <td className="py-4 px-6">
                      <a
                        href={`https://wa.me/${s.wa_ortu}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 font-medium hover:underline font-mono"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        +{s.wa_ortu}
                      </a>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-150 shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                {id ? 'Edit Detail Siswa' : 'Registrasi Siswa Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Contoh: Andi Saputra"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    required
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                    placeholder="Contoh: 00991"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                    placeholder="Contoh: XI IPA 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  required
                  value={namaOrtu}
                  onChange={(e) => setNamaOrtu(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Contoh: Bapak Joko Widodo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">No. WhatsApp Orang Tua</label>
                <input
                  type="text"
                  required
                  value={waOrtu}
                  onChange={(e) => setWaOrtu(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                  placeholder="Contoh: 08123456789"
                />
                <p className="text-[10px] text-gray-400 mt-1">Masukkan nomor aktif agar dapat menerima laporan langsung via tombol kirim WA.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
