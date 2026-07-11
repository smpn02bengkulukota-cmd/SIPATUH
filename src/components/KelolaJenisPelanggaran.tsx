/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JenisPelanggaran } from '../types';
import { Plus, Edit2, Trash2, Search, Check, AlertCircle, X, ShieldAlert, Award } from 'lucide-react';

interface KelolaJenisPelanggaranProps {
  jenisPelanggaran: JenisPelanggaran[];
  onSaveJenisPelanggaran: (item: Omit<JenisPelanggaran, 'id'> & { id?: number }) => Promise<any>;
  onDeleteJenisPelanggaran: (id: number) => Promise<any>;
}

export default function KelolaJenisPelanggaran({
  jenisPelanggaran,
  onSaveJenisPelanggaran,
  onDeleteJenisPelanggaran
}: KelolaJenisPelanggaranProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [id, setId] = useState<number | undefined>(undefined);
  const [namaPelanggaran, setNamaPelanggaran] = useState('');
  const [point, setPoint] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredJenis = jenisPelanggaran.filter(
    item =>
      item.nama_pelanggaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.point.toString().includes(searchTerm)
  );

  const resetForm = () => {
    setId(undefined);
    setNamaPelanggaran('');
    setPoint(5);
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (item: JenisPelanggaran) => {
    setId(item.id);
    setNamaPelanggaran(item.nama_pelanggaran);
    setPoint(item.point);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!namaPelanggaran.trim() || point <= 0) {
      setError('Nama pelanggaran dan bobot poin harus diisi dengan benar.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSaveJenisPelanggaran({
        id,
        nama_pelanggaran: namaPelanggaran.trim(),
        point: Number(point)
      });

      setSuccess(id ? 'Jenis pelanggaran diperbarui!' : 'Jenis pelanggaran baru ditambahkan!');
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan jenis pelanggaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: JenisPelanggaran) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus peraturan "${item.nama_pelanggaran}"?`)) {
      try {
        await onDeleteJenisPelanggaran(item.id);
        setSuccess('Jenis pelanggaran berhasil dihapus!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus jenis pelanggaran.');
      }
    }
  };

  const getPointBadgeColor = (p: number) => {
    if (p >= 50) return 'bg-red-50 text-red-700 border-red-100';
    if (p >= 25) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  const getSeverityLabel = (p: number) => {
    if (p >= 50) return 'Sangat Berat (Skorsing/Dikeluarkan)';
    if (p >= 25) return 'Berat (Peringatan Keras)';
    if (p >= 10) return 'Sedang (Pembinaan/Teguran)';
    return 'Ringan (Peringatan Lisan)';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            Aturan & Kategori Pelanggaran
          </h2>
          <p className="text-gray-500 text-sm">Definisikan macam-macam pelanggaran tata tertib sekolah beserta bobot poin sanksi.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-xs flex items-center gap-1.5 shadow-sm self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Aturan Baru
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
              placeholder="Cari jenis pelanggaran atau poin..."
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
                <th className="py-3 px-6">ID Aturan</th>
                <th className="py-3 px-6">Nama Deskripsi Pelanggaran</th>
                <th className="py-3 px-6">Kategori Sanksi</th>
                <th className="py-3 px-6 text-center">Bobot Poin</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredJenis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-gray-400">
                    Tidak ada jenis pelanggaran ditemukan.
                  </td>
                </tr>
              ) : (
                filteredJenis.map(item => (
                  <tr key={item.id} className="text-xs text-gray-600 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-gray-400">#{item.id}</td>
                    <td className="py-4 px-6 font-bold text-gray-900">{item.nama_pelanggaran}</td>
                    <td className="py-4 px-6 text-gray-500 font-medium">{getSeverityLabel(item.point)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-bold font-mono border text-xs ${getPointBadgeColor(item.point)}`}>
                        {item.point} Poin
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Aturan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Aturan"
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

      {/* Add / Edit Violation Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-150 shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                {id ? 'Edit Kategori Pelanggaran' : 'Aturan Pelanggaran Baru'}
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
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nama / Deskripsi Pelanggaran</label>
                <input
                  type="text"
                  required
                  value={namaPelanggaran}
                  onChange={(e) => setNamaPelanggaran(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Contoh: Merokok di lingkungan sekolah"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Bobot Poin Pengurangan</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={point}
                    onChange={(e) => setPoint(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full pl-4 pr-16 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-semibold font-mono">POIN</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Poin standar: Ringan (1-9), Sedang (10-24), Berat (25-49), Sangat Berat (50+).
                </p>
              </div>

              {point > 0 && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Kategori Tingkat Keparahan</span>
                    <span className="text-xs font-bold text-gray-700">{getSeverityLabel(point)}</span>
                  </div>
                </div>
              )}

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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
