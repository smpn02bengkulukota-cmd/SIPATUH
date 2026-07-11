/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { APPS_SCRIPT_FILES, APPS_SCRIPT_GUIDE_STEPS } from '../data/googleAppsScriptCode';
import { Copy, Check, Info, Server, Database, Sparkles } from 'lucide-react';

export default function AppsScriptSetup({ 
  settings, 
  onSaveSettings 
}: { 
  settings: { googleAppsScriptUrl: string; useLiveDatabase: boolean; namaSekolah: string }; 
  onSaveSettings: (s: any) => void 
}) {
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [gasUrl, setGasUrl] = useState(settings.googleAppsScriptUrl);
  const [useLive, setUseLive] = useState(settings.useLiveDatabase);
  const [schoolName, setSchoolName] = useState(settings.namaSekolah);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      googleAppsScriptUrl: gasUrl,
      useLiveDatabase: useLive,
      namaSekolah: schoolName
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Configuration Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          Koneksi Database Google Sheets
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Aplikasi ini dirancang sebagai Single Page Application (SPA) yang dapat bekerja dalam <strong>Mode Demo (Lokal Storage)</strong> maupun terhubung langsung ke <strong>Google Spreadsheet</strong> via <strong>Google Apps Script Web App</strong>.
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nama Sekolah / Instansi</label>
            <input 
              type="text" 
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              placeholder="SMAN 1 Contoh"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Google Apps Script Web App URL</label>
            <input 
              type="url" 
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono text-xs"
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <p className="text-xs text-gray-400 mt-1">
              Dapatkan URL ini setelah menerapkan (Deploy) sebagai Aplikasi Web di editor Google Apps Script.
            </p>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              id="useLiveDatabase"
              checked={useLive}
              onChange={(e) => setUseLive(e.target.checked)}
              className="w-4 h-4 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="useLiveDatabase" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Aktifkan Sinkronisasi Database Real-Time (Google Sheets)
            </label>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              Simpan Konfigurasi
            </button>
            {saveSuccess && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Pengaturan disimpan!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Guide Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <Info className="w-5 h-5 text-emerald-600" />
              Langkah Integrasi
            </h3>
            <div className="relative border-l border-emerald-100 pl-4 ml-2.5 space-y-6">
              {APPS_SCRIPT_GUIDE_STEPS.map((step, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[27px] top-0.5 bg-emerald-50 text-emerald-600 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border border-emerald-100 shadow-xs">
                    {idx + 1}
                  </span>
                  <h4 className="font-semibold text-gray-900 text-sm">{step.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100/50">
            <h4 className="font-semibold text-emerald-900 text-sm flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Mengapa Google Sheets?
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Google Spreadsheet adalah database gratis, kolaboratif, dan mudah dikelola tanpa memerlukan database server rumit. Apps Script bertindak sebagai API server aman (CORS-enabled) untuk membaca dan menulis data siswa Anda.
            </p>
          </div>
        </div>

        {/* Apps Script Code Tab */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              Kode Google Apps Script
            </span>
            <button
              onClick={() => handleCopy(APPS_SCRIPT_FILES[activeFileIdx].content)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-gray-200 bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-scale-up" />
                  Disalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kode
                </>
              )}
            </button>
          </div>

          {/* Code tabs selector */}
          <div className="flex border-b border-gray-100 bg-gray-50/20 px-2 pt-2 gap-1">
            {APPS_SCRIPT_FILES.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFileIdx(idx)}
                className={`px-4 py-2 text-xs font-medium rounded-t-xl transition-all border-t border-x cursor-pointer ${
                  activeFileIdx === idx
                    ? 'bg-white border-gray-150 text-emerald-600 font-bold shadow-xs -mb-px'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          <div className="p-4 flex-1 bg-gray-900 text-gray-100 font-mono text-[11px] leading-relaxed overflow-auto max-h-[480px]">
            <pre className="whitespace-pre">{APPS_SCRIPT_FILES[activeFileIdx].content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
