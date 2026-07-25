import type { ApiRequestConfig, ApiResponse } from '../types';

function buildHeaders(config: ApiRequestConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const h of config.headers) {
    if (h.key.trim()) headers[h.key.trim()] = h.value;
  }

  switch (config.authType) {
    case 'bearer':
      if (config.authToken) headers['Authorization'] = `Bearer ${config.authToken}`;
      break;
    case 'api-key':
      if (config.apiKeyHeader && config.apiKeyValue) headers[config.apiKeyHeader] = config.apiKeyValue;
      break;
    case 'basic':
      if (config.basicUsername) {
        const encoded = btoa(`${config.basicUsername}:${config.basicPassword}`);
        headers['Authorization'] = `Basic ${encoded}`;
      }
      break;
  }

  if (config.method !== 'GET' && config.bodyType === 'json' && config.body.trim()) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function buildUrl(base: string, params: { key: string; value: string }[]): string {
  if (params.length === 0) return base;
  const qs = params
    .filter(p => p.key.trim())
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
  return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
}

function getBody(config: ApiRequestConfig): BodyInit | undefined {
  if (config.method === 'GET' || config.method === 'DELETE') return undefined;
  if (!config.body.trim()) return undefined;

  if (config.bodyType === 'json') return config.body;
  return config.body;
}

export async function executeRequest(config: ApiRequestConfig): Promise<ApiResponse> {
  const start = performance.now();

  const headers = buildHeaders(config);
  const url = buildUrl(config.url, config.queryParams);
  const body = getBody(config);

  const res = await fetch(url, {
    method: config.method,
    headers,
    body,
  });

  const duration = Math.round(performance.now() - start);

  const resHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => { resHeaders[key] = value; });

  let data: unknown;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
    data,
    duration,
  };
}
