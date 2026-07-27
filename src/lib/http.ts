import { isTauri } from './tauri';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export async function httpFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isTauri()) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = init.headers as Record<string, string>;
      for (const key of Object.keys(h)) headers[key] = h[key];
    }
    const body = init?.body as string | undefined;
    return tauriFetch(url, { method, headers, body: body as any });
  }
  return fetch(input, init);
}
