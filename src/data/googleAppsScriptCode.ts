/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GASFile {
  name: string;
  content: string;
}

export const APPS_SCRIPT_GUIDE_STEPS = [
  {
    title: "Buat Spreadsheet Baru",
    description: "Buka Google Drive, buat Spreadsheet baru bernama 'Sistem Poin Pelanggaran Siswa'. Catat URL atau ID spreadsheet tersebut."
  },
  {
    title: "Buka Google Apps Script",
    description: "Di Spreadsheet baru Anda, klik menu Ekstensi -> Apps Script. Ini akan membuka editor Google Apps Script."
  },
  {
    title: "Buat File-file Kode Baru",
    description: "Di panel kiri, ganti nama 'Kode.gs' atau buat file script (.gs) baru sesuai dengan tab modular yang disediakan di bawah ini."
  },
  {
    title: "Simpan & Terapkan (Deploy)",
    description: "Klik tombol ikon disk (Simpan), lalu klik tombol 'Terapkan' (Deploy) -> 'Penerapan baru'. Pilih Jenis 'Aplikasi web'. Setel 'Akses' ke 'Siapa saja' (Anyone), lalu klik Terapkan."
  },
  {
    title: "Salin URL & Hubungkan",
    description: "Salin URL Aplikasi Web yang dihasilkan (berakhiran /exec). Buka Pengaturan di aplikasi ini, aktifkan Database Live, lalu tempel URL tersebut!"
  }
];

export const APPS_SCRIPT_FILES: GASFile[] = [
  {
    name: "Code.gs",
    content: `/**
 * Sistem Poin Pelanggaran Siswa - Apps Script Backend (Main)
 * Menangani routing GET dan POST dari Client Frontend SPA
 */

const SPREADSHEET_ID = ""; // Opsional, biarkan kosong jika script ini terikat dengan Spreadsheet (Container-bound)

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Inisialisasi sheet dan tabel database jika belum ada
function initDatabase() {
  const ss = getSpreadsheet();
  
  // 1. Sheet USER
  let userSheet = ss.getSheetByName("USER");
  if (!userSheet) {
    userSheet = ss.insertSheet("USER");
    userSheet.appendRow(["id", "nama", "username", "password", "level", "status"]);
    userSheet.appendRow([1, "Admin BK", "admin", "123456", "admin", "aktif"]);
    userSheet.appendRow([2, "Guru BK", "guru1", "123456", "guru", "aktif"]);
  }
  
  // 2. Sheet SISWA
  let siswaSheet = ss.getSheetByName("SISWA");
  if (!siswaSheet) {
    siswaSheet = ss.insertSheet("SISWA");
    siswaSheet.appendRow(["id", "nama", "nisn", "kelas", "nama_ortu", "wa_ortu"]);
    siswaSheet.appendRow([1, "Andi Saputra", "00991", "XI IPA 1", "Bapak Joko", "628123456789"]);
  }
  
  // 3. Sheet JENIS_PELANGGARAN
  let jpSheet = ss.getSheetByName("JENIS_PELANGGARAN");
  if (!jpSheet) {
    jpSheet = ss.insertSheet("JENIS_PELANGGARAN");
    jpSheet.appendRow(["id", "nama_pelanggaran", "point"]);
    jpSheet.appendRow([1, "Tidak memakai seragam lengkap", 5]);
    jpSheet.appendRow([2, "Terlambat masuk sekolah", 10]);
    jpSheet.appendRow([3, "Merokok di area sekolah", 50]);
  }
  
  // 4. Sheet PELANGGARAN
  let pSheet = ss.getSheetByName("PELANGGARAN");
  if (!pSheet) {
    pSheet = ss.insertSheet("PELANGGARAN");
    pSheet.appendRow(["id", "tanggal", "siswa_id", "pelanggaran_id", "guru_id", "point", "keterangan"]);
    pSheet.appendRow([1, "2026-05-02", 1, 2, 2, 10, "Terlambat masuk sekolah"]);
  }

  // 5. Sheet PENGATURAN
  let settingsSheet = ss.getSheetByName("PENGATURAN");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("PENGATURAN");
    settingsSheet.appendRow(["key", "value"]);
    settingsSheet.appendRow(["nama_aplikasi", "Sistem Poin Pelanggaran Siswa"]);
    settingsSheet.appendRow(["nama_sekolah", "SMAN 1 Contoh"]);
    settingsSheet.appendRow(["logo_url", ""]);
  }
}

// Membaca pengaturan dari Sheet PENGATURAN
function readSettings() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("PENGATURAN");
  if (!sheet) return {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const settings = {};
  for (let i = 0; i < values.length; i++) {
    const key = values[i][0];
    const val = values[i][1];
    if (key === "nama_aplikasi") settings.namaAplikasi = val;
    if (key === "nama_sekolah") settings.namaSekolah = val;
    if (key === "logo_url") settings.logoUrl = val;
  }
  return settings;
}

// Menyimpan pengaturan ke Sheet PENGATURAN
function saveSettings(settingsObj) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("PENGATURAN");
  if (!sheet) {
    sheet = ss.insertSheet("PENGATURAN");
    sheet.appendRow(["key", "value"]);
  }
  
  const keysToSave = {
    "nama_aplikasi": settingsObj.namaAplikasi || "",
    "nama_sekolah": settingsObj.namaSekolah || "",
    "logo_url": settingsObj.logoUrl || ""
  };
  
  const lastRow = sheet.getLastRow();
  const existingKeys = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return r[0]; }) : [];
  
  for (const key in keysToSave) {
    const idx = existingKeys.indexOf(key);
    if (idx !== -1) {
      sheet.getRange(idx + 2, 2).setValue(keysToSave[key]);
    } else {
      sheet.appendRow([key, keysToSave[key]]);
    }
  }
  return readSettings();
}

// Handler GET request (membaca data)
function doGet(e) {
  initDatabase();
  const action = e.parameter.action;
  
  try {
    if (action === "getAllData") {
      const users = readTable("USER");
      const siswa = readTable("SISWA");
      const jenisPelanggaran = readTable("JENIS_PELANGGARAN");
      const pelanggaran = readTable("PELANGGARAN");
      const settings = readSettings();
      
      return JSONResponse({
        status: "success",
        data: { users, siswa, jenisPelanggaran, pelanggaran, settings }
      });
    }
    
    return JSONResponse({ status: "error", message: "Action GET tidak dikenali" });
  } catch (err) {
    return JSONResponse({ status: "error", message: err.toString() });
  }
}

// Handler POST request (menulis & mengubah data)
function doPost(e) {
  initDatabase();
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === "saveUser") {
      const saved = saveRow("USER", postData.user);
      return JSONResponse({ status: "success", data: saved });
    }
    else if (action === "deleteUser") {
      const success = deleteRow("USER", postData.id);
      return JSONResponse({ status: "success", data: success });
    }
    else if (action === "saveSiswa") {
      const saved = saveRow("SISWA", postData.siswa);
      return JSONResponse({ status: "success", data: saved });
    }
    else if (action === "deleteSiswa") {
      const success = deleteRow("SISWA", postData.id);
      return JSONResponse({ status: "success", data: success });
    }
    else if (action === "saveJenisPelanggaran") {
      const saved = saveRow("JENIS_PELANGGARAN", postData.item);
      return JSONResponse({ status: "success", data: saved });
    }
    else if (action === "deleteJenisPelanggaran") {
      const success = deleteRow("JENIS_PELANGGARAN", postData.id);
      return JSONResponse({ status: "success", data: success });
    }
    else if (action === "savePelanggaran") {
      const saved = saveRow("PELANGGARAN", postData.record);
      return JSONResponse({ status: "success", data: saved });
    }
    else if (action === "deletePelanggaran") {
      const success = deleteRow("PELANGGARAN", postData.id);
      return JSONResponse({ status: "success", data: success });
    }
    else if (action === "saveSettings") {
      const saved = saveSettings(postData.settings);
      return JSONResponse({ status: "success", data: saved });
    }
    
    return JSONResponse({ status: "error", message: "Action POST tidak dikenali" });
  } catch (err) {
    return JSONResponse({ status: "error", message: err.toString() });
  }
}

// Format JSON response untuk CORS aman
function JSONResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`
  },
  {
    name: "DB_Helper.gs",
    content: `/**
 * Helper Database untuk membaca dan menulis dari Spreadsheet.
 * Mengubah baris-kolom excel menjadi struktur JSON Objek yang fleksibel.
 */

// Membaca semua baris di suatu sheet sebagai Array Objek
function readTable(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // Hanya header atau kosong
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = values[i][j];
      // Bersihkan tipe data jika angka
      if (headers[j] === "id" || headers[j] === "point" || headers[j] === "siswa_id" || headers[j] === "pelanggaran_id" || headers[j] === "guru_id") {
        val = Number(val);
      }
      rowObj[headers[j]] = val;
    }
    result.push(rowObj);
  }
  return result;
}

// Menambah atau mengedit baris berdasarkan "id"
function saveRow(sheetName, itemObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet " + sheetName + " tidak ditemukan.");
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Jika ID tidak disediakan, generate ID baru
  let isEdit = false;
  let targetRowIndex = -1;
  let id = Number(itemObj.id);
  
  if (id) {
    // Cari baris dengan ID tersebut
    const ids = sheet.getRange(1, 1, lastRow, 1).getValues();
    for (let r = 1; r < ids.length; r++) {
      if (Number(ids[r][0]) === id) {
        isEdit = true;
        targetRowIndex = r + 1; // 1-indexed Excel row
        break;
      }
    }
  }
  
  if (!id || targetRowIndex === -1) {
    // Generate ID baru (max ID + 1)
    const tableData = readTable(sheetName);
    const maxId = tableData.length > 0 ? Math.max.apply(Math, tableData.map(function(o) { return o.id; })) : 0;
    id = maxId + 1;
    itemObj.id = id;
    targetRowIndex = lastRow + 1;
  }
  
  // Siapkan nilai yang akan di-update sesuai header
  const rowValues = [];
  for (let c = 0; c < headers.length; c++) {
    const headerKey = headers[c];
    let val = itemObj[headerKey];
    if (val === undefined) val = "";
    rowValues.push(val);
  }
  
  // Tulis ke spreadsheet
  sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);
  return itemObj;
}

// Menghapus baris berdasarkan "id"
function deleteRow(sheetName, id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  const idToFind = Number(id);
  const ids = sheet.getRange(1, 1, lastRow, 1).getValues();
  
  for (let r = 1; r < ids.length; r++) {
    if (Number(ids[r][0]) === idToFind) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}`
  }
];
