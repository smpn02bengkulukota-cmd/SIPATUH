/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Siswa, PelanggaranJoined, User } from '../types';
import { Users, ShieldAlert, Calendar, BarChart2, TrendingUp, AlertTriangle, ChevronRight, Plus, Eye } from 'lucide-react';

interface DashboardProps {
  siswa: Siswa[];
  pelanggaran: PelanggaranJoined[];
  users: User[];
  currentUser: User;
  onNavigate: (view: string) => void;
}

export default function Dashboard({
  siswa,
  pelanggaran,
  currentUser,
  onNavigate
}: DashboardProps) {
  // 1. Calculations for stats
  const totalSiswa = siswa.length;

  const todayStr = new Date().toISOString().split('T')[0]; // Matches system date
  const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

  const pelanggaranHariIni = pelanggaran.filter(p => p.tanggal === todayStr).length;
  const pelanggaranBulanIni = pelanggaran.filter(p => p.tanggal.startsWith(currentYearMonth)).length;

  // 2. Accumulate points per student
  const studentPoints: { [key: number]: number } = {};
  pelanggaran.forEach(p => {
    if (p.siswa_id) {
      studentPoints[p.siswa_id] = (studentPoints[p.siswa_id] || 0) + (p.point || 0);
    }
  });

  // Top 5 students with highest points
  const topStudents = Object.entries(studentPoints)
    .map(([siswaId, points]) => {
      const s = siswa.find(item => item.id === Number(siswaId));
      return {
        id: Number(siswaId),
        nama: s?.nama || `Siswa ID ${siswaId}`,
        nisn: s?.nisn || '-',
        kelas: s?.kelas || '-',
        points
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // 3. Get recent 5 violation logs
  const recentViolations = [...pelanggaran]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 5);

  // 4. Monthly trend for chart (last 6 months, using standard months in 2026/2025)
  // Let's analyze data and group by year-month
  const monthlyCounts: { [key: string]: number } = {};
  pelanggaran.forEach(p => {
    const ym = p.tanggal.substring(0, 7); // e.g. "2026-05"
    monthlyCounts[ym] = (monthlyCounts[ym] || 0) + 1;
  });

  // Let's construct a list of last 6 months to display
  const monthsList = [
    { label: 'Jan', key: '2026-01' },
    { label: 'Feb', key: '2026-02' },
    { label: 'Mar', key: '2026-03' },
    { label: 'Apr', key: '2026-04' },
    { label: 'Mei', key: '2026-05' },
    { label: 'Jun', key: '2026-06' },
    { label: 'Jul', key: '2026-07' },
  ];

  const chartData = monthsList.map(m => ({
    label: m.label,
    count: monthlyCounts[m.key] || 0
  }));

  const maxChartVal = Math.max(...chartData.map(d => d.count), 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <span className="bg-emerald-500/30 text-emerald-100 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sesi Akun: {currentUser.level === 'admin' ? 'Administrator' : 'Guru BK'}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2.5">
            Selamat Datang, {currentUser.nama}!
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            Sistem Poin Pelanggaran Siswa membantu pemantauan ketertiban sekolah secara real-time dan meningkatkan disiplin siswa secara transparan.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigate(currentUser.level === 'admin' ? 'riwayat' : 'tambah_pelanggaran')}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Pelanggaran Baru
            </button>
            <button
              onClick={() => onNavigate('riwayat')}
              className="bg-emerald-500/20 text-white hover:bg-emerald-500/30 border border-emerald-400/30 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Lihat Riwayat Pelanggaran
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Siswa */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:border-emerald-100 transition-colors">
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Total Siswa Terdaftar</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1 font-mono">{totalSiswa}</h3>
          </div>
        </div>

        {/* Pelanggaran Hari Ini */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:border-amber-100 transition-colors">
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Pelanggaran Hari Ini</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1 font-mono">{pelanggaranHariIni}</h3>
          </div>
        </div>

        {/* Pelanggaran Bulan Ini */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4 hover:border-rose-100 transition-colors">
          <div className="bg-rose-50 p-4 rounded-xl text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Pelanggaran Bulan Ini</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1 font-mono">{pelanggaranBulanIni}</h3>
          </div>
        </div>
      </div>

      {/* Charts & Leadboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Monthly Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              Statistik Tren Pelanggaran Bulanan
            </h3>
            <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              Tahun 2026
            </span>
          </div>

          {/* Simple Highly Styled SVG Bar Chart */}
          <div className="flex-1 min-h-[220px] flex items-end justify-between px-2 gap-4">
            {chartData.map((d, idx) => {
              const heightPct = Math.round((d.count / maxChartVal) * 100);
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xs font-mono">
                      {d.count} kasus
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct || 4}%` }}
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 cursor-pointer ${
                        d.count > 0 
                          ? 'bg-emerald-500 group-hover:bg-emerald-600 shadow-xs' 
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2 font-medium">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Leaderboard (Poin Tertinggi) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            Top 5 Siswa Poin Tertinggi
          </h3>

          <div className="space-y-3 flex-1">
            {topStudents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6">
                <p className="text-xs">Belum ada pelanggaran tercatat.</p>
              </div>
            ) : (
              topStudents.map((st, idx) => {
                const colorMap = [
                  'bg-rose-50 border-rose-100 text-rose-600',
                  'bg-amber-50 border-amber-100 text-amber-600',
                  'bg-orange-50 border-orange-100 text-orange-600',
                  'bg-gray-50 border-gray-100 text-gray-600',
                  'bg-gray-50 border-gray-100 text-gray-500',
                ];
                return (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center border ${colorMap[idx] || 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs line-clamp-1">{st.nama}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">
                          NISN: {st.nisn} | Kelas: {st.kelas}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 font-mono bg-rose-50 px-2.5 py-1 rounded-lg">
                      {st.points} Poin
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Violations Log */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Pelanggaran Baru Tercatat</h3>
          <button 
            onClick={() => onNavigate('riwayat')}
            className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1 transition-all cursor-pointer"
          >
            Semua Riwayat <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Tanggal</th>
                <th className="pb-3 font-semibold">Siswa</th>
                <th className="pb-3 font-semibold">Kelas</th>
                <th className="pb-3 font-semibold">Jenis Pelanggaran</th>
                <th className="pb-3 font-semibold text-center">Poin</th>
                <th className="pb-3 font-semibold">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentViolations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-xs text-gray-400">
                    Belum ada riwayat pelanggaran.
                  </td>
                </tr>
              ) : (
                recentViolations.map(p => (
                  <tr key={p.id} className="text-xs text-gray-600 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 font-mono">{p.tanggal}</td>
                    <td className="py-3.5 font-bold text-gray-900">{p.nama_siswa}</td>
                    <td className="py-3.5">{p.kelas_siswa}</td>
                    <td className="py-3.5 font-medium">{p.nama_pelanggaran}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-sm font-bold font-mono ${
                        p.point >= 50 ? 'bg-red-50 text-red-600' : p.point >= 25 ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.point}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-400">{p.nama_guru}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
