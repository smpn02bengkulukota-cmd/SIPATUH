/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Edit2, Trash2, Search, Check, AlertCircle, X, Shield, Users } from 'lucide-react';

interface KelolaUserProps {
  users: User[];
  onSaveUser: (u: Omit<User, 'id'> & { id?: number }) => Promise<any>;
  onDeleteUser: (id: number) => Promise<any>;
}

export default function KelolaUser({ users, onSaveUser, onDeleteUser }: KelolaUserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form States
  const [id, setId] = useState<number | undefined>(undefined);
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState<'admin' | 'guru'>('guru');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredUsers = users.filter(
    u => 
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setId(undefined);
    setNama('');
    setUsername('');
    setPassword('');
    setLevel('guru');
    setStatus('aktif');
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setId(u.id);
    setNama(u.nama);
    setUsername(u.username);
    setPassword(u.password || '');
    setLevel(u.level);
    setStatus(u.status);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!nama.trim() || !username.trim()) {
      setError('Nama dan Username harus diisi.');
      setIsSubmitting(false);
      return;
    }

    // Check username duplicates
    const duplicate = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== id);
    if (duplicate) {
      setError('Username sudah digunakan oleh akun lain.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSaveUser({
        id,
        nama: nama.trim(),
        username: username.trim().toLowerCase(),
        password: password || '123456', // Default simple password if empty
        level,
        status
      });

      setSuccess(id ? 'Akun berhasil diperbarui!' : 'Akun baru berhasil ditambahkan!');
      setShowModal(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${u.nama}"?`)) {
      try {
        await onDeleteUser(u.id);
        setSuccess('Pengguna berhasil dihapus!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus pengguna.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Kelola Pengguna (Admin & Guru)
          </h2>
          <p className="text-gray-500 text-sm">Kelola hak akses login untuk Administrator BK dan Guru Piket.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-xs flex items-center gap-1.5 shadow-sm self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
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
              placeholder="Cari nama atau username..."
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
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Nama Lengkap</th>
                <th className="py-3 px-6">Username</th>
                <th className="py-3 px-6">Level Hak Akses</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-gray-400">
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="text-xs text-gray-600 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-gray-400">#{u.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${u.level === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                          {u.level === 'admin' ? 'AD' : 'GR'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.nama}</p>
                          <p className="text-[10px] text-gray-400 font-mono">ID Akun: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px]">{u.username}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-lg font-semibold text-[10px] uppercase tracking-wider ${
                        u.level === 'admin' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {u.level === 'admin' ? 'Administrator' : 'Guru BK'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] ${
                        u.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Akun"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Akun"
                          disabled={u.id === 1} // Protect default admin
                          style={{ opacity: u.id === 1 ? 0.4 : 1 }}
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

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-150 shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                {id ? 'Edit Detail Pengguna' : 'Tambah Pengguna Baru'}
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
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Contoh: Dra. Siska Amelia"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                  placeholder="Contoh: siska_bk"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder={id ? "Biarkan kosong jika tidak diubah" : "Masukkan kata sandi login"}
                  required={!id}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Level Akses</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'admin' | 'guru')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="guru">Guru BK / Piket</option>
                    <option value="admin">Administrator BK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status Akun</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
