/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Siswa, JenisPelanggaran, PelanggaranJoined, AppSettings } from './types';
import { api, saveSettings } from './services/api';

// Components
import Dashboard from './components/Dashboard';
import KelolaUser from './components/KelolaUser';
import KelolaSiswa from './components/KelolaSiswa';
import KelolaJenisPelanggaran from './components/KelolaJenisPelanggaran';
import TambahPelanggaranGuru from './components/TambahPelanggaranGuru';
import RiwayatPelanggaran from './components/RiwayatPelanggaran';
import PengaturanTampilan from './components/PengaturanTampilan';

// Icons
import {
  Shield, Users, GraduationCap, ShieldAlert, History, Database,
  LogOut, Menu, X, KeyRound, Check, AlertCircle, RefreshCw, Landmark,
  Sparkles, ChevronRight, Sliders
} from 'lucide-react';

export default function App() {
  // Auth Session States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const s = localStorage.getItem('siswa_current_user');
    return s ? JSON.parse(s) : null;
  });

  // DB States
  const [users, setUsers] = useState<User[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [jenisPelanggaran, setJenisPelanggaran] = useState<JenisPelanggaran[]>([]);
  const [pelanggaran, setPelanggaran] = useState<PelanggaranJoined[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = localStorage.getItem('siswa_settings');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        return {
          namaAplikasi: 'Sistem Poin Pelanggaran Siswa',
          logoUrl: '',
          ...parsed
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      googleAppsScriptUrl: '',
      useLiveDatabase: false,
      namaSekolah: 'SMAN 1 Contoh',
      namaAplikasi: 'Sistem Poin Pelanggaran Siswa',
      logoUrl: ''
    };
  });

  // Navigation
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login Form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Initial Fetch & Sync
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setSyncing(true);

    try {
      const data = await api.getAllData();
      setUsers(data.users);
      setSiswa(data.siswa);
      setJenisPelanggaran(data.jenisPelanggaran);
      setPelanggaran(data.pelanggaran);

      if (data.settings) {
        const hasChanges =
          data.settings.namaSekolah !== settings.namaSekolah ||
          data.settings.namaAplikasi !== settings.namaAplikasi ||
          data.settings.logoUrl !== settings.logoUrl;

        if (hasChanges) {
          const mergedSettings = {
            ...settings,
            namaSekolah: data.settings.namaSekolah,
            namaAplikasi: data.settings.namaAplikasi,
            logoUrl: data.settings.logoUrl
          };
          setSettings(mergedSettings);
          saveSettings(mergedSettings);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [settings.googleAppsScriptUrl, settings.useLiveDatabase]);

  // Handle Login Action
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedUser = loginUsername.trim().toLowerCase();
    const matchedUser = users.find(u => u.username === trimmedUser && u.status === 'aktif');

    if (!matchedUser) {
      setLoginError('Akun tidak ditemukan atau berstatus Nonaktif.');
      return;
    }

    // In a real OAuth or simple login, compare password.
    // Our mock password is simple plain text.
    if (matchedUser.password && matchedUser.password !== loginPassword) {
      setLoginError('Kata sandi yang Anda masukkan salah.');
      return;
    }

    // Success login
    setCurrentUser(matchedUser);
    localStorage.setItem('siswa_current_user', JSON.stringify(matchedUser));
    setCurrentView('dashboard');
  };

  // Handle Quick Login for developer/user convenience
  const handleQuickLogin = (username: string) => {
    const matchedUser = users.find(u => u.username === username);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem('siswa_current_user', JSON.stringify(matchedUser));
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('siswa_current_user');
  };

  // Handle settings update
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    // Also save to live spreadsheet if enabled
    if (newSettings.useLiveDatabase && newSettings.googleAppsScriptUrl) {
      setSyncing(true);
      try {
        await api.saveSettingsRemote(newSettings);
      } catch (err) {
        console.error('Failed to sync settings to Google Sheets:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  // CRUD Wrapper Handlers - Automatically trigger local state or Apps Script fetch
  const handleSaveUser = async (userObj: any) => {
    await api.saveUser(userObj);
    await loadData(false);
  };

  const handleDeleteUser = async (id: number) => {
    await api.deleteUser(id);
    await loadData(false);
  };

  const handleSaveSiswa = async (siswaObj: any) => {
    await api.saveSiswa(siswaObj);
    await loadData(false);
  };

  const handleDeleteSiswa = async (id: number) => {
    await api.deleteSiswa(id);
    await loadData(false);
  };

  const handleSaveJenisPelanggaran = async (itemObj: any) => {
    await api.saveJenisPelanggaran(itemObj);
    await loadData(false);
  };

  const handleDeleteJenisPelanggaran = async (id: number) => {
    await api.deleteJenisPelanggaran(id);
    await loadData(false);
  };

  const handleSavePelanggaran = async (recordObj: any) => {
    const saved = await api.savePelanggaran(recordObj);
    await loadData(false);
    return saved;
  };

  const handleDeletePelanggaran = async (id: number) => {
    await api.deletePelanggaran(id);
    await loadData(false);
  };

  // Render Login Layout if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-emerald-500 selection:text-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          {/* Logo Brand Icon */}
          <div className="mx-auto flex justify-center mb-4">
            {settings.logoUrl ? (
              <div className="h-16 w-16 rounded-2xl bg-white border border-gray-150 shadow-md flex items-center justify-center overflow-hidden p-1.5 animate-scale-up">
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
                <ShieldAlert className="w-8 h-8" />
              </div>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900 tracking-tight">
            {settings.namaAplikasi || 'Sistem Poin Pelanggaran Siswa'}
          </h2>
          <p className="mt-1.5 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Aplikasi bimbingan konseling pencatatan skor tata tertib sekolah, pelaporan orang tua & database Google Sheets di {settings.namaSekolah || 'SMAN 1 Contoh'}.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="bg-rose-50 border border-rose-150 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-scale-up">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Username Akun</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-400">@</span>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-mono"
                    placeholder="Contoh: admin atau guru1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kata Sandi (Password)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="Masukkan sandi..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs hover:from-emerald-700 hover:to-teal-800 focus:outline-hidden transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                Masuk ke Aplikasi
              </button>
            </form>

          
          </div>
        </div>
      </div>
    );
  }

  // Navigation Sidebar Definition
  const sidebarItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Shield, roles: ['admin', 'guru'] },
    { id: 'tambah_pelanggaran', name: 'Catat Pelanggaran', icon: ShieldAlert, roles: ['admin', 'guru'] },
    { id: 'kelola_siswa', name: 'Kelola Siswa', icon: GraduationCap, roles: ['admin'] },
    { id: 'kelola_jenis', name: 'Aturan & Poin', icon: KeyRound, roles: ['admin'] },
    { id: 'kelola_users', name: 'Kelola Pengguna', icon: Users, roles: ['admin'] },
    { id: 'riwayat', name: 'Riwayat & Laporan', icon: History, roles: ['admin', 'guru'] },
    { id: 'tampilan', name: 'Identitas & Logo', icon: Sliders, roles: ['admin'] },
    
  ];

  const filteredSidebarItems = sidebarItems.filter(item => item.roles.includes(currentUser.level));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* MOBILE HEADER BAR */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden print:hidden shrink-0">
        <div className="flex items-center gap-2">
          {settings.logoUrl ? (
            <div className="h-9 w-9 rounded-xl bg-white border border-gray-150 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-xs text-gray-900 tracking-tight leading-none truncate max-w-[130px]">
              {settings.namaAplikasi || 'Sistem Poin BK'}
            </h1>
            <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">{settings.namaSekolah}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncing && (
            <span className="p-1 rounded-lg text-emerald-600 bg-emerald-50 animate-spin" title="Menyinkronkan data...">
              <RefreshCw className="w-4 h-4" />
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 border border-gray-200 text-gray-600 hover:text-gray-950 rounded-lg cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* OVERLAY for Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION - Responsive (Desktop Static, Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-50 w-64 transform transition-transform duration-300 flex flex-col print:hidden
        md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {settings.logoUrl ? (
              <div className="h-10 w-10 rounded-xl bg-white border border-gray-150 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-xs text-gray-950 tracking-tight leading-none truncate max-w-[130px]">
                {settings.namaAplikasi || 'Sistem Poin BK'}
              </h1>
              <span className="text-[10px] text-gray-400 font-bold font-mono mt-0.5 block">{settings.namaSekolah}</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 md:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Database Status indicator */}
        <div className="p-4 mx-4 mt-4 bg-gray-50 border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${settings.useLiveDatabase ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Koneksi Database</span>
              <span className="text-xs font-extrabold text-gray-700">
                {settings.useLiveDatabase ? 'Google Spreadsheet' : 'Demo Mode (Lokal)'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items list */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {filteredSidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full px-4 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3.5 transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-emerald-50/70 text-emerald-700 border-l-4 border-emerald-600 font-extrabold shadow-3xs' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                `}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Current User Session Card & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 pb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${currentUser.level === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
              {currentUser.level === 'admin' ? 'AD' : 'GR'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-900 text-xs truncate leading-tight">{currentUser.nama}</h4>
              <span className="text-[10px] text-gray-400 font-medium capitalize">{currentUser.level === 'admin' ? 'Administrator' : 'Guru BK'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 rounded-xl border border-gray-200 transition-all font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* MAIN MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 print:p-0">
        {/* DESKTOP HEADER BAR */}
        <header className="hidden md:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            {settings.logoUrl ? (
              <div className="h-9 w-9 rounded-xl bg-white border border-gray-150 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <Landmark className="w-5 h-5 text-emerald-600" />
            )}
            <h1 className="font-bold text-sm text-gray-800">
              {settings.namaAplikasi || 'Sistem Pelaporan Pelanggaran BK'} - <span className="text-emerald-600">{settings.namaSekolah}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {syncing && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sinkronisasi spreadsheet...
              </span>
            )}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${settings.useLiveDatabase ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {settings.useLiveDatabase ? 'Database Live' : 'Database Lokal'}
            </div>
          </div>
        </header>

        {/* VIEW ROUTER BODY */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0">
          {loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Memuat dan mensinkronkan database sekolah...</p>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <Dashboard
                  siswa={siswa}
                  pelanggaran={pelanggaran}
                  users={users}
                  currentUser={currentUser}
                  onNavigate={(view) => setCurrentView(view)}
                />
              )}

              {currentView === 'tambah_pelanggaran' && (
                <TambahPelanggaranGuru
                  siswaList={siswa}
                  jenisPelanggaran={jenisPelanggaran}
                  pelanggaranList={pelanggaran}
                  currentUser={currentUser}
                  onSavePelanggaran={handleSavePelanggaran}
                  onNavigateToHistory={() => setCurrentView('riwayat')}
                  schoolName={settings.namaSekolah}
                />
              )}

              {currentView === 'kelola_siswa' && currentUser.level === 'admin' && (
                <KelolaSiswa
                  siswa={siswa}
                  onSaveSiswa={handleSaveSiswa}
                  onDeleteSiswa={handleDeleteSiswa}
                />
              )}

              {currentView === 'kelola_jenis' && currentUser.level === 'admin' && (
                <KelolaJenisPelanggaran
                  jenisPelanggaran={jenisPelanggaran}
                  onSaveJenisPelanggaran={handleSaveJenisPelanggaran}
                  onDeleteJenisPelanggaran={handleDeleteJenisPelanggaran}
                />
              )}

              {currentView === 'kelola_users' && currentUser.level === 'admin' && (
                <KelolaUser
                  users={users}
                  onSaveUser={handleSaveUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {currentView === 'riwayat' && (
                <RiwayatPelanggaran
                  pelanggaran={pelanggaran}
                  siswaList={siswa}
                  jenisPelanggaran={jenisPelanggaran}
                  users={users}
                  currentUser={currentUser}
                  onSavePelanggaran={handleSavePelanggaran}
                  onDeletePelanggaran={handleDeletePelanggaran}
                  schoolName={settings.namaSekolah}
                />
              )}

              {currentView === 'setup' && currentUser.level === 'admin' && (
               
              )}

              {currentView === 'tampilan' && currentUser.level === 'admin' && (
                <PengaturanTampilan
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
