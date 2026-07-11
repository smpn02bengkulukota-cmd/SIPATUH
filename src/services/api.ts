/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Siswa, JenisPelanggaran, Pelanggaran, PelanggaranJoined, AppSettings } from '../types';

const GOOGLE_APPS_SCRIPT_URL = (import.meta as any).env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

// Fetch helper for Google Apps Script with CORS handling
async function callGAS(action: string, payload: any = {}) {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    throw new Error('Google Apps Script Web App URL belum dikonfigurasi di environment variable VITE_GOOGLE_APPS_SCRIPT_URL.');
  }

  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  url.searchParams.set('action', action);

  let response;
  if (Object.keys(payload).length > 0) {
    response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload })
    });
  } else {
    response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors'
    });
  }

  if (!response.ok) {
    throw new Error(`Koneksi gagal: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message || 'Terjadi kesalahan pada Google Sheets.');
  }
  return result.data;
}

// Master API methods - strictly calling Apps Script without local fallbacks
export const api = {
  isLive: (): boolean => {
    return !!GOOGLE_APPS_SCRIPT_URL;
  },

  getGoogleAppsScriptUrl: (): string => {
    return GOOGLE_APPS_SCRIPT_URL;
  },

  // GET ALL DATA
  getAllData: async (): Promise<{
    users: User[];
    siswa: Siswa[];
    jenisPelanggaran: JenisPelanggaran[];
    pelanggaran: PelanggaranJoined[];
    settings?: Omit<AppSettings, 'googleAppsScriptUrl' | 'useLiveDatabase'>;
  }> => {
    try {
      const data = await callGAS('getAllData');
      
      const liveSettings = data.settings ? {
        namaSekolah: data.settings.namaSekolah || 'SMPN 2 Bengkulu Kota',
        namaAplikasi: data.settings.namaAplikasi || 'Sistem Poin Pelanggaran Siswa',
        logoUrl: data.settings.logoUrl || ''
      } : undefined;

      return {
        users: data.users || [],
        siswa: data.siswa || [],
        jenisPelanggaran: data.jenisPelanggaran || [],
        pelanggaran: api.joinData(data.pelanggaran || [], data.siswa || [], data.jenisPelanggaran || [], data.users || []),
        settings: liveSettings
      };
    } catch (err) {
      console.error('Gagal mengambil data dari Google Apps Script:', err);
      throw err;
    }
  },

  joinData: (records: Pelanggaran[], siswa: Siswa[], violations: JenisPelanggaran[], users: User[]): PelanggaranJoined[] => {
    return records.map(rec => {
      const s = siswa.find(item => item.id === rec.siswa_id);
      const v = violations.find(item => item.id === rec.pelanggaran_id);
      const u = users.find(item => item.id === rec.guru_id);
      return {
        ...rec,
        nama_siswa: s?.nama || `ID Siswa ${rec.siswa_id} (Dihapus)`,
        nisn_siswa: s?.nisn || '-',
        kelas_siswa: s?.kelas || '-',
        nama_ortu: s?.nama_ortu || '-',
        wa_ortu: s?.wa_ortu || '',
        nama_pelanggaran: v?.nama_pelanggaran || `ID Pelanggaran ${rec.pelanggaran_id} (Dihapus)`,
        nama_guru: u?.nama || `ID Guru ${rec.guru_id} (Dihapus)`
      };
    });
  },

  // USERS CRUD
  saveUser: async (user: Omit<User, 'id'> & { id?: number }): Promise<User> => {
    try {
      return await callGAS('saveUser', { user });
    } catch (e) {
      console.error('GAS saveUser error:', e);
      throw e;
    }
  },

  deleteUser: async (id: number): Promise<boolean> => {
    try {
      return await callGAS('deleteUser', { id });
    } catch (e) {
      console.error('GAS deleteUser error:', e);
      throw e;
    }
  },

  // SISWA CRUD
  saveSiswa: async (siswa: Omit<Siswa, 'id'> & { id?: number }): Promise<Siswa> => {
    try {
      return await callGAS('saveSiswa', { siswa });
    } catch (e) {
      console.error('GAS saveSiswa error:', e);
      throw e;
    }
  },

  deleteSiswa: async (id: number): Promise<boolean> => {
    try {
      return await callGAS('deleteSiswa', { id });
    } catch (e) {
      console.error('GAS deleteSiswa error:', e);
      throw e;
    }
  },

  // VIOLATIONS (JENIS PELANGGARAN) CRUD
  saveJenisPelanggaran: async (item: Omit<JenisPelanggaran, 'id'> & { id?: number }): Promise<JenisPelanggaran> => {
    try {
      return await callGAS('saveJenisPelanggaran', { item });
    } catch (e) {
      console.error('GAS saveJenisPelanggaran error:', e);
      throw e;
    }
  },

  deleteJenisPelanggaran: async (id: number): Promise<boolean> => {
    try {
      return await callGAS('deleteJenisPelanggaran', { id });
    } catch (e) {
      console.error('GAS deleteJenisPelanggaran error:', e);
      throw e;
    }
  },

  // PELANGGARAN RECORD CRUD
  savePelanggaran: async (record: Omit<Pelanggaran, 'id'> & { id?: number }): Promise<Pelanggaran> => {
    try {
      return await callGAS('savePelanggaran', { record });
    } catch (e) {
      console.error('GAS savePelanggaran error:', e);
      throw e;
    }
  },

  deletePelanggaran: async (id: number): Promise<boolean> => {
    try {
      return await callGAS('deletePelanggaran', { id });
    } catch (e) {
      console.error('GAS deletePelanggaran error:', e);
      throw e;
    }
  },

  saveSettingsRemote: async (settings: { namaSekolah: string; namaAplikasi: string; logoUrl: string }): Promise<boolean> => {
    try {
      await callGAS('saveSettings', { settings });
      return true;
    } catch (e) {
      console.error('GAS saveSettings error:', e);
      throw e;
    }
  }
};
