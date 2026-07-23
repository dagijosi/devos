import { database } from '../../../database';

async function getEncryptionKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('devos-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function encryptData(data: string, password: string): Promise<string> {
  const key = await getEncryptionKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(data: string, password: string): Promise<string> {
  const key = await getEncryptionKey(password);
  const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

export async function createBackup(password?: string): Promise<{ filename: string; blob: Blob }> {
  const data = await database.exportAllData();
  let jsonStr = JSON.stringify(data, null, 2);
  let encrypted = false;

  if (password) {
    jsonStr = await encryptData(jsonStr, password);
    encrypted = true;
  }

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const filename = `devos-backup-${new Date().toISOString().slice(0, 10)}${encrypted ? '.enc' : ''}.json`;

  await database.createBackup({
    filename,
    size_bytes: blob.size,
    type: 'manual',
    encrypted: encrypted ? 1 : 0,
    notes: password ? 'Encrypted backup' : 'Unencrypted backup',
  });

  return { filename, blob };
}

export async function restoreFromBackup(file: File, password?: string): Promise<{ success: boolean; message: string }> {
  try {
    let text = await file.text();

    if (password) {
      try { text = await decryptData(text.trim(), password); }
      catch { return { success: false, message: 'Decryption failed. Wrong password or corrupted file.' }; }
    }

    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid backup file format.' };
    }

    await database.importAllData(data);
    return { success: true, message: `Restored ${Object.keys(data).length} data categories successfully.` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Restore failed' };
  }
}

export async function getBackupConfig(): Promise<{ autoBackup: boolean; interval: string; encryptByDefault: boolean; maxBackups: number }> {
  const [autoBackup, interval, encryptByDefault, maxBackups] = await Promise.all([
    database.getSetting('backup_auto'),
    database.getSetting('backup_interval'),
    database.getSetting('backup_encrypt'),
    database.getSetting('backup_max'),
  ]);
  return {
    autoBackup: autoBackup === 'true',
    interval: interval || 'daily',
    encryptByDefault: encryptByDefault === 'true',
    maxBackups: parseInt(maxBackups || '10'),
  };
}

export async function saveBackupConfig(config: { autoBackup: boolean; interval: string; encryptByDefault: boolean; maxBackups: number }): Promise<void> {
  await Promise.all([
    database.setSetting('backup_auto', String(config.autoBackup)),
    database.setSetting('backup_interval', config.interval),
    database.setSetting('backup_encrypt', String(config.encryptByDefault)),
    database.setSetting('backup_max', String(config.maxBackups)),
  ]);
}
