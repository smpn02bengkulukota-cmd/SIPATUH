/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Check, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';

export default function PengaturanTampilan({
  settings,
  onSaveSettings
}: {
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
}) {
  const [appName, setAppName] = useState(settings.namaAplikasi || 'Sistem Poin Pelanggaran Siswa');
  const [schoolName, setSchoolName] = useState(settings.namaSekolah || 'SMAN 1 Contoh');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      namaAplikasi: appName.trim(),
      namaSekolah: schoolName.trim(),
      logoUrl: logoUrl.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Pengaturan Identitas & Tampilan</h2>
            <p className="text-xs text-gray-500 mt-0.5">Sesuaikan nama aplikasi, nama sekolah, dan logo instansi Anda.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* Nama Aplikasi */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider">Nama Aplikasi</label>
            <input
              type="text"
              required
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
              placeholder="Contoh: Sistem Poin Pelanggaran Siswa"
            />
            <p className="text-[10px] text-gray-400 mt-1">Judul utama yang akan ditampilkan pada halaman masuk (login) dan navigasi aplikasi.</p>
          </div>

          {/* Nama Sekolah */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider">Nama Sekolah / Instansi</label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-medium"
              placeholder="Contoh: SMAN 1 Contoh"
            />
            <p className="text-[10px] text-gray-400 mt-1">Nama sekolah yang dicantumkan pada bagian atas header, laporan cetak, dan pesan pemberitahuan WhatsApp.</p>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 tracking-wider">URL Logo Gambar (Online URL)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-gray-400">
                <ImageIcon className="w-4 h-4" />
              </span>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setPreviewError(false);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                placeholder="https://domain.com/path/to/logo.png"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Masukkan link URL gambar logo Anda (misal dari website sekolah atau Google Drive link publik). Kosongkan untuk menggunakan logo default.</p>
          </div>

          {/* Logo Preview Section */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl && !previewError ? (
                <img
                  src={logoUrl}
                  alt="Logo Preview"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setPreviewError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-gray-300 font-bold text-xs uppercase">No Logo</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider mb-0.5">Pratinjau Logo Baru</span>
              {previewError ? (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Gagal memuat gambar dari URL tersebut.
                </span>
              ) : logoUrl ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> URL Logo valid dan berhasil dimuat.
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-medium">Menggunakan logo default (perisai peringatan).</span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              Simpan Perubahan
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-scale-up">
                <Check className="w-4 h-4" /> Identitas aplikasi berhasil diperbarui!
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100/50 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-900 text-xs">Penyesuaian Visual Instan</h4>
          <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
            Setiap perubahan nama aplikasi, nama instansi, atau logo URL akan langsung diperbarui di seluruh bagian aplikasi termasuk halaman utama, panel navigasi sidebar, kop surat laporan, dan pratinjau pesan pelaporan.
          </p>
        </div>
      </div>
    </div>
  );
}
