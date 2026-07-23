import { logger } from './logger';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

const UPDATE_CHECK_KEY = 'devos_update_check';
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/devos/app/releases/latest';

export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const currentVersion = '0.1.0';
    const latestVersion = (data.tag_name || data.name || '').replace(/^v/, '');

    if (latestVersion && latestVersion > currentVersion) {
      logger.info('Updater', `Update available: v${latestVersion}`);
      return {
        available: true,
        version: latestVersion,
        releaseDate: data.published_at,
        releaseNotes: data.body,
        downloadUrl: data.html_url || data.zipball_url,
      };
    }

    return { available: false };
  } catch (e: any) {
    logger.warn('Updater', 'Failed to check for updates', e.message);
    return { available: false };
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
  const result = await checkForUpdates();
  setLastUpdateCheck();
  return result;
}
