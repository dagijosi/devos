import { check, Update } from '@tauri-apps/plugin-updater';
import { logger } from './logger';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  manifest?: Update;
}

const UPDATE_CHECK_KEY = 'devos_update_check';

export async function checkForUpdates(): Promise<UpdateInfo> {
  logger.info('Updater', 'Starting update check...');
  const update = await check();

  if (update) {
    logger.info('Updater', `Update available: v${update.version}`);
    return {
      available: true,
      version: update.version,
      releaseDate: update.date,
      releaseNotes: update.body,
      manifest: update,
    };
  }

  logger.info('Updater', 'No updates available');
  return { available: false };
}

export async function installUpdate(): Promise<void> {
  try {
    const update = await check();
    if (update) {
      await update.downloadAndInstall();
      logger.info('Updater', 'Update installed successfully');
    }
  } catch (e: any) {
    logger.error('Updater', 'Failed to install update', e.message);
    throw e;
  }
}

export function getLastUpdateCheck(): string | null {
  return localStorage.getItem(UPDATE_CHECK_KEY);
}

export function setLastUpdateCheck() {
  localStorage.setItem(UPDATE_CHECK_KEY, new Date().toISOString());
}

export async function checkForUpdatesPeriodically() {
  const last = getLastUpdateCheck();
  if (last) {
    const hoursSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) return;
  }
  try {
    const result = await checkForUpdates();
    setLastUpdateCheck();
    return result;
  } catch (e: any) {
    logger.error('Updater', 'Periodic check failed', e);
    return { available: false };
  }
}
