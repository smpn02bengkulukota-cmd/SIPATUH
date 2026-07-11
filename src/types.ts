/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  nama: string;
  username: string;
  password?: string; // Optional when sent to client (though in mock/GAS we might have it)
  level: 'admin' | 'guru';
  status: 'aktif' | 'nonaktif';
}

export interface Siswa {
  id: number;
  nama: string;
  nisn: string;
  kelas: string;
  nama_ortu: string;
  wa_ortu: string; // formats like 628123456789
}

export interface JenisPelanggaran {
  id: number;
  nama_pelanggaran: string;
  point: number;
}

export interface Pelanggaran {
  id: number;
  tanggal: string; // YYYY-MM-DD
  siswa_id: number;
  pelanggaran_id: number;
  guru_id: number;
  point: number; // Point at the time of violation
  keterangan: string;
}

// For UI convenience
export interface PelanggaranJoined extends Pelanggaran {
  nama_siswa?: string;
  nisn_siswa?: string;
  kelas_siswa?: string;
  nama_ortu?: string;
  wa_ortu?: string;
  nama_pelanggaran?: string;
  nama_guru?: string;
}

export interface AppSettings {
  googleAppsScriptUrl: string;
  useLiveDatabase: boolean;
  namaSekolah: string;
  logoUrl?: string;
  namaAplikasi?: string;
}
