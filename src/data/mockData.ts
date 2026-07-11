/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Siswa, JenisPelanggaran, Pelanggaran, AppSettings } from '../types';

export const DEFAULT_USERS: User[] = [
  { id: 1, nama: 'Admin BK', username: 'admin', password: '123', level: 'admin', status: 'aktif' },
  { id: 2, nama: 'Guru BK', username: 'guru1', password: '123', level: 'guru', status: 'aktif' },
  { id: 3, nama: 'Budi Santoso, S.Pd', username: 'guru2', password: '123', level: 'guru', status: 'aktif' },
];

export const DEFAULT_SISWA: Siswa[] = [
  { id: 1, nama: 'Andi Saputra', nisn: '00991', kelas: 'XI IPA 1', nama_ortu: 'Bapak Joko', wa_ortu: '628123456789' },
  { id: 2, nama: 'Budi Santoso', nisn: '00992', kelas: 'XI IPA 1', nama_ortu: 'Ibu Ani', wa_ortu: '628123456790' },
  { id: 3, nama: 'Sinta Aulia', nisn: '00993', kelas: 'XI IPA 2', nama_ortu: 'Bapak Budi', wa_ortu: '628123456791' },
  { id: 4, nama: 'Dimas Pratama', nisn: '00994', kelas: 'X IPS 1', nama_ortu: 'Ibu Clara', wa_ortu: '628123456792' },
  { id: 5, nama: 'Rian Maulana', nisn: '00995', kelas: 'XII IPA 3', nama_ortu: 'Bapak Heri', wa_ortu: '628123456793' },
  { id: 6, nama: 'Amanda Putri', nisn: '00996', kelas: 'XI IPS 2', nama_ortu: 'Ibu Dina', wa_ortu: '628123456794' },
  { id: 7, nama: 'Kevin Sanjaya', nisn: '00997', kelas: 'XII IPS 1', nama_ortu: 'Bapak Rudi', wa_ortu: '628123456795' },
];

export const DEFAULT_JENIS_PELANGGARAN: JenisPelanggaran[] = [
  { id: 1, nama_pelanggaran: 'Tidak memakai seragam lengkap', point: 5 },
  { id: 2, nama_pelanggaran: 'Terlambat masuk sekolah', point: 10 },
  { id: 3, nama_pelanggaran: 'Merokok di area sekolah', point: 50 },
  { id: 4, nama_pelanggaran: 'Membolos atau keluar jam pelajaran', point: 25 },
  { id: 5, nama_pelanggaran: 'Berkelahi atau tawuran', point: 75 },
  { id: 6, nama_pelanggaran: 'Merusak fasilitas sekolah', point: 40 },
  { id: 7, nama_pelanggaran: 'Tidak mengerjakan tugas sekolah', point: 5 },
];

export const DEFAULT_PELANGGARAN: Pelanggaran[] = [
  { id: 1, tanggal: '2026-05-02', siswa_id: 1, pelanggaran_id: 2, guru_id: 2, point: 10, keterangan: 'Terlambat masuk sekolah' },
  { id: 2, tanggal: '2026-05-05', siswa_id: 1, pelanggaran_id: 1, guru_id: 2, point: 5, keterangan: 'Tidak memakai ikat pinggang' },
  { id: 3, tanggal: '2026-05-09', siswa_id: 1, pelanggaran_id: 3, guru_id: 2, point: 50, keterangan: 'Merokok di belakang kantin' },
  { id: 4, tanggal: '2026-05-10', siswa_id: 2, pelanggaran_id: 3, guru_id: 2, point: 50, keterangan: 'Ketahuan membawa rokok di dalam tas' },
  { id: 5, tanggal: '2026-05-11', siswa_id: 2, pelanggaran_id: 2, guru_id: 3, point: 10, keterangan: 'Terlambat masuk 20 menit' },
  { id: 6, tanggal: '2026-05-12', siswa_id: 3, pelanggaran_id: 5, guru_id: 2, point: 75, keterangan: 'Terlibat pertengkaran lisan' },
  { id: 7, tanggal: '2026-05-13', siswa_id: 4, pelanggaran_id: 4, guru_id: 3, point: 25, keterangan: 'Keluar pagar tanpa izin' },
  { id: 8, tanggal: '2026-05-14', siswa_id: 5, pelanggaran_id: 3, guru_id: 2, point: 50, keterangan: 'Membawa rokok elektrik' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  googleAppsScriptUrl: '',
  useLiveDatabase: false,
  namaSekolah: 'SMAN 1 Contoh'
};

export function initializeLocalStorage() {
  if (!localStorage.getItem('siswa_users')) {
    localStorage.setItem('siswa_users', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('siswa_students')) {
    localStorage.setItem('siswa_students', JSON.stringify(DEFAULT_SISWA));
  }
  if (!localStorage.getItem('siswa_violations')) {
    localStorage.setItem('siswa_violations', JSON.stringify(DEFAULT_JENIS_PELANGGARAN));
  }
  if (!localStorage.getItem('siswa_records')) {
    localStorage.setItem('siswa_records', JSON.stringify(DEFAULT_PELANGGARAN));
  }
  if (!localStorage.getItem('siswa_settings')) {
    localStorage.setItem('siswa_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
}
