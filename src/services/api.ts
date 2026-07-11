/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Siswa, JenisPelanggaran, Pelanggaran, PelanggaranJoined, AppSettings } from '../types';
import { initializeLocalStorage } from '../data/mockData';

// Ensure data is initialized in local storage
initializeLocalStorage();

function getSettings(): AppSettings {
  const s = localStorage.getItem('siswa_settings');
  return s ? JSON.parse(s) : { googleAppsScriptUrl: '', useLiveDatabase: false, namaSekolah: 'SMAN 1 Contoh' };
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem('siswa_settings', JSON.stringify(settings));
}

// Low-level Local Storage getters/setters
const getLocalUsers = (): User[] => JSON.parse(localStorage.getItem('siswa_users') || '[]');
const setLocalUsers = (data: User[]) => localStorage.setItem('siswa_users', JSON.stringify(data));

const getLocalSiswa = (): Siswa[] => JSON.parse(localStorage.getItem('siswa_students') || '[]');
const setLocalSiswa = (data: Siswa[]) => localStorage.setItem('siswa_students', JSON.stringify(data));

const getLocalJenisPelanggaran = (): JenisPelanggaran[] => JSON.parse(localStorage.getItem('siswa_violations') || '[]');
const setLocalJenisPelanggaran = (data: JenisPelanggaran[]) => localStorage.setItem('siswa_violations', JSON.stringify(data));

const getLocalPelanggaran = (): Pelanggaran[] => JSON.parse(localStorage.getItem('siswa_records') || '[]');
const setLocalPelanggaran = (data: Pelanggaran[]) => localStorage.setItem('siswa_records', JSON.stringify(data));

// Fetch helper for Google Apps Script with CORS handling
async function callGAS(action: string, payload: any = {}) {
  const settings = getSettings();
  if (!settings.googleAppsScriptUrl) {
    throw new Error('Google Apps Script Web App URL belum dikonfigurasi.');
  }

  const url = new URL(settings.googleAppsScriptUrl);
  url.searchParams.set('action', action);

  let response;
  if (Object.keys(payload).length > 0) {
    // Apps Script prefers POST or GET. Since Apps Script redirects, fetch handles redirect automatically.
    // However, POST to Apps Script requires a redirect-safe request, or we can send it as parameters or a JSON body.
    response = await fetch(settings.googleAppsScriptUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Plain text prevents CORS preflight triggers which Apps Script can struggle with
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

// Master API methods supporting live/offline dual states
export const api = {
  // Sync Status
  isLive: (): boolean => {
    const s = getSettings();
    return s.useLiveDatabase && !!s.googleAppsScriptUrl;
  },

  getSchoolName: (): string => {
    return getSettings().namaSekolah;
  },

  // GET ALL DATA
  getAllData: async (): Promise<{
    users: User[];
    siswa: Siswa[];
    jenisPelanggaran: JenisPelanggaran[];
    pelanggaran: PelanggaranJoined[];
    settings?: AppSettings;
  }> => {
    if (api.isLive()) {
      try {
        const data = await callGAS('getAllData');
        const liveSettings: AppSettings | undefined = data.settings ? {
          googleAppsScriptUrl: getSettings().googleAppsScriptUrl,
          useLiveDatabase: true,
          namaSekolah: data.settings.namaSekolah || getSettings().namaSekolah,
          namaAplikasi: data.settings.namaAplikasi || getSettings().namaAplikasi || 'Sistem Poin Pelanggaran Siswa',
          logoUrl: data.settings.logoUrl || getSettings().logoUrl || ''
        } : undefined;

        return {
          users: data.users || [],
          siswa: data.siswa || [],
          jenisPelanggaran: data.jenisPelanggaran || [],
          pelanggaran: api.joinData(data.pelanggaran || [], data.siswa || [], data.jenisPelanggaran || [], data.users || []),
          settings: liveSettings
        };
      } catch (err) {
        console.warn('Gagal memuat data live, beralih ke Lokal Storage:', err);
        // Fallback to local
      }
    }

    // Local state fallback
    const users = getLocalUsers();
    const siswa = getLocalSiswa();
    const jenisPelanggaran = getLocalJenisPelanggaran();
    const pelanggaran = getLocalPelanggaran();
    return {
      users,
      siswa,
      jenisPelanggaran,
      pelanggaran: api.joinData(pelanggaran, siswa, jenisPelanggaran, users)
    };
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
    if (api.isLive()) {
      try {
        return await callGAS('saveUser', { user });
      } catch (e) {
        console.error('GAS saveUser error:', e);
        throw e;
      }
    }

    const users = getLocalUsers();
    let savedUser: User;
    if (user.id) {
      savedUser = { ...user } as User;
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) users[index] = savedUser;
    } else {
      const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      savedUser = { ...user, id: nextId } as User;
      users.push(savedUser);
    }
    setLocalUsers(users);
    return savedUser;
  },

  deleteUser: async (id: number): Promise<boolean> => {
    if (api.isLive()) {
      try {
        return await callGAS('deleteUser', { id });
      } catch (e) {
        console.error('GAS deleteUser error:', e);
        throw e;
      }
    }

    const users = getLocalUsers();
    const filtered = users.filter(u => u.id !== id);
    setLocalUsers(filtered);
    return true;
  },

  // SISWA CRUD
  saveSiswa: async (siswa: Omit<Siswa, 'id'> & { id?: number }): Promise<Siswa> => {
    if (api.isLive()) {
      try {
        return await callGAS('saveSiswa', { siswa });
      } catch (e) {
        console.error('GAS saveSiswa error:', e);
        throw e;
      }
    }

    const list = getLocalSiswa();
    let savedSiswa: Siswa;
    if (siswa.id) {
      savedSiswa = { ...siswa } as Siswa;
      const index = list.findIndex(s => s.id === siswa.id);
      if (index !== -1) list[index] = savedSiswa;
    } else {
      const nextId = list.length > 0 ? Math.max(...list.map(s => s.id)) + 1 : 1;
      savedSiswa = { ...siswa, id: nextId } as Siswa;
      list.push(savedSiswa);
    }
    setLocalSiswa(list);
    return savedSiswa;
  },

  deleteSiswa: async (id: number): Promise<boolean> => {
    if (api.isLive()) {
      try {
        return await callGAS('deleteSiswa', { id });
      } catch (e) {
        console.error('GAS deleteSiswa error:', e);
        throw e;
      }
    }

    const list = getLocalSiswa();
    const filtered = list.filter(s => s.id !== id);
    setLocalSiswa(filtered);
    return true;
  },

  // VIOLATIONS (JENIS PELANGGARAN) CRUD
  saveJenisPelanggaran: async (item: Omit<JenisPelanggaran, 'id'> & { id?: number }): Promise<JenisPelanggaran> => {
    if (api.isLive()) {
      try {
        return await callGAS('saveJenisPelanggaran', { item });
      } catch (e) {
        console.error('GAS saveJenisPelanggaran error:', e);
        throw e;
      }
    }

    const list = getLocalJenisPelanggaran();
    let savedItem: JenisPelanggaran;
    if (item.id) {
      savedItem = { ...item } as JenisPelanggaran;
      const index = list.findIndex(i => i.id === item.id);
      if (index !== -1) list[index] = savedItem;
    } else {
      const nextId = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1;
      savedItem = { ...item, id: nextId } as JenisPelanggaran;
      list.push(savedItem);
    }
    setLocalJenisPelanggaran(list);
    return savedItem;
  },

  deleteJenisPelanggaran: async (id: number): Promise<boolean> => {
    if (api.isLive()) {
      try {
        return await callGAS('deleteJenisPelanggaran', { id });
      } catch (e) {
        console.error('GAS deleteJenisPelanggaran error:', e);
        throw e;
      }
    }

    const list = getLocalJenisPelanggaran();
    const filtered = list.filter(i => i.id !== id);
    setLocalJenisPelanggaran(filtered);
    return true;
  },

  // PELANGGARAN RECORD CRUD
  savePelanggaran: async (record: Omit<Pelanggaran, 'id'> & { id?: number }): Promise<Pelanggaran> => {
    if (api.isLive()) {
      try {
        return await callGAS('savePelanggaran', { record });
      } catch (e) {
        console.error('GAS savePelanggaran error:', e);
        throw e;
      }
    }

    const list = getLocalPelanggaran();
    let savedRecord: Pelanggaran;
    if (record.id) {
      savedRecord = { ...record } as Pelanggaran;
      const index = list.findIndex(r => r.id === record.id);
      if (index !== -1) list[index] = savedRecord;
    } else {
      const nextId = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
      savedRecord = { ...record, id: nextId } as Pelanggaran;
      list.push(savedRecord);
    }
    setLocalPelanggaran(list);
    return savedRecord;
  },

  deletePelanggaran: async (id: number): Promise<boolean> => {
    if (api.isLive()) {
      try {
        return await callGAS('deletePelanggaran', { id });
      } catch (e) {
        console.error('GAS deletePelanggaran error:', e);
        throw e;
      }
    }

    const list = getLocalPelanggaran();
    const filtered = list.filter(r => r.id !== id);
    setLocalPelanggaran(filtered);
    return true;
  },

  saveSettingsRemote: async (settings: AppSettings): Promise<boolean> => {
    if (api.isLive()) {
      try {
        await callGAS('saveSettings', { settings });
        return true;
      } catch (e) {
        console.error('GAS saveSettings error:', e);
        return false;
      }
    }
    return true;
  }
};
